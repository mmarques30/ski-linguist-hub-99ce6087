/** Origine facture — BL-007 / Pilotage. */
export const INVOICE_ORIGIN_APP = "app" as const;
export const INVOICE_ORIGIN_IMPORT = "import_historique" as const;

export type InvoiceOrigin =
  | typeof INVOICE_ORIGIN_APP
  | typeof INVOICE_ORIGIN_IMPORT;

/** Relances, KPI retard, trésorerie opérationnelle : uniquement l’app. */
export function isOperationalInvoiceOrigin(
  origin: string | null | undefined
): boolean {
  return origin === INVOICE_ORIGIN_APP || origin == null;
}
