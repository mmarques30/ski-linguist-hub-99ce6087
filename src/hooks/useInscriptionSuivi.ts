import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type InscriptionSuiviPayload = {
  code: string | null;
  status: string;
  language: string | null;
  start_date: string | null;
  end_date: string | null;
  dates_to_confirm: boolean;
  schedule: string | null;
  rhythm: string | null;
  course_location: string | null;
  modality: string | null;
  first_name: string | null;
  documents_available: boolean;
  documents_count: number;
  payment_status: "regle" | "partiel" | "a_regler" | "aucun" | string;
  has_portal_account: boolean;
};

export function useInscriptionSuivi(token: string | undefined) {
  return useQuery({
    queryKey: ["inscription-suivi", token],
    queryFn: async (): Promise<InscriptionSuiviPayload | null> => {
      if (!token) return null;
      const { data, error } = await supabase.rpc("get_inscription_suivi_by_token", {
        p_token: token,
      });
      if (error) throw error;
      if (!data) return null;
      return data as InscriptionSuiviPayload;
    },
    enabled: Boolean(token),
    retry: false,
  });
}
