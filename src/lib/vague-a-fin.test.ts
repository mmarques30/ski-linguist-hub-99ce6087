import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formateurAssistPath, studentAssistPath } from "@/lib/client-links";
import { pisteBucketFromDeterminedLevel } from "@/hooks/usePlacementTestStats";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("Vague A fin — Assister formateur, portail, pistes", () => {
  it("expose Assister formateur", () => {
    expect(formateurAssistPath("inst-1", "evaluations")).toBe(
      "/portails/formateur/inst-1/evaluations"
    );
    expect(source("src/App.tsx")).toContain('path="/portails/formateur/:instructorId"');
    expect(source("src/contexts/FormateurViewContext.tsx")).toContain("FormateurAssistViewProvider");
    expect(source("src/pages/formateurs/InstructorDetails.tsx")).toContain(
      "FormateurPortalAccessCard"
    );
    expect(source("src/components/formateurs/FormateurPortalAccessCard.tsx")).toContain(
      "Voir comme le formateur"
    );
    // Garde SPA : attendre le rôle (isPending / roleResolved) avant redirect
    expect(source("src/hooks/useUserPermissions.ts")).toContain("isPending");
    expect(source("src/hooks/useUserPermissions.ts")).toContain("user-role-check");
    expect(source("src/components/auth/AssistFormateurRoute.tsx")).toContain("roleResolved");
  });

  it("pilote le portail via app_settings", () => {
    expect(
      source("supabase/migrations/20260918090000_student_portal_enabled_setting.sql")
    ).toContain("student_portal_enabled");
    expect(source("src/components/settings/StudentPortalEnabledCard.tsx")).toContain(
      "Invitations portail activées"
    );
    expect(source("src/components/students/StudentPortalAccessCard.tsx")).toContain(
      "useStudentPortalEnabled"
    );
    expect(source("supabase/functions/invite-student-portal/index.ts")).toContain(
      "student_portal_enabled"
    );
  });

  it("affiche /tests en pistes", () => {
    expect(pisteBucketFromDeterminedLevel("B1")).toBe("Piste bleue");
    expect(pisteBucketFromDeterminedLevel("A1")).toBe("Piste verte");
    expect(pisteBucketFromDeterminedLevel(null)).toBe("Non renseigné");
    expect(source("src/pages/PlacementTests.tsx")).toContain("Piste verte");
    expect(source("src/pages/PlacementTests.tsx")).toContain("Répartition par piste");
  });

  it("affiche la liste Admin inscriptions en couleur de piste (pas CECRL brut)", () => {
    const inscriptions = source("src/pages/Inscriptions.tsx");
    expect(inscriptions).toContain("displayPisteLabel");
    expect(inscriptions).toContain("pistePillTone");
    expect(inscriptions).not.toMatch(
      /<Badge[^>]*>\{inscription\.entry_level/
    );
    expect(pisteBucketFromDeterminedLevel("B1a")).toBe("Piste bleue");
  });

  it("bilan progression fiche : saisie formateur, jamais le niveau du test", () => {
    const fiche = source("src/pages/inscriptions/InscriptionDetails.tsx");
    expect(fiche).toContain("progression?.niveau_general_entree?.trim()");
    expect(fiche).not.toContain(
      "progression?.niveau_general_entree || inscription.entry_level"
    );
    expect(fiche).toContain('label="Progression"');
    expect(fiche).not.toContain('label="Progression CECRL"');
    const entryForm = source(
      "src/components/inscriptions/FormateurEntryFormDialog.tsx"
    );
    expect(entryForm).toContain(
      "Jamais de préremplissage depuis le test de placement"
    );
    expect(entryForm).not.toContain(
      "initial?.niveau_general_entree || suggestedGeneralEntry"
    );
  });

  it("conserve Assister stagiaire", () => {
    expect(studentAssistPath("s1")).toBe("/portails/stagiaire/s1/dashboard");
  });
});
