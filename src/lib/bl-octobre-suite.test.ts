import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("BL-048 — cosmétiques octobre", () => {
  it("Students.tsx pluralise « stagiaire / stagiaires »", () => {
    const students = source("src/pages/Students.tsx");
    expect(students).toContain("studentSingular");
    expect(students).toContain('fr: "stagiaire"');
    expect(students).toMatch(/=== 1\s*\?\s*t\(translations\.studentSingular\)/);
  });

  it("Inscriptions.tsx pluralise « inscription / inscriptions »", () => {
    const inscriptions = source("src/pages/Inscriptions.tsx");
    expect(inscriptions).toContain("inscriptionSingular");
    expect(inscriptions).toMatch(/=== 1\s*\?\s*t\(translations\.inscriptionSingular\)/);
  });

  it("PlacementTests.tsx — titre « Test — » et pluriel des tests complétés", () => {
    const placement = source("src/pages/PlacementTests.tsx");
    expect(placement).toContain('fr: "Test —"');
    expect(placement).toContain("testCompleted");
    expect(placement).toMatch(/completedTests === 1/);
  });

  it("Invoices.tsx — « Nouvelle facture » (minuscule)", () => {
    const invoices = source("src/pages/Invoices.tsx");
    expect(invoices).toContain('fr: "Nouvelle facture"');
    expect(invoices).not.toContain('fr: "Nouvelle Facture"');
  });

  it("InstructorDetails.tsx — TAX_STATUSES et note nulle", () => {
    const details = source("src/pages/formateurs/InstructorDetails.tsx");
    expect(details).toContain("TAX_STATUSES");
    expect(details).toMatch(/rating_average != null/);
  });

  it("useInstructorInscriptions — hook présent sur la branche", () => {
    const hooks = source("src/hooks/useInstructors.ts");
    expect(hooks).toContain("export function useInstructorInscriptions");
    expect(hooks).toContain("inscriptions_complete");
  });

  it("InstructorDetails Planning/Historique lisent les inscriptions (BL-041)", () => {
    const details = source("src/pages/formateurs/InstructorDetails.tsx");
    expect(details).toContain("useInstructorInscriptions");
    expect(details).not.toContain("useInstructorSessions");
    expect(details).not.toContain("SessionFormDialog");
    expect(details).toContain("Aucune formation à venir");
  });

  it("InstructorsList.tsx — titres inclusifs et labels de filtres", () => {
    const list = source("src/pages/formateurs/InstructorsList.tsx");
    expect(list).toContain("Formateur·rices");
    expect(list).toContain("Ajouter un·e formateur·rice");
    expect(list).toContain('<Label htmlFor="instructor-lang-filter">Langue</Label>');
    expect(list).toContain('<Label htmlFor="instructor-status-filter">Statut</Label>');
    expect(list).toContain('<Label htmlFor="instructor-avail-filter">Disponibilité</Label>');
  });

  it("FliInvoicesImportCard.tsx — invite générique CSV", () => {
    const card = source("src/components/admin/FliInvoicesImportCard.tsx");
    expect(card).toContain("Déposer un fichier CSV de facturation");
    expect(card).not.toContain("facturation_FLI_2026_09_15.csv");
  });
});

describe("BL-044 — test_phrases dans le nettoyage ZZTEST", () => {
  it("CleanupZztestCard mentionne code prefix et text_fr ZZTEST", () => {
    const card = source("src/components/admin/CleanupZztestCard.tsx");
    expect(card).toContain("test_phrases");
    expect(card).toContain("text_fr");
    expect(card).toMatch(/code.*ZZTEST|ZZTEST.*code/i);
  });

  it("migration cleanup-zztest sélectionne test_phrases par code ou text_fr", () => {
    const migration = source(
      "supabase/migrations/20260915190000_zztest_cleanup_storage_via_api.sql"
    );
    expect(migration).toContain("FROM public.test_phrases");
    expect(migration).toMatch(/code ILIKE 'ZZTEST%'/);
    expect(migration).toMatch(/text_fr ILIKE '%ZZTEST%'/);
  });
});
