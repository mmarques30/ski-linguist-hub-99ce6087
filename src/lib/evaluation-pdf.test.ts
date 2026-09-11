import { writeFile, mkdir } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  DEFAULT_FLI_IDENTITY,
  buildEvaluationPdfModel,
  evaluationTitle,
  formatScoreCecrl,
  parseEvaluationPriceTtc,
  skiSeasonYears,
  type EvaluationPdfInput,
} from "./evaluation-pdf";
import { renderEvaluationPdf } from "./evaluation-pdf-render";

function pdfVisibleText(bytes: Uint8Array): string {
  const latin = Buffer.from(bytes).toString("latin1");
  const chunks: string[] = [];
  const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(latin))) {
    const payload = Buffer.from(match[1], "latin1");
    try {
      chunks.push(inflateSync(payload).toString("latin1"));
    } catch {
      chunks.push(payload.toString("latin1"));
    }
  }
  return chunks
    .join("\n")
    .replace(/<([0-9A-Fa-f]+)>/g, (_, hex: string) =>
      Buffer.from(hex, "hex").toString("latin1")
    );
}

const identity = DEFAULT_FLI_IDENTITY;

const sample = (sponsorType: string): EvaluationPdfInput => ({
  sponsorType,
  evaluatedAt: new Date("2026-01-15T10:00:00.000Z"),
  candidateName: "ZZTEST CandidatC5",
  candidateProfession: "moniteur",
  language: "anglais",
  previousTest: false,
  skiSchoolName: "ZZTEST École C5",
  companyName: "Domaines Skiables de France",
  instructorName: "ZZTEST Formateur",
  scores: {
    comprehension: 3,
    expression: 3,
    structure: 3.5,
    technique: 3,
    conversation: 3,
    general: 3,
  },
  cecrlGeneral: "B2",
  blocs: {
    introduction: "Vous vous présentez clairement et vous situez votre activité.",
    comprehension: "Vous comprenez les consignes de sécurité.",
    technique: "Votre vocabulaire technique est adapté aux situations de piste.",
    conclusion: "Vous pouvez conclure un échange professionnel de façon courtoise.",
  },
  noteMethodologique: "Écart volontaire d'un demi-point pour la fluidité orale.",
  priceTtc: 45,
  identity,
});

describe("titre et saison PDF", () => {
  it("calcule la saison ski juillet–juin", () => {
    expect(skiSeasonYears(new Date("2025-12-01"))).toEqual({ start: 2025, end: 2026 });
    expect(skiSeasonYears(new Date("2026-01-15"))).toEqual({ start: 2025, end: 2026 });
    expect(skiSeasonYears(new Date("2026-07-01"))).toEqual({ start: 2026, end: 2027 });
  });

  it("compose le titre à partir de la saison", () => {
    expect(evaluationTitle(new Date("2026-01-15"))).toBe(
      "Évaluation en langue vivante saison 2025 / 2026"
    );
  });
});

describe("prix TTC selon habillage", () => {
  it("lit le montant depuis app_settings", () => {
    expect(parseEvaluationPriceTtc(45)).toBe(45);
    expect(parseEvaluationPriceTtc({ amount: 45, currency: "EUR" })).toBe(45);
  });

  it("affiche le tarif pour ESF et école de ski, jamais pour DSF", () => {
    const esf = buildEvaluationPdfModel(sample("esf"));
    const ecole = buildEvaluationPdfModel(sample("ecole_ski"));
    const dsf = buildEvaluationPdfModel(sample("dsf"));
    expect(esf.showPrice).toBe(true);
    expect(esf.priceLabel).toBe("45 € TTC");
    expect(esf.showCourseTable).toBe(true);
    expect(esf.showRegionalSections).toBe(true);
    expect(ecole.showPrice).toBe(true);
    expect(ecole.showFliHeaderFooter).toBe(true);
    expect(dsf.showPrice).toBe(false);
    expect(dsf.priceLabel).toBeNull();
    expect(dsf.showCompanyField).toBe(true);
    expect(dsf.companyName).toBe("Domaines Skiables de France");
  });

  it("refuse un prix manquant hors DSF", () => {
    expect(() =>
      buildEvaluationPdfModel({ ...sample("esf"), priceTtc: null })
    ).toThrow(/evaluation_price_ttc/);
  });
});

describe("grille N - CECRL", () => {
  it("formate la note et le libellé", () => {
    expect(formatScoreCecrl(4, "C1")).toBe("4 - C1");
    expect(formatScoreCecrl(3.5, "B2+")).toBe("3,5 - B2+");
  });
});

describe("octets PDF", () => {
  it("produit un PDF par habillage et écrit les trois preuves", async () => {
    await mkdir("/opt/cursor/artifacts", { recursive: true });
    for (const sponsor of ["esf", "ecole_ski", "dsf"] as const) {
      const model = buildEvaluationPdfModel(sample(sponsor));
      const bytes = await renderEvaluationPdf(model);
      expect(bytes.byteLength).toBeGreaterThan(1000);
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
      const ascii = pdfVisibleText(bytes);
      expect(Buffer.from(bytes).toString("latin1")).toContain("%PDF");
      expect(ascii).toContain("ZZTEST CandidatC5");
      if (sponsor === "dsf") {
        expect(ascii).toContain("Entreprise");
        expect(ascii).not.toContain("TTC");
        expect(ascii).not.toContain("Tarif");
      } else {
        expect(ascii).toContain("TTC");
        expect(ascii).toContain("Tarif");
      }
      if (sponsor === "esf") {
        expect(ascii).toContain("Cours collectifs enfants");
      }
      await writeFile(
        `/opt/cursor/artifacts/c5-evaluation-${sponsor}.pdf`,
        bytes
      );
    }
  });
});
