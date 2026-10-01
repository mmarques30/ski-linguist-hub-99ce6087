/**
 * File d'attente modèle 2 (`inscription_documents`).
 *
 * Règle Paula : pour les flux avec règlement (Stripe / virement), le dossier
 * part seulement après confirmation du paiement des frais de dossier (150 €)
 * ou du paiement intégral — pas à la soumission d'inscription.
 *
 * Miroir Edge : `supabase/functions/_shared/enqueue-inscription-documents.ts`.
 */

import { isStudentPayer } from "@/lib/inscription-payer";

export const DOCUMENT_REMINDER_DELAY_MINUTES = 30;

export type DepositConfirmingPayment = {
  status: string;
  amount: number;
  payment_type?: string | null;
};

/**
 * Un paiement « reçu » de type acompte ou total confirme le règlement
 * qui autorise l'envoi du dossier (150 € ou intégral).
 * Le solde chèque (`partial`) ne déclenche pas l'envoi.
 */
export function qualifiesAsDepositConfirmation(
  payment: DepositConfirmingPayment
): boolean {
  const status = (payment.status || "").toLowerCase();
  if (status !== "recu" && status !== "valide") return false;
  const type = (payment.payment_type || "").toLowerCase();
  if (type !== "acompte" && type !== "total") return false;
  return Number(payment.amount) > 0;
}

export type EnqueueInscriptionDocumentsParams = {
  /** Client Supabase (service role côté Edge, session staff côté app). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { from: (table: string) => any };
  inscriptionId: string;
  fundingOrganization?: string | null;
  delayMinutes?: number;
};

/**
 * Enfile un rappel DOCUMENT (+30 min) si le payeur est le stagiaire et qu'aucun
 * rappel PENDING/SENT n'existe déjà (idempotent). Un CANCELLED n'empêche pas
 * un nouvel enfilement après confirmation de paiement.
 */
export async function enqueueInscriptionDocuments(
  params: EnqueueInscriptionDocumentsParams
): Promise<boolean> {
  if (!isStudentPayer({ funding_organization: params.fundingOrganization })) {
    return false;
  }

  const { data: existing, error: existingError } = await params.supabase
    .from("scheduled_reminders")
    .select("id")
    .eq("related_id", params.inscriptionId)
    .eq("related_table", "inscriptions")
    .eq("type", "DOCUMENT")
    .in("status", ["PENDING", "SENT"])
    .limit(1);

  if (existingError) {
    console.error("enqueue inscription_documents lookup:", existingError);
    return false;
  }
  if (existing && existing.length > 0) {
    return false;
  }

  const delayMs = (params.delayMinutes ?? DOCUMENT_REMINDER_DELAY_MINUTES) * 60 * 1000;
  const scheduledFor = new Date(Date.now() + delayMs).toISOString();
  const { error } = await params.supabase.from("scheduled_reminders").insert({
    type: "DOCUMENT",
    related_id: params.inscriptionId,
    related_table: "inscriptions",
    scheduled_for: scheduledFor,
    status: "PENDING",
  });
  if (error) {
    console.error("enqueue inscription_documents:", error);
    return false;
  }
  return true;
}

/**
 * Après confirmation d'un acompte / paiement intégral : pose `deposit_date`
 * si besoin, puis enfile le dossier.
 */
export async function confirmDepositAndEnqueueDocuments(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { from: (table: string) => any };
  inscriptionId: string;
  paymentDate: string;
  fundingOrganization?: string | null;
}): Promise<{ depositDateSet: boolean; documentsEnqueued: boolean }> {
  const { data: inscription } = await params.supabase
    .from("inscriptions")
    .select("id, deposit_date, funding_organization")
    .eq("id", params.inscriptionId)
    .maybeSingle();

  if (!inscription) {
    return { depositDateSet: false, documentsEnqueued: false };
  }

  let depositDateSet = false;
  if (!inscription.deposit_date) {
    const { error } = await params.supabase
      .from("inscriptions")
      .update({ deposit_date: params.paymentDate })
      .eq("id", params.inscriptionId);
    if (!error) depositDateSet = true;
  }

  const fundingOrganization =
    params.fundingOrganization ?? inscription.funding_organization ?? null;
  const documentsEnqueued = await enqueueInscriptionDocuments({
    supabase: params.supabase,
    inscriptionId: params.inscriptionId,
    fundingOrganization,
  });

  return { depositDateSet, documentsEnqueued };
}
