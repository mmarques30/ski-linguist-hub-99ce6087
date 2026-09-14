/** C.6 — export xlsx DSF et filtres de la liste évaluations. */

import { format } from "date-fns";
import { formatScoreCecrl } from "@/lib/evaluation-pdf";
import { LANGUAGE_LABELS } from "@/lib/evaluation-utils";

export const DSF_XLSX_COLUMNS = [
  "Date",
  "Candidat",
  "Entreprise",
  "Station",
  "Langue",
  "Compréhension",
  "Expression",
  "Structures de la langue",
  "Expression technique et spécifique",
  "Conversation générale",
  "Appréciation générale",
  "Évaluateur·rice",
  "Lien PDF",
] as const;

export const EVAL_STATUS_LABEL: Record<string, string> = {
  brouillon: "Brouillon",
  a_verifier: "À vérifier",
  valide: "Validée",
  envoye: "Envoyée",
};

export type EvaluationListRow = {
  id?: string | null;
  datetime?: string | null;
  candidate_name?: string | null;
  company_name?: string | null;
  partner_name?: string | null;
  ski_school_name?: string | null;
  station?: string | null;
  language?: string | null;
  instructor_name?: string | null;
  instructor_id?: string | null;
  evaluation_status?: string | null;
  sponsor_type?: string | null;
  score_comprehension?: number | null;
  score_expression?: number | null;
  score_structure?: number | null;
  score_technique?: number | null;
  score_conversation?: number | null;
  score_general?: number | null;
  cecrl_label?: string | null;
  pdf_url?: string | null;
  evaluation_id?: string | null;
};

export type EvaluationListFilters = {
  dateFrom?: string;
  dateTo?: string;
  company?: string;
  station?: string;
  language?: string;
  evaluator?: string;
  status?: string;
};

export type DsfExportRow = {
  date: string;
  candidat: string;
  entreprise: string;
  station: string;
  langue: string;
  comprehension: string;
  expression: string;
  structure: string;
  technique: string;
  conversation: string;
  appreciationGenerale: string;
  evaluateur: string;
  lienPdf: string;
};

const ALL = "all";

export function isDsfBooking(row: EvaluationListRow): boolean {
  return row.sponsor_type === "dsf";
}

export function evaluationCompanyName(row: EvaluationListRow): string {
  if (row.sponsor_type === "dsf") {
    return (row.company_name || row.partner_name || row.ski_school_name || "").trim();
  }
  return (row.company_name || row.ski_school_name || "").trim();
}

export function uniqueSorted(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const value of values) {
    const trimmed = (value ?? "").trim();
    if (trimmed) set.add(trimmed);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "fr"));
}

function dateKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return format(d, "yyyy-MM-dd");
}

export function matchesEvaluationFilters(
  row: EvaluationListRow,
  filters: EvaluationListFilters
): boolean {
  const day = dateKey(row.datetime);
  if (filters.dateFrom && (!day || day < filters.dateFrom)) return false;
  if (filters.dateTo && (!day || day > filters.dateTo)) return false;

  const company = evaluationCompanyName(row);
  if (filters.company && filters.company !== ALL && company !== filters.company) {
    return false;
  }

  const station = (row.station ?? "").trim();
  if (filters.station && filters.station !== ALL && station !== filters.station) {
    return false;
  }

  if (
    filters.language &&
    filters.language !== ALL &&
    (row.language || "") !== filters.language
  ) {
    return false;
  }

  const evaluator = (row.instructor_name ?? "").trim();
  if (filters.evaluator && filters.evaluator !== ALL && evaluator !== filters.evaluator) {
    return false;
  }

  if (
    filters.status &&
    filters.status !== ALL &&
    (row.evaluation_status || "") !== filters.status
  ) {
    return false;
  }

  return true;
}

function scoreCell(score: number | null | undefined, cecrl?: string | null): string {
  if (score == null || Number.isNaN(Number(score))) return "";
  return formatScoreCecrl(Number(score), cecrl);
}

export function toDsfExportRow(
  row: EvaluationListRow,
  pdfLink = ""
): DsfExportRow {
  const dt = row.datetime ? new Date(row.datetime) : null;
  return {
    date:
      dt && !Number.isNaN(dt.getTime())
        ? format(dt, "dd/MM/yyyy")
        : "",
    candidat: (row.candidate_name ?? "").trim(),
    entreprise: evaluationCompanyName(row),
    station: (row.station ?? "").trim(),
    langue: LANGUAGE_LABELS[row.language || ""] || row.language || "",
    comprehension: scoreCell(row.score_comprehension),
    expression: scoreCell(row.score_expression),
    structure: scoreCell(row.score_structure),
    technique: scoreCell(row.score_technique),
    conversation: scoreCell(row.score_conversation),
    appreciationGenerale: scoreCell(row.score_general, row.cecrl_label),
    evaluateur: (row.instructor_name ?? "").trim(),
    lienPdf: pdfLink,
  };
}

export function dsfRowsForExport(
  rows: EvaluationListRow[],
  filters: EvaluationListFilters,
  pdfLinks: Record<string, string> = {}
): DsfExportRow[] {
  return rows
    .filter(isDsfBooking)
    .filter((row) => matchesEvaluationFilters(row, filters))
    .map((row) => toDsfExportRow(row, (row.id && pdfLinks[row.id]) || ""));
}

export function dsfExportFilename(now = new Date()): string {
  return `DSF-evaluations-${format(now, "yyyy-MM-dd")}.xlsx`;
}

export async function buildDsfXlsxBuffer(rows: DsfExportRow[]): Promise<ArrayBuffer> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "FLI Formation";
  const sheet = wb.addWorksheet("DSF", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.addRow([...DSF_XLSX_COLUMNS]);
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    sheet.addRow([
      row.date,
      row.candidat,
      row.entreprise,
      row.station,
      row.langue,
      row.comprehension,
      row.expression,
      row.structure,
      row.technique,
      row.conversation,
      row.appreciationGenerale,
      row.evaluateur,
      row.lienPdf,
    ]);
  }
  sheet.columns.forEach((col) => {
    col.width = 28;
  });
  const buf = await wb.xlsx.writeBuffer();
  return buf as ArrayBuffer;
}
