import { describe, expect, it } from "vitest";
import { describeAuthError } from "./auth-copy";

describe("describeAuthError", () => {
  it("traduit les erreurs Supabase courantes", () => {
    expect(describeAuthError("Invalid login credentials")).toMatch(/mot de passe/i);
    expect(describeAuthError("Email not confirmed")).toMatch(/confirmée/i);
    expect(describeAuthError("Too many requests")).toMatch(/Tentatives|minutes/i);
  });

  it("masque un message technique anglais inconnu", () => {
    expect(describeAuthError("JWT expired somehow")).toMatch(/FLI|Réessayez/);
  });

  it("conserve un message déjà en français", () => {
    expect(describeAuthError("Adresse introuvable")).toBe("Adresse introuvable");
  });

  it("explique les échecs de changement de mot de passe", () => {
    expect(describeAuthError("New password should be different from the old password.")).toMatch(
      /différent/i,
    );
    expect(describeAuthError("Session expirée. Reconnecte-toi puis réessaie.")).toMatch(
      /Session expirée/i,
    );
  });
});
