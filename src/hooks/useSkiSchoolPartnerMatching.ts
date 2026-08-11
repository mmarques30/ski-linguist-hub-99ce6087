import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  PartnerRecord,
  SkiSchoolMatchPreview,
  SkiSchoolRecord,
  buildPartnerPayloadFromSchool,
  suggestSchoolPartnerMatches,
} from "@/lib/ski-school-partner-match";

export function useSkiSchoolPartnerMatching() {
  const qc = useQueryClient();

  const schoolsQuery = useQuery({
    queryKey: ["ski-schools-matching"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ski_schools")
        .select("id, name, director_name, director_phone, partner_id, school_kind, station")
        .order("name");
      if (error) throw error;
      return (data || []) as SkiSchoolRecord[];
    },
  });

  const partnersQuery = useQuery({
    queryKey: ["partners-for-school-matching"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id, name, type, station, contact_name, contact_email, contact_phone, status")
        .order("name");
      if (error) throw error;
      return (data || []) as PartnerRecord[];
    },
  });

  const previews: SkiSchoolMatchPreview[] =
    schoolsQuery.data && partnersQuery.data
      ? schoolsQuery.data.map((school) => suggestSchoolPartnerMatches(school, partnersQuery.data!))
      : [];

  const linkSchool = useMutation({
    mutationFn: async ({
      schoolId,
      partnerId,
      schoolKind,
      station,
    }: {
      schoolId: string;
      partnerId: string;
      schoolKind: string;
      station: string | null;
    }) => {
      const { error } = await supabase
        .from("ski_schools")
        .update({
          partner_id: partnerId,
          school_kind: schoolKind,
          station,
        })
        .eq("id", schoolId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ski-schools-matching"] });
      qc.invalidateQueries({ queryKey: ["ski-schools"] });
      qc.invalidateQueries({ queryKey: ["partners"] });
    },
  });

  const createAndLink = useMutation({
    mutationFn: async (preview: SkiSchoolMatchPreview) => {
      const payload = buildPartnerPayloadFromSchool(preview.school, preview.school_kind, preview.station);
      const { data: partner, error: partnerError } = await supabase
        .from("partners")
        .insert(payload)
        .select("id")
        .single();
      if (partnerError) throw partnerError;

      const { error: schoolError } = await supabase
        .from("ski_schools")
        .update({
          partner_id: partner.id,
          school_kind: preview.school_kind,
          station: preview.station,
        })
        .eq("id", preview.school.id);
      if (schoolError) throw schoolError;
      return partner.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ski-schools-matching"] });
      qc.invalidateQueries({ queryKey: ["ski-schools"] });
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["hosting-school-partners"] });
    },
  });

  const runAutoMatching = useMutation({
    mutationFn: async () => {
      if (!schoolsQuery.data || !partnersQuery.data) return { linked: 0, created: 0, skipped: 0 };

      let linked = 0;
      let created = 0;
      let skipped = 0;

      for (const school of schoolsQuery.data) {
        if (school.partner_id) {
          skipped += 1;
          continue;
        }

        const preview = suggestSchoolPartnerMatches(school, partnersQuery.data);
        if (preview.auto_link && preview.best_match) {
          const { error } = await supabase
            .from("ski_schools")
            .update({
              partner_id: preview.best_match.partner.id,
              school_kind: preview.school_kind,
              station: preview.station,
            })
            .eq("id", school.id);
          if (error) throw error;
          linked += 1;
          continue;
        }

        const payload = buildPartnerPayloadFromSchool(preview.school, preview.school_kind, preview.station);
        const { data: partner, error: partnerError } = await supabase
          .from("partners")
          .insert(payload)
          .select("id")
          .single();
        if (partnerError) throw partnerError;

        const { error: schoolError } = await supabase
          .from("ski_schools")
          .update({
            partner_id: partner.id,
            school_kind: preview.school_kind,
            station: preview.station,
          })
          .eq("id", school.id);
        if (schoolError) throw schoolError;
        created += 1;
      }

      return { linked, created, skipped };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ski-schools-matching"] });
      qc.invalidateQueries({ queryKey: ["ski-schools"] });
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["hosting-school-partners"] });
    },
  });

  return {
    schoolsQuery,
    partnersQuery,
    previews,
    linkSchool,
    createAndLink,
    runAutoMatching,
    unmatched: previews.filter((p) => !p.school.partner_id),
    linked: previews.filter((p) => !!p.school.partner_id),
  };
}

export function useHostingSchoolPartners() {
  return useQuery({
    queryKey: ["hosting-school-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id, name, station, type, status")
        .in("type", ["esf", "ecole_ski"])
        .in("status", ["actif", "prospect"])
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
}
