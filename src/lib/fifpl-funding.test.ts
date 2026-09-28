import { describe, expect, it } from "vitest";
import {
  EMPTY_FIFPL_QUESTIONNAIRE,
  estimateFifplRights,
  FIFPL_ANNUAL_CEILING_EUR,
  FIFPL_CRITERIA_YEAR,
  formatFifplQuestionnaireSummary,
  microPercentFromCfpContribution,
  parseCfpAttestationText,
  validateFifplQuestionnaire,
} from "./fifpl-funding";

describe("fifpl-funding — grille micro CFP 2026", () => {
  it("applique le tableau page 3", () => {
    expect(microPercentFromCfpContribution(10)).toBe(20);
    expect(microPercentFromCfpContribution(21)).toBe(40);
    expect(microPercentFromCfpContribution(80)).toBe(60);
    expect(microPercentFromCfpContribution(100)).toBe(80);
    expect(microPercentFromCfpContribution(115)).toBe(90);
    expect(microPercentFromCfpContribution(116)).toBe(100);
    expect(microPercentFromCfpContribution(200)).toBe(100);
    expect(microPercentFromCfpContribution(0)).toBeNull();
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
  });

  it("réduit le plafond e-learning de 50 % avant le % micro", () => {
    const rights = estimateFifplRights({
      status: "micro_entrepreneur",
      cfpContributionEur: 50, // 60 %
      modality: "online_individual",
      alreadyCoveredEur: 0,
    });
    // base 450 × 60 % = 270
    expect(rights?.annualCeilingBaseEur).toBe(450);
    expect(rights?.grossRightsEur).toBe(270);
    expect(rights?.isElearning).toBe(true);
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

  it("alerte si l'année n'est pas 2026", () => {
    const parsed = parseCfpAttestationText("Attestation CFP exercice 2025 cotisation 120 €");
    expect(parsed.year).toBe(2025);
    expect(parsed.warnings.some((w) => w.includes("2025"))).toBe(true);
  });
});

describe("fifpl-funding — validation", () => {
  it("exige attestation, statut et question autre formation", () => {
    expect(validateFifplQuestionnaire(EMPTY_FIFPL_QUESTIONNAIRE)).toMatch(/attestation CFP/i);

    expect(
      validateFifplQuestionnaire({
        ...EMPTY_FIFPL_QUESTIONNAIRE,
        cfpAttestationFileName: "cfp.pdf",
        cfpAttestationPath: "register/cfp/x.pdf",
        cfpAttestationYear: FIFPL_CRITERIA_YEAR,
        status: "independant",
        hadOtherFifplTrainingThisYear: false,
      })
    ).toBeNull();

    expect(
      validateFifplQuestionnaire({
        ...EMPTY_FIFPL_QUESTIONNAIRE,
        cfpAttestationFileName: "cfp.pdf",
        cfpAttestationPath: "register/cfp/x.pdf",
        cfpAttestationYear: 2025,
        status: "independant",
        hadOtherFifplTrainingThisYear: false,
      })
    ).toMatch(/2026/);
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
    });
    const summary = formatFifplQuestionnaireSummary(q, rights);
    expect(summary).toContain("micro-entrepreneur");
    expect(summary).toContain("100 €");
    expect(summary).toContain("reste");
  });
});
