import { describe, expect, it } from "vitest";
import { isZztestEmail, isZztestName, isZztestRecord } from "./zztest";

describe("convention ZZTEST", () => {
  it("accepte un stagiaire de test", () => {
    expect(
      isZztestRecord({
        firstName: "ZZTEST",
        lastName: "Camille",
        email: "zztest.camille@example.invalid",
      })
    ).toBe(true);
  });

  it("refuse un email hors example.invalid même avec le préfixe", () => {
    expect(
      isZztestRecord({
        firstName: "ZZTEST",
        lastName: "Camille",
        email: "zztest.camille@fli.fr",
      })
    ).toBe(false);
  });

  it("refuse un vrai nom avec un email de test", () => {
    expect(
      isZztestRecord({
        firstName: "Camille",
        lastName: "Exemple",
        email: "camille@example.invalid",
      })
    ).toBe(false);
  });

  it("reconnaît le préfixe sans tenir compte de la casse", () => {
    expect(isZztestName("zztest-marie")).toBe(true);
    expect(isZztestEmail("x@EXAMPLE.INVALID")).toBe(true);
  });
});
