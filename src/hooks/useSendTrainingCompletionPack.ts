import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invokeAdminEdgeFunction } from "@/lib/admin-edge-invoke";

export type SendTrainingCompletionPackInput = {
  inscriptionId: string;
};

export type SendTrainingCompletionPackResult = {
  success?: boolean;
  sent?: boolean;
  resendId?: string | null;
  to?: string;
  subject?: string;
  attachments?: string[];
  error?: string;
  message?: string;
};

/**
 * Envoi manuel du pack fin (certificat + attestation + facture) via l'edge
 * `send-training-completion-pack`. Les crons sont fermés — Paula déclenche
 * depuis l'UI après avoir validé les documents générés.
 */
export function useSendTrainingCompletionPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendTrainingCompletionPackInput) => {
      const result =
        await invokeAdminEdgeFunction<SendTrainingCompletionPackResult>(
          "send-training-completion-pack",
          { inscriptionId: input.inscriptionId }
        );

      if (result?.success === false || result?.error) {
        throw new Error(
          result.error || result.message || "Envoi du pack fin échoué"
        );
      }
      if (!result?.sent) {
        throw new Error(
          result?.message ||
            "Aucun e-mail envoyé — vérifier le modèle et l'e-mail du stagiaire."
        );
      }
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["email-log"] });
      queryClient.invalidateQueries({
        queryKey: ["inscription", variables.inscriptionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inscription-documents", variables.inscriptionId],
      });
      toast.success(
        data.to
          ? `Pack fin envoyé à ${data.to}`
          : "Pack fin de formation envoyé"
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'envoi du pack fin");
    },
  });
}
