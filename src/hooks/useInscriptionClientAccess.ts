import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InscriptionEmailLog {
  id: string;
  template_slug: string;
  recipient_email: string;
  recipient_name: string | null;
  status: string;
  sent_at: string;
  error_message: string | null;
}

export interface InscriptionSurvey {
  id: string;
  token: string;
  completed_at: string | null;
  created_at: string;
}

export interface InscriptionPaymentRow {
  id: string;
  amount: number;
  payment_method: string;
  payment_type: string;
  status: string;
  payment_date: string | null;
  stripe_checkout_session_id: string | null;
}

export function useInscriptionClientAccess(inscriptionId?: string) {
  return useQuery({
    queryKey: ["inscription-client-access", inscriptionId],
    queryFn: async () => {
      if (!inscriptionId) {
        return { emails: [], surveys: [], payments: [] };
      }

      const [emailsRes, surveysRes, paymentsRes] = await Promise.all([
        supabase
          .from("email_log")
          .select("id, template_slug, recipient_email, recipient_name, status, sent_at, error_message")
          .eq("inscription_id", inscriptionId)
          .order("sent_at", { ascending: false }),
        supabase
          .from("satisfaction_surveys")
          .select("id, token, completed_at, created_at")
          .eq("inscription_id", inscriptionId)
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select(
            "id, amount, payment_method, payment_type, status, payment_date, stripe_checkout_session_id"
          )
          .eq("inscription_id", inscriptionId)
          .order("payment_date", { ascending: false }),
      ]);

      if (emailsRes.error) throw emailsRes.error;
      if (surveysRes.error) throw surveysRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      return {
        emails: (emailsRes.data || []) as InscriptionEmailLog[],
        surveys: (surveysRes.data || []) as InscriptionSurvey[],
        payments: (paymentsRes.data || []) as InscriptionPaymentRow[],
      };
    },
    enabled: !!inscriptionId,
  });
}
