import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("ExpectationsStep — plus de doublon attentes / auto-diagnostic", () => {
  it("ne propose plus le champ attentes (Q10 auto-diag fait foi)", () => {
    const step = source("src/components/registration/ExpectationsStep.tsx");
    expect(step).not.toContain("Quelles sont vos attentes pour cette formation");
    expect(step).not.toContain('id="expectations"');
    expect(step).toContain("Certification");
    expect(step).toContain('data.profession === "ski_instructor"');
    expect(step).toContain('certification: "none"');
    expect(step).toContain("Continuer vers le paiement");
  });

  it("le parcours inscription saute l'étape certification pour les moniteurs", () => {
    const index = source("src/pages/register/Index.tsx");
    expect(index).toContain("skipCertificationStep");
    expect(index).toContain('profession === "ski_instructor"');
    expect(index).toContain('name: "Certification"');
  });

  it("ne récapitule pas la certification pour les moniteurs", () => {
    const confirmation = source("src/components/registration/ConfirmationStep.tsx");
    expect(confirmation).toContain('profession !== "ski_instructor"');
  });
});
