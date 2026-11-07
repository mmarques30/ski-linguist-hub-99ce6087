import { describe, expect, it } from "vitest";
import { homePathForRole } from "./auth-home";
import { describeAuthError } from "./auth-copy";

describe("homePathForRole", () => {
  it("envoie un formateur sur son espace", () => {
    expect(homePathForRole("formateur")).toBe("/formateur/tableau-de-bord");
  });
  it("envoie un stagiaire sur son espace", () => {
    expect(homePathForRole("student")).toBe("/student/dashboard");
  });
  it("envoie admin / rôle inconnu sur /app", () => {
    expect(homePathForRole("admin")).toBe("/app");
    expect(homePathForRole(null)).toBe("/app");
  });
});

describe("describeAuthError mot de passe", () => {
  it("même mot de passe", () => {
    expect(describeAuthError("New password should be different from the old password.")).toMatch(/différent/);
  });
  it("session expirée", () => {
    expect(describeAuthError("Auth session missing!")).toMatch(/Session expirée/);
  });
  it("mot de passe faible", () => {
    expect(describeAuthError("Password is known to be weak and easy to guess")).toMatch(/trop faible/);
  });
});
