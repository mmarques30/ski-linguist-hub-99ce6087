import { describe, expect, it } from "vitest";
import {
  ZZTEST_FORMATEUR_LOGIN,
  ZZTEST_STAGIAIRE_LOGIN,
} from "./zztest-roles-logins";

describe("logins ZZTEST rôles", () => {
  it("utilise des emails @example.invalid", () => {
    expect(ZZTEST_FORMATEUR_LOGIN.email).toMatch(/@example\.invalid$/);
    expect(ZZTEST_STAGIAIRE_LOGIN.email).toMatch(/@example\.invalid$/);
  });

  it("pointe vers les bons espaces", () => {
    expect(ZZTEST_FORMATEUR_LOGIN.homePath).toBe("/formateur/evaluations");
    expect(ZZTEST_STAGIAIRE_LOGIN.homePath).toBe("/student/dashboard");
  });
});
