/**
 * Ancien lien public déjà diffusé (Paula, 14/10/2026) :
 * https://plateforme.fli.fr/register → https://www.fli.fr/register
 *
 * Le même garde-fou est recopié dans index.html (avant le chargement de React).
 * Les retours Stripe /register/payment-success et /register/payment-cancel
 * restent sur l'hôte d'origine.
 */

export const LEGACY_PUBLIC_REGISTRATION_HOST = "plateforme.fli.fr";
export const PUBLIC_REGISTRATION_URL = "https://www.fli.fr/register";

export function normalizeRegistrationPath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

export function isLegacyPublicRegistrationHost(hostname: string): boolean {
  return hostname.toLowerCase() === LEGACY_PUBLIC_REGISTRATION_HOST;
}

/** Cible absolue, ou null si cette visite doit rester sur le formulaire local. */
export function legacyRegistrationRedirectUrl(location: {
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
}): string | null {
  if (!isLegacyPublicRegistrationHost(location.hostname)) return null;
  if (normalizeRegistrationPath(location.pathname) !== "/register") return null;
  return PUBLIC_REGISTRATION_URL + (location.search || "") + (location.hash || "");
}
