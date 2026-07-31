import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InscriptionDocumentSending {
  id: string;
  inscription_id: string;
  document_type: string;
  sent_at: string;
  sent_to: string;
  opened_at: string | null;
  pdf_url: string | null;
  created_at: string;
}

export function useInscriptionDocuments(inscriptionId?: string) {
  return useQuery({
    queryKey: ["inscription-documents", inscriptionId],
    queryFn: async (): Promise<InscriptionDocumentSending[]> => {
      if (!inscriptionId) return [];

      const { data, error } = await supabase
        .from("document_sendings")
        .select("*")
        .eq("inscription_id", inscriptionId)
        .order("sent_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!inscriptionId,
  });
}
