/** Statuts facture (référentiel unique UI + KPI + crons). */

export const INVOICE_STATUSES = [
  { value: "draft", label: "Brouillon" },
  { value: "sent", label: "Envoyée" },
  { value: "en_attente", label: "En attente" },
  { value: "a_relancer", label: "À relancer" },
  { value: "paid", label: "Payée" },
  { value: "cancelled", label: "Annulée" },
  { value: "a_verifier", label: "À vérifier" },
] as const;

export type InvoiceStatusValue = (typeof INVOICE_STATUSES)[number]["value"];

/** Statuts encore ouverts (non soldés / non annulés) — KPI retard & relances auto. */
export const INVOICE_OPEN_STATUSES: InvoiceStatusValue[] = [
  "draft",
  "sent",
  "en_attente",
  "a_relancer",
];

/** Statuts sur lesquels Paula suit le recouvrement manuellement. */
export const INVOICE_COLLECTION_STATUSES: InvoiceStatusValue[] = [
  "en_attente",
  "a_relancer",
  "sent",
];

export function invoiceStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return INVOICE_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function isOpenInvoiceStatus(status: string | null | undefined): boolean {
  return INVOICE_OPEN_STATUSES.includes(status as InvoiceStatusValue);
}
