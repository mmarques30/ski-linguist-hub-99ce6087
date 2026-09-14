import { describe, expect, it } from "vitest";
import { describeCaughtError, messageFromFunctionsInvoke } from "./supabase-error";

describe("describeCaughtError", () => {
  it("lit message et code d'une erreur PostgREST (pas une Error)", () => {
    const described = describeCaughtError({
      code: "23505",
      message: "duplicate key value violates unique constraint \"inscriptions_code_key\"",
      details: "Key (code)=(FLI-262627) already exists.",
    });
    expect(described.code).toBe("23505");
    expect(described.message).toBe("Ce code d'inscription existe déjà. Réessayez.");
  });

  it("ne masque plus une erreur objet en Erreur interne", () => {
    expect(
      describeCaughtError({ message: "column season_id does not exist", code: "42703" }).message
    ).toBe("column season_id does not exist");
  });

  it("garde Error.message", () => {
    expect(describeCaughtError(new Error("Données d'inscription incomplètes")).message).toBe(
      "Données d'inscription incomplètes"
    );
  });

  it("lit le champ error d'une Edge Function plutôt que le message invoke générique", () => {
    expect(
      describeCaughtError({
        success: false,
        error: "Ce code d'inscription existe déjà. Réessayez.",
        code: "23505",
      }).message
    ).toBe("Ce code d'inscription existe déjà. Réessayez.");
  });
});

describe("messageFromFunctionsInvoke", () => {
  it("préfère le JSON de la fonction au message non-2xx", () => {
    expect(
      messageFromFunctionsInvoke(
        { message: "Edge Function returned a non-2xx status code" },
        { success: false, error: "Données d'inscription incomplètes" }
      )
    ).toBe("Données d'inscription incomplètes");
  });
});
