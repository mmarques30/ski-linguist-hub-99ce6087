/** Formats figés — étape « Informations personnelles » du /register. */

const EMAIL_WITH_AT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FRENCH_POSTAL_CODE = /^\d{5}$/;

export function isValidRegistrationEmail(value: string): boolean {
  return EMAIL_WITH_AT.test(value.trim());
}

export function isValidFrenchPostalCode(value: string): boolean {
  return FRENCH_POSTAL_CODE.test(value.trim());
}

/** Ne garde que les chiffres, tronque à 5 (saisie code postal). */
export function sanitizeFrenchPostalCodeInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 5);
}

export function validatePersonalInfoFormats(input: {
  email?: string;
  postalCode?: string;
}): string | null {
  if (!isValidRegistrationEmail(input.email ?? "")) {
    return "Indiquez une adresse e-mail valide (avec un @).";
  }
  if (!isValidFrenchPostalCode(input.postalCode ?? "")) {
    return "Le code postal doit comporter exactement 5 chiffres.";
  }
  return null;
}
