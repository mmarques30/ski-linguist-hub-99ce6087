import { describe, expect, it } from "vitest";
import { isStudentPayer } from "./inscription-payer";
import { REGISTRATION_FUNDING_MAP } from "./registration-utils";

describe("isStudentPayer", () => {
  it("reconnaît FIFPL, AGEFICE, OPCO et Autofinancement", () => {
    expect(isStudentPayer({ funding_organization: REGISTRATION_FUNDING_MAP.fifpl })).toBe(true);
    expect(isStudentPayer({ funding_organization: REGISTRATION_FUNDING_MAP.agefice })).toBe(true);
    expect(isStudentPayer({ funding_organization: REGISTRATION_FUNDING_MAP.opco })).toBe(true);
    expect(isStudentPayer({ funding_organization: REGISTRATION_FUNDING_MAP.self })).toBe(true);
    expect(isStudentPayer({ funding_organization: "FIFPL" })).toBe(true);
    expect(isStudentPayer({ funding_organization: "AGEFICE" })).toBe(true);
    expect(isStudentPayer({ funding_organization: "OPCO" })).toBe(true);
  });

  it("refuse le financement Entreprise / école", () => {
    expect(isStudentPayer({ funding_organization: REGISTRATION_FUNDING_MAP.company })).toBe(
      false
    );
    expect(isStudentPayer({ funding_organization: "École de ski Courchevel" })).toBe(false);
    expect(isStudentPayer({ funding_organization: "DSF" })).toBe(false);
  });

  it("traite un financement vide comme payeur stagiaire", () => {
    expect(isStudentPayer({ funding_organization: null })).toBe(true);
    expect(isStudentPayer({ funding_organization: "" })).toBe(true);
    expect(isStudentPayer({})).toBe(true);
  });

  it("refuse un libellé inconnu", () => {
    expect(isStudentPayer({ funding_organization: "Coupon cadeau" })).toBe(false);
  });

  it("garde agefice dans les marqueurs front et Deno", async () => {
    const { readFileSync } = await import("node:fs");
    const front = readFileSync("src/lib/inscription-payer.ts", "utf8");
    const deno = readFileSync("supabase/functions/_shared/inscription-payer.ts", "utf8");
    expect(front).toContain('"agefice"');
    expect(deno).toContain('"agefice"');
    expect(front).toMatch(/STUDENT_PAYER_MARKERS = \[[^\]]*agefice/);
    expect(deno).toMatch(/STUDENT_PAYER_MARKERS = \[[^\]]*agefice/);
  });
});
