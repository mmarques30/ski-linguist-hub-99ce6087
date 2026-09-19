import { describe, expect, it } from "vitest";
import { isStudentPayer } from "./inscription-payer";
import { REGISTRATION_FUNDING_MAP } from "./registration-utils";

describe("isStudentPayer", () => {
  it("reconnaît FIFPL, OPCO et Autofinancement", () => {
    expect(isStudentPayer({ funding_organization: REGISTRATION_FUNDING_MAP.fifpl })).toBe(true);
    expect(isStudentPayer({ funding_organization: REGISTRATION_FUNDING_MAP.opco })).toBe(true);
    expect(isStudentPayer({ funding_organization: REGISTRATION_FUNDING_MAP.self })).toBe(true);
    expect(isStudentPayer({ funding_organization: "FIFPL" })).toBe(true);
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
});
