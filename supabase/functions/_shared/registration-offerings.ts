/** Aligné sur src/lib/registration-offerings.ts — résolution tarif partenaire. */

export type EnrollmentStatus = "open" | "waitlist";

export type SessionFundingMode =
  | "individuel"
  | "forfait_ecole"
  | "fifpl_stagiaire_solde_ecole";

export interface RegistrationOfferingPriceFields {
  base_price: number;
  partner_price?: number | null;
  partner_price_alt?: number | null;
  partner_price_pending?: boolean | null;
  partner_school_codes?: string[] | null;
  funding_mode?: SessionFundingMode | null;
  enrollment_status?: EnrollmentStatus | null;
}

/** Tarif appliqué selon l'école (SESSIONS §3.1). */
export function resolveOfferingPrice(
  offering: RegistrationOfferingPriceFields,
  skiSchoolCode?: string | null
): number | null {
  const codes = offering.partner_school_codes ?? [];
  const isPartner =
    Boolean(skiSchoolCode) &&
    skiSchoolCode !== "__autre__" &&
    codes.includes(skiSchoolCode as string);

  if (isPartner && offering.partner_price_pending) {
    return null;
  }

  const partner = offering.partner_price;
  if (isPartner && partner != null) {
    return Number(partner);
  }
  return Number(offering.base_price);
}

export function isPartnerSchool(
  offering: Pick<RegistrationOfferingPriceFields, "partner_school_codes">,
  skiSchoolCode?: string | null
): boolean {
  const codes = offering.partner_school_codes ?? [];
  return Boolean(
    skiSchoolCode && skiSchoolCode !== "__autre__" && codes.includes(skiSchoolCode)
  );
}

export function isPartnerPricePending(
  offering: Pick<
    RegistrationOfferingPriceFields,
    "partner_price_pending" | "partner_school_codes"
  >,
  skiSchoolCode?: string | null
): boolean {
  return Boolean(offering.partner_price_pending) && isPartnerSchool(offering, skiSchoolCode);
}

export function getSessionFundingMode(
  offering: Pick<RegistrationOfferingPriceFields, "funding_mode"> | null | undefined
): SessionFundingMode {
  const mode = offering?.funding_mode;
  if (mode === "forfait_ecole" || mode === "fifpl_stagiaire_solde_ecole") return mode;
  return "individuel";
}

export function hidesDepositPaymentOptions(fundingMode: SessionFundingMode): boolean {
  return fundingMode === "forfait_ecole" || fundingMode === "fifpl_stagiaire_solde_ecole";
}

export function requiresMandatoryFifplEstimate(fundingMode: SessionFundingMode): boolean {
  return fundingMode === "fifpl_stagiaire_solde_ecole";
}

export function isWaitlistOffering(
  offering: Pick<RegistrationOfferingPriceFields, "enrollment_status">
): boolean {
  return offering.enrollment_status === "waitlist";
}

export function isOpenOffering(
  offering: Pick<RegistrationOfferingPriceFields, "enrollment_status">
): boolean {
  return (offering.enrollment_status ?? "open") === "open";
}
