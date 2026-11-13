/** Aligné sur src/lib/registration-offerings.ts — résolution tarif partenaire / anciens. */

export type EnrollmentStatus = "open" | "waitlist" | "invite_only";

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
  alumni_price?: number | null;
  funding_mode?: SessionFundingMode | null;
  enrollment_status?: EnrollmentStatus | null;
  student_payment_required?: boolean | null;
}

export type ResolveOfferingPriceOptions = {
  isAlumni?: boolean;
};

export function normalizeLocationToken(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function isAlumniLocationMatch(
  courseLocation: string | null | undefined,
  locationKey?: string | null,
  locationLabel?: string | null
): boolean {
  const course = normalizeLocationToken(courseLocation);
  if (!course) return false;
  const key = normalizeLocationToken((locationKey || "").replace(/-/g, " "));
  const label = normalizeLocationToken(locationLabel);
  if (label && (course === label || course.includes(label) || label.includes(course))) {
    return true;
  }
  if (key && (course === key || course.includes(key) || key.includes(course))) {
    return true;
  }
  if (
    (key.includes("saintjean") || label.includes("saintjean")) &&
    course.includes("saintjean") &&
    course.includes("maurienne")
  ) {
    return true;
  }
  return false;
}

export function hasAlumniPrice(
  offering: Pick<RegistrationOfferingPriceFields, "alumni_price" | "base_price">
): boolean {
  return (
    offering.alumni_price != null &&
    Number.isFinite(Number(offering.alumni_price)) &&
    Number(offering.alumni_price) > 0
  );
}

/** Tarif appliqué selon l'école (SESSIONS §3.1) et le statut ancien stagiaire. */
export function resolveOfferingPrice(
  offering: RegistrationOfferingPriceFields,
  skiSchoolCode?: string | null,
  options?: ResolveOfferingPriceOptions
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
  if (options?.isAlumni && hasAlumniPrice(offering)) {
    return Number(offering.alumni_price);
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

export function isInviteOnlyOffering(
  offering: Pick<RegistrationOfferingPriceFields, "enrollment_status">
): boolean {
  return offering.enrollment_status === "invite_only";
}

export function isOpenOffering(
  offering: Pick<RegistrationOfferingPriceFields, "enrollment_status">
): boolean {
  return (offering.enrollment_status ?? "open") === "open";
}

export function isEnrollableOffering(
  offering: Pick<RegistrationOfferingPriceFields, "enrollment_status">
): boolean {
  return isOpenOffering(offering) || isInviteOnlyOffering(offering);
}

export function requiresStudentPayment(
  offering: Pick<RegistrationOfferingPriceFields, "student_payment_required"> | null | undefined
): boolean {
  return offering?.student_payment_required !== false;
}
