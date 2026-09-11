/** Garde-fous d'envoi e-mail (avant activation de RESEND_API_KEY). */

export const FLI_PLACEHOLDER_EMAIL_DOMAIN = "fli.placeholder";

/** Portail stagiaire hors périmètre de la saison en cours. */
export const STUDENT_PORTAL_IN_SEASON_SCOPE = false;

export function isFliPlaceholderEmail(email: string | null | undefined): boolean {
  const value = (email ?? "").trim().toLowerCase();
  const at = value.lastIndexOf("@");
  if (at <= 0 || at === value.length - 1) return false;
  return value.slice(at + 1) === FLI_PLACEHOLDER_EMAIL_DOMAIN;
}

export function massSendNeedsConfirmation(recipientCount: number): boolean {
  return recipientCount > 1;
}

export function isMassSendConfirmed(
  recipientCount: number,
  confirmedCount: number | null | undefined
): boolean {
  if (recipientCount <= 1) return true;
  return confirmedCount === recipientCount;
}
