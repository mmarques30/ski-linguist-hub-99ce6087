import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  WAITLIST_MESSAGE,
  formatOfferingPriceHint,
  formatPartnerConditionalPriceHint,
  getSessionFundingMode,
  hidesDepositPaymentOptions,
  isOpenOffering,
  isPartnerPricePending,
  isPartnerSchool,
  isWaitlistOffering,
  requiresMandatoryFifplEstimate,
  resolveOfferingPrice,
} from "./registration-offerings";

/**
 * Garde la copie Deno d'accord avec le module front (résolution tarif partenaire).
 */

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

const sample = {
  base_price: 900,
  partner_price: 750,
  partner_school_codes: ["esf-668", "esf-260"],
  enrollment_status: "open" as const,
};

const chatel = {
  base_price: 900,
  partner_price: 750,
  partner_price_alt: 800,
  partner_price_pending: true,
  partner_school_codes: ["esf-260", "esf-254"],
  funding_mode: "individuel" as const,
  enrollment_status: "open" as const,
};

const valCenis = {
  base_price: 750,
  partner_price: 750,
  partner_school_codes: ["esf-668"],
  funding_mode: "individuel" as const,
  enrollment_status: "open" as const,
};

describe("resolveOfferingPrice — tarif selon école", () => {
  it("applique le tarif partenaire si le code est listé", () => {
    expect(resolveOfferingPrice(sample, "esf-668")).toBe(750);
    expect(isPartnerSchool(sample, "esf-668")).toBe(true);
  });

  it("garde le tarif autres pour école hors liste, Autre ou absente", () => {
    expect(resolveOfferingPrice(sample, "esf-101")).toBe(900);
    expect(resolveOfferingPrice(sample, "__autre__")).toBe(900);
    expect(resolveOfferingPrice(sample, null)).toBe(900);
    expect(isPartnerSchool(sample, "esf-101")).toBe(false);
  });

  it("affiche le double tarif quand partenaire ≠ autres", () => {
    expect(formatOfferingPriceHint(sample)).toContain("750");
    expect(formatOfferingPriceHint(sample)).toContain("900");
  });

  it("Val Cenis : tarif unique 750 pour toutes les écoles", () => {
    expect(resolveOfferingPrice(valCenis, "esf-668")).toBe(750);
    expect(resolveOfferingPrice(valCenis, "esf-101")).toBe(750);
    expect(formatOfferingPriceHint(valCenis)).toContain("750");
    expect(formatOfferingPriceHint(valCenis)).not.toContain("900");
  });

  it("Châtel partenaire : tarif en attente (null) + libellé 750/800", () => {
    expect(isPartnerPricePending(chatel, "esf-260")).toBe(true);
    expect(resolveOfferingPrice(chatel, "esf-260")).toBeNull();
    expect(resolveOfferingPrice(chatel, "esf-101")).toBe(900);
    expect(formatPartnerConditionalPriceHint(chatel)).toMatch(/750/);
    expect(formatPartnerConditionalPriceHint(chatel)).toMatch(/800/);
    expect(formatOfferingPriceHint(chatel)).toContain("autres");
  });

  it("reconnaît waitlist vs open", () => {
    expect(isWaitlistOffering({ enrollment_status: "waitlist" })).toBe(true);
    expect(isOpenOffering({ enrollment_status: "open" })).toBe(true);
    expect(isOpenOffering({ enrollment_status: null })).toBe(true);
    expect(WAITLIST_MESSAGE.toLowerCase()).toContain("attente de confirmation");
  });

  it("mode financement Méribel / La Rosière", () => {
    expect(getSessionFundingMode({ funding_mode: "forfait_ecole" })).toBe("forfait_ecole");
    expect(hidesDepositPaymentOptions("forfait_ecole")).toBe(true);
    expect(hidesDepositPaymentOptions("fifpl_stagiaire_solde_ecole")).toBe(true);
    expect(hidesDepositPaymentOptions("individuel")).toBe(false);
    expect(requiresMandatoryFifplEstimate("fifpl_stagiaire_solde_ecole")).toBe(true);
    expect(requiresMandatoryFifplEstimate("individuel")).toBe(false);
  });
});

describe("copie Deno registration-offerings", () => {
  it("exporte les mêmes helpers de prix que le front", () => {
    const deno = source("supabase/functions/_shared/registration-offerings.ts");
    expect(deno).toContain("export function resolveOfferingPrice");
    expect(deno).toContain("export function isWaitlistOffering");
    expect(deno).toContain("export function isOpenOffering");
    expect(deno).toContain("export function isPartnerPricePending");
    expect(deno).toContain("export function hidesDepositPaymentOptions");
    expect(deno).toContain('skiSchoolCode !== "__autre__"');
    expect(deno).toContain("codes.includes(skiSchoolCode)");
    expect(deno).toContain("partner_price_pending");
  });
});
