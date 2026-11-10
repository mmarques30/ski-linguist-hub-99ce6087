import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("résidus sécurité Lovable (10/11/2026)", () => {
  it("checkout return URLs : pas de wildcard *.lovable.app", () => {
    const front = source("src/lib/checkout-return-urls.ts");
    const deno = source("supabase/functions/_shared/checkout-return-urls.ts");
    for (const texte of [front, deno]) {
      expect(texte).not.toContain('endsWith(".lovable.app")');
      expect(texte).toContain("ski-linguist-hub.lovable.app");
      expect(texte).toContain("plateforme.fli.fr");
    }
  });

  it("log-redact masque les e-mails dans les logs outreach", () => {
    const redact = source("supabase/functions/_shared/log-redact.ts");
    const outreach = source("supabase/functions/process-intake-outreach/index.ts");
    expect(redact).toContain("export function redactEmail");
    expect(outreach).toContain('from "../_shared/log-redact.ts"');
    expect(outreach).toContain("redactEmail(to)");
    expect(outreach).not.toMatch(/console\.error\("Resend error:",\s*to,/);
  });

  it("submit-registration ne journalise plus l'objet error brut", () => {
    const edge = source("supabase/functions/submit-registration/index.ts");
    expect(edge).toContain("Ne pas journaliser l'objet error brut");
    expect(edge).not.toMatch(
      /console\.error\("submit-registration error:",\s*\{[^}]*\berror,/
    );
  });
});
