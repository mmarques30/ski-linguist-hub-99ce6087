import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  instructorLabelMatchesProfile,
  offeringMatchesInstructor,
  splitFormateurCatalogSessions,
  splitFormateurInscriptions,
  toFormateurCatalogSession,
  uniqueStagiairesFromInscriptions,
  type FormateurInscriptionRow,
} from "./formateur-portal";
import type { RegistrationOffering } from "./registration-offerings";

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

describe("catalogue formateur — matching libellé", () => {
  const georgios = {
    id: "inst-georgios",
    first_name: "Georgios",
    last_name: "Constandi",
  };

  it("reconnaît Prénom Nom, Nom Prénom et UUID instructor_id", () => {
    expect(
      instructorLabelMatchesProfile("Georgios Constandi", georgios)
    ).toBe(true);
    expect(
      instructorLabelMatchesProfile("Constandi Georgios", georgios)
    ).toBe(true);
    expect(instructorLabelMatchesProfile("Martine", georgios)).toBe(false);
    expect(
      offeringMatchesInstructor(
        { instructor_id: "inst-georgios", instructor_label: "Autre" },
        georgios
      )
    ).toBe(true);
    expect(
      offeringMatchesInstructor(
        { instructor_id: "autre", instructor_label: "Georgios Constandi" },
        georgios
      )
    ).toBe(false);
  });

  it("accepte un libellé prénom seul (Martine, Lydia)", () => {
    expect(
      instructorLabelMatchesProfile("Martine", {
        first_name: "Martine",
        last_name: "Dupont",
      })
    ).toBe(true);
  });

  it("répartit les sessions catalogue par dates", () => {
    const base = {
      session_code: "S05",
      location_label: "ESF Val d'Isère",
      language_label: "Anglais",
      modality_label: "Présentiel",
      format_label: "Présentiel 24 h",
      date_label: null,
      duration_hours: 24,
      enrollment_status: "open",
      instructor_label: "Georgios Constandi",
    };
    const { upcoming, past } = splitFormateurCatalogSessions([
      { ...base, id: "a", start_date: "2020-01-01", end_date: "2020-01-05" },
      { ...base, id: "b", start_date: "2099-11-30", end_date: "2099-12-04" },
    ]);
    expect(past.map((r) => r.id)).toEqual(["a"]);
    expect(upcoming.map((r) => r.id)).toEqual(["b"]);
  });

  it("mappe une offre catalogue vers FormateurCatalogSession", () => {
    const offering = {
      id: "off-1",
      season_id: null,
      session_code: "S05",
      location_key: "val-disere",
      location_label: "ESF Val d'Isère",
      language_key: "english",
      language_label: "Anglais",
      modality_key: "in_person" as const,
      modality_label: "Présentiel",
      duration_hours: 24,
      start_date: "2026-11-30",
      end_date: "2026-12-04",
      date_label: "30 nov.–4 déc. 2026",
      format_label: "Présentiel 24 h",
      instructor_label: "Georgios Constandi",
      base_price: 900,
      sort_order: 5,
      enrollment_status: "open" as const,
    } satisfies RegistrationOffering;
    expect(toFormateurCatalogSession(offering).session_code).toBe("S05");
  });
});

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

  it("migration suite 2 paiements / contrats / invite existe", () => {
    const path = "supabase/migrations/20260929140000_formateur_portal_suite2.sql";
    expect(existsSync(join(process.cwd(), path))).toBe(true);
    const sql = source(path);
    expect(sql).toContain("rls_instructor_payments_select_formateur");
    expect(sql).toContain("rls_instructor_contracts_select_formateur");
    expect(sql).toContain("rls_documents_storage_select_formateur_own");
    expect(sql).toContain("formateur_portal_invite");
  });

  it("App expose tableau-de-bord / onboarding / planning / missions / stagiaires / docs / paiements / profil + Assister", () => {
    const app = source("src/App.tsx");
    expect(app).toContain('path="/formateur/tableau-de-bord"');
    expect(app).toContain('path="/formateur/onboarding"');
    expect(app).toContain('path="/formateur/planning"');
    expect(app).toContain('path="/formateur/missions/:inscriptionId"');
    expect(app).toContain('path="/formateur/stagiaires"');
    expect(app).toContain('path="/formateur/stagiaires/:studentId"');
    expect(app).toContain('path="/formateur/presences"');
    expect(app).toContain('path="/emarger/:token"');
    expect(app).toContain("EmargerPage");
    expect(app).toContain('path="/formateur/documents"');
    expect(app).toContain('path="/formateur/paiements"');
    expect(app).toContain('path="/formateur/profil"');
    expect(app).toContain('path="tableau-de-bord"');
    expect(app).toContain('path="onboarding"');
    expect(app).toContain('path="missions/:inscriptionId"');
    expect(app).toContain('path="stagiaires/:studentId"');
    expect(app).toContain('path="presences"');
    expect(app).toContain('path="documents"');
    expect(app).toContain('path="paiements"');
    expect(app).toContain('path="profil"');
    expect(app).toContain("FormateurDashboard");
    expect(app).toContain("FormateurOnboarding");
    expect(app).toContain("FormateurMissionDetail");
    expect(app).toContain("FormateurStagiaireDetail");
    expect(app).toContain("FormateurPresences");
    expect(app).toContain("FormateurDocuments");
    expect(app).toContain("FormateurPaiements");
    expect(app).toContain("FormateurProfil");
  });

  it("migration placement_tests SELECT formateur existe", () => {
    const path =
      "supabase/migrations/20261022060000_formateur_placement_tests_select.sql";
    expect(existsSync(join(process.cwd(), path))).toBe(true);
    const sql = source(path);
    expect(sql).toContain("rls_placement_tests_select_formateur");
  });

  it("migration + portail exposent les sessions catalogue sans inscrits", () => {
    const path =
      "supabase/migrations/20261103184000_formateur_catalog_sessions_instructor_id.sql";
    expect(existsSync(join(process.cwd(), path))).toBe(true);
    const sql = source(path);
    expect(sql).toContain("instructor_id");
    expect(sql).toContain("registration_offerings");
    const hook = source("src/hooks/useFormateurPortal.ts");
    expect(hook).toContain("useFormateurCatalogSessions");
    expect(hook).toContain("offeringMatchesInstructor");
    const planning = source("src/pages/formateur/FormateurPlanning.tsx");
    expect(planning).toContain("FormateurCatalogSessionCard");
    expect(planning).toContain("useFormateurCatalogSessions");
    const dash = source("src/pages/formateur/FormateurDashboard.tsx");
    expect(dash).toContain("useFormateurCatalogSessions");
    expect(
      existsSync(
        join(process.cwd(), "src/components/formateur/FormateurCatalogSessionCard.tsx")
      )
    ).toBe(true);
  });

  it("Auth et ProtectedRoute redirigent vers tableau-de-bord", () => {
    expect(source("src/lib/auth-home.ts")).toContain("/formateur/tableau-de-bord");
    expect(source("src/pages/Auth.tsx")).toContain("homePathForRole");
    expect(source("src/components/auth/ProtectedRoute.tsx")).toContain(
      "/formateur/tableau-de-bord"
    );
    // Ne plus forcer /app admin après login (bug Claire → dash admin).
    expect(source("src/components/auth/AuthCard.tsx")).not.toContain("ADMIN_HOME_PATH");
    expect(source("src/components/auth/AuthCard.tsx")).toContain("PasswordInput");
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
    expect(layout).toContain("onboarding");
    expect(layout).toContain("presences");
    expect(layout).toContain("documents");
    expect(layout).toContain("paiements");
    expect(layout).toContain("profil");
    expect(layout).toContain("Espace formateur");
  });

  it("fiche formateur expose invitation portail + Assister", () => {
    expect(
      existsSync(join(process.cwd(), "src/components/formateurs/FormateurPortalAccessCard.tsx"))
    ).toBe(true);
    const details = source("src/pages/formateurs/InstructorDetails.tsx");
    expect(details).toContain("FormateurPortalAccessCard");
    expect(
      existsSync(join(process.cwd(), "supabase/functions/invite-formateur-portal/index.ts"))
    ).toBe(true);
    const invite = source("supabase/functions/invite-formateur-portal/index.ts");
    expect(invite).toContain("formateur_portal_invite");
    expect(invite).toContain("requireAdmin");
    expect(invite).toContain("temporary_password");
    expect(invite).toContain("generateTemporaryPassword");
    expect(invite).not.toContain('type: "magiclink"');
  });

  it("profil formateur permet de changer le mot de passe", () => {
    expect(
      existsSync(join(process.cwd(), "src/components/formateur/FormateurChangePasswordCard.tsx"))
    ).toBe(true);
    const profil = source("src/pages/formateur/FormateurProfil.tsx");
    expect(profil).toContain("FormateurChangePasswordCard");
    const auth = source("src/hooks/useAuth.ts");
    expect(auth).toContain("updatePassword");
    expect(auth).toContain("resetPasswordForEmail");
  });

  it("sign-private-download autorise le CV formateur sous staff/instructors", () => {
    const edge = source("supabase/functions/sign-private-download/index.ts");
    expect(edge).toContain('parts[0] === "staff"');
    expect(edge).toContain('parts[1] === "instructors"');
  });
});
