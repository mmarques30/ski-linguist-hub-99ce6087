import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EMPTY_FIFPL_QUESTIONNAIRE,
  estimateFifplRights,
  FIFPL_ACCEPTED_CFP_ATTESTATION_YEARS,
  FIFPL_ANNUAL_CEILING_EUR,
  FIFPL_CRITERIA_YEAR,
  FIFPL_MICRO_CFP_BRACKETS,
  FIFPL_REGISTER_COPY,
  formatAcceptedCfpAttestationYears,
  formatFifplQuestionnaireSummary,
  isAcceptedCfpAttestationYear,
  microPercentFromCfpContribution,
  parseCfpAttestationText,
  validateFifplQuestionnaire,
} from "./fifpl-funding";

describe("fifpl-funding — grille micro CFP 2026", () => {
  it("applique les plafonds 2026 proportionnels à la cotisation CFP", () => {
    expect(FIFPL_MICRO_CFP_BRACKETS.map((b) => [b.minEur, b.maxEur, b.percent])).toEqual([
      [1, 20, 20],
      [21, 40, 60],
      [41, 80, 80],
      [81, null, 100],
    ]);
    expect(microPercentFromCfpContribution(1)).toBe(20);
    expect(microPercentFromCfpContribution(10)).toBe(20);
    expect(microPercentFromCfpContribution(20)).toBe(20);
    expect(microPercentFromCfpContribution(20.5)).toBe(20);
    expect(microPercentFromCfpContribution(21)).toBe(60);
    expect(microPercentFromCfpContribution(40)).toBe(60);
    expect(microPercentFromCfpContribution(40.99)).toBe(60);
    expect(microPercentFromCfpContribution(41)).toBe(80);
    expect(microPercentFromCfpContribution(50)).toBe(80);
    expect(microPercentFromCfpContribution(80)).toBe(80);
    expect(microPercentFromCfpContribution(80.5)).toBe(80);
    expect(microPercentFromCfpContribution(81)).toBe(100);
    expect(microPercentFromCfpContribution(100)).toBe(100);
    expect(microPercentFromCfpContribution(115)).toBe(100);
    expect(microPercentFromCfpContribution(116)).toBe(100);
    expect(microPercentFromCfpContribution(200)).toBe(100);
    expect(microPercentFromCfpContribution(0)).toBeNull();
    expect(microPercentFromCfpContribution(0.99)).toBeNull();
  });

  it("convertit chaque tranche en droits annuels (900 € × taux)", () => {
    const gross = (cfp: number) =>
      estimateFifplRights({
        status: "micro_entrepreneur",
        cfpContributionEur: cfp,
      })?.grossRightsEur;
    expect(gross(15)).toBe(180);
    expect(gross(30)).toBe(540);
    expect(gross(50)).toBe(720);
    expect(gross(87.5)).toBe(900);
  });

  it("garde la copie Deno de submit-registration sur la même grille", () => {
    const deno = readFileSync(
      join(process.cwd(), "supabase/functions/submit-registration/index.ts"),
      "utf8"
    );
    expect(deno).toContain("if (c >= 81) percent = 100;");
    expect(deno).toContain("else if (c >= 41) percent = 80;");
    expect(deno).toContain("else if (c >= 21) percent = 60;");
    expect(deno).toContain("else if (c >= 1) percent = 20;");
    expect(deno).not.toMatch(/c >= 116|c >= 101|percent = 90|percent = 40/);
  });

  it("donne 100 % aux indépendants et déduit une prise en charge antérieure", () => {
    const rights = estimateFifplRights({
      status: "independant",
      cfpContributionEur: null,
      alreadyCoveredEur: 300,
    });
    expect(rights?.rightsPercent).toBe(100);
    expect(rights?.grossRightsEur).toBe(FIFPL_ANNUAL_CEILING_EUR);
    expect(rights?.remainingRightsEur).toBe(600);
    expect(rights?.isProvisionalMicroEstimate).toBe(false);
  });

  it("estime la prise en charge sur le tarif de la formation", () => {
    const rights = estimateFifplRights({
      status: "independant",
      cfpContributionEur: null,
      alreadyCoveredEur: 200,
      coursePriceEur: 1200,
    });
    expect(rights?.remainingRightsEur).toBe(700);
    expect(rights?.coveredOnCourseEur).toBe(700);
    expect(rights?.remainingChargeEur).toBe(500);
  });

  it("traite la visio FLI (online_*) comme du présentiel FIFPL, pas e-learning", () => {
    for (const modality of ["online_individual", "online_group", "in_person", "en_ligne_groupe"]) {
      const rights = estimateFifplRights({
        status: "independant",
        cfpContributionEur: null,
        modality,
        alreadyCoveredEur: 0,
      });
      expect(rights?.annualCeilingBaseEur).toBe(FIFPL_ANNUAL_CEILING_EUR);
      expect(rights?.isElearning).toBe(false);
    }
  });

  it("réduit le plafond uniquement pour l’e-learning asynchrone", () => {
    const rights = estimateFifplRights({
      status: "micro_entrepreneur",
      cfpContributionEur: 50, // 41–80 € → 80 %
      modality: "elearning",
      alreadyCoveredEur: 0,
    });
    // base 450 × 80 % = 360
    expect(rights?.annualCeilingBaseEur).toBe(450);
    expect(rights?.rightsPercent).toBe(80);
    expect(rights?.grossRightsEur).toBe(360);
    expect(rights?.isElearning).toBe(true);
  });

  it("utilise le pire cas 20 % pour un micro sans cotisation (aperçu seulement)", () => {
    const rights = estimateFifplRights({
      status: "micro_entrepreneur",
      cfpContributionEur: null,
    });
    expect(rights?.rightsPercent).toBe(20);
    expect(rights?.isProvisionalMicroEstimate).toBe(true);
  });
});

describe("fifpl-funding — parse attestation", () => {
  it("lit année 2026 et montant cotisation", () => {
    const text = `
      Attestation de contribution à la formation professionnelle
      Exercice 2026
      Micro-entrepreneur
      Montant de la cotisation CFP : 87,50 €
    `;
    const parsed = parseCfpAttestationText(text);
    expect(parsed.year).toBe(2026);
    expect(parsed.contributionEur).toBe(87.5);
    expect(parsed.suggestedStatus).toBe("micro_entrepreneur");
    expect(parsed.warnings).toHaveLength(0);
  });

  it("accepte 2025 sans alerte (N-1 des critères)", () => {
    const parsed = parseCfpAttestationText("Attestation CFP exercice 2025 cotisation 120 €");
    expect(parsed.year).toBe(2025);
    expect(isAcceptedCfpAttestationYear(2025)).toBe(true);
    expect(parsed.warnings).toHaveLength(0);
  });

  it("alerte sans bloquer si l'année est hors 2025/2026", () => {
    const parsed = parseCfpAttestationText("Attestation CFP exercice 2024 cotisation 120 €");
    expect(parsed.year).toBe(2024);
    expect(parsed.warnings.some((w) => w.includes("2024"))).toBe(true);
    expect(parsed.warnings.some((w) => /continuer/i.test(w))).toBe(true);
  });
});

describe("fifpl-funding — validation (pas de dépôt « plus tard »)", () => {
  it("exige le statut professionnel en premier", () => {
    expect(validateFifplQuestionnaire(EMPTY_FIFPL_QUESTIONNAIRE)).toMatch(
      /indépendant ou micro-entrepreneur/i
    );
  });

  it("autorise de continuer sans attestation CFP", () => {
    expect(
      validateFifplQuestionnaire({
        ...EMPTY_FIFPL_QUESTIONNAIRE,
        status: "independant",
        hadOtherFifplTrainingThisYear: false,
      })
    ).toBeNull();
  });

  it("exige la cotisation CFP pour un micro-entrepreneur", () => {
    expect(
      validateFifplQuestionnaire({
        ...EMPTY_FIFPL_QUESTIONNAIRE,
        status: "micro_entrepreneur",
        hadOtherFifplTrainingThisYear: false,
      })
    ).toMatch(/cotisation CFP/i);

    expect(
      validateFifplQuestionnaire({
        ...EMPTY_FIFPL_QUESTIONNAIRE,
        status: "micro_entrepreneur",
        cfpContributionEur: 50,
        hadOtherFifplTrainingThisYear: false,
      })
    ).toBeNull();
  });

  it("exige le montant déjà pris en charge si autre formation FIFPL", () => {
    expect(
      validateFifplQuestionnaire({
        ...EMPTY_FIFPL_QUESTIONNAIRE,
        status: "independant",
        hadOtherFifplTrainingThisYear: true,
      })
    ).toMatch(/montant déjà pris en charge/i);

    expect(
      validateFifplQuestionnaire({
        ...EMPTY_FIFPL_QUESTIONNAIRE,
        status: "independant",
        hadOtherFifplTrainingThisYear: true,
        otherFifplAmountAlreadyCoveredEur: 250,
      })
    ).toBeNull();
  });

  it("ne bloque jamais sur l'année de l'attestation (null, 2024, 2025, 2026)", () => {
    expect(FIFPL_ACCEPTED_CFP_ATTESTATION_YEARS).toEqual([2025, 2026]);
    const base = {
      ...EMPTY_FIFPL_QUESTIONNAIRE,
      cfpAttestationFileName: "cfp.pdf",
      cfpAttestationPath: "register/cfp/x.pdf",
      status: "independant" as const,
      hadOtherFifplTrainingThisYear: false,
    };
    for (const y of [null, 2024, 2025, 2026]) {
      expect(validateFifplQuestionnaire({ ...base, cfpAttestationYear: y })).toBeNull();
    }
  });

  it("préfère l'année d'exercice à une date d'émission dans le PDF", () => {
    const parsed = parseCfpAttestationText(
      "Document émis le 12/03/2026\nAttestation de contribution à la formation professionnelle\nExercice 2025\nCotisation CFP : 87,50 €"
    );
    expect(parsed.year).toBe(2025);
    expect(parsed.warnings).toHaveLength(0);
  });

  it("rappelle que l'attestation est facultative et demande le montant autre formation", () => {
    expect(FIFPL_REGISTER_COPY.sectionDescription.toLowerCase()).toMatch(/facultative/);
    expect(FIFPL_REGISTER_COPY.sectionDescription.toLowerCase()).not.toMatch(/plus tard/);
    expect(FIFPL_REGISTER_COPY.alreadyCoveredLabel.toLowerCase()).toMatch(/pris en charge/);
    expect(FIFPL_REGISTER_COPY.otherTrainingHelp.toLowerCase()).toMatch(/déduit/);
    expect(FIFPL_REGISTER_COPY.confirmationAlert(600)).toMatch(/600/);
    expect(FIFPL_REGISTER_COPY.confirmationAlert(null)).not.toMatch(/plus tard/);
  });

  it("résume pour observations", () => {
    const q = {
      ...EMPTY_FIFPL_QUESTIONNAIRE,
      status: "micro_entrepreneur" as const,
      cfpAttestationYear: 2026,
      cfpContributionEur: 50,
      cfpAttestationFileName: "attestation.pdf",
      cfpAttestationPath: "register/cfp/a.pdf",
      hadOtherFifplTrainingThisYear: true,
      otherFifplAmountAlreadyCoveredEur: 100,
    };
    const rights = estimateFifplRights({
      status: q.status,
      cfpContributionEur: q.cfpContributionEur,
      alreadyCoveredEur: q.otherFifplAmountAlreadyCoveredEur,
      coursePriceEur: 800,
    });
    const summary = formatFifplQuestionnaireSummary(q, rights);
    expect(summary).toContain("micro-entrepreneur");
    expect(summary).toContain("80 %");
    expect(summary).toContain("100 €");
    expect(summary).toContain("reste");
    expect(summary).toContain("prise en charge estimée");
    expect(summary).toContain(String(FIFPL_CRITERIA_YEAR));
  });
});
