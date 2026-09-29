import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("ExpectationsStep — pas de certification pour moniteurs", () => {
  it("masque la certification quand profession = ski_instructor", () => {
    const step = source("src/components/registration/ExpectationsStep.tsx");
    expect(step).toContain('data.profession === "ski_instructor"');
    expect(step).toContain('certification: "none"');
    expect(step).toContain('offersCertification ? "Attentes et certification" : "Attentes"');
    expect(step).toContain("Continuer vers le paiement");
  });

  it("ne récapitule pas la certification pour les moniteurs", () => {
    const confirmation = source("src/components/registration/ConfirmationStep.tsx");
    expect(confirmation).toContain('profession !== "ski_instructor"');
  });
});
