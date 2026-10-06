import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getAvailablePaymentOptions,
  getRegistrationPaymentSummary,
  hasChequeBalance,
  isStripe4xEligible,
  isStripeTotalSettlement,
  PAYMENT_OPTION_LABELS,
  REGISTRATION_PAYMENT_OPTIONS,
  requiresStripeCheckout,
  requiresVirementInstructions,
  STRIPE_4X_MIN_EUR,
  stripe4xInstallmentEur,
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
    expect(isStripeTotalSettlement(null)).toBe(false);
  });

  it("affiche « paiement sécurisé en ligne » et non Stripe sur /register", () => {
    for (const label of Object.values(PAYMENT_OPTION_LABELS)) {
      expect(label.toLowerCase()).not.toContain("stripe");
    }
    expect(
      PAYMENT_OPTION_LABELS[REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE]
    ).toMatch(/paiement sécurisé en ligne/i);
    expect(
      PAYMENT_OPTION_LABELS[REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL]
    ).toMatch(/paiement sécurisé en ligne/i);
    expect(
      PAYMENT_OPTION_LABELS[REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X]
    ).toMatch(/paiement sécurisé en ligne en 4 fois/i);
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

    const fourTimes = getRegistrationPaymentSummary(
      900,
      REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X
    );
    expect(fourTimes.amountDueNow).toBe(900);
    expect(fourTimes.balanceAfterDossier).toBe(0);
    expect(fourTimes.amountDueNowLabel).toMatch(/4\s*×/);
  });

  it("propose le 4× seulement à partir de 500 €", () => {
    expect(STRIPE_4X_MIN_EUR).toBe(500);
    expect(isStripe4xEligible(499.99)).toBe(false);
    expect(isStripe4xEligible(500)).toBe(true);
    expect(stripe4xInstallmentEur(900)).toBe(225);

    const below = getAvailablePaymentOptions("individuel", 300);
    expect(below).not.toContain(REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X);

    const above = getAvailablePaymentOptions("individuel", 500);
    expect(above).toContain(REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X);
    expect(above.indexOf(REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X)).toBeGreaterThan(
      above.indexOf(REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL)
    );

    const school = getAvailablePaymentOptions("forfait_ecole", 900);
    expect(school).toContain(REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X);
    expect(requiresStripeCheckout(REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X)).toBe(true);
    expect(isStripeTotalSettlement(REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X)).toBe(true);
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
    // totaux Stripe (FULL + 4× via isStripeTotalSettlement) / virement + school_fifpl_cheque
    expect(matches.filter((v) => v === "null")).toHaveLength(3);
  });

  it("garde la copie Deno d'accord avec le seuil et l'option 4×", () => {
    const front = readFileSync(
      join(process.cwd(), "src/lib/registration-payments.ts"),
      "utf8"
    );
    const deno = readFileSync(
      join(process.cwd(), "supabase/functions/_shared/registration-payments.ts"),
      "utf8"
    );
    expect(front).toContain('STRIPE_4X: "stripe_4x"');
    expect(deno).toContain('STRIPE_4X: "stripe_4x"');
    expect(front).toContain("export const STRIPE_4X_MIN_EUR = 500");
    expect(deno).toContain("export const STRIPE_4X_MIN_EUR = 500");
    expect(deno).toContain('paymentMethodTypes ?? ["card", "klarna"]');
    expect(deno).toContain('"alma"');
    expect(deno).toContain("isStripeTotalSettlement");
  });

  it("masque l'acompte 150 € pour Méribel / La Rosière et ajoute le chèque école", () => {
    const schoolModes = getAvailablePaymentOptions("forfait_ecole");
    expect(schoolModes).toContain(REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL);
    expect(schoolModes).toContain(REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE);
    expect(schoolModes).not.toContain(REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE);
    expect(schoolModes).not.toContain(REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X);

    const individual = getAvailablePaymentOptions("individuel");
    expect(individual).toContain(REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE);
    expect(individual).not.toContain(REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE);

    const cheque = getRegistrationPaymentSummary(
      900,
      REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE
    );
    expect(cheque.amountDueNow).toBe(0);
    expect(cheque.balanceAfterDossier).toBe(900);
  });

  it("écrit deposit_amount à la création d'inscription", () => {
    const submit = readFileSync(
      join(process.cwd(), "supabase/functions/submit-registration/index.ts"),
      "utf8"
    );
    expect(submit).toContain("deposit_amount: paymentFields?.depositAmount ?? null");
    expect(submit).toContain("STRIPE_4X");
  });

  it("passe le montant payable à getAvailablePaymentOptions dans PaymentStep", () => {
    const etape = source("components/registration/PaymentStep.tsx");
    expect(etape).toContain("getAvailablePaymentOptions(fundingMode, payableAmount)");
  });
});
