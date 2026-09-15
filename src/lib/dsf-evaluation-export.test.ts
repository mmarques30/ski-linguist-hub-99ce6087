import { describe, expect, it } from "vitest";
import {
  DSF_XLSX_COLUMNS,
  buildDsfXlsxBuffer,
  dsfExportFilename,
  dsfRowsForExport,
  isDsfBooking,
  matchesEvaluationFilters,
  toDsfExportRow,
  uniqueSorted,
  type EvaluationListRow,
} from "./dsf-evaluation-export";

const dsf: EvaluationListRow = {
  id: "b1",
  datetime: "2026-02-10T09:00:00.000Z",
  candidate_name: "ZZTEST C6 A",
  company_name: "Domaines Skiables de France",
  station: "Val d'Isère",
  language: "anglais",
  instructor_name: "ZZTEST Formateur",
  evaluation_status: "valide",
  sponsor_type: "dsf",
  score_comprehension: 3,
  score_expression: 3,
  score_structure: 3,
  score_technique: 2.5,
  score_conversation: 3,
  score_general: 3,
  cecrl_label: "B2",
  pdf_url: "evaluations/e1.pdf",
};

const esf: EvaluationListRow = {
  ...dsf,
  id: "b2",
  sponsor_type: "esf",
  company_name: "ESF Test",
  station: "Courchevel",
};

describe("C.6 export DSF", () => {
  it("ne retient que sponsor_type = dsf", () => {
    expect(isDsfBooking(dsf)).toBe(true);
    expect(isDsfBooking(esf)).toBe(false);
    expect(dsfRowsForExport([dsf, esf], {})).toHaveLength(1);
  });

  it("filtre période, entreprise, station, langue, évaluateur, statut", () => {
    expect(
      matchesEvaluationFilters(dsf, { dateFrom: "2026-02-01", dateTo: "2026-02-28" })
    ).toBe(true);
    expect(matchesEvaluationFilters(dsf, { dateFrom: "2026-03-01" })).toBe(false);
    expect(matchesEvaluationFilters(dsf, { company: "Domaines Skiables de France" })).toBe(
      true
    );
    expect(matchesEvaluationFilters(dsf, { company: "Autre" })).toBe(false);
    expect(matchesEvaluationFilters(dsf, { station: "Val d'Isère" })).toBe(true);
    expect(matchesEvaluationFilters(dsf, { language: "anglais" })).toBe(true);
    expect(matchesEvaluationFilters(dsf, { language: "allemand" })).toBe(false);
    expect(matchesEvaluationFilters(dsf, { evaluator: "ZZTEST Formateur" })).toBe(true);
    expect(matchesEvaluationFilters(dsf, { status: "valide" })).toBe(true);
    expect(matchesEvaluationFilters(dsf, { status: "brouillon" })).toBe(false);
  });

  it("formate les cinq notes avec CECRL et l'appréciation générale", () => {
    const row = toDsfExportRow(dsf, "https://example.invalid/pdf");
    expect(row.comprehension).toBe("3 - B2");
    expect(row.technique).toBe("2,5 - B1+");
    expect(row.appreciationGenerale).toBe("3 - B2");
    expect(row.langue).toBe("Anglais");
    expect(row.lienPdf).toBe("https://example.invalid/pdf");
    expect(DSF_XLSX_COLUMNS).toHaveLength(13);
  });

  it("écrit un xlsx avec les 13 colonnes demandées", async () => {
    const rows = dsfRowsForExport([dsf], {}, { b1: "https://example.invalid/e1.pdf" });
    const buf = await buildDsfXlsxBuffer(rows);
    expect(buf.byteLength).toBeGreaterThan(1000);
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const sheet = wb.getWorksheet("DSF");
    expect(sheet).toBeTruthy();
    const headers = (sheet!.getRow(1).values as string[]).filter(Boolean);
    expect(headers).toEqual([...DSF_XLSX_COLUMNS]);
    expect(sheet!.getRow(2).getCell(3).value).toBe("Domaines Skiables de France");
    expect(sheet!.getRow(2).getCell(11).value).toBe("3 - B2");
    expect(sheet!.getRow(2).getCell(13).value).toBe("https://example.invalid/e1.pdf");
    expect(dsfExportFilename(new Date("2026-09-14T12:00:00Z"))).toBe(
      "DSF-evaluations-2026-09-14.xlsx"
    );
  });

  it("déduplique les options de filtre", () => {
    expect(uniqueSorted([" Val ", "Val", "", null, "Alpe"])).toEqual(["Alpe", "Val"]);
  });
});
