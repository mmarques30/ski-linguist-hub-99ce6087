import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type IntakeStatus = "brouillon" | "confirme" | "ouvert" | "complet" | "annule";

export interface CourseIntake {
  id: string;
  season_id: string | null;
  hosting_partner_id: string;
  start_date: string;
  end_date: string;
  language: string;
  location: string;
  modality: string | null;
  target_audience: "moniteur_ski" | "autre";
  open_to_other_schools: boolean;
  max_places: number | null;
  status: IntakeStatus;
  outreach_sent_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  partner?: { name: string; station: string | null } | null;
  enrollment_count?: number;
}

export const INTAKE_STATUSES = [
  { key: "brouillon", label: "Brouillon", color: "bg-gray-500" },
  { key: "confirme", label: "Confirmé", color: "bg-blue-500" },
  { key: "ouvert", label: "Ouvert", color: "bg-green-500" },
  { key: "complet", label: "Complet", color: "bg-amber-500" },
  { key: "annule", label: "Annulé", color: "bg-destructive" },
] as const;

export function useCourseIntakes(filters?: {
  status?: string;
  seasonId?: string;
}) {
  return useQuery({
    queryKey: ["course-intakes", filters],
    queryFn: async () => {
      let query = supabase
        .from("course_intakes")
        .select("*, partner:hosting_partner_id(name, station)")
        .order("start_date", { ascending: true });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.seasonId) {
        query = query.eq("season_id", filters.seasonId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const intakes = (data || []) as CourseIntake[];

      if (intakes.length === 0) return intakes;

      const ids = intakes.map((i) => i.id);
      const { data: counts } = await supabase
        .from("inscriptions")
        .select("intake_id")
        .in("intake_id", ids);

      const countMap: Record<string, number> = {};
      for (const row of counts || []) {
        if (row.intake_id) {
          countMap[row.intake_id] = (countMap[row.intake_id] || 0) + 1;
        }
      }

      return intakes.map((i) => ({
        ...i,
        enrollment_count: countMap[i.id] || 0,
      }));
    },
  });
}

export function useCreateCourseIntake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (intake: Partial<CourseIntake> & { hosting_partner_id: string; start_date: string; end_date: string; language: string; location: string }) => {
      const { data, error } = await supabase.from("course_intakes").insert(intake).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["course-intakes"] }),
  });
}

export function useUpdateCourseIntake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CourseIntake> & { id: string }) => {
      const { data, error } = await supabase.from("course_intakes").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["course-intakes"] }),
  });
}

export function useSendIntakeOutreach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ intakeId, dryRun = false }: { intakeId: string; dryRun?: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-intake-outreach?intake_id=${intakeId}${dryRun ? "&dry_run=true" : ""}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "Erreur d'envoi");
      }
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["course-intakes"] }),
  });
}
