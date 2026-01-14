import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  company: string | null;
  civility: string | null;
  street_address: string | null;
  postal_code: string | null;
  created_at: string;
  updated_at: string;
  inscription_count?: number;
}

export function useStudents(filters?: {
  search?: string;
}) {
  return useQuery({
    queryKey: ["students", filters],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as Student[];
    },
  });
}

export function useStudentStats() {
  return useQuery({
    queryKey: ["student-stats"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      if (error) throw error;

      return {
        total: count || 0,
      };
    },
  });
}
