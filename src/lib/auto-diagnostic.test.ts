import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AUTO_DIAGNOSTIC_QUESTIONS,
  DIFFICULTY_RANKING_ITEMS,
  expectationsFromAutoDiagnostic,
  isAutoDiagnosticQuestionVisible,
  substituteLanguagePlaceholder,
  validateAutoDiagnostic,
} from "./auto-diagnostic";

describe("auto-diagnostic — modèle Excel", () => {
  it("charge les 13 questions de la feuille Auto-diagnostic", () => {
    expect(AUTO_DIAGNOSTIC_QUESTIONS).toHaveLength(13);
    expect(AUTO_DIAGNOSTIC_QUESTIONS[0].section).toBe("Historique");
    expect(DIFFICULTY_RANKING_ITEMS).toHaveLength(7);
  });

  it("substitue [langue] avec le libellé du catalogue", () => {
    expect(
      substituteLanguagePlaceholder("cours de [langue]", "english")
    ).toMatch(/anglais/i);
  });

  it("montre les questions conditionnelles seulement si Oui", () => {
    const q2 = AUTO_DIAGNOSTIC_QUESTIONS.find((q) => q.order_index === 2)!;
    expect(isAutoDiagnosticQuestionVisible(q2, {})).toBe(false);
    expect(isAutoDiagnosticQuestionVisible(q2, { "1": "Oui" })).toBe(true);
    expect(isAutoDiagnosticQuestionVisible(q2, { "1": "Non" })).toBe(false);
  });

  it("valide les champs obligatoires et le ranking", () => {
    expect(validateAutoDiagnostic({})).toMatch(/obligatoires|difficultés/i);

    const complete = {
      "1": "Non",
      "3": "Non",
      "5": [...DIFFICULTY_RANKING_ITEMS],
      "7": "Pour travailler avec des clients anglophones",
      "8": "Améliorer mon oral",
      "9": "Assez confiant(e)",
      "10": "Non",
      "12": "Non",
    };
    expect(validateAutoDiagnostic(complete)).toBeNull();
    expect(expectationsFromAutoDiagnostic(complete)).toBe("Améliorer mon oral");
  });
});

describe("PlacementTestStep — auto-diagnostic avant QCM", () => {
  const step = readFileSync(
    join(process.cwd(), "src/components/registration/PlacementTestStep.tsx"),
    "utf8"
  );
  const form = readFileSync(
    join(process.cwd(), "src/components/registration/AutoDiagnosticForm.tsx"),
    "utf8"
  );

  it("enchaîne auto-diagnostic puis test pistes", () => {
    expect(step).toContain("AutoDiagnosticForm");
    expect(step).toContain("auto_diagnostic");
    expect(step).toContain("Commencer l&apos;auto-diagnostic");
    expect(step).toContain("Commencer le test (piste verte)");
    expect(step).toContain("Comment ça fonctionne");
    expect(form).toContain("Continuer vers le test de niveau");
  });

  it("exige l'auto-diagnostic côté submit-registration", () => {
    const edge = readFileSync(
      join(process.cwd(), "supabase/functions/submit-registration/index.ts"),
      "utf8"
    );
    expect(edge).toContain("autoDiagnostic");
    expect(edge).toMatch(/auto-diagnostic/i);
  });
});
