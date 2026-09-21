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

  it("EndPackDialog affiche le solde via resolveEndPackDeposit, pas le prix brut", () => {
    const dialog = source("src/components/endpack/EndPackDialog.tsx");
    expect(dialog).toContain("resolveEndPackDeposit");
    expect(dialog).toContain("invoiceRemaining");
    expect(dialog).not.toMatch(/Montant restant \(\{inscription\.price/);
  });

  it("cleanup-zztest appelle l'RPC avec le JWT utilisateur et décrit l'erreur", () => {
    const cleanup = source("supabase/functions/cleanup-zztest/index.ts");
    expect(cleanup).toContain("callerClient.rpc(\"cleanup_zztest_data\"");
    expect(cleanup).toContain("describeCleanupError");
    expect(cleanup).not.toMatch(/admin\.rpc\("cleanup_zztest_data"/);
    expect(cleanup).not.toMatch(/error instanceof Error \? error\.message : "Erreur"/);
  });

  it("Autre profession pointe vers info@fli.fr", () => {
    const step = source("src/components/registration/ProfessionalProfileStep.tsx");
    expect(step).toContain("info@fli.fr");
    expect(step).not.toContain("fli-langues.fr");
  });
});
