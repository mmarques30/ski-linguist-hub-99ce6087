import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ParsedFliInscriptionRow } from "@/lib/fli-inscriptions-csv-import";

interface ImportOptions {
  importInscriptions: boolean;
  enrichMonitors: boolean;
}

interface ImportResult {
  studentsUpserted: number;
  inscriptionsImported: number;
  skiSchoolsCreated: number;
  monitorsEnriched: number;
  errors: string[];
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

export function useFliInscriptionsImport() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rows,
      monitorContacts,
      options,
    }: {
      rows: ParsedFliInscriptionRow[];
      monitorContacts: Array<{
        first_name: string;
        last_name: string;
        email: string;
        phone: string | null;
        home_station: string | null;
        company: string | null;
        ski_school_name: string | null;
      }>;
      options: ImportOptions;
    }): Promise<ImportResult> => {
      const result: ImportResult = {
        studentsUpserted: 0,
        inscriptionsImported: 0,
        skiSchoolsCreated: 0,
        monitorsEnriched: 0,
        errors: [],
      };

      const [{ data: instructors }, { data: skiSchools }, { data: existingInscriptions }] = await Promise.all([
        supabase.from("instructors").select("id, first_name, last_name, email"),
        supabase.from("ski_schools").select("id, name"),
        supabase.from("inscriptions").select("id, code"),
      ]);

      const instructorByEmail = new Map<string, string>();
      const instructorByName = new Map<string, string>();
      for (const ins of instructors || []) {
        if (ins.email) instructorByEmail.set(normalizeKey(ins.email), ins.id);
        const name = `${ins.first_name || ""} ${ins.last_name || ""}`.trim();
        if (name) instructorByName.set(normalizeKey(name), ins.id);
      }

      const skiSchoolByName = new Map<string, string>();
      for (const school of skiSchools || []) {
        skiSchoolByName.set(normalizeKey(school.name), school.id);
      }

      const inscriptionByCode = new Map<string, string>();
      for (const insc of existingInscriptions || []) {
        if (insc.code) inscriptionByCode.set(normalizeKey(insc.code), insc.id);
      }

      const studentIdByEmail = new Map<string, string>();

      async function ensureSkiSchool(name: string | null, director: string | null, directorPhone: string | null) {
        if (!name) return null;
        const key = normalizeKey(name);
        if (skiSchoolByName.has(key)) return skiSchoolByName.get(key)!;

        const { data, error } = await supabase
          .from("ski_schools")
          .insert({
            name,
            director_name: director,
            director_phone: directorPhone,
          })
          .select("id")
          .single();

        if (error) {
          const { data: existing } = await supabase.from("ski_schools").select("id").eq("name", name).maybeSingle();
          if (existing) {
            skiSchoolByName.set(key, existing.id);
            return existing.id;
          }
          throw error;
        }

        skiSchoolByName.set(key, data.id);
        result.skiSchoolsCreated++;
        return data.id;
      }

      async function ensureStudent(row: ParsedFliInscriptionRow) {
        if (studentIdByEmail.has(row.email)) {
          return studentIdByEmail.get(row.email)!;
        }

        const { data: existing } = await supabase
          .from("students")
          .select("id")
          .eq("email", row.email)
          .maybeSingle();

        if (existing) {
          await supabase.from("students").update({
            first_name: row.first_name,
            last_name: row.last_name,
            civility: row.civility,
            phone: row.phone,
            street_address: row.street_address,
            postal_code: row.postal_code,
            city: row.city,
            company: row.company,
          }).eq("id", existing.id);
          studentIdByEmail.set(row.email, existing.id);
          return existing.id;
        }

        const { data, error } = await supabase
          .from("students")
          .insert({
            email: row.email,
            first_name: row.first_name,
            last_name: row.last_name,
            civility: row.civility,
            phone: row.phone,
            street_address: row.street_address,
            postal_code: row.postal_code,
            city: row.city,
            company: row.company,
          })
          .select("id")
          .single();

        if (error) throw error;
        studentIdByEmail.set(row.email, data.id);
        result.studentsUpserted++;
        return data.id;
      }

      if (options.importInscriptions) {
        for (const row of rows) {
          try {
            if (row.code && inscriptionByCode.has(normalizeKey(row.code))) {
              continue;
            }

            const studentId = await ensureStudent(row);
            const skiSchoolId = await ensureSkiSchool(
              row.ski_school_name,
              row.ski_school_director,
              row.ski_school_director_phone
            );

            let instructorId: string | null = null;
            if (row.instructor_email && instructorByEmail.has(normalizeKey(row.instructor_email))) {
              instructorId = instructorByEmail.get(normalizeKey(row.instructor_email))!;
            } else if (row.instructor_name && instructorByName.has(normalizeKey(row.instructor_name.trim()))) {
              instructorId = instructorByName.get(normalizeKey(row.instructor_name.trim()))!;
            }

            const { data: inscription, error } = await supabase
              .from("inscriptions")
              .insert({
                student_id: studentId,
                instructor_id: instructorId,
                ski_school_id: skiSchoolId,
                code: row.code,
                modality: row.modality,
                course_type: row.course_type,
                max_participants: row.max_participants,
                language: row.language,
                certification_type: row.certification_type,
                course_location: row.course_location,
                course_address: row.course_address,
                start_date: row.start_date,
                end_date: row.end_date,
                duration_hours: row.duration_hours,
                duration_days: row.duration_days,
                hours_per_day: row.hours_per_day,
                rhythm: row.rhythm,
                entry_test_score: row.entry_test_score,
                entry_level: row.entry_level,
                group_name: row.group_name,
                schedule: row.schedule,
                final_general_level: row.final_general_level,
                final_specific_level: row.final_specific_level,
                certification_date: row.certification_date,
                certification_result: row.certification_result,
                expectations: row.expectations,
                observations: row.observations,
                pedagogical_cost: row.pedagogical_cost,
                price: row.price,
                status: row.status,
              })
              .select("id, code")
              .single();

            if (error) throw error;

            if (inscription.code) {
              inscriptionByCode.set(normalizeKey(inscription.code), inscription.id);
            }

            if (row.accommodation_address || row.accommodation_dates) {
              await supabase.from("accommodations").insert({
                inscription_id: inscription.id,
                dates: row.accommodation_dates,
                address: row.accommodation_address,
                observations: row.accommodation_notes,
              });
            }

            result.inscriptionsImported++;
          } catch (err: unknown) {
            result.errors.push(
              `${row.first_name} ${row.last_name} (${row.start_date}): ${err instanceof Error ? err.message : "Erreur"}`
            );
          }
        }
      }

      if (options.enrichMonitors && monitorContacts.length > 0) {
        const BATCH = 100;
        for (let i = 0; i < monitorContacts.length; i += BATCH) {
          const batch = monitorContacts.slice(i, i + BATCH).map((m) => ({
            first_name: m.first_name,
            last_name: m.last_name,
            email: m.email,
            phone: m.phone,
            home_station: m.home_station,
            status: "active" as const,
            notes: [
              m.company ? `Entreprise: ${m.company}` : null,
              m.ski_school_name ? `ESF: ${m.ski_school_name}` : null,
              "Source: inscriptions FLI",
            ].filter(Boolean).join(" | ") || "Source: inscriptions FLI",
            partner_id: null,
            ski_school_id: null,
          }));

          const { error } = await supabase.from("ski_monitors").upsert(batch, { onConflict: "email" });
          if (error) {
            result.errors.push(`Moniteurs lot ${Math.floor(i / BATCH) + 1}: ${error.message}`);
          } else {
            result.monitorsEnriched += batch.length;
          }
        }
      }

      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inscriptions"] });
      qc.invalidateQueries({ queryKey: ["inscription-stats"] });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["ski-monitors"] });
      qc.invalidateQueries({ queryKey: ["ski-monitor-stats"] });
    },
  });
}
