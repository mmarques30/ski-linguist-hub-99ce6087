import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { describeCaughtError } from "@/lib/supabase-error";
import {
  generateEndPack,
  type EndPackInput,
  type EndPackResult,
  type EndPackStore,
} from "@/lib/end-pack";
import { CERTIFICATE_BUCKET } from "@/lib/certificateStorage";

export type { EndPackInput as EndPackData, EndPackResult };

function throwIfError(error: unknown, fallback: string): void {
  if (!error) return;
  throw new Error(describeCaughtError(error).message || fallback);
}

function createSupabaseEndPackStore(): EndPackStore {
  return {
    async findExistingInvoice(inscriptionId) {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number")
        .eq("inscription_id", inscriptionId)
        .in("payment_type", ["integral", "saldo", "solde"]);
      throwIfError(error, "Lecture des factures impossible.");
      if (!data || data.length === 0) return null;
      return { id: data[0].id, invoice_number: data[0].invoice_number };
    },

    async getInscriptionAmounts(inscriptionId) {
      const { data, error } = await supabase
        .from("inscriptions")
        .select("price, deposit_amount")
        .eq("id", inscriptionId)
        .maybeSingle();
      throwIfError(error, "Lecture de l'inscription impossible.");
      return data;
    },

    async insertInvoice(row) {
      const { data, error } = await supabase
        .from("invoices")
        .insert(row)
        .select("id, invoice_number")
        .single();
      throwIfError(error, "Création de la facture impossible.");
      if (!data) throw new Error("Création de la facture impossible.");
      return data;
    },

    async findExistingCertificate(inscriptionId) {
      const { data, error } = await supabase
        .from("certificates")
        .select("id, pdf_url")
        .eq("inscription_id", inscriptionId);
      throwIfError(error, "Lecture des certificats impossible.");
      if (!data || data.length === 0) return null;
      return { id: data[0].id, pdf_url: data[0].pdf_url };
    },

    async insertCertificate(row) {
      const { data, error } = await supabase
        .from("certificates")
        .insert(row as never)
        .select("id")
        .single();
      throwIfError(error, "Création du certificat impossible.");
      if (!data) throw new Error("Création du certificat impossible.");
      return { id: data.id };
    },

    async updateCertificatePdfUrl(id, path) {
      const { error } = await supabase
        .from("certificates")
        .update({ pdf_url: path })
        .eq("id", id);
      throwIfError(error, "Enregistrement du chemin PDF impossible.");
    },

    async insertDocumentSending(row) {
      const { data, error } = await supabase
        .from("document_sendings")
        .insert(row as never)
        .select("id")
        .single();
      throwIfError(error, "Enregistrement du certificat impossible.");
      if (!data) throw new Error("Enregistrement du certificat impossible.");
      return { id: data.id };
    },

    async uploadCertificatePdf(path, blob) {
      const { error } = await supabase.storage
        .from(CERTIFICATE_BUCKET)
        .upload(path, blob, {
          contentType: "application/pdf",
          upsert: true,
        });
      throwIfError(error, "Dépôt du PDF du certificat impossible.");
    },

    async findExistingSurvey(inscriptionId) {
      const { data, error } = await supabase
        .from("satisfaction_surveys")
        .select("id, token")
        .eq("inscription_id", inscriptionId);
      throwIfError(error, "Lecture des enquêtes impossible.");
      if (!data || data.length === 0) return null;
      return { id: data[0].id, token: data[0].token };
    },

    async insertSurvey(row) {
      const { data, error } = await supabase
        .from("satisfaction_surveys")
        .insert(row)
        .select("id, token")
        .single();
      throwIfError(error, "Création de l'enquête impossible.");
      if (!data) throw new Error("Création de l'enquête impossible.");
      return { id: data.id, token: data.token };
    },

    async closeInscription(inscriptionId, fields) {
      const { error } = await supabase
        .from("inscriptions")
        .update(fields as never)
        .eq("id", inscriptionId);
      throwIfError(error, "Passage au statut Terminée impossible.");
    },

    async deleteInvoice(id) {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      throwIfError(error, "Annulation de la facture brouillon impossible.");
    },

    async deleteCertificate(id) {
      const { error } = await supabase.from("certificates").delete().eq("id", id);
      throwIfError(error, "Annulation du certificat impossible.");
    },

    async deleteDocumentSending(id) {
      const { error } = await supabase
        .from("document_sendings")
        .delete()
        .eq("id", id);
      throwIfError(error, "Annulation de l'enregistrement du certificat impossible.");
    },

    async deleteSurvey(id) {
      const { error } = await supabase
        .from("satisfaction_surveys")
        .delete()
        .eq("id", id);
      throwIfError(error, "Annulation de l'enquête impossible.");
    },

    async removeCertificatePdf(path) {
      const { error } = await supabase.storage
        .from(CERTIFICATE_BUCKET)
        .remove([path]);
      throwIfError(error, "Suppression du PDF du certificat impossible.");
    },
  };
}

export function useGenerateEndPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EndPackInput): Promise<EndPackResult> => {
      return generateEndPack(createSupabaseEndPackStore(), data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-documents"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-progression"] });

      const messages = [];
      if (result.invoiceId) messages.push("facture");
      if (result.certificateId) messages.push("certificat");
      if (result.surveyToken) messages.push("questionnaire");

      if (messages.length > 0) {
        toast.success(`Pack fin de formation généré : ${messages.join(", ")}`);
      }
    },
    onError: (error: Error) => {
      console.error("End pack generation error:", error);
      const message = error.message || "";
      if (message.includes("Transition de statut non autorisée")) {
        toast.error(
          "Clôture refusée par la base : la migration du cycle de vie (point 10) n'est pas appliquée sur cet environnement."
        );
        return;
      }
      toast.error(message || "Erreur lors de la génération du pack fin de formation");
    },
  });
}

export function useCertificates(inscriptionId?: string) {
  return {
    queryKey: ["certificates", inscriptionId],
  };
}
