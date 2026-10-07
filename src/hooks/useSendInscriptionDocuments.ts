import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeAdminEdgeFunction } from "@/lib/admin-edge-invoke";

export type SendInscriptionDocumentsInput = {
  inscriptionId: string;
  /** Renvoi même si déjà journalisé (défaut true pour le bouton admin). */
  force?: boolean;
  customSubject?: string;
  customHtml?: string;
};

export type SendInscriptionDocumentsResult = {
  success?: boolean;
  sent?: number;
  skipped?: number;
  cancelled?: number;
  errors?: string[];
  details?: Array<{ inscriptionId: string; action: string }>;
  message?: string;
  error?: string;
};

/**
 * Envoi / renvoi du pack dossier (convention, programme, critères…) via
 * l'edge `send-inscription-documents` (force + inscriptionId).
 */
export function useSendInscriptionDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendInscriptionDocumentsInput) => {
      const body: Record<string, unknown> = {
        inscriptionId: input.inscriptionId,
        force: input.force !== false,
      };
      if (input.customSubject?.trim()) body.customSubject = input.customSubject.trim();
      if (input.customHtml?.trim()) body.customHtml = input.customHtml.trim();

      const result = await invokeAdminEdgeFunction<SendInscriptionDocumentsResult>(
        "send-inscription-documents",
        body
      );

      if (result?.success === false) {
        throw new Error(result.error || result.message || "Envoi du dossier échoué");
      }
      if ((result?.errors?.length ?? 0) > 0 && !(result?.sent && result.sent > 0)) {
        throw new Error(result.errors!.join(" · "));
      }
      if (!(result?.sent && result.sent > 0)) {
        const action = result?.details?.[0]?.action;
        throw new Error(
          action ||
            result?.message ||
            "Aucun e-mail envoyé — vérifier le modèle dossier et l'e-mail du stagiaire."
        );
      }
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["inscription-documents", variables.inscriptionId],
      });
      queryClient.invalidateQueries({ queryKey: ["email-log"] });
      queryClient.invalidateQueries({
        queryKey: ["inscription", variables.inscriptionId],
      });
    },
  });
}
