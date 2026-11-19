import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SalonDemoTestRow = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ski_school_name: string;
  ski_school_code: string | null;
  language: string;
  determined_level: string | null;
  score_percentage: number | null;
};

/** Résultats du test isolé /salon (hors inscriptions) — lecture staff. */
export function useSalonDemoTests(limit = 40) {
  return useQuery({
    queryKey: ["salon-demo-tests", limit],
    queryFn: async (): Promise<SalonDemoTestRow[]> => {
      const { data, error } = await supabase
        .from("salon_demo_tests")
        .select(
          "id, created_at, first_name, last_name, email, phone, ski_school_name, ski_school_code, language, determined_level, score_percentage"
        )
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as SalonDemoTestRow[];
    },
  });
}
