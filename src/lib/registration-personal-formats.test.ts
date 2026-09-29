import { describe, expect, it } from "vitest";
import {
  isValidFrenchPostalCode,
  isValidRegistrationEmail,
  sanitizeFrenchPostalCodeInput,
  validatePersonalInfoFormats,
} from "./registration-personal-formats";

describe("registration-personal-formats", () => {
  it("exige un e-mail avec @ et un domaine", () => {
    expect(isValidRegistrationEmail("a@b.c")).toBe(true);
    expect(isValidRegistrationEmail("prenom.nom@exemple.com")).toBe(true);
    expect(isValidRegistrationEmail("sans-arobase")).toBe(false);
    expect(isValidRegistrationEmail("a@")).toBe(false);
    expect(isValidRegistrationEmail("@b.com")).toBe(false);
  });

  it("exige un code postal français à 5 chiffres", () => {
    expect(isValidFrenchPostalCode("73000")).toBe(true);
    expect(isValidFrenchPostalCode("75001")).toBe(true);
    expect(isValidFrenchPostalCode("7300")).toBe(false);
    expect(isValidFrenchPostalCode("730000")).toBe(false);
    expect(isValidFrenchPostalCode("73A00")).toBe(false);
  });

  it("filtre la saisie du code postal", () => {
    expect(sanitizeFrenchPostalCodeInput("73a00b12")).toBe("73001");
    expect(sanitizeFrenchPostalCodeInput("73 000")).toBe("73000");
  });

  it("valide le couple e-mail / CP pour l'étape", () => {
    expect(
      validatePersonalInfoFormats({ email: "ok@exemple.com", postalCode: "73000" })
    ).toBeNull();
    expect(
      validatePersonalInfoFormats({ email: "pasbon", postalCode: "73000" })
    ).toMatch(/e-mail/i);
    expect(
      validatePersonalInfoFormats({ email: "ok@exemple.com", postalCode: "73" })
    ).toMatch(/5 chiffres/);
  });
});
