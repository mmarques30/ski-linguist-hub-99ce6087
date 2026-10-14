import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isAllowedStripeCheckoutReturnUrl } from "./checkout-return-urls";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("isAllowedStripeCheckoutReturnUrl", () => {
  it("accepte les origines FLI / Lovable / localhost:8080", () => {
    expect(
      isAllowedStripeCheckoutReturnUrl(
        "https://plateforme.fli.fr/register?paid=1&session_id={CHECKOUT_SESSION_ID}"
      )
    ).toBe(true);
    expect(
      isAllowedStripeCheckoutReturnUrl(
        "https://ski-linguist-hub.lovable.app/register?cancel=1"
      )
    ).toBe(true);
    expect(
      isAllowedStripeCheckoutReturnUrl(
        "https://id-preview--abc.lovable.app/register"
      )
    ).toBe(true);
    expect(
      isAllowedStripeCheckoutReturnUrl("http://localhost:8080/register?paid=1")
    ).toBe(true);
  });

  it("refuse les origines hors allowlist", () => {
    expect(
      isAllowedStripeCheckoutReturnUrl("https://evil.example/phish")
    ).toBe(false);
    expect(isAllowedStripeCheckoutReturnUrl("javascript:alert(1)")).toBe(false);
    expect(isAllowedStripeCheckoutReturnUrl("http://localhost:3000/")).toBe(
      false
    );
    expect(isAllowedStripeCheckoutReturnUrl("")).toBe(false);
  });

  it("garde la copie Deno d'accord avec le module front", () => {
    const front = source("src/lib/checkout-return-urls.ts");
    const deno = source("supabase/functions/_shared/checkout-return-urls.ts");
    const extraire = (texte: string, nom: string) => {
      const debut = texte.indexOf(`export function ${nom}`);
      expect(debut).toBeGreaterThan(-1);
      const fin = texte.indexOf("\nexport ", debut + 1);
      return texte.slice(debut, fin === -1 ? undefined : fin);
    };
    expect(extraire(deno, "isAllowedStripeCheckoutReturnUrl")).toBe(
      extraire(front, "isAllowedStripeCheckoutReturnUrl")
    );
  });
});
