import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("PartnerDetails — dates sûres", () => {
  it("n'appelle plus format(new Date(...)) sans garde sur les tableaux", () => {
    const src = readFileSync(
      resolve(__dirname, "../pages/partners/PartnerDetails.tsx"),
      "utf8"
    );
    expect(src).toContain("function formatDate");
    // Les cellules inscriptions / facturation / contrats doivent passer par formatDate.
    expect(src).toMatch(/formatDate\(i\.start_date/);
    expect(src).toMatch(/formatDate\(inv\.invoice_date/);
    expect(src).toMatch(/formatDate\(c\.signed_date/);
    // Plus de format(new Date(...)) hors du helper (les charts utilisent déjà NaN guard).
    const unguarded = src.match(/format\(\s*new Date\(/g) || [];
    expect(unguarded).toHaveLength(0);
  });
});
