import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getRegistrationPaymentSummary,
  hasChequeBalance,
  PAYMENT_OPTION_LABELS,
  REGISTRATION_PAYMENT_OPTIONS,
  requiresStripeCheckout,
  requiresVirementInstructions,
} from "./registration-payments";

/**
 * BL-024 — décision Paula : aucun moyen de paiement coché par défaut dans
 * `/register` tant que Stripe (point 6) n'est pas validé. Le stagiaire doit
 * choisir explicitement, sinon l'étape 6 refuse de continuer et l'étape 7
 * refuse de soumettre.
 */

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), "src", relatif), "utf8");
}

describe("modes de règlement /register", () => {
  it("ne présélectionne aucun mode à l'étape paiement", () => {
    const etape = source("components/registration/PaymentStep.tsx");
    expect(etape).toContain("data.paymentOption ?? null");
    expect(etape).not.toMatch(
      /paymentOption\s*\?\?\s*REGISTRATION_PAYMENT_OPTIONS/
    );
    expect(etape).not.toMatch(
      /onUpdate\(\{\s*paymentOption:\s*REGISTRATION_PAYMENT_OPTIONS/
    );
  });

  it("ne présélectionne aucun mode à l'étape confirmation", () => {
    const etape = source("components/registration/ConfirmationStep.tsx");
    expect(etape).toContain("data.paymentOption ?? null");
    expect(etape).not.toMatch(
      /paymentOption\s*\?\?\s*REGISTRATION_PAYMENT_OPTIONS/
    );
  });

  it("laisse les prédicats répondre « non » sans choix", () => {
    expect(requiresStripeCheckout(null)).toBe(false);
    expect(requiresVirementInstructions(null)).toBe(false);
    expect(hasChequeBalance(null)).toBe(false);
    expect(requiresStripeCheckout(undefined)).toBe(false);
  });

  it("affiche « carte bancaire en ligne » et non Stripe sur /register", () => {
    for (const label of Object.values(PAYMENT_OPTION_LABELS)) {
      expect(label.toLowerCase()).not.toContain("stripe");
    }
    expect(
      PAYMENT_OPTION_LABELS[REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE]
    ).toMatch(/carte bancaire en ligne/i);
    expect(
      PAYMENT_OPTION_LABELS[REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL]
    ).toMatch(/carte bancaire en ligne/i);
  });

  it("garde le détail du règlement une fois le mode choisi", () => {
    const acompte = getRegistrationPaymentSummary(
      600,
      REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE
    );
    expect(acompte.amountDueNow).toBe(150);
    expect(acompte.balanceAfterDossier).toBe(450);

    const total = getRegistrationPaymentSummary(
      600,
      REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL
    );
    expect(total.amountDueNow).toBe(600);
    expect(total.balanceAfterDossier).toBe(0);
  });

  it("renseigne depositAmount = 150 € sur les flux acompte (copie Deno)", () => {
    const deno = readFileSync(
      join(process.cwd(), "supabase/functions/_shared/registration-payments.ts"),
      "utf8"
    );
    // Les deux retours acompte (virement + stripe) doivent poser depositAmount.
    const matches = [
      ...deno.matchAll(/depositAmount:\s*([^,\n]+)/g),
    ].map((m) => m[1].trim());
    expect(matches.filter((v) => v === "FRAIS_DOSSIER_EUR")).toHaveLength(2);
    expect(matches.filter((v) => v === "null")).toHaveLength(2); // totaux Stripe / virement
  });

  it("écrit deposit_amount à la création d'inscription", () => {
    const submit = readFileSync(
      join(process.cwd(), "supabase/functions/submit-registration/index.ts"),
      "utf8"
    );
    expect(submit).toContain("deposit_amount: paymentFields?.depositAmount ?? null");
  });
});
