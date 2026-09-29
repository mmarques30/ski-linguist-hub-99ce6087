import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  splitFormateurInscriptions,
  uniqueStagiairesFromInscriptions,
  type FormateurInscriptionRow,
} from "./formateur-portal";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

function row(
  partial: Partial<FormateurInscriptionRow> & { id: string }
): FormateurInscriptionRow {
  return {
    code: null,
    language: null,
    start_date: null,
    end_date: null,
    status: null,
    student_id: null,
    student_name: null,
    student_email: null,
    student_phone: null,
    course_location: null,
    course_address: null,
    modality: null,
    rhythm: null,
    schedule: null,
    group_name: null,
    ski_school_name: null,
    ...partial,
  };
}

describe("useFormateurPortal helpers", () => {
  it("répartit inscriptions en cours / à venir / passées", () => {
    const { upcoming, current, past } = splitFormateurInscriptions([
      row({
        id: "1",
        start_date: "2020-01-01",
        end_date: "2020-01-10",
        student_name: "A",
      }),
      row({
        id: "2",
        start_date: "2099-01-01",
        end_date: "2099-01-10",
        student_name: "B",
      }),
      row({
        id: "3",
        start_date: "2020-01-01",
        end_date: "2099-12-31",
        student_name: "C",
      }),
    ]);
    expect(past.map((r) => r.id)).toEqual(["1"]);
    expect(upcoming.map((r) => r.id)).toEqual(["2"]);
    expect(current.map((r) => r.id)).toEqual(["3"]);
  });

  it("dédoublonne les stagiaires par student_id", () => {
    const list = uniqueStagiairesFromInscriptions([
      row({
        id: "i1",
        student_id: "s1",
        student_name: "Ada",
        student_email: "a@example.invalid",
      }),
      row({
        id: "i2",
        student_id: "s1",
        student_name: "Ada",
        student_email: "a@example.invalid",
      }),
      row({
        id: "i3",
        student_id: "s2",
        student_name: "Bob",
      }),
    ]);
    expect(list).toHaveLength(2);
    expect(list[0].name).toBe("Ada");
    expect(list[0].inscriptions).toHaveLength(2);
    expect(list[1].name).toBe("Bob");
  });
});

describe("portail formateur — câblage", () => {
  it("migration RLS formateur inscriptions existe", () => {
    const path = "supabase/migrations/20260929130000_formateur_portal_inscriptions_rls.sql";
    expect(existsSync(join(process.cwd(), path))).toBe(true);
    const sql = source(path);
    expect(sql).toContain("rls_inscriptions_select_formateur");
    expect(sql).toContain("rls_students_select_formateur");
    expect(sql).toContain("rls_instructor_sessions_select_formateur");
  });

  it("App expose tableau-de-bord / planning / stagiaires + Assister", () => {
    const app = source("src/App.tsx");
    expect(app).toContain('path="/formateur/tableau-de-bord"');
    expect(app).toContain('path="/formateur/planning"');
    expect(app).toContain('path="/formateur/stagiaires"');
    expect(app).toContain('path="tableau-de-bord"');
    expect(app).toContain("FormateurDashboard");
  });

  it("Auth et ProtectedRoute redirigent vers tableau-de-bord", () => {
    expect(source("src/pages/Auth.tsx")).toContain("/formateur/tableau-de-bord");
    expect(source("src/components/auth/ProtectedRoute.tsx")).toContain(
      "/formateur/tableau-de-bord"
    );
  });

  it("FormateurLayout et PageShell existent", () => {
    expect(existsSync(join(process.cwd(), "src/components/layout/FormateurLayout.tsx"))).toBe(
      true
    );
    expect(
      existsSync(join(process.cwd(), "src/components/layout/FormateurPageShell.tsx"))
    ).toBe(true);
    const layout = source("src/components/layout/FormateurLayout.tsx");
    expect(layout).toContain("tableau-de-bord");
    expect(layout).toContain("Espace formateur");
  });
});
