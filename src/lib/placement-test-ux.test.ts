import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PASS_THRESHOLD,
  QUESTIONS_PER_SLOPE,
  SALON_PASS_THRESHOLD,
  SALON_QUESTIONS_PER_SLOPE,
  SLOPE_LABELS,
} from "./placement-test-engine";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("PlacementTestStep — UX progressif pistes", () => {
  const step = source("src/components/registration/PlacementTestStep.tsx");

  it("explique le parcours comme les pistes de ski + vocabulaire pour tous", () => {
    expect(step).toContain("Comment ça fonctionne");
    expect(step).toContain("piste verte");
    expect(step).toContain("bleue");
    expect(step).toContain("rouge");
    expect(step).toContain("noire");
    expect(step).toContain("Vocabulaire du ski");
    expect(step).toContain("tous les stagiaires passent");
    expect(step).toContain("PASS_THRESHOLD");
    expect(step).toContain("QUESTIONS_PER_SLOPE");
    expect(step).toContain("Auto-diagnostic");
  });

  it("supporte le mode salon sans auto-diagnostic", () => {
    expect(step).toContain('variant?: "register" | "salon"');
    expect(step).toContain("isSalon");
    expect(step).toContain("!isSalon && !data.autoDiagnostic");
  });

  it("utilise une version courte au salon (3 Q × 2 pistes, pas de vocab)", () => {
    expect(step).toContain("SALON_QUESTIONS_PER_SLOPE");
    expect(step).toContain("SALON_PASS_THRESHOLD");
    expect(step).toContain("getNextSalonSlopeAfterSlope");
    expect(step).toContain("version salon");
    expect(step).toContain("Pas de vocabulaire ski");
    expect(SALON_QUESTIONS_PER_SLOPE).toBe(3);
    expect(SALON_PASS_THRESHOLD).toBe(2);
  });

  it("affiche la progression au format n/total piste X", () => {
    expect(step).toContain("progressLabel");
    expect(step).toContain("toLowerCase()");
    expect(step).toContain("questionNumber}/${questionsInSlope}");
    expect(SLOPE_LABELS.bleue.toLowerCase()).toBe("piste bleue");
  });

  it("remonte le RadioGroup à chaque question sans présélection", () => {
    expect(step).toContain("key={currentQuestion.id}");
    expect(step).toContain("onValueChange={selectAnswer}");
  });

  it("garde le seuil métier 3/5", () => {
    expect(PASS_THRESHOLD).toBe(3);
    expect(QUESTIONS_PER_SLOPE).toBe(5);
  });
});
