import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Garde la règle Paula 03/10/2026 : tout envoi Resend copie info@fli.fr en BCC.
 * Le module Deno n'est pas importable depuis Vitest — on vérifie le source.
 */
describe("fli-email notify BCC", () => {
  const edge = readFileSync(
    join(process.cwd(), "supabase/functions/_shared/fli-email.ts"),
    "utf8"
  );
  const outreach = readFileSync(
    join(process.cwd(), "supabase/functions/process-intake-outreach/index.ts"),
    "utf8"
  );

  it("expose FLI_NOTIFY_BCC = info@fli.fr et l'applique dans sendFliEmail", () => {
    expect(edge).toContain('export const FLI_NOTIFY_BCC = "info@fli.fr"');
    expect(edge).toContain("body.bcc = [FLI_NOTIFY_BCC]");
    expect(edge).toContain("toNormalized !== FLI_NOTIFY_BCC.toLowerCase()");
  });

  it("applique aussi le BCC sur process-intake-outreach (hors sendFliEmail)", () => {
    expect(outreach).toContain('payload.bcc = ["info@fli.fr"]');
  });
});
