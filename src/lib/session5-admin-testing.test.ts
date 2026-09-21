import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("session 5 — /admin/testing et type de cours BO", () => {
  it("CleanupZztestCard et Emails8MinimalCard appellent via invokeAdminEdgeFunction", () => {
    const cleanup = source("src/components/admin/CleanupZztestCard.tsx");
    const emails = source("src/components/admin/Emails8MinimalCard.tsx");
    const helper = source("src/lib/admin-edge-invoke.ts");

    expect(helper).toContain("functions/v1/");
    expect(helper).toContain("Authorization");
    expect(cleanup).toContain("invokeAdminEdgeFunction");
    expect(cleanup).toContain("Échec de l");
    expect(emails).toContain("invokeAdminEdgeFunction");
    expect(emails).toContain("TEST_EMAIL_SLUGS");
    expect(emails).toContain("inscription_confirmation_individual");
    expect(emails).toContain("student_portal_invite");
    // Ne plus envoyer tous les modèles actifs sans slugs.
    expect(emails).not.toMatch(/fetch\(\s*`\$\{import\.meta\.env\.VITE_SUPABASE_URL\}/);
  });

  it("InscriptionFormDialog expose le type de cours Individuel / Collectif", () => {
    const form = source("src/components/inscriptions/InscriptionFormDialog.tsx");
    expect(form).toContain('name="course_type"');
    expect(form).toContain('value="Collectif"');
    expect(form).toContain('value="Individuel"');
    expect(form).toContain("course_type: data.course_type || null");
  });

  it("requireAdmin et cleanup-zztest ont un repli getUser", () => {
    const auth = source("supabase/functions/_shared/admin-auth.ts");
    const cleanup = source("supabase/functions/cleanup-zztest/index.ts");
    expect(auth).toContain("getUser");
    expect(cleanup).toContain("getUser");
  });
});
