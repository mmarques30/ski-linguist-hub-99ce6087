import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Stripe Checkout EUR", () => {
  it("force locale fr et désactive la conversion adaptive pricing", () => {
    const source = readFileSync(
      join(process.cwd(), "supabase/functions/_shared/registration-payments.ts"),
      "utf8"
    );
    expect(source).toContain('locale: "fr"');
    expect(source).toContain('"adaptive_pricing[enabled]": "false"');
    expect(source).toContain('"line_items[0][price_data][currency]": "eur"');
  });

  it("propose carte et Klarna au Checkout (intégral / acompte)", () => {
    const source = readFileSync(
      join(process.cwd(), "supabase/functions/_shared/registration-payments.ts"),
      "utf8"
    );
    expect(source).toContain('paymentMethodTypes ?? ["card", "klarna"]');
    expect(source).toContain('billing_address_collection: "required"');
    expect(source).not.toContain('"alma"');
  });

  it("réserve Klarna seul au parcours 3× dans create-registration-checkout", () => {
    const checkout = readFileSync(
      join(process.cwd(), "supabase/functions/create-registration-checkout/index.ts"),
      "utf8"
    );
    expect(checkout).toContain('? ["klarna"]');
    expect(checkout).toContain(': ["card", "klarna"]');
    expect(checkout).toContain("STRIPE_KLARNA_3X");
    expect(checkout).toContain("isStripeKlarna3xEligibleAmount");
    expect(checkout).not.toContain("alma");
    expect(checkout).not.toContain("4× Alma");
  });
});
