import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function escapeIlike(s: string): string {
  return s.replace(/%/g, "\\%").replace(/_/g, "\\_").replace(/,/g, "");
}

/** PostgREST `.or()` filter for student search (single- or multi-token). */
export function buildStudentSearchFilter(search: string): string | null {
  const trimmed = search.trim();
  if (!trimmed) return null;

  const tokens = trimmed.split(/\s+/).filter(Boolean).map(escapeIlike);

  if (tokens.length === 1) {
    const t = tokens[0];
    return `first_name.ilike.%${t}%,last_name.ilike.%${t}%,email.ilike.%${t}%,company.ilike.%${t}%`;
  }

  const andParts = tokens
    .map((t) => `or(first_name.ilike.%${t}%,last_name.ilike.%${t}%)`)
    .join(",");
  const full = escapeIlike(trimmed);
  return `and(${andParts}),email.ilike.%${full}%,company.ilike.%${full}%`;
}

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
  auth_user_id?: string | null;
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

      const searchFilter = filters?.search
        ? buildStudentSearchFilter(filters.search)
        : null;
      if (searchFilter) {
        query = query.or(searchFilter);
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
