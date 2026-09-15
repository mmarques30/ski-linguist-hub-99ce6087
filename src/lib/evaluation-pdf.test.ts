import { readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  DEFAULT_FLI_IDENTITY,
  SKILL_ORDER,
  buildEvaluationPdfModel,
  evaluationTitle,
  formatCandidateDisplayName,
  formatScoreCecrl,
  parseEvaluationPriceTtc,
  principalLabel,
  skiSeasonYears,
  type CecrlScaleRow,
  type EvaluationPdfInput,
} from "./evaluation-pdf";
import { EVALUATION_PDF_ASSET_FILES, type EvaluationPdfAssets } from "./evaluation-pdf-assets";
import { renderEvaluationPdf, wrapText } from "./evaluation-pdf-render";

// Les trois PDF de preuve du point C.5 sont écrits à côté des tests. Le chemin
// était figé sur /opt/cursor/artifacts, qui n'existe que dans le bac à sable de
// l'agent : ailleurs, mkdir échoue en EACCES et npm test part en rouge.
const PROOF_DIR = process.env.FLI_PDF_PREUVES_DIR ?? join(tmpdir(), "fli-pdf-preuves");

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

const SCALE: CecrlScaleRow[] = [
  { score: 0, cecrl_label: "A1", niveau: 0, description: "Faux débutant / Quelques notions / Éveil" },
  { score: 0.5, cecrl_label: "A1+", niveau: 0, description: "Faux débutant / Quelques notions / Éveil" },
  { score: 1, cecrl_label: "A2", niveau: 1, description: "Élémentaire / Pré-intermédiaire / Survie" },
  { score: 1.5, cecrl_label: "A2+", niveau: 1, description: "Élémentaire / Pré-intermédiaire / Survie" },
  { score: 2, cecrl_label: "B1", niveau: 2, description: "Intermédiaire / Autonomie" },
  { score: 2.5, cecrl_label: "B1+", niveau: 2, description: "Intermédiaire / Autonomie" },
  { score: 3, cecrl_label: "B2", niveau: 3, description: "Post intermédiaire / Opérationnel" },
  { score: 3.5, cecrl_label: "B2+", niveau: 3, description: "Post intermédiaire / Opérationnel" },
  { score: 4, cecrl_label: "C1", niveau: 4, description: "Perfectionnement / Fluidité / Aisance" },
  { score: 4.5, cecrl_label: "C1+", niveau: 4, description: "Perfectionnement / Fluidité / Aisance" },
  { score: 5, cecrl_label: "C2", niveau: 5, description: "Maîtrise" },
];

/** Moyenne 3,1 → 3, écart nul : pas de note méthodologique. */
const sample = (sponsorType: string): EvaluationPdfInput => ({
  sponsorType,
  evaluatedAt: new Date("2026-01-15T10:00:00.000Z"),
  candidateName: "ZZTEST CandidatC5",
  candidateProfession: "moniteur",
  skiDiscipline: "alpin",
  trainingCycle: "ZZTEST Cycle 2",
  language: "anglais",
  previousTest: false,
  skiSchoolName: "ZZTEST École C5",
  companyName: "Domaines Skiables de France",
  instructorName: "ZZTEST Formateur",
  scores: {
    comprehension: 3,
    expression: 3,
    structure: 3,
    technique: 3,
    conversation: 3.5,
    general: 3,
  },
  cecrlGeneral: "B2",
  blocs: {
    introduction: "Vous vous présentez clairement et vous situez votre activité.",
    comprehension: "Vous comprenez les consignes de sécurité.",
    technique: "Votre vocabulaire technique est adapté aux situations de piste.",
    conclusion: "Vous pouvez conclure un échange professionnel de façon courtoise.",
  },
  noteMethodologique: "Cette phrase ne doit pas apparaître sans écart.",
  priceTtc: 45,
  identity,
  cecrlScale: SCALE,
  verifiedAt: new Date("2026-09-10T12:00:00.000Z"),
});

async function loadAssets(): Promise<EvaluationPdfAssets> {
  const dir = join(process.cwd(), "public/evaluation-pdf");
  const read = (name: string) => readFile(join(dir, name));
  return {
    esfLogo: await read(EVALUATION_PDF_ASSET_FILES.esfLogo),
    fliHeader: await read(EVALUATION_PDF_ASSET_FILES.fliHeader),
    fliCachet: await read(EVALUATION_PDF_ASSET_FILES.fliCachet),
    fliCompact: await read(EVALUATION_PDF_ASSET_FILES.fliCompact),
    dsfLetterhead: await read(EVALUATION_PDF_ASSET_FILES.dsfLetterhead),
    partnerLogos: await Promise.all(
      EVALUATION_PDF_ASSET_FILES.partners.map((name) => read(name))
    ),
  };
}

describe("titre et saison PDF", () => {
  it("calcule la saison ski juillet–juin", () => {
    expect(skiSeasonYears(new Date("2025-12-01"))).toEqual({ start: 2025, end: 2026 });
    expect(skiSeasonYears(new Date("2026-01-15"))).toEqual({ start: 2025, end: 2026 });
    expect(skiSeasonYears(new Date("2026-07-01"))).toEqual({ start: 2026, end: 2027 });
  });

  it("compose le titre à partir de la saison, jamais d'une année de modèle", () => {
    expect(evaluationTitle(new Date("2026-01-15"))).toBe(
      "Évaluation en langue vivante saison 2025 / 2026"
    );
    expect(evaluationTitle(new Date("2026-07-02"))).toBe(
      "Évaluation en langue vivante saison 2026 / 2027"
    );
  });
});

describe("nom affiché et sous-titre", () => {
  it("passe le nom de famille en majuscules", () => {
    expect(formatCandidateDisplayName("ZZTEST CandidatC5")).toBe("ZZTEST CANDIDATC5");
  });

  it("calcule le sous-titre label principal → objectif C1", () => {
    expect(principalLabel("Post intermédiaire / Opérationnel")).toBe(
      "Post intermédiaire"
    );
    const model = buildEvaluationPdfModel(sample("esf"));
    expect(model.subtitle).toContain("ZZTEST CANDIDATC5");
    expect(model.subtitle).toContain("3 / B2 - Niveau 3 - Post intermédiaire");
    expect(model.subtitle).not.toContain("Opérationnel");
    expect(model.subtitle).toContain("→ objectif C1");
    expect(model.subtitle).toContain("Anglais");
    expect(model.subtitle).toContain("évaluateur");
    expect(model.subtitle).toContain("ZZTEST Formateur");
    expect(model.skiDisciplineLabel).toBe("Alpin");
    expect(model.trainingCycle).toBe("ZZTEST Cycle 2");
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
    expect(ecole.title).toBe("Évaluation en langue vivante saison 2025 / 2026");
    expect(dsf.showPrice).toBe(false);
    expect(dsf.priceLabel).toBeNull();
    expect(dsf.showCompanyField).toBe(true);
    expect(dsf.showDsfLetterhead).toBe(true);
    expect(dsf.companyName).toBe("Domaines Skiables de France");
  });

  it("refuse un prix manquant hors DSF", () => {
    expect(() =>
      buildEvaluationPdfModel({ ...sample("esf"), priceTtc: null })
    ).toThrow(/evaluation_price_ttc/);
  });
});

describe("blocs C.2/C.3 et note méthodologique", () => {
  it("affiche Points forts / À consolider / Pour passer au CECRL suivant / Clôture", () => {
    const model = buildEvaluationPdfModel(sample("ecole_ski"));
    expect(model.blocs.map((b) => b.label)).toEqual([
      "Points forts",
      "À consolider",
      "Pour passer au C1 (Niveau 4 - Perfectionnement / Fluidité / Aisance)",
      "Clôture",
    ]);
    expect(model.noteMethodologique).toBeNull();
  });

  it("n'affiche la note méthodologique que pour un écart d'1 point", () => {
    const halfGap = buildEvaluationPdfModel({
      ...sample("esf"),
      scores: {
        comprehension: 3,
        expression: 3,
        structure: 3,
        technique: 3,
        conversation: 3.5,
        general: 3.5,
      },
      noteMethodologique: "Ne doit pas apparaître pour 0,5.",
    });
    expect(halfGap.noteMethodologique).toBeNull();
    const withGap = buildEvaluationPdfModel({
      ...sample("esf"),
      scores: {
        comprehension: 3,
        expression: 3,
        structure: 3,
        technique: 3,
        conversation: 3,
        general: 4,
      },
      noteMethodologique: "Écart expliqué pour la fluidité orale.",
    });
    expect(withGap.noteMethodologique).toBe("Écart expliqué pour la fluidité orale.");
  });

  it("aligne les six compétences sur les trois habillages", () => {
    const labels = SKILL_ORDER.map((s) => s.label);
    expect(labels).toEqual([
      "Compréhension",
      "Expression",
      "Structures de la langue",
      "Expression technique et spécifique",
      "Conversation générale",
      "Appréciation générale",
    ]);
    for (const sponsor of ["esf", "ecole_ski", "dsf"] as const) {
      expect(buildEvaluationPdfModel(sample(sponsor)).skillRows.map((r) => r.label)).toEqual(
        labels
      );
    }
  });
});

describe("grille N - CECRL", () => {
  it("formate la note et le libellé", () => {
    expect(formatScoreCecrl(4, "C1")).toBe("4 - C1");
    expect(formatScoreCecrl(3.5, "B2+")).toBe("3,5 - B2+");
  });
});

describe("retour à la ligne", () => {
  it("ne dépasse pas la largeur max, y compris les mots longs", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const max = 200;
    const lines = wrapText(
      font,
      "France Langues International — 25 avenue de la Gare — 73800 Montmélian — Tél. : 04 79 28 21 09 — info@fli.fr",
      7,
      max
    );
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(font.widthOfTextAtSize(line, 7)).toBeLessThanOrEqual(max + 0.05);
    }
  });
});

describe("octets PDF", () => {
  it("produit un PDF par habillage et écrit les trois preuves", async () => {
    await mkdir(PROOF_DIR, { recursive: true });
    const assets = await loadAssets();
    for (const sponsor of ["esf", "ecole_ski", "dsf"] as const) {
      const model = buildEvaluationPdfModel(sample(sponsor));
      const bytes = await renderEvaluationPdf(model, assets);
      expect(bytes.byteLength).toBeGreaterThan(5000);
      const doc = await PDFDocument.load(bytes);
      const ascii = pdfVisibleText(bytes);
      expect(Buffer.from(bytes).toString("latin1")).toContain("%PDF");
      expect(ascii).toContain("ZZTEST CANDIDATC5");
      expect(ascii).toContain("Points forts");
      expect(ascii).toContain("Clôture");
      expect(ascii).toContain("Pour passer au C1");
      expect(ascii).not.toContain("EVALUATION EN LANGUE VIVANTE");
      expect(ascii).not.toContain("Note m");
      expect(ascii).toContain("Structures de la langue");
      expect(ascii).toContain("Expression technique et sp");
      expect(ascii).toContain("Appr");
      expect(ascii).toContain("saison 2025 / 2026");
      await writeFile(join(PROOF_DIR, `c5-preuve-${sponsor}.pdf`), bytes);
      if (sponsor === "dsf") {
        expect(doc.getPageCount()).toBe(1);
        expect(ascii).toContain("Entreprise");
        expect(ascii).toContain("Bar");
        expect(ascii).not.toContain("TTC");
        expect(ascii).not.toContain("Tarif");
      } else {
        expect(ascii).toContain("TTC");
        expect(ascii).toContain("Tarif");
      }
      if (sponsor === "esf") {
        expect(doc.getPageCount()).toBe(2);
        expect(ascii).toContain("Cours collectifs enfants");
        expect(ascii).toContain("Organismes agr");
        expect(ascii).toContain("Sections r");
        expect(ascii).toContain("Alpin");
        expect(ascii).toContain("ZZTEST Cycle 2");
        expect(ascii).toContain("objectif C1");
      }
      if (sponsor === "ecole_ski") {
        expect(doc.getPageCount()).toBe(1);
        expect(ascii).toContain("04 79 28 21 09");
        expect(ascii).not.toContain("09 81 84 60 65");
        expect(ascii).toContain("Fait ");
        expect(ascii).toContain("10/09/2026");
        expect(ascii).not.toContain("le 15/01/2026");
      }
    }
  }, 20_000);
});
