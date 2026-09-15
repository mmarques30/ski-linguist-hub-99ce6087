/** Liste unique des moyens de paiement (facture et paiement). */
export const PAYMENT_METHODS = [
  { value: "cb", label: "Carte" },
  { value: "virement", label: "Virement" },
  { value: "cheque", label: "Chèque" },
  { value: "especes", label: "Espèces" },
  { value: "stripe", label: "Stripe" },
  { value: "organisme", label: "Prise en charge organisme" },
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]["value"];

/** Moyen réservé à l'import historique (moyen vide avant le 01/07/2025). */
export const HISTORICAL_PAYMENT_METHOD = "historique" as const;

export const CHEQUE_STATUSES = [
  { value: "recu", label: "Reçu" },
  { value: "remis", label: "Remis" },
  { value: "encaisse", label: "Encaissé" },
  { value: "rejete", label: "Rejeté" },
] as const;

export type ChequeStatusValue = (typeof CHEQUE_STATUSES)[number]["value"];

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  cancelled: "Annulée",
  a_verifier: "À vérifier",
};

const LEGACY_METHOD_ALIASES: Record<string, PaymentMethodValue> = {
  carte: "cb",
  carte_bancaire: "cb",
  opco: "organisme",
};

export function canonicalPaymentMethod(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const folded = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (folded === HISTORICAL_PAYMENT_METHOD) return HISTORICAL_PAYMENT_METHOD;
  if (LEGACY_METHOD_ALIASES[folded]) return LEGACY_METHOD_ALIASES[folded];
  if (PAYMENT_METHODS.some((m) => m.value === folded)) return folded;
  return raw;
}

export function paymentMethodLabel(raw: string | null | undefined): string {
  const value = canonicalPaymentMethod(raw);
  if (!value) return "—";
  if (value === HISTORICAL_PAYMENT_METHOD) return "Non renseigné (historique)";
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}

export function invoiceStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return INVOICE_STATUS_LABELS[status] ?? status;
}

export function chequeStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return CHEQUE_STATUSES.find((s) => s.value === status)?.label ?? status;
}
