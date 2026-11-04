/**
 * Visibilité ops liste inscriptions : dossier envoyé + règlement (soldé).
 * Agrège `documents_sent_at` et la somme des paiements `recu` vs prix.
 */

export type InscriptionPaymentSettlement =
  | "solde"
  | "partiel"
  | "a_regler"
  | "aucun";

export type InscriptionDocsSentStatus = "envoye" | "a_envoyer";

export function computePaymentSettlement(input: {
  price: number | null | undefined;
  receivedTotal: number;
}): InscriptionPaymentSettlement {
  const price = Number(input.price);
  const received = Math.max(0, Number(input.receivedTotal) || 0);
  if (!Number.isFinite(price) || price <= 0) {
    if (received > 0) return "partiel";
    return "aucun";
  }
  if (received <= 0) return "a_regler";
  // Tolérance 0,5 € pour arrondis Stripe / centimes.
  if (received + 0.5 >= price) return "solde";
  return "partiel";
}

export function docsSentStatus(
  documentsSentAt: string | null | undefined,
): InscriptionDocsSentStatus {
  return documentsSentAt ? "envoye" : "a_envoyer";
}

export const DOCS_SENT_LABELS: Record<InscriptionDocsSentStatus, string> = {
  envoye: "Docs envoyés",
  a_envoyer: "Docs à envoyer",
};

export const DOCS_SENT_TONES: Record<
  InscriptionDocsSentStatus,
  "success" | "warning"
> = {
  envoye: "success",
  a_envoyer: "warning",
};

export const PAYMENT_SETTLEMENT_LABELS: Record<
  InscriptionPaymentSettlement,
  string
> = {
  solde: "Soldé",
  partiel: "Partiel",
  a_regler: "À régler",
  aucun: "Aucun paiement",
};

export const PAYMENT_SETTLEMENT_TONES: Record<
  InscriptionPaymentSettlement,
  "success" | "info" | "warning" | "neutral"
> = {
  solde: "success",
  partiel: "info",
  a_regler: "warning",
  aucun: "neutral",
};

export function sumReceivedPayments(
  payments: Array<{ amount?: number | null; status?: string | null }>,
): number {
  return payments.reduce((sum, p) => {
    if (p.status !== "recu") return sum;
    return sum + (Number(p.amount) || 0);
  }, 0);
}
