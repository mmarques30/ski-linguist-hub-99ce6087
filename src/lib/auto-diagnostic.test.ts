import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AUTO_DIAGNOSTIC_QUESTIONS,
  autoDiagnosticAnswersFromPlacementPayload,
  autoDiagnosticGroupingFields,
  expectationsFromAutoDiagnostic,
  isAutoDiagnosticQuestionVisible,
  substituteLanguagePlaceholder,
  toggleMultiChoice,
  validateAutoDiagnostic,
} from "./auto-diagnostic";

describe("auto-diagnostic — modèle Excel 2026", () => {
  it("charge les 13 questions et Q7 max 3", () => {
    expect(AUTO_DIAGNOSTIC_QUESTIONS).toHaveLength(13);
    expect(AUTO_DIAGNOSTIC_QUESTIONS[0].section).toBe("Parcours");
    const q7 = AUTO_DIAGNOSTIC_QUESTIONS.find((q) => q.order_index === 7)!;
    expect(q7.question).toBe("Dans quels domaines voulez-vous progresser en priorité ?");
    expect(q7.response_type).toBe("Choix multiple (max 3)");
    expect(q7.maxSelections).toBe(3);
  });

  it("substitue [langue] avec le libellé du catalogue", () => {
    expect(
      substituteLanguagePlaceholder("cours de [langue]", "english")
    ).toMatch(/anglais/i);
    expect(
      substituteLanguagePlaceholder("apprendre [langue]", "french")
    ).toMatch(/français/i);
  });

  it("montre les questions conditionnelles selon les règles 2026", () => {
    const q2 = AUTO_DIAGNOSTIC_QUESTIONS.find((q) => q.order_index === 2)!;
    expect(isAutoDiagnosticQuestionVisible(q2, {})).toBe(false);
    expect(isAutoDiagnosticQuestionVisible(q2, { "1": "Oui" })).toBe(true);

    const q6 = AUTO_DIAGNOSTIC_QUESTIONS.find((q) => q.order_index === 6)!;
    expect(isAutoDiagnosticQuestionVisible(q6, { "5": ["Accueillir les clients et les parents"] })).toBe(
      false
    );
    expect(isAutoDiagnosticQuestionVisible(q6, { "5": ["Autre"] })).toBe(true);

    const q12 = AUTO_DIAGNOSTIC_QUESTIONS.find((q) => q.order_index === 12)!;
    expect(isAutoDiagnosticQuestionVisible(q12, { "11": "Oui" })).toBe(true);
  });

  it("bloque la 4e sélection sur Q7", () => {
    const first = toggleMultiChoice([], "Parler", 3);
    const second = toggleMultiChoice(first.next, "Grammaire", 3);
    const third = toggleMultiChoice(second.next, "Prononciation", 3);
    const fourth = toggleMultiChoice(third.next, "Vocabulaire général", 3);
    expect(fourth.error).toMatch(/maximum 3/i);
    expect(fourth.next).toHaveLength(3);
  });

  it("valide les champs obligatoires (multi + unique + texte)", () => {
    expect(validateAutoDiagnostic({})).toMatch(/obligatoires|choix multiple/i);

    const complete = {
      "1": "Non",
      "3": "Non",
      "5": ["Donner des consignes techniques"],
      "7": ["Parler", "Grammaire"],
      "9": "vous faites comprendre, mais cherchez vos mots",
      "10": "Améliorer mon oral",
    };
    expect(validateAutoDiagnostic(complete)).toBeNull();
    expect(expectationsFromAutoDiagnostic(complete)).toBe("Améliorer mon oral");
  });

  it("résume les champs utiles pour constituer les groupes", () => {
    const fields = autoDiagnosticGroupingFields({
      "5": ["Donner des consignes techniques", "Cours avec des enfants"],
      "7": ["Parler", "Vocabulaire du ski"],
      "9": "passez vite par les gestes ou une autre langue",
      "10": "Être à l’aise avec tout type de client",
      "11": "Oui",
      "12": "Brésil",
    });
    expect(fields.hasAnswers).toBe(true);
    expect(fields.expectations).toMatch(/aise/i);
    expect(fields.aisance).toMatch(/gestes/i);
    expect(fields.priorities).toContain("Parler");
    expect(fields.situations).toMatch(/consignes/i);
    expect(fields.stayedAbroad).toBe("Oui — Brésil");
  });

  it("extrait autoDiagnostic depuis le payload placement_tests.answers", () => {
    expect(autoDiagnosticAnswersFromPlacementPayload(null)).toBeNull();
    expect(
      autoDiagnosticAnswersFromPlacementPayload({
        autoDiagnostic: { answers: { "10": "Progresser" }, version: 1 },
      })
    ).toEqual({ "10": "Progresser" });
  });
});

describe("Fiche stagiaire & constitution des groupes — auto-éval visible", () => {
  it("monte PlacementTestSummaryCard sur la fiche stagiaire", () => {
    const page = readFileSync(
      join(process.cwd(), "src/pages/students/StudentDetails.tsx"),
      "utf8"
    );
    expect(page).toContain("PlacementTestSummaryCard");
    expect(page).toContain("Auto-évaluation & test de niveau");
    expect(page).toContain("inscriptionsWithForm");
  });

  it("affiche attentes / aisance / priorités sur Constitution des groupes", () => {
    const page = readFileSync(
      join(process.cwd(), "src/pages/inscriptions/ScheduleValidation.tsx"),
      "utf8"
    );
    const hook = readFileSync(
      join(process.cwd(), "src/hooks/usePendingSchedules.ts"),
      "utf8"
    );
    expect(hook).toContain("autoDiagnosticGroupingFields");
    expect(hook).toContain("entry_test_id");
    expect(page).toContain("autoDiagnostic?.aisance");
    expect(page).toContain("Attentes");
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
    expect(form).toContain("Choix multiple");
  });

  it("n'affiche que la piste côté résultats stagiaire", () => {
    expect(step).toContain("Votre piste");
    expect(step).not.toContain("Score global");
    expect(step).not.toContain("Parcours des pistes");
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
