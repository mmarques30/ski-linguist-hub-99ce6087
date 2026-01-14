import { useQuery } from "@tanstack/react-query";
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
  certification_result: string | null;
  created_at: string;
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
        active: byStatus['En cours'] || 0,
        completed: byStatus['Terminé'] || 0,
        billed: byStatus['Facturé'] || 0,
      };
    },
  });
}
