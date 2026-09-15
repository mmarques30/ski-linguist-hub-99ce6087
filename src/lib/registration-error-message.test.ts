import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FLI_CONTACT_EMAIL,
  FLI_CONTACT_PHONE,
  isStudentFacingMessage,
  registrationCheckoutFailureNotice,
  registrationFailureNotice,
  REGISTRATION_FAILURE_TITLE,
} from "./registration-error-message";
import { hasTutoiement } from "./vouvoiement";

/**
 * BL-025 — en cas d'échec, `/register` affichait le message brut de la fonction
 * Edge, en anglais et sans consigne.
 */

const MESSAGES_TECHNIQUES = [
  'duplicate key value violates unique constraint "inscriptions_code_key"',
  'null value in column "start_date" of relation "inscriptions" violates not-null constraint',
  "Edge Function returned a non-2xx status code",
  "Failed to fetch",
  "TypeError: Load failed",
  "Internal Server Error",
  "Erreur interne",
  "permission denied for table inscriptions",
  'relation "public.inscriptions" does not exist',
  "JWT expired",
];

const MESSAGES_METIER = [
  "Le test de niveau adaptatif est obligatoire pour finaliser l'inscription",
  "Veuillez choisir un mode de paiement",
  "Un stagiaire avec cet e-mail existe déjà.",
  "Ce code d'inscription existe déjà. Réessayez.",
  "Données d'inscription incomplètes",
];

describe("message d'échec de /register", () => {
  it("ne montre jamais une erreur technique au stagiaire", () => {
    for (const brut of MESSAGES_TECHNIQUES) {
      expect(isStudentFacingMessage(brut), brut).toBe(false);
      const notice = registrationFailureNotice(new Error(brut));
      expect(notice.detail, brut).toBeNull();
      expect(notice.title).toBe(REGISTRATION_FAILURE_TITLE);
    }
  });

  it("garde les refus métier déjà rédigés en français", () => {
    for (const brut of MESSAGES_METIER) {
      expect(isStudentFacingMessage(brut), brut).toBe(true);
      expect(registrationFailureNotice(new Error(brut)).detail, brut).toMatch(
        /[.!?]$/
      );
    }
  });

  it("annonce toujours la saisie conservée et le contact FLI", () => {
    const notice = registrationFailureNotice(new Error("Failed to fetch"));
    expect(notice.instruction).toContain("conservées");
    expect(notice.instruction).toContain(FLI_CONTACT_EMAIL);
    expect(notice.instruction).toContain(FLI_CONTACT_PHONE);
    expect(hasTutoiement(`${notice.title} ${notice.instruction}`)).toBe(false);
  });

  it("distingue l'échec du paiement en ligne de l'échec d'inscription", () => {
    const notice = registrationCheckoutFailureNotice(
      new Error("Impossible de préparer le paiement en ligne")
    );
    expect(notice.title).not.toBe(REGISTRATION_FAILURE_TITLE);
    expect(notice.detail).toBe("Impossible de préparer le paiement en ligne.");
    expect(notice.instruction).toContain("ne la recommencez pas");
    expect(notice.instruction).toContain(FLI_CONTACT_PHONE);
  });

  it("accepte aussi bien une Error qu'un corps JSON ou une chaîne", () => {
    expect(registrationFailureNotice("Veuillez choisir un mode de paiement").detail).toBe(
      "Veuillez choisir un mode de paiement."
    );
    expect(
      registrationFailureNotice({ error: "Données d'inscription incomplètes" }).detail
    ).toBe("Données d'inscription incomplètes.");
    expect(registrationFailureNotice(null).detail).toBeNull();
    expect(registrationFailureNotice(undefined).detail).toBeNull();
  });

  it("n'affiche plus error.message tel quel dans l'étape 7", () => {
    const etape = readFileSync(
      join(process.cwd(), "src", "components/registration/ConfirmationStep.tsx"),
      "utf8"
    );
    expect(etape).not.toMatch(/toast\.error\(\s*\n?\s*error instanceof Error/);
    expect(etape).not.toContain("? error.message");
    expect(etape).toContain("registrationFailureNotice(error)");
  });
});
