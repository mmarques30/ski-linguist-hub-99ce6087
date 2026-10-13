/**
 * Pack de fin de formation — orchestration sûre, sans refonte.
 *
 * Ordre : facture, certificat, attestation de présence (FIF-PL), enquête,
 * puis seulement le passage à « Terminée ». Si une étape échoue, on annule
 * ce que cette tentative a créé (l'inscription ne change pas de statut).
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
import {
  buildAttestationPresencePath,
  buildAttestationPresencePdfBlob,
  inferFormationKindFifpl,
  type FormationKindFifpl,
} from "@/lib/attestation-presence-pdf";
import {
  buildInvoicePdfBlob,
  buildInvoicePdfPath,
  type InvoicePdfInput,
} from "@/lib/invoice-pdf";

export type EndPackStep =
  | "invoice"
  | "invoice_pdf"
  | "certificate"
  | "pdf"
  | "sending"
  | "attestation"
  | "survey"
  | "close";

const STEP_LABELS: Record<EndPackStep, string> = {
  invoice: "facture",
  invoice_pdf: "PDF de la facture",
  certificate: "certificat",
  pdf: "dépôt du PDF du certificat",
  sending: "enregistrement du certificat",
  attestation: "attestation de présence",
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
  /** Requis seulement si `generateCertificate` — sinon le pack part sans certificat. */
  niveauGeneralSortie?: string | null;
  niveauTechniqueSortie?: string | null;
  objectifAtteint?: ObjectifAtteint | null;
  commentaireSortie?: string | null;
  attendanceRate?: number;
  generateInvoice: boolean;
  generateCertificate: boolean;
  /** Attestation de présence FIF-PL (dossier de remboursement). */
  generateAttestation: boolean;
  sendSurvey: boolean;
  /**
   * Régénère les PDF même s'ils existent déjà (tampon/signature, facture
   * officielle, etc.). Les lignes DB (facture, certificat, enquête) sont
   * réutilisées ; seuls les fichiers Storage sont réécrits.
   */
  forceRegenerate?: boolean;
  certificatePdfBlob?: Blob | null;
  attestationPdfBlob?: Blob | null;
  invoicePdfBlob?: Blob | null;
  fundingOrganization?: string | null;
  /** Montant pédagogique (sinon lu via getInscriptionAmounts.price). */
  pedagogicalAmount?: number | null;
  formationKind?: FormationKindFifpl | null;
  courseType?: string | null;
  /** Collective : valeurs convention (ignorées si individuelle). */
  joursEntiersConvention?: number | null;
  demiJourneesConvention?: number | null;
  /** Contexte client / règlement pour le PDF facture officiel. */
  invoicePdfContext?: Partial<InvoicePdfInput> | null;
}

export interface EndPackResult {
  invoiceId?: string;
  invoiceNumber?: string | null;
  invoicePath?: string;
  certificateId?: string;
  certificatePath?: string;
  attestationPath?: string;
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
  ): Promise<{
    id: string;
    invoice_number: string | null;
    amount_ht?: number | null;
    invoice_date?: string | null;
    payment_date?: string | null;
    status?: string | null;
  } | null>;
  getInscriptionAmounts(
    inscriptionId: string
  ): Promise<{
    price: number | null;
    deposit_amount: number | null;
    balance_after_deposit?: number | null;
    deposit_date?: string | null;
  } | null>;
  insertInvoice(row: {
    inscription_id: string;
    invoice_type: "formation";
    amount_ht: number;
    payment_type: "saldo" | "integral";
    status: "draft" | "paid";
    payment_date?: string | null;
  }): Promise<{ id: string; invoice_number: string | null }>;
  /** Marque une facture existante comme payée (pack fin, règlement déjà encaissé). */
  markInvoicePaid(
    id: string,
    fields: { payment_date: string | null }
  ): Promise<void>;
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
    document_type: "CERTIFICAT" | "ATTESTATION_PRESENCE" | "FACTURE";
    sent_to: string;
    pdf_url: string;
  }): Promise<{ id: string }>;
  updateDocumentSendingPdfUrl(id: string, path: string): Promise<void>;
  uploadCertificatePdf(path: string, blob: Blob): Promise<void>;
  findExistingAttestation(
    inscriptionId: string
  ): Promise<{ id: string; pdf_url: string | null } | null>;
  findExistingInvoiceSending(
    inscriptionId: string
  ): Promise<{ id: string; pdf_url: string | null } | null>;
  uploadAttestationPdf(path: string, blob: Blob): Promise<void>;
  uploadInvoicePdf(path: string, blob: Blob): Promise<void>;
  removeAttestationPdf(path: string): Promise<void>;
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
  invoicePath?: string;
  invoiceSendingId?: string;
  certificateId?: string;
  attestationPath?: string;
  attestationSendingId?: string;
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
  if (created.invoiceSendingId) {
    await tryUndo("enregistrement de la facture PDF", () =>
      store.deleteDocumentSending(created.invoiceSendingId!)
    );
  }
  if (created.invoicePath) {
    await tryUndo("fichier PDF de la facture", () =>
      store.removeAttestationPdf(created.invoicePath!)
    );
  }
  if (created.attestationSendingId) {
    await tryUndo("enregistrement de l'attestation", () =>
      store.deleteDocumentSending(created.attestationSendingId!)
    );
  }
  if (created.attestationPath) {
    await tryUndo("fichier PDF de l'attestation", () =>
      store.removeAttestationPdf(created.attestationPath!)
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

/**
 * Montant d'acompte à déduire de la facture de solde.
 * Priorité à `deposit_amount` ; sinon reconstitution via
 * `price - balance_after_deposit` (inscriptions FIFPL / OPCO créées avant
 * que `deposit_amount` soit renseigné à la soumission).
 */
export function resolveEndPackDeposit(amounts: {
  price: number | null;
  deposit_amount: number | null;
  balance_after_deposit?: number | null;
}): number {
  if (amounts.deposit_amount != null && amounts.deposit_amount > 0) {
    return amounts.deposit_amount;
  }
  const price = amounts.price ?? 0;
  const balance = amounts.balance_after_deposit;
  if (balance != null && balance >= 0 && price > balance) {
    return price - balance;
  }
  return 0;
}

/**
 * Choisit la facture à réutiliser pour le pack fin.
 * Ignore les annulées et les avoirs (montant ≤ 0) ; préfère une payée.
 */
export function pickEndPackInvoice<
  T extends { status?: string | null; amount_ht?: number | null },
>(invoices: T[]): T | null {
  const usable = invoices.filter((inv) => {
    const status = (inv.status || "").toLowerCase();
    if (status === "cancelled" || status === "annulee") return false;
    const amount = Number(inv.amount_ht);
    if (Number.isFinite(amount) && amount <= 0) return false;
    return true;
  });
  if (usable.length === 0) return null;
  return (
    usable.find((inv) => (inv.status || "").toLowerCase() === "paid") ||
    usable[0]
  );
}

export async function generateEndPack(
  store: EndPackStore,
  data: EndPackInput
): Promise<EndPackResult> {
  const result: EndPackResult = {};
  const created: CreatedInRun = {};
  let step: EndPackStep = "invoice";

  const exitFields = {
    niveau_general_sortie: data.niveauGeneralSortie ?? null,
    niveau_technique_sortie: data.niveauTechniqueSortie ?? null,
    objectif_atteint: data.objectifAtteint ?? null,
    commentaire_sortie: data.commentaireSortie ?? null,
  };

  if (data.generateCertificate && !canIssueCertificate(exitFields)) {
    throw new Error(
      "Certificat impossible : formulaire de sortie formateur incomplet"
    );
  }

  const niveauGeneralSortie = (data.niveauGeneralSortie || "").trim();
  const niveauTechniqueSortie = (data.niveauTechniqueSortie || "").trim();
  const objectifAtteint: ObjectifAtteint = data.objectifAtteint || "non";
  const commentaireSortie = (data.commentaireSortie || "").trim();

  const force = data.forceRegenerate === true;

  try {
    let invoiceRow: Awaited<ReturnType<EndPackStore["findExistingInvoice"]>> =
      null;
    let amountsRow: Awaited<
      ReturnType<EndPackStore["getInscriptionAmounts"]>
    > = null;

    if (data.generateInvoice) {
      step = "invoice";
      invoiceRow = await store.findExistingInvoice(data.inscriptionId);
      const wantPaid = data.invoicePdfContext?.status === "paid";
      const paidDate =
        data.invoicePdfContext?.paymentDate ||
        new Date().toISOString().slice(0, 10);
      if (invoiceRow) {
        result.invoiceId = invoiceRow.id;
        result.invoiceNumber = invoiceRow.invoice_number;
        if (
          wantPaid &&
          (invoiceRow.status || "").toLowerCase() !== "paid"
        ) {
          await store.markInvoicePaid(invoiceRow.id, {
            payment_date: paidDate,
          });
          invoiceRow = {
            ...invoiceRow,
            status: "paid",
            payment_date: paidDate,
          };
        }
      } else {
        amountsRow = await store.getInscriptionAmounts(data.inscriptionId);
        if (!amountsRow) {
          throw new Error("Inscription introuvable, facture impossible.");
        }
        const amount = amountsRow.price || 0;
        const deposit = resolveEndPackDeposit(amountsRow);
        const finalAmount = amount - deposit;
        const invoice = await store.insertInvoice({
          inscription_id: data.inscriptionId,
          invoice_type: "formation",
          amount_ht: finalAmount > 0 ? finalAmount : amount,
          payment_type: deposit > 0 ? "saldo" : "integral",
          status: wantPaid ? "paid" : "draft",
          payment_date: wantPaid ? paidDate : null,
        });
        created.invoiceId = invoice.id;
        result.invoiceId = invoice.id;
        result.invoiceNumber = invoice.invoice_number;
        invoiceRow = {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          amount_ht: finalAmount > 0 ? finalAmount : amount,
          status: wantPaid ? "paid" : "draft",
          payment_date: wantPaid ? paidDate : null,
        };
      }

      // PDF facture au format officiel (InvoiceTemplate) — toujours généré /
      // régénéré pour la PJ e-mail.
      step = "invoice_pdf";
      const existingInvoiceSending = await store.findExistingInvoiceSending(
        data.inscriptionId
      );
      if (existingInvoiceSending?.pdf_url && !force && !data.invoicePdfBlob) {
        result.invoicePath = existingInvoiceSending.pdf_url;
      } else {
        amountsRow =
          amountsRow ||
          (await store.getInscriptionAmounts(data.inscriptionId));
        const price = amountsRow?.price ?? data.pedagogicalAmount ?? 0;
        const deposit = resolveEndPackDeposit(
          amountsRow || {
            price,
            deposit_amount: null,
            balance_after_deposit: null,
          }
        );
        const invoiceNumber =
          result.invoiceNumber ||
          invoiceRow?.invoice_number ||
          data.code ||
          "facture";
        const invoiceDate =
          invoiceRow?.invoice_date ||
          new Date().toISOString().slice(0, 10);
        const ctx = data.invoicePdfContext || {};
        const pdfInput: InvoicePdfInput = {
          invoiceNumber,
          invoiceDate,
          dueDate: ctx.dueDate ?? invoiceDate,
          // Le contexte pack (règlement déjà encaissé) prime sur le statut DB
          // brouillon — sinon le PDF omet « Facture acquittée ».
          status:
            ctx.status ||
            (invoiceRow?.status as InvoicePdfInput["status"]) ||
            "paid",
          clientName: ctx.clientName || data.studentName,
          clientAddress: ctx.clientAddress ?? null,
          clientPostalCode: ctx.clientPostalCode ?? null,
          clientCity: ctx.clientCity ?? null,
          clientCompany: ctx.clientCompany ?? null,
          courseDescription:
            ctx.courseDescription ||
            `Formation ${data.language || ""}`.trim(),
          courseDateStart: ctx.courseDateStart || data.startDate,
          courseDateEnd: ctx.courseDateEnd || data.endDate,
          courseDurationHours:
            ctx.courseDurationHours ?? data.durationHours ?? null,
          courseLocation:
            ctx.courseLocation ||
            formatLocationOrModality({
              course_location: data.courseLocation,
              modality: data.modality,
            }),
          amountHt: Number(
            ctx.amountHt ?? price ?? invoiceRow?.amount_ht ?? 0
          ),
          amountTtc: Number(
            ctx.amountTtc ?? ctx.amountHt ?? price ?? invoiceRow?.amount_ht ?? 0
          ),
          acompteAmount: ctx.acompteAmount ?? deposit,
          acompteDate:
            ctx.acompteDate ?? amountsRow?.deposit_date ?? null,
          paymentDate:
            ctx.paymentDate || invoiceRow?.payment_date || null,
          paymentMethodLabel: ctx.paymentMethodLabel ?? null,
        };
        const invoiceBlob =
          data.invoicePdfBlob || (await buildInvoicePdfBlob(pdfInput));
        const invoicePath = buildInvoicePdfPath(
          data.studentId,
          data.inscriptionId,
          invoiceNumber
        );
        await store.uploadInvoicePdf(invoicePath, invoiceBlob);
        if (!existingInvoiceSending) {
          created.invoicePath = invoicePath;
          const sending = await store.insertDocumentSending({
            inscription_id: data.inscriptionId,
            document_type: "FACTURE",
            sent_to: "portail-stagiaire",
            pdf_url: invoicePath,
          });
          created.invoiceSendingId = sending.id;
        } else {
          await store.updateDocumentSendingPdfUrl(
            existingInvoiceSending.id,
            invoicePath
          );
        }
        result.invoicePath = invoicePath;
      }
    }

    if (data.generateCertificate) {
      step = "certificate";
      const existingCert = await store.findExistingCertificate(
        data.inscriptionId
      );
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
        niveauGeneralSortie,
        niveauTechniqueSortie,
        objectifAtteint,
        commentaire: commentaireSortie,
        issueDate,
        inscriptionCode: data.code,
      };

      if (existingCert && !force) {
        result.certificateId = existingCert.id;
        result.certificatePath = existingCert.pdf_url || undefined;
      } else if (existingCert && force) {
        result.certificateId = existingCert.id;
        step = "pdf";
        const pdfBlob =
          data.certificatePdfBlob || (await buildCertificatePdfBlob(bilan));
        const storagePath =
          existingCert.pdf_url ||
          buildCertificatePath(
            data.studentId,
            data.inscriptionId,
            existingCert.id
          );
        await store.uploadCertificatePdf(storagePath, pdfBlob);
        await store.updateCertificatePdfUrl(existingCert.id, storagePath);
        result.certificatePath = storagePath;
      } else {
        const certificate = await store.insertCertificate({
          inscription_id: data.inscriptionId,
          student_id: data.studentId,
          level_achieved: niveauGeneralSortie,
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
          data.certificatePdfBlob || (await buildCertificatePdfBlob(bilan));
        const storagePath = buildCertificatePath(
          data.studentId,
          data.inscriptionId,
          certificate.id
        );
        await store.uploadCertificatePdf(storagePath, pdfBlob);
        created.certificatePath = storagePath;
        await store.updateCertificatePdfUrl(certificate.id, storagePath);
        result.certificatePath = storagePath;

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

    if (data.generateAttestation) {
      step = "attestation";
      const existingAttestation = await store.findExistingAttestation(
        data.inscriptionId
      );
      if (existingAttestation?.pdf_url && !force && !data.attestationPdfBlob) {
        result.attestationPath = existingAttestation.pdf_url;
      } else {
        const issueDate = new Date().toISOString().split("T")[0];
        let amount = data.pedagogicalAmount ?? null;
        if (amount == null) {
          amountsRow =
            amountsRow ||
            (await store.getInscriptionAmounts(data.inscriptionId));
          amount = amountsRow?.price ?? null;
        }
        const formationKind = inferFormationKindFifpl({
          formationKind: data.formationKind,
          modality: data.modality,
          courseType: data.courseType,
        });
        const attestationBlob =
          data.attestationPdfBlob ||
          (await buildAttestationPresencePdfBlob({
            studentName: data.studentName,
            language: data.language,
            startDate: data.startDate,
            endDate: data.endDate,
            durationHoursPlanned: data.durationHours,
            hoursFollowed: data.hoursFollowed,
            attendanceRate: data.attendanceRate ?? null,
            locationOrModality: formatLocationOrModality({
              course_location: data.courseLocation,
              modality: data.modality,
            }),
            formateurName: data.formateurName,
            inscriptionCode: data.code,
            issueDate,
            fundingOrganization: data.fundingOrganization ?? "FIFPL",
            amountHt: amount,
            amountTtc: amount,
            formationKind,
            joursEntiersConvention: data.joursEntiersConvention,
            demiJourneesConvention: data.demiJourneesConvention,
          }));
        const attestationPath =
          existingAttestation?.pdf_url ||
          buildAttestationPresencePath(
            data.studentId,
            data.inscriptionId,
            data.code || data.inscriptionId
          );
        await store.uploadAttestationPdf(attestationPath, attestationBlob);
        result.attestationPath = attestationPath;
        if (!existingAttestation) {
          created.attestationPath = attestationPath;
          const attestationSending = await store.insertDocumentSending({
            inscription_id: data.inscriptionId,
            document_type: "ATTESTATION_PRESENCE",
            sent_to: "portail-stagiaire",
            pdf_url: attestationPath,
          });
          created.attestationSendingId = attestationSending.id;
        } else {
          await store.updateDocumentSendingPdfUrl(
            existingAttestation.id,
            attestationPath
          );
        }
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
      exit_level: niveauGeneralSortie,
      final_general_level: niveauGeneralSortie,
      final_specific_level: niveauTechniqueSortie,
      progression: niveauGeneralSortie
        ? progressionLabel(objectifAtteint)
        : "",
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
