import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  buildProgressionSnapshot,
  canIssueCertificate,
  formatLocationOrModality,
  type CertificateBilanData,
  type ObjectifAtteint,
} from "@/lib/certificate-progression";
import { buildCertificatePdfBlob } from "@/lib/certificate-pdf";

interface EndPackData {
  inscriptionId: string;
  studentId: string;
  studentName: string;
  language: string;
  startDate: string;
  endDate: string;
  durationHours: number | null;
  hoursFollowed: number | null;
  courseLocation: string | null;
  modality: string | null;
  formateurName: string | null;
  code: string | null;
  niveauGeneralEntree: string;
  niveauTechniqueEntree: string;
  niveauGeneralSortie: string;
  niveauTechniqueSortie: string;
  objectifAtteint: ObjectifAtteint;
  commentaireSortie: string;
  attendanceRate?: number;
  generateInvoice: boolean;
  generateCertificate: boolean;
  sendSurvey: boolean;
  /** Optional pre-rendered PDF blob (from CertificatePreview). */
  certificatePdfBlob?: Blob | null;
}

interface EndPackResult {
  invoiceId?: string;
  certificateId?: string;
  surveyToken?: string;
  certificateSkippedReason?: string;
}

async function uploadCertificatePdf(
  inscriptionId: string,
  certificateId: string,
  blob: Blob
): Promise<string | null> {
  const path = `certificates/${inscriptionId}/${certificateId}.pdf`;
  const { error } = await supabase.storage.from("documents").upload(path, blob, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) {
    console.error("Certificate PDF upload failed:", error);
    return null;
  }
  const { data } = supabase.storage.from("documents").getPublicUrl(path);
  return data.publicUrl;
}

export function useGenerateEndPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EndPackData): Promise<EndPackResult> => {
      const result: EndPackResult = {};

      const exitFields = {
        niveau_general_sortie: data.niveauGeneralSortie,
        niveau_technique_sortie: data.niveauTechniqueSortie,
        objectif_atteint: data.objectifAtteint,
        commentaire_sortie: data.commentaireSortie,
      };

      if (data.generateCertificate && !canIssueCertificate(exitFields)) {
        throw new Error(
          "Certificat impossible : formulaire de sortie formateur incomplet"
        );
      }

      const { error: updateError } = await supabase
        .from("inscriptions")
        .update({
          status: "terminee",
          exit_level: data.niveauGeneralSortie,
          final_general_level: data.niveauGeneralSortie,
          final_specific_level: data.niveauTechniqueSortie,
          progression:
            data.objectifAtteint === "oui"
              ? "Oui"
              : data.objectifAtteint === "partiellement"
                ? "Partiellement"
                : "Non",
          final_status: "terminee",
          end_pack_sent_at: new Date().toISOString(),
          hours_followed: data.hoursFollowed,
        } as never)
        .eq("id", data.inscriptionId);

      if (updateError) throw updateError;

      if (data.generateInvoice) {
        const { data: existingInvoices } = await supabase
          .from("invoices")
          .select("id")
          .eq("inscription_id", data.inscriptionId)
          .eq("payment_type", "integral");

        if (!existingInvoices || existingInvoices.length === 0) {
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

      if (data.generateCertificate) {
        const { data: existingCert } = await supabase
          .from("certificates")
          .select("id, pdf_url")
          .eq("inscription_id", data.inscriptionId);

        if (!existingCert || existingCert.length === 0) {
          const issueDate = new Date().toISOString().split("T")[0];
          const bilan: CertificateBilanData = {
            studentName: data.studentName,
            language: data.language,
            startDate: data.startDate,
            endDate: data.endDate,
            durationHoursPlanned: data.durationHours,
            hoursFollowed: data.hoursFollowed,
            locationOrModality: formatLocationOrModality({
              course_location: data.courseLocation,
              modality: data.modality,
            }),
            formateurName: data.formateurName,
            niveauGeneralEntree: data.niveauGeneralEntree,
            niveauTechniqueEntree: data.niveauTechniqueEntree,
            niveauGeneralSortie: data.niveauGeneralSortie,
            niveauTechniqueSortie: data.niveauTechniqueSortie,
            objectifAtteint: data.objectifAtteint,
            commentaire: data.commentaireSortie,
            issueDate,
            inscriptionCode: data.code,
          };

          const { data: certificate, error: certError } = await supabase
            .from("certificates")
            .insert({
              inscription_id: data.inscriptionId,
              student_id: data.studentId,
              // Conservé pour contrainte NOT NULL — n'est plus le libellé affiché au stagiaire
              level_achieved: data.niveauGeneralSortie,
              attendance_rate: data.attendanceRate ?? null,
              issue_date: issueDate,
              hours_followed: data.hoursFollowed,
              hours_planned: data.durationHours,
              progression_snapshot: buildProgressionSnapshot(bilan),
            } as never)
            .select()
            .single();

          if (certError) throw certError;
          result.certificateId = certificate.id;

          const pdfBlob =
            data.certificatePdfBlob || buildCertificatePdfBlob(bilan);
          const publicUrl = await uploadCertificatePdf(
            data.inscriptionId,
            certificate.id,
            pdfBlob
          );
          if (publicUrl) {
            await supabase
              .from("certificates")
              .update({ pdf_url: publicUrl })
              .eq("id", certificate.id);

            await supabase.from("document_sendings").insert({
              inscription_id: data.inscriptionId,
              document_type: "CERTIFICAT",
              sent_to: "portail-stagiaire",
              pdf_url: publicUrl,
            } as never);
          }
        } else {
          result.certificateId = existingCert[0].id;
        }
      }

      if (data.sendSurvey) {
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
      toast.error(error.message || "Erreur lors de la génération du pack fin de formation");
    },
  });
}

export function useCertificates(inscriptionId?: string) {
  return {
    queryKey: ["certificates", inscriptionId],
  };
}
