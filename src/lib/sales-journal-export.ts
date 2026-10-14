/**
 * Export « journal de ventes » pour l'expert-comptable.
 * CSV séparateur `;`, montants au format français, hors brouillons et annulées.
 */

import { csvEscape } from "@/lib/csv-import-parser";
import { resolveInvoiceClientName } from "@/lib/invoice-client-name";
import { invoiceStatusLabel, paymentMethodLabel } from "@/lib/payment-methods";

export const SALES_JOURNAL_HEADERS = [
  "Date",
  "N° facture",
  "Client",
  "Type client",
  "Nature",
  "Libellé",
  "Montant HT",
  "Taux TVA %",
  "Montant TVA",
  "Montant TTC",
  "Statut",
  "Date échéance",
  "Date paiement",
  "Mode paiement",
  "Exercice",
  "Réf. inscription",
] as const;

/** Statuts exclus du journal comptable (pièces non émises ou annulées). */
export const SALES_JOURNAL_EXCLUDED_STATUSES = new Set(["draft", "cancelled"]);

export const INVOICE_TYPE_LABELS_FR: Record<string, string> = {
  formation: "Formation",
  test: "Test de niveau",
  soustraitance: "Sous-traitance",
};

export const CLIENT_TYPE_LABELS_FR: Record<string, string> = {
  stagiaire: "Stagiaire",
  ecole_ski: "École de ski",
  dsf: "DSF",
  autre: "Autre",
};

export type SalesJournalInvoice = {
  invoice_number?: string | null;
  invoice_date: string;
  due_date?: string | null;
  invoice_type: string;
  client_type: string;
  amount_ht: number;
  tva_rate?: number | null;
  amount_ttc?: number | null;
  status: string;
  payment_date?: string | null;
  payment_method?: string | null;
  fiscal_year?: string | null;
  notes?: string | null;
  inscription?: {
    code?: string | null;
    language?: string | null;
    student_name?: string | null;
    student_company?: string | null;
  } | null;
};

export type SalesJournalRow = {
  date: string;
  invoiceNumber: string;
  client: string;
  clientType: string;
  nature: string;
  label: string;
  amountHt: number;
  tvaRate: number;
  amountTva: number;
  amountTtc: number;
  status: string;
  dueDate: string;
  paymentDate: string;
  paymentMethod: string;
  fiscalYear: string;
  inscriptionRef: string;
};

/** ISO `yyyy-MM-dd` → `dd/MM/yyyy` (ou chaîne vide). */
export function formatJournalDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Montant français : virgule décimale, 2 décimales (Excel FR). */
export function formatJournalAmount(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return n.toFixed(2).replace(".", ",");
}

export function computeTvaAmount(amountHt: number, tvaRate: number | null | undefined): number {
  const rate = Number(tvaRate) || 0;
  const ht = Number(amountHt) || 0;
  return Math.round(ht * rate) / 100;
}

export function resolveAmountTtc(
  amountHt: number,
  amountTtc: number | null | undefined,
  tvaRate: number | null | undefined
): number {
  if (amountTtc != null && Number.isFinite(Number(amountTtc))) {
    return Number(amountTtc);
  }
  return (Number(amountHt) || 0) + computeTvaAmount(amountHt, tvaRate);
}

/** Libellé métier pour la ligne (notes import, langue, ou type). */
export function resolveJournalLabel(invoice: SalesJournalInvoice): string {
  const notesLine = (invoice.notes || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !l.startsWith("---"));
  if (notesLine) {
    const afterDash = notesLine.split(/\s+[—–-]\s+/).slice(1).join(" — ").trim();
    if (afterDash) return afterDash;
  }
  const lang = invoice.inscription?.language?.trim();
  if (lang && invoice.invoice_type === "formation") {
    return `Formation ${lang}`;
  }
  return INVOICE_TYPE_LABELS_FR[invoice.invoice_type] || invoice.invoice_type;
}

export function isIncludedInSalesJournal(status: string): boolean {
  return !SALES_JOURNAL_EXCLUDED_STATUSES.has(status);
}

export function buildSalesJournalRows(invoices: SalesJournalInvoice[]): SalesJournalRow[] {
  const included = invoices.filter((inv) => isIncludedInSalesJournal(inv.status));

  const sorted = [...included].sort((a, b) => {
    const byDate = a.invoice_date.localeCompare(b.invoice_date);
    if (byDate !== 0) return byDate;
    return (a.invoice_number || "").localeCompare(b.invoice_number || "", "fr");
  });

  return sorted.map((invoice) => {
    const amountHt = Number(invoice.amount_ht) || 0;
    const tvaRate = Number(invoice.tva_rate) || 0;
    const amountTva = computeTvaAmount(amountHt, tvaRate);
    const amountTtc = resolveAmountTtc(amountHt, invoice.amount_ttc, tvaRate);
    const client = resolveInvoiceClientName(invoice);

    return {
      date: formatJournalDate(invoice.invoice_date),
      invoiceNumber: invoice.invoice_number || "",
      client: client === "-" ? "" : client,
      clientType: CLIENT_TYPE_LABELS_FR[invoice.client_type] || invoice.client_type,
      nature: INVOICE_TYPE_LABELS_FR[invoice.invoice_type] || invoice.invoice_type,
      label: resolveJournalLabel(invoice),
      amountHt,
      tvaRate,
      amountTva,
      amountTtc,
      status: invoiceStatusLabel(invoice.status),
      dueDate: formatJournalDate(invoice.due_date),
      paymentDate: formatJournalDate(invoice.payment_date),
      paymentMethod: paymentMethodLabel(invoice.payment_method),
      fiscalYear: invoice.fiscal_year || "",
      inscriptionRef: invoice.inscription?.code || "",
    };
  });
}

export function salesJournalRowToCells(row: SalesJournalRow): string[] {
  return [
    row.date,
    row.invoiceNumber,
    row.client,
    row.clientType,
    row.nature,
    row.label,
    formatJournalAmount(row.amountHt),
    formatJournalAmount(row.tvaRate),
    formatJournalAmount(row.amountTva),
    formatJournalAmount(row.amountTtc),
    row.status,
    row.dueDate,
    row.paymentDate,
    row.paymentMethod,
    row.fiscalYear,
    row.inscriptionRef,
  ];
}

export function buildSalesJournalTotalsRow(rows: SalesJournalRow[]): string[] {
  const sumHt = rows.reduce((s, r) => s + r.amountHt, 0);
  const sumTva = rows.reduce((s, r) => s + r.amountTva, 0);
  const sumTtc = rows.reduce((s, r) => s + r.amountTtc, 0);
  return [
    "",
    "TOTAL",
    "",
    "",
    "",
    `${rows.length} ligne(s)`,
    formatJournalAmount(sumHt),
    "",
    formatJournalAmount(sumTva),
    formatJournalAmount(sumTtc),
    "",
    "",
    "",
    "",
    "",
    "",
  ];
}

/** Contenu CSV (sans BOM — `downloadTextFile` l'ajoute). */
export function buildSalesJournalCsv(invoices: SalesJournalInvoice[]): string {
  const rows = buildSalesJournalRows(invoices);
  const lines = [
    SALES_JOURNAL_HEADERS.join(";"),
    ...rows.map((row) => salesJournalRowToCells(row).map(csvEscape).join(";")),
  ];
  if (rows.length > 0) {
    lines.push(buildSalesJournalTotalsRow(rows).map(csvEscape).join(";"));
  }
  return lines.join("\n");
}

export function salesJournalFilename(opts?: {
  dateFrom?: string | null;
  dateTo?: string | null;
  exportedAt?: Date;
}): string {
  const stamp = (opts?.exportedAt ?? new Date()).toISOString().slice(0, 10);
  if (opts?.dateFrom && opts?.dateTo) {
    return `journal-ventes_${opts.dateFrom}_${opts.dateTo}.csv`;
  }
  return `journal-ventes_${stamp}.csv`;
}
