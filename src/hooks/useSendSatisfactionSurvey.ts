import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invokeAdminEdgeFunction } from "@/lib/admin-edge-invoke";

export type SendSatisfactionSurveyResult = {
  success: boolean;
  surveyId?: string;
  surveyToken?: string;
  recipientEmail?: string;
  recipientName?: string;
  resent?: boolean;
  day0SentAt?: string;
  resendId?: string | null;
  error?: string;
};

export function useSendSatisfactionSurvey() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (inscriptionId: string) => {
      return invokeAdminEdgeFunction<SendSatisfactionSurveyResult>(
        "send-satisfaction-survey",
        { inscriptionId }
      );
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["formateur-satisfaction-surveys"] });
      const name = result.recipientName || "le·la stagiaire";
      toast.success(
        result.resent
          ? `Questionnaire renvoyé à ${name}`
          : `Questionnaire envoyé à ${name}`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Envoi impossible");
    },
  });
}
