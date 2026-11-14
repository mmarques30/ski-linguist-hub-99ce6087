/**
 * Ancien lien public déjà diffusé (Paula, 14/10/2026) :
 * https://plateforme.fli.fr/register → https://www.fli.fr/register
 *
 * Alias multi-domaine (stages-langues.fr, apex fli.fr) → www.fli.fr (toute path).
 * Le même garde-fou est recopié dans index.html (avant le chargement de React).
 * Les retours Stripe /register/payment-success et /register/payment-cancel
 * restent sur l'hôte d'origine pour plateforme.
 */

import {
  PUBLIC_ALIAS_HOSTS,
  PUBLIC_SITE_ORIGIN,
  isPublicAliasHost,
  normalizePublicPath,
} from "@/lib/public-site";

export const LEGACY_PUBLIC_REGISTRATION_HOST = "plateforme.fli.fr";
export const PUBLIC_REGISTRATION_URL = `${PUBLIC_SITE_ORIGIN}/register`;

export { PUBLIC_ALIAS_HOSTS, isPublicAliasHost, normalizePublicPath };

export function normalizeRegistrationPath(pathname: string): string {
  return normalizePublicPath(pathname);
}

export function isLegacyPublicRegistrationHost(hostname: string): boolean {
  return hostname.toLowerCase() === LEGACY_PUBLIC_REGISTRATION_HOST;
}

/** Redirection canonique pour un hôte alias (Search Console / soft 404). */
export function aliasHostRedirectUrl(location: {
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
}): string | null {
  if (!isPublicAliasHost(location.hostname)) return null;
  const path = normalizePublicPath(location.pathname);
  const targetPath = path === "/" ? "/" : path;
  return `${PUBLIC_SITE_ORIGIN}${targetPath === "/" ? "/" : targetPath}${location.search || ""}${location.hash || ""}`;
}

/** Cible absolue /register plateforme → www, ou null. */
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

/** Toute redirection d'hôte à appliquer au boot (alias ou /register plateforme). */
export function publicHostRedirectUrl(location: {
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
}): string | null {
  return aliasHostRedirectUrl(location) ?? legacyRegistrationRedirectUrl(location);
}
