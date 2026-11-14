/**
 * Hôte public canonique de la landing / inscription (Paula, 14/10/2026).
 * `plateforme.fli.fr` et `stages-langues.fr` servent la même app : on pointe
 * Search Console, sitemap et balises canoniques vers www.fli.fr.
 */

export const PUBLIC_SITE_ORIGIN = "https://www.fli.fr";

export const PUBLIC_CANONICAL_HOST = "www.fli.fr";

/**
 * Hôtes qui doivent rediriger vers le canonique (même app Lovable multi-domaine).
 * Ne pas y mettre `plateforme.fli.fr` (back-office).
 */
export const PUBLIC_ALIAS_HOSTS = [
  "fli.fr",
  "stages-langues.fr",
  "www.stages-langues.fr",
] as const;

/** Pages indexables (pas de tokens, pas de back-office). */
export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/register",
  "/reserver-test",
  "/conditions-generales",
  "/politique-de-confidentialite",
  "/auth",
] as const;

export type PublicSitemapPath = (typeof PUBLIC_SITEMAP_PATHS)[number];

export function publicAbsoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `${PUBLIC_SITE_ORIGIN}/`;
  return `${PUBLIC_SITE_ORIGIN}${normalized}`;
}

/** Normalise le pathname (sans trailing slash, sauf `/`). */
export function normalizePublicPath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

export function isPublicIndexablePath(pathname: string): boolean {
  const path = normalizePublicPath(pathname);
  return (PUBLIC_SITEMAP_PATHS as readonly string[]).includes(path);
}

export function isPublicAliasHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  return (PUBLIC_ALIAS_HOSTS as readonly string[]).includes(host);
}
