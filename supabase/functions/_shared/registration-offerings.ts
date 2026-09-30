/** Aligné sur src/lib/registration-offerings.ts — résolution tarif partenaire. */

export type EnrollmentStatus = "open" | "waitlist";

export interface RegistrationOfferingPriceFields {
  base_price: number;
  partner_price?: number | null;
  partner_school_codes?: string[] | null;
  enrollment_status?: EnrollmentStatus | null;
}

/** Tarif appliqué selon l'école (SESSIONS §3.1). */
export function resolveOfferingPrice(
  offering: RegistrationOfferingPriceFields,
  skiSchoolCode?: string | null
): number {
  const partner = offering.partner_price;
  const codes = offering.partner_school_codes ?? [];
  if (
    partner != null &&
    skiSchoolCode &&
    skiSchoolCode !== "__autre__" &&
    codes.includes(skiSchoolCode)
  ) {
    return Number(partner);
  }
  return Number(offering.base_price);
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
