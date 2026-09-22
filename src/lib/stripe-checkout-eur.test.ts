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
});
