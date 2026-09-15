/**
 * Pack de fin de formation — orchestration sûre, sans refonte.
 *
 * Ordre : facture, certificat, enquête, puis seulement le passage à
 * « Terminée ». Si une étape échoue, on annule ce que cette tentative a créé
 * (l'inscription ne change pas de statut).
 */

import {
  buildProgressionSnapshot,
  canIssueCertificate,
  formatLocationOrModality,
  type CertificateBilanData,
  type ObjectifAtteint,
} from "@/lib/certificate-progression";
import { buildCertificatePdfBlob } from "@/lib/certificate-pdf";
import { buildCertificatePath } from "@/lib/certificateStorage";

export type EndPackStep =
  | "invoice"
  | "certificate"
  | "pdf"
  | "sending"
  | "survey"
  | "close";

const STEP_LABELS: Record<EndPackStep, string> = {
  invoice: "facture",
  certificate: "certificat",
  pdf: "dépôt du PDF du certificat",
  sending: "enregistrement du certificat",
  survey: "enquête de satisfaction",
  close: "passage au statut Terminée",
};

export interface EndPackInput {
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
  certificatePdfBlob?: Blob | null;
}

export interface EndPackResult {
  invoiceId?: string;
  invoiceNumber?: string | null;
  certificateId?: string;
  surveyToken?: string;
  certificateSkippedReason?: string;
}

export type EndPackCloseFields = {
  status: "terminee";
  exit_level: string;
  final_general_level: string;
  final_specific_level: string;
  progression: string;
  final_status: "terminee";
  end_pack_sent_at: string;
  hours_followed: number | null;
};

export interface EndPackStore {
  findExistingInvoice(
    inscriptionId: string
  ): Promise<{ id: string; invoice_number: string | null } | null>;
  getInscriptionAmounts(
    inscriptionId: string
  ): Promise<{ price: number | null; deposit_amount: number | null } | null>;
  insertInvoice(row: {
    inscription_id: string;
    invoice_type: "formation";
    amount_ht: number;
    payment_type: "saldo" | "integral";
    status: "draft";
  }): Promise<{ id: string; invoice_number: string | null }>;
  findExistingCertificate(
    inscriptionId: string
  ): Promise<{ id: string; pdf_url: string | null } | null>;
  insertCertificate(row: {
    inscription_id: string;
    student_id: string;
    level_achieved: string;
    attendance_rate: number | null;
    issue_date: string;
    hours_followed: number | null;
    hours_planned: number | null;
    progression_snapshot: ReturnType<typeof buildProgressionSnapshot>;
  }): Promise<{ id: string }>;
  updateCertificatePdfUrl(id: string, path: string): Promise<void>;
  insertDocumentSending(row: {
    inscription_id: string;
    document_type: "CERTIFICAT";
    sent_to: string;
    pdf_url: string;
  }): Promise<{ id: string }>;
  uploadCertificatePdf(path: string, blob: Blob): Promise<void>;
  findExistingSurvey(
    inscriptionId: string
  ): Promise<{ id: string; token: string } | null>;
  insertSurvey(row: {
    inscription_id: string;
    student_id: string;
  }): Promise<{ id: string; token: string }>;
  closeInscription(
    inscriptionId: string,
    fields: EndPackCloseFields
  ): Promise<void>;
  deleteInvoice(id: string): Promise<void>;
  deleteCertificate(id: string): Promise<void>;
  deleteDocumentSending(id: string): Promise<void>;
  deleteSurvey(id: string): Promise<void>;
  removeCertificatePdf(path: string): Promise<void>;
}

type CreatedInRun = {
  invoiceId?: string;
  certificateId?: string;
  certificatePath?: string;
  sendingId?: string;
  surveyId?: string;
};

export function describeEndPackRollback(params: {
  step: EndPackStep;
  cause: string;
  rolledBack: string[];
  rollbackFailures: string[];
}): string {
  const cause = params.cause.replace(/\s+/g, " ").trim();
  const annule =
    params.rolledBack.length > 0
      ? ` Annulé : ${params.rolledBack.join(", ")}.`
      : " Rien n'avait encore été créé.";
  const echecAnnul =
    params.rollbackFailures.length > 0
      ? ` Impossible d'annuler : ${params.rollbackFailures.join(", ")}.`
      : "";
  return `Pack de fin interrompu à l'étape « ${STEP_LABELS[params.step]} » : ${cause}. L'inscription n'est pas passée à « Terminée ».${annule}${echecAnnul}`;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "erreur inattendue";
}

async function rollbackCreated(
  store: EndPackStore,
  created: CreatedInRun
): Promise<{ rolledBack: string[]; rollbackFailures: string[] }> {
  const rolledBack: string[] = [];
  const rollbackFailures: string[] = [];

  const tryUndo = async (label: string, action: () => Promise<void>) => {
    try {
      await action();
      rolledBack.push(label);
    } catch (error) {
      rollbackFailures.push(`${label} (${errorMessage(error)})`);
    }
  };

  if (created.surveyId) {
    await tryUndo("enquête de satisfaction", () =>
      store.deleteSurvey(created.surveyId!)
    );
  }
  if (created.sendingId) {
    await tryUndo("enregistrement du certificat", () =>
      store.deleteDocumentSending(created.sendingId!)
    );
  }
  if (created.certificatePath) {
    await tryUndo("fichier PDF du certificat", () =>
      store.removeCertificatePdf(created.certificatePath!)
    );
  }
  if (created.certificateId) {
    await tryUndo("certificat", () =>
      store.deleteCertificate(created.certificateId!)
    );
  }
  if (created.invoiceId) {
    await tryUndo("facture brouillon", () =>
      store.deleteInvoice(created.invoiceId!)
    );
  }

  return { rolledBack, rollbackFailures };
}

function progressionLabel(objectif: ObjectifAtteint): string {
  if (objectif === "oui") return "Oui";
  if (objectif === "partiellement") return "Partiellement";
  return "Non";
}

export async function generateEndPack(
  store: EndPackStore,
  data: EndPackInput
): Promise<EndPackResult> {
  const result: EndPackResult = {};
  const created: CreatedInRun = {};
  let step: EndPackStep = "invoice";

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

  try {
    if (data.generateInvoice) {
      step = "invoice";
      const existing = await store.findExistingInvoice(data.inscriptionId);
      if (existing) {
        result.invoiceId = existing.id;
        result.invoiceNumber = existing.invoice_number;
      } else {
        const amounts = await store.getInscriptionAmounts(data.inscriptionId);
        if (!amounts) {
          throw new Error("Inscription introuvable, facture impossible.");
        }
        const amount = amounts.price || 0;
        const deposit = amounts.deposit_amount || 0;
        const finalAmount = amount - deposit;
        const invoice = await store.insertInvoice({
          inscription_id: data.inscriptionId,
          invoice_type: "formation",
          amount_ht: finalAmount > 0 ? finalAmount : amount,
          payment_type: deposit > 0 ? "saldo" : "integral",
          status: "draft",
        });
        created.invoiceId = invoice.id;
        result.invoiceId = invoice.id;
        result.invoiceNumber = invoice.invoice_number;
      }
    }

    if (data.generateCertificate) {
      step = "certificate";
      const existingCert = await store.findExistingCertificate(
        data.inscriptionId
      );
      if (existingCert) {
        result.certificateId = existingCert.id;
      } else {
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

        const certificate = await store.insertCertificate({
          inscription_id: data.inscriptionId,
          student_id: data.studentId,
          level_achieved: data.niveauGeneralSortie,
          attendance_rate: data.attendanceRate ?? null,
          issue_date: issueDate,
          hours_followed: data.hoursFollowed,
          hours_planned: data.durationHours,
          progression_snapshot: buildProgressionSnapshot(bilan),
        });
        created.certificateId = certificate.id;
        result.certificateId = certificate.id;

        step = "pdf";
        const pdfBlob =
          data.certificatePdfBlob || buildCertificatePdfBlob(bilan);
        const storagePath = buildCertificatePath(
          data.studentId,
          data.inscriptionId,
          certificate.id
        );
        await store.uploadCertificatePdf(storagePath, pdfBlob);
        created.certificatePath = storagePath;
        await store.updateCertificatePdfUrl(certificate.id, storagePath);

        step = "sending";
        const sending = await store.insertDocumentSending({
          inscription_id: data.inscriptionId,
          document_type: "CERTIFICAT",
          sent_to: "portail-stagiaire",
          pdf_url: storagePath,
        });
        created.sendingId = sending.id;
      }
    }

    if (data.sendSurvey) {
      step = "survey";
      const existingSurvey = await store.findExistingSurvey(data.inscriptionId);
      if (existingSurvey) {
        result.surveyToken = existingSurvey.token;
      } else {
        const survey = await store.insertSurvey({
          inscription_id: data.inscriptionId,
          student_id: data.studentId,
        });
        created.surveyId = survey.id;
        result.surveyToken = survey.token;
      }
    }

    step = "close";
    await store.closeInscription(data.inscriptionId, {
      status: "terminee",
      exit_level: data.niveauGeneralSortie,
      final_general_level: data.niveauGeneralSortie,
      final_specific_level: data.niveauTechniqueSortie,
      progression: progressionLabel(data.objectifAtteint),
      final_status: "terminee",
      end_pack_sent_at: new Date().toISOString(),
      hours_followed: data.hoursFollowed,
    });

    return result;
  } catch (error) {
    const { rolledBack, rollbackFailures } = await rollbackCreated(
      store,
      created
    );
    throw new Error(
      describeEndPackRollback({
        step,
        cause: errorMessage(error),
        rolledBack,
        rollbackFailures,
      })
    );
  }
}
