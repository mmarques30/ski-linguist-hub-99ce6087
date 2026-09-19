import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("BL-octobre suite 3 — GlobalSearch multi-jetons", () => {
  it("GlobalSearch importe et utilise buildStudentSearchFilter pour les stagiaires", () => {
    const globalSearch = source("src/components/layout/GlobalSearch.tsx");
    expect(globalSearch).toContain('from "@/hooks/useStudents"');
    expect(globalSearch).toContain("buildStudentSearchFilter");
    expect(globalSearch).toMatch(/buildStudentSearchFilter\(debounced\)/);
    expect(globalSearch).toMatch(/\.or\(studentFilter\)/);
  });

  it("GlobalSearch applique un filtre multi-jetons pour les formateurs", () => {
    const globalSearch = source("src/components/layout/GlobalSearch.tsx");
    expect(globalSearch).toContain("buildInstructorSearchFilter");
    expect(globalSearch).toMatch(/buildInstructorSearchFilter\(debounced\)/);
    expect(globalSearch).toMatch(/\.or\(instructorFilter\)/);
  });
});

describe("BL-034 — saison = exercice comptable", () => {
  it("migration bl034_saison_exercice_comptable existe", () => {
    const path = "supabase/migrations/20260919120000_bl034_saison_exercice_comptable.sql";
    expect(existsSync(join(process.cwd(), path))).toBe(true);
    const sql = source(path);
    expect(sql).toContain("get_fiscal_year");
    expect(sql).toContain("2026-07-01");
    expect(sql).toContain("2027-06-30");
  });

  it("SeasonFormDialog préremplit les dates via getFiscalYearBounds", () => {
    const dialog = source("src/components/admin/SeasonFormDialog.tsx");
    expect(dialog).toContain("getFiscalYearBounds");
    expect(dialog).toContain("getCurrentFiscalYear");
  });
});

describe("BL-042 — attestation de vigilance", () => {
  it("migration bl042_vigilance_attestation existe", () => {
    const path = "supabase/migrations/20260919121000_bl042_vigilance_attestation.sql";
    expect(existsSync(join(process.cwd(), path))).toBe(true);
    const sql = source(path);
    expect(sql).toContain("vigilance_attestation_url");
    expect(sql).toContain("vigilance_attestation_received_at");
    expect(sql).toContain("vigilance_attestation_expires_at");
  });

  it("InstructorDetails gère vigilance_attestation", () => {
    const details = source("src/pages/formateurs/InstructorDetails.tsx");
    expect(details).toContain("vigilance_attestation_url");
    expect(details).toContain("vigilance_attestation_received_at");
    expect(details).toContain("vigilance_attestation_expires_at");
    expect(details).toContain("Attestation de vigilance");
    expect(details).not.toContain("à venir (pas de colonne en base");
  });
});
