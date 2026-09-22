/**
 * Point 9 — import du CSV de facturation FLI (export Paula).
 *
 * Format : UTF-8 BOM, séparateur `;`, dates ISO, décimales à virgule.
 * Les numéros `Fact FLI` sont conservés tels quels (jamais de renumérotation).
 * Trou historique unique attendu : séquence 13288 (décembre 2021).
 */

import {
  parseCsvText,
  parseFrenchNumber,
  type CsvRow,
} from "@/lib/csv-import-parser";
import { applyDsfFormationClientType } from "@/lib/invoice-client-type";

/** Trou de séquence connu : ne pas le combler. */
export const HISTORICAL_SEQUENCE_GAP = 13288;

export type InvoiceType = "formation" | "test" | "soustraitance";
export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled" | "a_verifier";
export type ClientType = "stagiaire" | "ecole_ski" | "dsf" | "autre";
export type DbPaymentMethod =
  | "cheque"
  | "virement"
  | "cb"
  | "especes"
  | "stripe"
  | "organisme"
  | "historique";

export type PaymentKind =
  | "cheque"
  | "virement"
  | "cb"
  | "especes"
  | "stripe"
  | "organisme"
  | "unpaid"
  | "credit"
  | "cancelled"
  | "empty"
  | "esf"
  | "other"
  | "historique"
  | "a_verifier";

/** Cut-off Paula : moyen vide avant cette date → réglée, après → à vérifier. */
export const EMPTY_PAYMENT_CUTOFF = "2025-07-01";

export interface FliInvoiceParsedRow {
  lineNumber: number;
  sequence: number;
  fiscalYear: string;
  invoiceNumber: string;
  invoiceDate: string;
  designation: string;
  amountHt: number;
  tvaAmount: number;
  amountTtc: number;
  tvaRate: 0 | 20;
  invoiceType: InvoiceType;
  typeAmbiguous: boolean;
  typeNote: string | null;
  language: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  clientName: string;
  email: string | null;
  skiSchool: string | null;
  paymentKind: PaymentKind;
  paymentMethod: DbPaymentMethod | null;
  paymentDate: string | null;
  chequeNumber: string | null;
  chequeBank: string | null;
  invoiceStatus: InvoiceStatus;
  askPaula: boolean;
  askPaulaReason: string | null;
  clientType: ClientType;
  relatedInvoiceRef: string | null;
  depositAmount: number | null;
  depositDate: string | null;
  depositMethod: DbPaymentMethod | null;
  notes: string | null;
  raw: CsvRow;
}

export interface FiscalYearTotal {
  year: string;
  n: number;
  ht: number;
  tva: number;
  ttc: number;
}

export interface InscriptionMatchInput {
  id: string;
  code: string | null;
  start_date: string | null;
  language: string | null;
  first_name: string | null;
  last_name: string | null;
}

export interface InvoiceMatch {
  invoiceNumber: string;
  inscriptionId: string;
  inscriptionCode: string | null;
  studentName: string;
}

export interface FliInvoicesPreview {
  totalRows: number;
  encodingNotes: string[];
  sequence: {
    min: number;
    max: number;
    missing: number[];
    knownGapPreserved: boolean;
    duplicates: string[];
  };
  totalsByYear: FiscalYearTotal[];
  grandTotal: FiscalYearTotal;
  /** HT/TVA/TTC hors factures annulées (les avoirs négatifs restent déduits). */
  caByYear: FiscalYearTotal[];
  caGrandTotal: FiscalYearTotal;
  byType: Record<InvoiceType, number>;
  byPaymentKind: Record<PaymentKind, number>;
  ambiguousTypes: Array<{
    invoiceNumber: string;
    designation: string;
    tvaAmount: number;
    note: string;
  }>;
  emptyPaymentMethods: Array<{
    invoiceNumber: string;
    clientName: string;
    invoiceDate: string;
    year: string;
    amountHt: number;
    amountTtc: number;
    resolution: "credit" | "cancelled" | "historique" | "a_verifier";
  }>;
  toVerify: Array<{
    invoiceNumber: string;
    clientName: string;
    invoiceDate: string;
    amountTtc: number;
  }>;
  credits: Array<{ invoiceNumber: string; amountHt: number; relatedInvoiceRef: string | null }>;
  cancelled: Array<{ invoiceNumber: string; amountHt: number }>;
  esfBilled: Array<{
    invoiceNumber: string;
    clientName: string;
    location: string | null;
    skiSchool: string | null;
  }>;
  otherPaymentLabels: Array<{ invoiceNumber: string; label: string }>;
  rows: FliInvoiceParsedRow[];
}

export interface FliInvoicesMatchReport {
  matched: InvoiceMatch[];
  unmatched: Array<{
    invoiceNumber: string;
    clientName: string;
    startDate: string | null;
    language: string | null;
    year: string;
    reason: string;
  }>;
  ambiguous: Array<{
    invoiceNumber: string;
    clientName: string;
    invoiceDate: string;
    startDate: string | null;
    language: string | null;
    candidates: Array<{ id: string; code: string | null; name: string }>;
  }>;
  esfPartners: EsfPartnerLink[];
  byYear: Record<string, { matched: number; unmatched: number; ambiguous: number }>;
}

/** Phrase exigée par Paula avant toute écriture du CSV historique. */
export const FLI_INVOICES_WRITE_CONFIRMATION = "OK import";

export interface EsfPartnerInput {
  id: string;
  name: string;
  type: string;
  station: string | null;
  esf_code?: string | null;
}

export interface EsfPartnerLink {
  invoiceNumber: string;
  clientName: string;
  location: string | null;
  partnerId: string | null;
  partnerName: string | null;
  partnerCode: string | null;
  inscriptionId: string | null;
}

const MAC_ROMAN_TO_LATIN: Record<string, string> = {
  "\u0088": "à",
  "\u0089": "à",
  "\u008a": "è",
  "\u008d": "ç",
  "\u008e": "é",
  "\u008f": "è",
  "\u0090": "ê",
  "\u0091": "ë",
  "\u0094": "î",
  "\u0095": "ï",
  "\u0099": "ô",
  "\u009d": "ù",
};

export function restoreMacRoman(raw: string): string {
  return raw.replace(/[\u0080-\u009F]/g, (ch) => MAC_ROMAN_TO_LATIN[ch] ?? "");
}

export function foldInvoiceText(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = restoreMacRoman(raw);
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/[^a-zA-Z0-9]+/g, " ").toLowerCase().trim();
  return s;
}

export function nameTokens(raw: string | null | undefined): Set<string> {
  const stop = new Set(["de", "du", "des", "la", "le", "les", "d"]);
  return new Set(
    foldInvoiceText(raw)
      .split(/\s+/)
      .filter((t) => t && !stop.has(t))
  );
}

export function languageKey(raw: string | null | undefined): string {
  const t = foldInvoiceText(raw);
  if (!t) return "";
  if (t.startsWith("portugais")) return "portugais";
  if (t.startsWith("neerlandais")) return "neerlandais";
  if (t.startsWith("fle")) return "fle";
  return t;
}

function cell(row: CsvRow, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined) return (row[key] ?? "").trim();
  }
  const wanted = keys.map((k) => foldInvoiceText(k).replace(/\s+/g, ""));
  for (const [k, v] of Object.entries(row)) {
    if (wanted.includes(foldInvoiceText(k).replace(/\s+/g, ""))) {
      return (v ?? "").trim();
    }
  }
  return "";
}

function numberOrZero(raw: string): number {
  const n = parseFrenchNumber(raw);
  return n == null ? 0 : n;
}

function optionalNumber(raw: string): number | null {
  if (!raw.trim()) return null;
  return parseFrenchNumber(raw);
}

function isoDate(raw: string): string | null {
  const s = raw.trim();
  if (!s || s === "-" || s === "?" || s.toUpperCase() === "N/A") return null;
  const folded = foldInvoiceText(s).replace(/\s+/g, "");
  if (!folded || folded === "aregler") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const long = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (long) {
    return `${long[3]}-${long[2].padStart(2, "0")}-${long[1].padStart(2, "0")}`;
  }
  const short = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2})$/);
  if (short) {
    const yy = Number(short[3]);
    const year = yy >= 70 ? 1900 + yy : 2000 + yy;
    return `${year}-${short[2].padStart(2, "0")}-${short[1].padStart(2, "0")}`;
  }
  return null;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function addTotal(current: FiscalYearTotal, row: FliInvoiceParsedRow): FiscalYearTotal {
  return {
    year: current.year,
    n: current.n + 1,
    ht: current.ht + row.amountHt,
    tva: current.tva + row.tvaAmount,
    ttc: current.ttc + row.amountTtc,
  };
}

function mapPaymentMethod(raw: string): DbPaymentMethod | null {
  const k = foldInvoiceText(raw).replace(/\s+/g, "");
  if (!k) return null;
  if (k === "cheque" || k === "chq") return "cheque";
  if (k === "virement") return "virement";
  if (k === "cb" || k === "carte" || k === "cartebancaire") return "cb";
  return null;
}

function parseRelatedInvoiceRef(designation: string): string | null {
  const full = designation.match(/\b(\d{2}-\d{2}\.\d{4,5})\b/);
  if (full) return full[1];
  const seq = designation.match(/facture\s+(\d{5})\b/i);
  if (seq) return seq[1];
  return null;
}

/**
 * Type déduit de la TVA (montant) et de la désignation.
 * TVA à 0 → formation. TVA ≠ 0 → test, sauf « encadrement » → sous-traitance.
 */
export function deduceInvoiceType(
  designation: string,
  tvaAmount: number
): { type: InvoiceType; ambiguous: boolean; note: string | null } {
  if (tvaAmount === 0) {
    return { type: "formation", ambiguous: false, note: null };
  }

  const d = foldInvoiceText(designation);
  if (d.includes("encadrement")) {
    return { type: "soustraitance", ambiguous: false, note: null };
  }

  const testLike =
    /\b(test|tests|testes|tstes|evaluation|evaluations)\b/.test(d) ||
    d.startsWith("tstes") ||
    d.includes("avoir");
  if (testLike) {
    const graphie = !/\b(test|tests|evaluation|evaluations|avoir)\b/.test(d);
    return {
      type: "test",
      ambiguous: false,
      note: graphie
        ? `Graphie « ${designation.slice(0, 80)} » interprétée comme test`
        : d.includes("avoir")
          ? "Avoir à TVA non nulle : type test (crédit sur une évaluation)"
          : null,
    };
  }

  return {
    type: "test",
    ambiguous: true,
    note: `TVA ≠ 0 sans mot test/évaluation/encadrement : type test par défaut — ${designation.slice(0, 80)}`,
  };
}

function classifyPayment(moyen: string): {
  kind: PaymentKind;
  method: DbPaymentMethod | null;
  status: InvoiceStatus;
  askPaula: boolean;
  askPaulaReason: string | null;
  clientType: ClientType;
} {
  const raw = moyen.trim();
  const k = foldInvoiceText(raw).replace(/\s+/g, "");
  if (!k) {
    return {
      kind: "empty",
      method: null,
      status: "sent",
      askPaula: true,
      askPaulaReason: "Moyen de paiement vide",
      clientType: "stagiaire",
    };
  }
  if (k === "avoir") {
    return {
      kind: "credit",
      method: null,
      status: "paid",
      askPaula: false,
      askPaulaReason: null,
      clientType: "stagiaire",
    };
  }
  if (k === "annulee") {
    return {
      kind: "cancelled",
      method: null,
      status: "cancelled",
      askPaula: false,
      askPaulaReason: null,
      clientType: "stagiaire",
    };
  }
  if (k === "aregler") {
    return {
      kind: "unpaid",
      method: null,
      status: "sent",
      askPaula: false,
      askPaulaReason: null,
      clientType: "stagiaire",
    };
  }
  if (k.includes("facture") && k.includes("esf")) {
    return {
      kind: "esf",
      method: null,
      status: "sent",
      askPaula: false,
      askPaulaReason: null,
      clientType: "ecole_ski",
    };
  }
  const method = mapPaymentMethod(raw);
  if (method) {
    return {
      kind: method,
      method,
      status: "paid",
      askPaula: false,
      askPaulaReason: null,
      clientType: "stagiaire",
    };
  }
  return {
    kind: "other",
    method: null,
    status: "sent",
    askPaula: true,
    askPaulaReason: `Moyen de paiement non reconnu : ${raw}`,
    clientType: "stagiaire",
  };
}

/** Règles Paula pour une colonne moyen vide. */
export function applyEmptyPaymentRules(row: FliInvoiceParsedRow): "credit" | "cancelled" | "historique" | "a_verifier" {
  const blob = foldInvoiceText(`${row.clientName} ${row.designation}`);
  if (row.amountTtc < 0 || row.amountHt < 0) {
    row.paymentKind = "credit";
    row.invoiceStatus = "paid";
    row.askPaula = false;
    row.askPaulaReason = null;
    return "credit";
  }
  if (row.amountTtc === 0 || blob.includes("erreur")) {
    row.paymentKind = "cancelled";
    row.invoiceStatus = "cancelled";
    row.askPaula = false;
    row.askPaulaReason = null;
    return "cancelled";
  }
  if (row.invoiceDate < EMPTY_PAYMENT_CUTOFF) {
    row.paymentKind = "historique";
    row.paymentMethod = "historique";
    row.invoiceStatus = "paid";
    row.paymentDate = row.paymentDate || row.invoiceDate;
    row.askPaula = false;
    row.askPaulaReason = null;
    return "historique";
  }
  row.paymentKind = "a_verifier";
  row.invoiceStatus = "a_verifier";
  row.askPaula = true;
  row.askPaulaReason = "Moyen vide, date ≥ 01/07/2025 : à vérifier";
  return "a_verifier";
}

function emptyYear(year: string): FiscalYearTotal {
  return { year, n: 0, ht: 0, tva: 0, ttc: 0 };
}

export function parseFliInvoicesCsv(text: string): FliInvoicesPreview {
  const parsed = parseCsvText(text, ";");
  const rows: FliInvoiceParsedRow[] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();
  const ambiguousTypes: FliInvoicesPreview["ambiguousTypes"] = [];
  const emptyPaymentMethods: FliInvoicesPreview["emptyPaymentMethods"] = [];
  const toVerify: FliInvoicesPreview["toVerify"] = [];
  const credits: FliInvoicesPreview["credits"] = [];
  const cancelled: FliInvoicesPreview["cancelled"] = [];
  const esfBilled: FliInvoicesPreview["esfBilled"] = [];
  const otherPaymentLabels: FliInvoicesPreview["otherPaymentLabels"] = [];
  const byType: Record<InvoiceType, number> = {
    formation: 0,
    test: 0,
    soustraitance: 0,
  };
  const byPaymentKind: Record<PaymentKind, number> = {
    cheque: 0,
    virement: 0,
    cb: 0,
    especes: 0,
    stripe: 0,
    organisme: 0,
    unpaid: 0,
    credit: 0,
    cancelled: 0,
    empty: 0,
    esf: 0,
    other: 0,
    historique: 0,
    a_verifier: 0,
  };

  parsed.rows.forEach((raw, index) => {
    const lineNumber = index + 2;
    const invoiceNumber = cell(raw, "Fact FLI");
    if (!invoiceNumber) {
      throw new Error(`Ligne ${lineNumber} : Fact FLI manquant`);
    }
    if (seen.has(invoiceNumber)) duplicates.push(invoiceNumber);
    seen.add(invoiceNumber);

    const sequenceRaw = cell(raw, "n° seq", "n°");
    const sequence = Number.parseInt(sequenceRaw, 10);
    if (!Number.isFinite(sequence)) {
      throw new Error(`Ligne ${lineNumber} : n° seq invalide (${sequenceRaw})`);
    }

    const invoiceDate = isoDate(cell(raw, "Date Fact"));
    if (!invoiceDate) {
      throw new Error(`Ligne ${lineNumber} : Date Fact manquante ou invalide`);
    }

    const amountHt = numberOrZero(cell(raw, "Total HT"));
    const tvaAmount = numberOrZero(cell(raw, "TVA"));
    const amountTtc = numberOrZero(cell(raw, "Total TTC"));
    const designation = cell(raw, "Désignation");
    const deduced = deduceInvoiceType(designation, tvaAmount);
    const payment = classifyPayment(cell(raw, "Moyen de paiement"));
    const depositMethod = mapPaymentMethod(cell(raw, "Moyen de paiement - Acompt"));

    const row: FliInvoiceParsedRow = {
      lineNumber,
      sequence,
      fiscalYear: cell(raw, "Année compt"),
      invoiceNumber,
      invoiceDate,
      designation,
      amountHt,
      tvaAmount,
      amountTtc,
      tvaRate: deduced.type === "formation" ? 0 : 20,
      invoiceType: deduced.type,
      typeAmbiguous: deduced.ambiguous,
      typeNote: deduced.note,
      language: cell(raw, "Langue") || null,
      startDate: isoDate(cell(raw, "Date de début")),
      endDate: isoDate(cell(raw, "Date de fin")),
      location: cell(raw, "Lieu du stage") || null,
      clientName: cell(raw, "Nom et Prénom"),
      email: cell(raw, "Email") || null,
      skiSchool: cell(raw, "école de ski") || null,
      paymentKind: payment.kind,
      paymentMethod: payment.method,
      paymentDate: isoDate(cell(raw, "Date émiss chèque / virement")),
      chequeNumber: cell(raw, "N° Chèque") || null,
      chequeBank: cell(raw, "Banque") || null,
      invoiceStatus: payment.status,
      askPaula: payment.askPaula,
      askPaulaReason: payment.askPaulaReason,
      clientType: applyDsfFormationClientType(
        payment.clientType,
        cell(raw, "Nom et Prénom"),
        [designation, cell(raw, "Commentaire Formateur")]
          .filter(Boolean)
          .join(" — ") || null
      ),
      relatedInvoiceRef: parseRelatedInvoiceRef(designation),
      depositAmount: optionalNumber(cell(raw, "Montant de l'acompte")),
      depositDate: isoDate(cell(raw, "Date de l'acompte")),
      depositMethod,
      notes: [designation, cell(raw, "Commentaire Formateur")]
        .filter(Boolean)
        .join(" — ") || null,
      raw,
    };

    if (row.fiscalYear && !invoiceNumber.startsWith(`${row.fiscalYear}.`)) {
      throw new Error(
        `Ligne ${lineNumber} : Fact FLI ${invoiceNumber} ne commence pas par l'exercice ${row.fiscalYear}`
      );
    }

    rows.push(row);
    if (row.paymentKind === "empty") {
      const resolution = applyEmptyPaymentRules(row);
      emptyPaymentMethods.push({
        invoiceNumber,
        clientName: row.clientName,
        invoiceDate: row.invoiceDate,
        year: row.fiscalYear,
        amountHt,
        amountTtc: row.amountTtc,
        resolution,
      });
      if (resolution === "a_verifier") {
        toVerify.push({
          invoiceNumber,
          clientName: row.clientName,
          invoiceDate: row.invoiceDate,
          amountTtc: row.amountTtc,
        });
      }
    }
    byType[row.invoiceType] += 1;
    byPaymentKind[row.paymentKind] += 1;
    if (row.typeAmbiguous || row.typeNote) {
      if (row.typeAmbiguous) {
        ambiguousTypes.push({
          invoiceNumber,
          designation,
          tvaAmount,
          note: row.typeNote ?? "",
        });
      }
    }
    if (row.paymentKind === "credit") {
      credits.push({
        invoiceNumber,
        amountHt,
        relatedInvoiceRef: row.relatedInvoiceRef,
      });
    }
    if (row.paymentKind === "cancelled") {
      cancelled.push({ invoiceNumber, amountHt });
    }
    if (row.paymentKind === "esf") {
      esfBilled.push({
        invoiceNumber,
        clientName: row.clientName,
        location: row.location,
        skiSchool: row.skiSchool,
      });
    }
    if (row.paymentKind === "other") {
      otherPaymentLabels.push({
        invoiceNumber,
        label: cell(raw, "Moyen de paiement"),
      });
    }
  });

  const sequences = rows.map((r) => r.sequence).sort((a, b) => a - b);
  const min = sequences[0] ?? 0;
  const max = sequences[sequences.length - 1] ?? 0;
  const present = new Set(sequences);
  const missing: number[] = [];
  for (let n = min; n <= max; n++) {
    if (!present.has(n)) missing.push(n);
  }

  const totalsMap = new Map<string, FiscalYearTotal>();
  for (const row of rows) {
    const current = totalsMap.get(row.fiscalYear) ?? emptyYear(row.fiscalYear);
    totalsMap.set(row.fiscalYear, addTotal(current, row));
  }
  const totalsByYear = [...totalsMap.values()]
    .sort((a, b) => a.year.localeCompare(b.year))
    .map((y) => ({
      ...y,
      ht: round2(y.ht),
      tva: round2(y.tva),
      ttc: round2(y.ttc),
    }));
  const grandTotal = totalsByYear.reduce(
    (acc, y) => ({
      year: "total",
      n: acc.n + y.n,
      ht: round2(acc.ht + y.ht),
      tva: round2(acc.tva + y.tva),
      ttc: round2(acc.ttc + y.ttc),
    }),
    emptyYear("total")
  );

  const caMap = new Map<string, FiscalYearTotal>();
  for (const row of rows) {
    if (row.invoiceStatus === "cancelled") continue;
    const current = caMap.get(row.fiscalYear) ?? emptyYear(row.fiscalYear);
    caMap.set(row.fiscalYear, addTotal(current, row));
  }
  const caByYear = [...caMap.values()]
    .sort((a, b) => a.year.localeCompare(b.year))
    .map((y) => ({
      ...y,
      ht: round2(y.ht),
      tva: round2(y.tva),
      ttc: round2(y.ttc),
    }));
  const caGrandTotal = caByYear.reduce(
    (acc, y) => ({
      year: "ca",
      n: acc.n + y.n,
      ht: round2(acc.ht + y.ht),
      tva: round2(acc.tva + y.tva),
      ttc: round2(acc.ttc + y.ttc),
    }),
    emptyYear("ca")
  );

  return {
    totalRows: rows.length,
    encodingNotes: parsed.encodingNotes,
    sequence: {
      min,
      max,
      missing,
      knownGapPreserved: missing.includes(HISTORICAL_SEQUENCE_GAP),
      duplicates,
    },
    totalsByYear,
    grandTotal,
    caByYear,
    caGrandTotal,
    byType,
    byPaymentKind,
    ambiguousTypes,
    emptyPaymentMethods,
    toVerify,
    credits,
    cancelled,
    esfBilled,
    otherPaymentLabels,
    rows,
  };
}

function namesMatch(invoiceName: string, first: string | null, last: string | null): boolean {
  const a = nameTokens(invoiceName);
  const b = nameTokens(`${first ?? ""} ${last ?? ""}`);
  if (a.size === 0 || b.size === 0) return false;
  if (a.size === b.size && [...a].every((t) => b.has(t))) return true;
  if (a.size >= 2 && b.size >= 2 && ([...a].every((t) => b.has(t)) || [...b].every((t) => a.has(t)))) {
    return true;
  }
  return false;
}

export function matchFliInvoicesToInscriptions(
  rows: FliInvoiceParsedRow[],
  inscriptions: InscriptionMatchInput[]
): FliInvoicesMatchReport {
  const index = new Map<string, InscriptionMatchInput[]>();
  for (const inscription of inscriptions) {
    if (!inscription.start_date) continue;
    const key = `${inscription.start_date}|${languageKey(inscription.language)}`;
    const list = index.get(key) ?? [];
    list.push(inscription);
    index.set(key, list);
  }

  const matched: InvoiceMatch[] = [];
  const unmatched: FliInvoicesMatchReport["unmatched"] = [];
  const ambiguous: FliInvoicesMatchReport["ambiguous"] = [];
  const byYear: FliInvoicesMatchReport["byYear"] = {};

  const bump = (year: string, field: "matched" | "unmatched" | "ambiguous") => {
    const current = byYear[year] ?? { matched: 0, unmatched: 0, ambiguous: 0 };
    current[field] += 1;
    byYear[year] = current;
  };

  for (const row of rows) {
    const year = row.fiscalYear || "?";
    if (!row.startDate || !row.language || !row.clientName) {
      unmatched.push({
        invoiceNumber: row.invoiceNumber,
        clientName: row.clientName,
        startDate: row.startDate,
        language: row.language,
        year,
        reason: "nom, date de début ou langue manquant",
      });
      bump(year, "unmatched");
      continue;
    }

    const candidates = (index.get(`${row.startDate}|${languageKey(row.language)}`) ?? []).filter(
      (inscription) => namesMatch(row.clientName, inscription.first_name, inscription.last_name)
    );
    const unique = new Map(candidates.map((c) => [c.id, c]));
    if (unique.size === 1) {
      const inscription = [...unique.values()][0];
      matched.push({
        invoiceNumber: row.invoiceNumber,
        inscriptionId: inscription.id,
        inscriptionCode: inscription.code,
        studentName: `${inscription.first_name ?? ""} ${inscription.last_name ?? ""}`.trim(),
      });
      bump(year, "matched");
    } else if (unique.size > 1) {
      ambiguous.push({
        invoiceNumber: row.invoiceNumber,
        clientName: row.clientName,
        invoiceDate: row.invoiceDate,
        startDate: row.startDate,
        language: row.language,
        candidates: [...unique.values()].map((c) => ({
          id: c.id,
          code: c.code ? restoreMacRoman(c.code) : null,
          name: restoreMacRoman(`${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()),
        })),
      });
      bump(year, "ambiguous");
    } else {
      unmatched.push({
        invoiceNumber: row.invoiceNumber,
        clientName: row.clientName,
        startDate: row.startDate,
        language: row.language,
        year,
        reason: "aucune inscription nom + date + langue",
      });
      bump(year, "unmatched");
    }
  }

  return { matched, unmatched, ambiguous, esfPartners: [], byYear };
}

const STATION_STOP = new Set(["esf", "la", "le", "les", "de", "du", "des", "d", "l"]);

/** Clé de station : articles et préfixe ESF ignorés, tokens triés. */
export function stationTokenKey(raw: string | null | undefined): string {
  return foldInvoiceText(raw)
    .split(/\s+/)
    .filter((t) => t && !STATION_STOP.has(t))
    .sort()
    .join(" ");
}

/**
 * Rattache un partenaire ESF unique à partir du lieu de stage / école de ski.
 * Plusieurs ESF sur la même station (ex. Courchevel) → aucun rattachement auto.
 */
export function resolveEsfPartner(
  location: string | null,
  skiSchool: string | null,
  partners: EsfPartnerInput[]
): EsfPartnerInput | null {
  const esf = partners.filter((p) => p.type === "esf");
  const keys = [...new Set([skiSchool, location].map(stationTokenKey).filter(Boolean))];
  if (keys.length === 0 || esf.length === 0) return null;

  const hits = new Map<string, EsfPartnerInput>();
  for (const key of keys) {
    const exact = esf.filter(
      (p) => stationTokenKey(p.station) === key || stationTokenKey(p.name) === key
    );
    if (exact.length !== 1) continue;
    hits.set(exact[0].id, exact[0]);
  }
  if (hits.size === 1) return [...hits.values()][0];
  return null;
}

export function linkEsfPartners(
  rows: FliInvoiceParsedRow[],
  match: Pick<FliInvoicesMatchReport, "matched">,
  partners: EsfPartnerInput[]
): EsfPartnerLink[] {
  const inscriptionByInvoice = new Map(
    match.matched.map((m) => [m.invoiceNumber, m.inscriptionId])
  );
  return rows
    .filter((row) => row.paymentKind === "esf")
    .map((row) => {
      const partner = resolveEsfPartner(row.location, row.skiSchool, partners);
      return {
        invoiceNumber: row.invoiceNumber,
        clientName: row.clientName,
        location: row.location,
        partnerId: partner?.id ?? null,
        partnerName: partner?.name ?? null,
        partnerCode: partner?.esf_code ?? null,
        inscriptionId: inscriptionByInvoice.get(row.invoiceNumber) ?? null,
      };
    });
}

export function toInvoiceInsert(
  row: FliInvoiceParsedRow,
  inscriptionId: string | null,
  esfPartner?: EsfPartnerInput | null
): Record<string, unknown> {
  const partnerNote =
    row.paymentKind === "esf"
      ? esfPartner
        ? `Payeur école : ${esfPartner.name}${esfPartner.esf_code ? ` (${esfPartner.esf_code})` : ""}`
        : "Payeur école : ESF (partenaire non rattaché — lieu ambigu ou absent)"
      : null;
  const notes =
    [row.clientName, row.notes, partnerNote].filter(Boolean).join(" — ") || null;
  const paidDate =
    row.invoiceStatus === "paid" ? row.paymentDate || row.invoiceDate : null;
  return {
    invoice_number: row.invoiceNumber,
    fiscal_year: row.fiscalYear,
    sequence_number: row.sequence,
    invoice_date: row.invoiceDate,
    invoice_type: row.invoiceType,
    client_type: row.clientType,
    amount_ht: row.amountHt,
    tva_rate: row.tvaRate,
    status: row.invoiceStatus,
    payment_date: paidDate,
    payment_method: row.paymentMethod,
    payment_type: "integral",
    notes,
    inscription_id: inscriptionId,
    origin: "import_historique",
  };
}

export interface FliPaymentInsert {
  invoice_number: string;
  inscription_id: string | null;
  amount: number;
  payment_type: "acompte" | "total";
  payment_method: DbPaymentMethod;
  payment_date: string;
  currency: "EUR";
  payer_type: string;
  payer_name: string;
  cheque_number: string | null;
  cheque_bank: string | null;
  cheque_date: string | null;
  cheque_status: "recu" | "remis" | "encaisse" | "rejete" | null;
  status: "recu";
}

/** Paiements liés à une ligne CSV : acompte éventuel + encaissement si facture réglée. */
export function toPaymentInserts(
  row: FliInvoiceParsedRow,
  inscriptionId: string | null,
  esfPartner?: EsfPartnerInput | null
): FliPaymentInsert[] {
  const payerType =
    row.clientType === "ecole_ski"
      ? "ecole"
      : row.clientType === "dsf"
        ? "dsf"
        : "stagiaire";
  const payerName = esfPartner?.name ?? row.clientName;
  const out: FliPaymentInsert[] = [];
  if (row.depositAmount && row.depositAmount > 0 && row.depositMethod && row.depositDate) {
    out.push({
      invoice_number: row.invoiceNumber,
      inscription_id: inscriptionId,
      amount: row.depositAmount,
      payment_type: "acompte",
      payment_method: row.depositMethod,
      payment_date: row.depositDate,
      currency: "EUR",
      payer_type: payerType,
      payer_name: payerName,
      cheque_number: null,
      cheque_bank: null,
      cheque_date: null,
      cheque_status: row.depositMethod === "cheque" ? "encaisse" : null,
      status: "recu",
    });
  }
  const paymentDate =
    row.paymentDate || (row.invoiceStatus === "paid" && row.paymentMethod ? row.invoiceDate : null);
  if (row.paymentMethod && row.invoiceStatus === "paid" && paymentDate) {
    out.push({
      invoice_number: row.invoiceNumber,
      inscription_id: inscriptionId,
      amount: Math.abs(row.amountTtc),
      payment_type: "total",
      payment_method: row.paymentMethod,
      payment_date: paymentDate,
      currency: "EUR",
      payer_type: payerType,
      payer_name: payerName,
      cheque_number: row.chequeNumber,
      cheque_bank: row.chequeBank,
      cheque_date: row.paymentMethod === "cheque" ? paymentDate : null,
      cheque_status: row.paymentMethod === "cheque" ? "encaisse" : null,
      status: "recu",
    });
  }
  return out;
}
