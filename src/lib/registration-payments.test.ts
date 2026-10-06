import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getAvailablePaymentOptions,
  getRegistrationPaymentSummary,
  hasChequeBalance,
  isStripeKlarna3xEligible,
  isStripeTotalSettlement,
  PAYMENT_OPTION_DESCRIPTIONS,
  PAYMENT_OPTION_LABELS,
  REGISTRATION_PAYMENT_OPTIONS,
  requiresStripeCheckout,
  requiresVirementInstructions,
  resolveStripeCheckoutAmountEur,
  STRIPE_KLARNA_3X_MIN_EUR,
  stripeKlarna3xInstallmentEur,
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

  it("affiche « paiement sécurisé en ligne » / Klarna / règlement intégral et non Stripe sur /register", () => {
    for (const label of Object.values(PAYMENT_OPTION_LABELS)) {
      expect(label.toLowerCase()).not.toContain("stripe");
    }
    expect(
      PAYMENT_OPTION_LABELS[REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE]
    ).toMatch(/paiement sécurisé en ligne/i);
    expect(
      PAYMENT_OPTION_LABELS[REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL]
    ).toBe("Règlement intégral en ligne");
    expect(
      PAYMENT_OPTION_LABELS[REGISTRATION_PAYMENT_OPTIONS.STRIPE_KLARNA_3X]
    ).toBe("Payez en 3 fois avec Klarna");
    expect(
      PAYMENT_OPTION_LABELS[REGISTRATION_PAYMENT_OPTIONS.STRIPE_KLARNA_3X].toLowerCase()
    ).not.toContain("4 fois");
    expect(
      PAYMENT_OPTION_LABELS[REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE]
    ).toMatch(/envoyer à FLI/i);
    expect(
      PAYMENT_OPTION_LABELS[REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE].toLowerCase()
    ).not.toMatch(/remettre|via l'école|à votre école/);
    expect(PAYMENT_OPTION_DESCRIPTIONS[REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE])
      .not.toMatch(/remettre|à votre école de ski/i);
    expect(PAYMENT_OPTION_DESCRIPTIONS[REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE])
      .toMatch(/Montmélian/);
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

    const threeTimes = getRegistrationPaymentSummary(
      900,
      REGISTRATION_PAYMENT_OPTIONS.STRIPE_KLARNA_3X
    );
    expect(threeTimes.amountDueNow).toBe(900);
    expect(threeTimes.balanceAfterDossier).toBe(0);
    expect(threeTimes.amountDueNowLabel).toMatch(/3 échéances Klarna/i);
    expect(threeTimes.amountDueNowLabel).toMatch(/Klarna/i);
  });

  it("propose Klarna 3× dès 500 € pour un particulier, jamais pour forfait école", () => {
    expect(STRIPE_KLARNA_3X_MIN_EUR).toBe(500);
    expect(isStripeKlarna3xEligible(499.99, "individuel")).toBe(false);
    expect(isStripeKlarna3xEligible(500, "individuel")).toBe(true);
    expect(isStripeKlarna3xEligible(900, "forfait_ecole")).toBe(false);
    expect(isStripeKlarna3xEligible(900, "fifpl_stagiaire_solde_ecole")).toBe(false);
    expect(stripeKlarna3xInstallmentEur(900)).toBe(300);

    const below = getAvailablePaymentOptions("individuel", 300);
    expect(below).not.toContain(REGISTRATION_PAYMENT_OPTIONS.STRIPE_KLARNA_3X);

    const above = getAvailablePaymentOptions("individuel", 500);
    expect(above).toContain(REGISTRATION_PAYMENT_OPTIONS.STRIPE_KLARNA_3X);
    expect(
      above.indexOf(REGISTRATION_PAYMENT_OPTIONS.STRIPE_KLARNA_3X)
    ).toBeGreaterThan(above.indexOf(REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL));

    const school = getAvailablePaymentOptions("forfait_ecole", 900);
    expect(school).not.toContain(REGISTRATION_PAYMENT_OPTIONS.STRIPE_KLARNA_3X);
    expect(requiresStripeCheckout(REGISTRATION_PAYMENT_OPTIONS.STRIPE_KLARNA_3X)).toBe(
      true
    );
    expect(isStripeTotalSettlement(REGISTRATION_PAYMENT_OPTIONS.STRIPE_KLARNA_3X)).toBe(
      true
    );
  });

  it("facture la part stagiaire (balance) et non le tarif école pour Stripe intégral / Klarna", () => {
    expect(
      resolveStripeCheckoutAmountEur({
        coursePrice: 1500,
        balanceAfterDeposit: 900,
        paymentOption: REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL,
      })
    ).toBe(900);
    expect(
      resolveStripeCheckoutAmountEur({
        coursePrice: 1500,
        balanceAfterDeposit: 900,
        paymentOption: REGISTRATION_PAYMENT_OPTIONS.STRIPE_KLARNA_3X,
      })
    ).toBe(900);
    expect(
      resolveStripeCheckoutAmountEur({
        coursePrice: 1500,
        balanceAfterDeposit: null,
        paymentOption: REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL,
      })
    ).toBe(1500);
    expect(
      resolveStripeCheckoutAmountEur({
        coursePrice: 1500,
        balanceAfterDeposit: 1500,
        paymentOption: REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL,
      })
    ).toBe(1500);
  });

  it("renseigne depositAmount = 150 € sur les flux acompte (copie Deno)", () => {
    const deno = readFileSync(
      join(process.cwd(), "supabase/functions/_shared/registration-payments.ts"),
      "utf8"
    );
    const matches = [
      ...deno.matchAll(/depositAmount:\s*([^,\n]+)/g),
    ].map((m) => m[1].trim());
    expect(matches.filter((v) => v === "FRAIS_DOSSIER_EUR")).toHaveLength(2);
    expect(matches.filter((v) => v === "null")).toHaveLength(3);
  });

  it("garde la copie Deno d'accord avec Klarna 3× (pas Alma)", () => {
    const front = readFileSync(
      join(process.cwd(), "src/lib/registration-payments.ts"),
      "utf8"
    );
    const deno = readFileSync(
      join(process.cwd(), "supabase/functions/_shared/registration-payments.ts"),
      "utf8"
    );
    expect(front).toContain('STRIPE_KLARNA_3X: "stripe_klarna_3x"');
    expect(deno).toContain('STRIPE_KLARNA_3X: "stripe_klarna_3x"');
    expect(front).toContain("export const STRIPE_KLARNA_3X_MIN_EUR = 500");
    expect(deno).toContain("export const STRIPE_KLARNA_3X_MIN_EUR = 500");
    expect(deno).toContain('paymentMethodTypes ?? ["card", "klarna"]');
    expect(deno).not.toContain('"alma"');
    expect(front).toMatch(/Alma est inéligible/);
    expect(front.toLowerCase()).not.toContain("4 fois");
    expect(deno).toContain("isStripeTotalSettlement");
    expect(deno).toContain('LEGACY_STRIPE_4X = "stripe_4x"');
  });

  it("masque l'acompte 150 € pour Méribel / La Rosière et propose intégral en ligne + chèque FLI", () => {
    const schoolModes = getAvailablePaymentOptions("forfait_ecole");
    expect(schoolModes).toContain(REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL);
    expect(schoolModes).toContain(REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE);
    expect(schoolModes).toContain(REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL);
    expect(schoolModes).not.toContain(REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE);
    expect(schoolModes).not.toContain(REGISTRATION_PAYMENT_OPTIONS.STRIPE_KLARNA_3X);

    const individual = getAvailablePaymentOptions("individuel");
    expect(individual).toContain(REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE);
    expect(individual).not.toContain(REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE);

    const cheque = getRegistrationPaymentSummary(
      900,
      REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE
    );
    expect(cheque.amountDueNow).toBe(0);
    expect(cheque.balanceAfterDossier).toBe(900);
    expect(cheque.amountDueNowLabel).toMatch(/envoyer à FLI/i);
  });

  it("écrit deposit_amount à la création d'inscription", () => {
    const submit = readFileSync(
      join(process.cwd(), "supabase/functions/submit-registration/index.ts"),
      "utf8"
    );
    expect(submit).toContain("deposit_amount: paymentFields?.depositAmount ?? null");
    expect(submit).toContain("STRIPE_KLARNA_3X");
    expect(submit).toContain("Payez en 3 fois avec Klarna");
  });

  it("passe le montant payable à getAvailablePaymentOptions dans PaymentStep", () => {
    const etape = source("components/registration/PaymentStep.tsx");
    expect(etape).toContain("getAvailablePaymentOptions(fundingMode, payableAmount)");
  });
});
