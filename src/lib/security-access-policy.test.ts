import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Politique FLI (scan 14/10/2026, item 6) — documentée par assertions source.
 * Formateurs = accès global (ne pas restreindre davantage).
 * Anon / student : pas d'accès staff ; student = propres données seulement.
 */
function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("politique d'accès recherches / PDF (item 6)", () => {
  it("GlobalSearch n'est monté que dans le shell staff (MainLayout / TopHeader)", () => {
    const header = source("src/components/layout/TopHeader.tsx");
    const main = source("src/components/layout/MainLayout.tsx");
    const formateur = source("src/components/layout/FormateurLayout.tsx");
    expect(header).toContain("GlobalSearch");
    expect(main).toContain("TopHeader");
    expect(formateur).not.toContain("GlobalSearch");
  });

  it("sign-private-download refuse anon et borne le student à son préfixe", () => {
    const edge = source("supabase/functions/sign-private-download/index.ts");
    expect(edge).toContain("getUser");
    expect(edge).toContain("student");
    expect(edge).toContain("formateur");
    // Formateurs : accès global aux PDF d'évaluation (politique FLI).
    expect(edge).toContain("evaluation-pdfs");
  });

  it("generate-evaluation-pdf exige is_staff (pas anon / student / formateur)", () => {
    const edge = source("supabase/functions/generate-evaluation-pdf/index.ts");
    expect(edge).toMatch(/rpc\(\s*"is_staff"\s*\)/);
    expect(edge).toContain('json(403, { error: "Réservé au staff" })');
  });
});
