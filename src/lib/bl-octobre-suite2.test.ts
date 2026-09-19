import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("BL-octobre suite 2 — invalidations inscription", () => {
  it("InscriptionFormDialog invalide inscription-details et inscription-ops-fields", () => {
    const dialog = source("src/components/inscriptions/InscriptionFormDialog.tsx");
    expect(dialog).toContain('queryKey: ["inscription-details"]');
    expect(dialog).toContain('queryKey: ["inscription-ops-fields"]');
  });
});

describe("BL-octobre suite 2 — fiche formateur administratif", () => {
  it("InstructorDetails contient l'onglet Administratif", () => {
    const details = source("src/pages/formateurs/InstructorDetails.tsx");
    expect(details).toContain("Administratif");
    expect(details).toContain('value="administratif"');
    expect(details).toContain("useInstructorContracts");
    expect(details).toContain("statut_administratif");
  });
});

describe("BL-octobre suite 2 — libellés register", () => {
  it("ProfessionalProfileStep oriente vers le test de niveau", () => {
    const step = source("src/components/registration/ProfessionalProfileStep.tsx");
    expect(step).toContain("Continuer vers le test de niveau");
    expect(step).not.toContain("Continuer vers la configuration de la formation");
  });

  it("PlacementTestStep sépare piste et score avec un point médian", () => {
    const step = source("src/components/registration/PlacementTestStep.tsx");
    expect(step).toContain(" · ");
    expect(step).not.toMatch(/SLOPE_LABELS\[sr\.slope\]\}:\s*\{sr\.correct\}/);
  });

  it("ConfirmationStep affiche le score en correct/total", () => {
    const step = source("src/components/registration/ConfirmationStep.tsx");
    expect(step).toContain("totalAnswered");
    expect(step).toContain("bonnes réponses");
  });
});
