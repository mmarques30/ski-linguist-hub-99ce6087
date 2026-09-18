import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InscriptionComplete {
  id: string;
  code: string | null;
  modality: string | null;
  course_type: string | null;
  language: string;
  status: string;
  start_date: string;
  end_date: string;
  duration_hours: number | null;
  price: number | null;
  entry_level: string | null;
  entry_test_id?: string | null;
  dates_to_confirm?: boolean | null;
  exit_level?: string | null;
  course_location?: string | null;
  end_pack_sent_at?: string | null;
  season_id?: string | null;
  certification_result: string | null;
  created_at: string;
  student_id?: string | null;
  student_name: string | null;
  student_email: string | null;
  student_phone: string | null;
  student_city: string | null;
  student_company: string | null;
  instructor_name: string | null;
  ski_school_name: string | null;
}

export function useInscriptions(filters?: {
  status?: string;
  language?: string;
  search?: string;
  seasonId?: string | null;
  seasonStart?: string | null;
  seasonEnd?: string | null;
}) {
  return useQuery({
    queryKey: ["inscriptions", filters],
    queryFn: async () => {
      let query = supabase
        .from("inscriptions_complete")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.language && filters.language !== "all") {
        query = query.eq("language", filters.language);
      }

      // Prefer date range: live data has season_id NULL almost everywhere.
      if (filters?.seasonStart && filters?.seasonEnd) {
        query = query
          .gte("start_date", filters.seasonStart)
          .lte("start_date", filters.seasonEnd);
      } else if (filters?.seasonId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = (query as any).eq("season_id", filters.seasonId);
      }

      if (filters?.search) {
        query = query.or(
          `student_name.ilike.%${filters.search}%,student_email.ilike.%${filters.search}%,code.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as InscriptionComplete[];
    },
  });
}

export function useInscriptionStats() {
  return useQuery({
    queryKey: ["inscription-stats"],
    queryFn: async () => {
      const { data: inscriptions, error } = await supabase
        .from("inscriptions")
        .select("status, price, language");

      if (error) throw error;

      const total = inscriptions?.length || 0;
      const totalRevenue = inscriptions?.reduce((sum, i) => sum + (Number(i.price) || 0), 0) || 0;
      
      const byStatus = inscriptions?.reduce((acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const byLanguage = inscriptions?.reduce((acc, i) => {
        acc[i.language] = (acc[i.language] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        total,
        totalRevenue,
        byStatus,
        byLanguage,
        active: byStatus['en_cours'] || 0,
        completed: byStatus['terminee'] || 0,
        billed: byStatus['facturee'] || 0,
      };
    },
  });
}

export function useUpdateInscriptionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("inscriptions")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-details"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["inscriptions-a-avancer"] });
    },
  });
}

export interface StatusAdvanceReport {
  dry_run: boolean;
  transition: string;
  nombre: number;
  inscriptions: { code: string | null; debut: string }[];
}

/**
 * Compte les inscriptions confirmées dont la date de début est atteinte : elles
 * devraient être « En cours ». Le job pg_cron qui fait ce rattrapage la nuit
 * existe mais reste inactif, donc l'écran propose de le déclencher à la main.
 */
export function useDueStatusAdvances() {
  return useQuery({
    queryKey: ["inscriptions-a-avancer"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("avancer_statuts_inscriptions", {
        _dry_run: true,
      });

      if (error) throw error;
      return data as unknown as StatusAdvanceReport;
    },
    retry: false,
  });
}

export function useAdvanceDueStatuses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("avancer_statuts_inscriptions", {
        _dry_run: false,
      });

      if (error) throw error;
      return data as unknown as StatusAdvanceReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-details"] });
      queryClient.invalidateQueries({ queryKey: ["inscriptions-a-avancer"] });
    },
  });
}

export function useDeleteInscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inscriptions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-stats"] });
    },
  });
}

export function useRecentInscriptions() {
  return useQuery({
    queryKey: ["recent-inscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inscriptions_complete")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Deduplicate by student_id, keeping most recent (already sorted)
      const seen = new Map<string, InscriptionComplete>();
      for (const insc of (data || [])) {
        const key = insc.student_id || insc.id;
        if (!seen.has(key)) {
          seen.set(key, insc as InscriptionComplete);
        }
      }
      return Array.from(seen.values()).slice(0, 5);
    },
  });
}
