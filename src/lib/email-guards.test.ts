import { describe, expect, it } from "vitest";
import {
  FLI_PLACEHOLDER_EMAIL_DOMAIN,
  STUDENT_PORTAL_IN_SEASON_SCOPE,
  isFliPlaceholderEmail,
  isMassSendConfirmed,
  massSendNeedsConfirmation,
} from "./email-guards";

describe("isFliPlaceholderEmail", () => {
  it("refuse le domaine unique @fli.placeholder, casse ignorée", () => {
    expect(FLI_PLACEHOLDER_EMAIL_DOMAIN).toBe("fli.placeholder");
    expect(isFliPlaceholderEmail("stagiaire@fli.placeholder")).toBe(true);
    expect(isFliPlaceholderEmail("  STAGIAIRE@FLI.PLACEHOLDER  ")).toBe(true);
  });

  it("laisse passer les adresses métier et de test", () => {
    expect(isFliPlaceholderEmail("info@fli.fr")).toBe(false);
    expect(isFliPlaceholderEmail("zztest-camille@example.invalid")).toBe(false);
    expect(isFliPlaceholderEmail("user@not-fli.placeholder")).toBe(false);
    expect(isFliPlaceholderEmail("user@fli.placeholder.example")).toBe(false);
    expect(isFliPlaceholderEmail(null)).toBe(false);
    expect(isFliPlaceholderEmail("")).toBe(false);
    expect(isFliPlaceholderEmail("pas-un-email")).toBe(false);
  });
});

describe("envoi de masse", () => {
  it("exige une confirmation explicite avec le même compteur", () => {
    expect(massSendNeedsConfirmation(1)).toBe(false);
    expect(massSendNeedsConfirmation(200)).toBe(true);
    expect(isMassSendConfirmed(200, 200)).toBe(true);
    expect(isMassSendConfirmed(200, 199)).toBe(false);
    expect(isMassSendConfirmed(200, undefined)).toBe(false);
    expect(isMassSendConfirmed(1, undefined)).toBe(true);
  });
});

describe("portail saison", () => {
  it("reste hors périmètre tant que la constante n'est pas levée", () => {
    expect(STUDENT_PORTAL_IN_SEASON_SCOPE).toBe(false);
  });
});
