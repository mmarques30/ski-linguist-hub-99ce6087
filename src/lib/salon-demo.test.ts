import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("Salon des directeurs — /salon", () => {
  const page = source("src/pages/salon/Index.tsx");
  const app = source("src/App.tsx");
  const step = source("src/components/registration/PlacementTestStep.tsx");
  const migration = source("supabase/migrations/20261014180000_salon_demo_tests.sql");
  const contactMigration = source(
    "supabase/migrations/20261014190000_salon_demo_tests_contact.sql"
  );

  it("expose une route publique /salon", () => {
    expect(app).toContain('path="/salon"');
    expect(app).toContain("SalonDirecteursPage");
  });

  it("demande nom, prénom, e-mail, portable et école ESF uniquement", () => {
    expect(page).toContain("Prénom");
    expect(page).toContain("Nom");
    expect(page).toContain("E-mail");
    expect(page).toContain("Portable");
    expect(page).toContain("p_email");
    expect(page).toContain("p_phone");
    expect(page).toContain('useSkiSchoolDirectory("ESF")');
    expect(page).toContain("Autre ESF");
    expect(page).not.toContain("ESI");
    expect(page).not.toContain("Evolution 2");
  });

  it("enchaîne sur le test adaptatif en mode salon", () => {
    expect(page).toContain('variant="salon"');
    expect(page).toContain("submit_salon_demo_test");
    expect(step).toContain('variant?: "register" | "salon"');
    expect(step).toContain("isSalon");
    expect(step).toContain("Commencer le test (piste verte)");
  });

  it("persiste via RPC SECURITY DEFINER (pas d'INSERT anon direct)", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.salon_demo_tests");
    expect(migration).toContain("submit_salon_demo_test");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.submit_salon_demo_test");
    expect(migration).toContain("rls_salon_demo_tests_select_staff");
    expect(migration).not.toContain("FOR INSERT");
    expect(contactMigration).toContain("ADD COLUMN IF NOT EXISTS email");
    expect(contactMigration).toContain("ADD COLUMN IF NOT EXISTS phone");
    expect(contactMigration).toContain("p_email text");
    expect(contactMigration).toContain("p_phone text");
  });
});
