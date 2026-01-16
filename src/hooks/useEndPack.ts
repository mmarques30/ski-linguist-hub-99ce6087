import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EndPackData {
  inscriptionId: string;
  studentId: string;
  exitLevel: string;
  attendanceRate?: number;
  generateInvoice: boolean;
  generateCertificate: boolean;
  sendSurvey: boolean;
}

interface EndPackResult {
  invoiceId?: string;
  certificateId?: string;
  surveyToken?: string;
}

export function useGenerateEndPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EndPackData): Promise<EndPackResult> => {
      const result: EndPackResult = {};

      // 1. Update inscription with final status and exit level
      const { error: updateError } = await supabase
        .from("inscriptions")
        .update({
          status: "Terminé",
          exit_level: data.exitLevel,
          final_status: "Terminé",
          end_pack_sent_at: new Date().toISOString(),
        })
        .eq("id", data.inscriptionId);

      if (updateError) throw updateError;

      // 2. Generate invoice if requested
      if (data.generateInvoice) {
        // Check if invoice already exists for this inscription
        const { data: existingInvoices } = await supabase
          .from("invoices")
          .select("id")
          .eq("inscription_id", data.inscriptionId)
          .eq("payment_type", "integral");

        if (!existingInvoices || existingInvoices.length === 0) {
          // Get inscription details for invoice amount
          const { data: inscription } = await supabase
            .from("inscriptions")
            .select("price, deposit_amount")
            .eq("id", data.inscriptionId)
            .single();

          if (inscription) {
            const amount = inscription.price || 0;
            const deposit = inscription.deposit_amount || 0;
            const finalAmount = amount - deposit;

            const { data: invoice, error: invoiceError } = await supabase
              .from("invoices")
              .insert({
                inscription_id: data.inscriptionId,
                invoice_type: "formation",
                amount_ht: finalAmount > 0 ? finalAmount : amount,
                payment_type: deposit > 0 ? "solde" : "integral",
                status: "draft",
              })
              .select()
              .single();

            if (invoiceError) throw invoiceError;
            result.invoiceId = invoice.id;
          }
        }
      }

      // 3. Generate certificate if requested
      if (data.generateCertificate) {
        // Check if certificate already exists
        const { data: existingCert } = await supabase
          .from("certificates")
          .select("id")
          .eq("inscription_id", data.inscriptionId);

        if (!existingCert || existingCert.length === 0) {
          const { data: certificate, error: certError } = await supabase
            .from("certificates")
            .insert({
              inscription_id: data.inscriptionId,
              student_id: data.studentId,
              level_achieved: data.exitLevel,
              attendance_rate: data.attendanceRate || 100,
              issue_date: new Date().toISOString().split("T")[0],
            })
            .select()
            .single();

          if (certError) throw certError;
          result.certificateId = certificate.id;
        }
      }

      // 4. Create satisfaction survey if requested
      if (data.sendSurvey) {
        // Check if survey already exists
        const { data: existingSurvey } = await supabase
          .from("satisfaction_surveys")
          .select("id, token")
          .eq("inscription_id", data.inscriptionId);

        if (!existingSurvey || existingSurvey.length === 0) {
          const { data: survey, error: surveyError } = await supabase
            .from("satisfaction_surveys")
            .insert({
              inscription_id: data.inscriptionId,
              student_id: data.studentId,
            })
            .select()
            .single();

          if (surveyError) throw surveyError;
          result.surveyToken = survey.token;
        } else {
          result.surveyToken = existingSurvey[0].token;
        }
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      
      const messages = [];
      if (result.invoiceId) messages.push("facture");
      if (result.certificateId) messages.push("certificat");
      if (result.surveyToken) messages.push("questionnaire");
      
      if (messages.length > 0) {
        toast.success(`Pack fin de formation généré : ${messages.join(", ")}`);
      }
    },
    onError: (error) => {
      console.error("End pack generation error:", error);
      toast.error("Erreur lors de la génération du pack fin de formation");
    },
  });
}

export function useCertificates(inscriptionId?: string) {
  return {
    queryKey: ["certificates", inscriptionId],
  };
}
