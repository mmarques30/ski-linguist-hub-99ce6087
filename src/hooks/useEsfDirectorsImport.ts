import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ParsedEsfDirectorRow,
  buildPartnerNotes,
  scoreEsfPartnerNameMatch,
} from "@/lib/esf-directors-csv-import";
import { Partner } from "@/hooks/usePartners";

export interface EsfDirectorsImportResult {
  created: number;
  updated: number;
  contactsUpserted: number;
  skiSchoolsUpdated: number;
  skipped: number;
  errors: string[];
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

export function useEsfDirectorsImport() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (rows: ParsedEsfDirectorRow[]): Promise<EsfDirectorsImportResult> => {
      const result: EsfDirectorsImportResult = {
        created: 0,
        updated: 0,
        contactsUpserted: 0,
        skiSchoolsUpdated: 0,
        skipped: 0,
        errors: [],
      };

      const [{ data: partners }, { data: skiSchools }] = await Promise.all([
        supabase.from("partners").select("id, name, type, esf_code, station, contact_name, contact_email, contact_phone, address, notes"),
        supabase.from("ski_schools").select("id, name, partner_id, director_name, director_phone"),
      ]);

      const partnerByCode = new Map<string, Partner & { esf_code?: string | null }>();
      const esfPartners = (partners || []).filter((p) => p.type === "esf" || p.type === "ecole_ski");

      for (const partner of partners || []) {
        if (partner.esf_code) partnerByCode.set(partner.esf_code, partner as Partner);
      }

      const skiSchoolByName = new Map<string, (typeof skiSchools)[number]>();
      for (const school of skiSchools || []) {
        skiSchoolByName.set(normalizeKey(school.name), school);
      }

      for (const row of rows) {
        try {
          let partner = partnerByCode.get(row.esf_code);

          if (!partner) {
            let best: { partner: (typeof esfPartners)[number]; score: number } | null = null;
            for (const candidate of esfPartners) {
              const score = scoreEsfPartnerNameMatch(row.school_name, candidate.name);
              if (score >= 70 && (!best || score > best.score)) {
                best = { partner: candidate, score };
              }
            }
            if (best) partner = best.partner as Partner;
          }

          const payload = {
            name: row.school_name,
            type: "esf" as const,
            esf_code: row.esf_code,
            station: row.station,
            address: row.address,
            contact_name: row.director_name !== "—" ? row.director_name : null,
            contact_email: row.director_email,
            contact_phone: row.director_phone || row.school_phone,
            status: "actif",
            notes: buildPartnerNotes(row),
          };

          let partnerId: string;

          if (partner) {
            const { error } = await supabase
              .from("partners")
              .update({
                ...payload,
                contact_name: payload.contact_name || partner.contact_name,
                contact_email: payload.contact_email || partner.contact_email,
                contact_phone: payload.contact_phone || partner.contact_phone,
                address: payload.address || partner.address,
              })
              .eq("id", partner.id);
            if (error) throw error;
            partnerId = partner.id;
            result.updated++;
            partnerByCode.set(row.esf_code, { ...partner, ...payload });
          } else {
            const { data, error } = await supabase.from("partners").insert(payload).select("id").single();
            if (error) throw error;
            partnerId = data.id;
            result.created++;
            partnerByCode.set(row.esf_code, { id: partnerId, ...payload } as Partner);
          }

          const { data: existingContact } = await supabase
            .from("partner_contacts")
            .select("id")
            .eq("partner_id", partnerId)
            .eq("role", "Directeur")
            .maybeSingle();

          const contactPayload = {
            partner_id: partnerId,
            name: row.director_name !== "—" ? row.director_name : row.school_name,
            role: "Directeur",
            email: row.director_email,
            phone: row.director_phone || row.school_phone,
            is_primary: true,
          };

          if (existingContact) {
            const { error } = await supabase.from("partner_contacts").update(contactPayload).eq("id", existingContact.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("partner_contacts").insert(contactPayload);
            if (error) throw error;
          }
          result.contactsUpserted++;

          let matchedSchool = skiSchoolByName.get(normalizeKey(row.school_name));
          if (!matchedSchool) {
            for (const school of skiSchools || []) {
              if (scoreEsfPartnerNameMatch(row.school_name, school.name) >= 70) {
                matchedSchool = school;
                break;
              }
            }
          }

          if (matchedSchool) {
            const { error } = await supabase
              .from("ski_schools")
              .update({
                director_name: row.director_name !== "—" ? row.director_name : matchedSchool.director_name,
                director_phone: row.director_phone || matchedSchool.director_phone,
                partner_id: matchedSchool.partner_id || partnerId,
                school_kind: "esf",
                station: row.station,
              })
              .eq("id", matchedSchool.id);
            if (error) throw error;
            result.skiSchoolsUpdated++;
          }
        } catch (err: unknown) {
          result.errors.push(
            `${row.school_name}: ${err instanceof Error ? err.message : "erreur inconnue"}`
          );
          result.skipped++;
        }
      }

      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["ski-schools-matching"] });
      qc.invalidateQueries({ queryKey: ["partners-for-school-matching"] });
      qc.invalidateQueries({ queryKey: ["hosting-school-partners"] });
    },
  });
}
