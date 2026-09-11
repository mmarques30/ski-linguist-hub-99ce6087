/** Convention des jeux de test FLI (à partir du 14/09/2026). */

export const ZZTEST_PREFIX = "ZZTEST";
export const ZZTEST_EMAIL_DOMAIN = "example.invalid";

export function isZztestName(value: string | null | undefined): boolean {
  return (value ?? "").trim().toUpperCase().startsWith(ZZTEST_PREFIX);
}

export function isZztestEmail(value: string | null | undefined): boolean {
  const email = (value ?? "").trim().toLowerCase();
  return email.endsWith(`@${ZZTEST_EMAIL_DOMAIN}`);
}

/** Un enregistrement de test porte un nom ZZTEST et un email @example.invalid. */
export function isZztestRecord(input: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): boolean {
  return (
    (isZztestName(input.firstName) || isZztestName(input.lastName)) &&
    isZztestEmail(input.email)
  );
}
