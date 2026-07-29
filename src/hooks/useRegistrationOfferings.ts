import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RegistrationOffering } from "@/lib/registration-offerings";

export function useRegistrationOfferings() {
  return useQuery({
    queryKey: ["registration-offerings"],
    queryFn: async (): Promise<RegistrationOffering[]> => {
      const { data: season } = await supabase
        .from("seasons")
        .select("id")
        .eq("is_current", true)
        .maybeSingle();

      let query = supabase
        .from("registration_offerings")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (season?.id) {
        query = query.or(`season_id.eq.${season.id},season_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as RegistrationOffering[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
