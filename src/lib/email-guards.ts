/** Garde-fous d'envoi e-mail (avant activation de RESEND_API_KEY). */

/** Domaine historique exact (certains scripts). */
export const FLI_PLACEHOLDER_EMAIL_DOMAIN = "fli.placeholder";

/** Domaines synthétiques d'import — jamais délivrables. */
const FLI_PLACEHOLDER_DOMAINS = new Set([
  "fli.placeholder",
  "fli.placeholder.local",
  "fli.import",
]);

/** Portail stagiaire hors périmètre de la saison en cours. */
export const STUDENT_PORTAL_IN_SEASON_SCOPE = false;

export const STUDENT_EMAIL_MISSING_LABEL = "Email manquant";

export function isFliPlaceholderEmail(email: string | null | undefined): boolean {
  const value = (email ?? "").trim().toLowerCase();
  const at = value.lastIndexOf("@");
  if (at <= 0 || at === value.length - 1) return false;
  const domain = value.slice(at + 1);
  if (FLI_PLACEHOLDER_DOMAINS.has(domain)) return true;
  // Sous-domaines explicites de fli.placeholder (ex. futur fli.placeholder.test)
  return domain.startsWith(`${FLI_PLACEHOLDER_EMAIL_DOMAIN}.`);
}

/** Pas d'adresse réelle : vide ou placeholder d'import. */
export function isMissingStudentEmail(email: string | null | undefined): boolean {
  const value = (email ?? "").trim();
  return value === "" || isFliPlaceholderEmail(value);
}

/** Libellé UI : jamais afficher import.csv…@fli.placeholder.local comme un mail valide. */
export function studentEmailLabel(email: string | null | undefined): string {
  if (isMissingStudentEmail(email)) return STUDENT_EMAIL_MISSING_LABEL;
  return (email ?? "").trim();
}

/** Adresse utilisable pour mailto / envoi, sinon null. */
export function studentEmailForSend(email: string | null | undefined): string | null {
  if (isMissingStudentEmail(email)) return null;
  return (email ?? "").trim();
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
