/**
 * Hôte public canonique de la landing / inscription (Paula, 14/10/2026).
 * `plateforme.fli.fr` et `stages-langues.fr` servent la même app : on pointe
 * Search Console, sitemap et balises canoniques vers www.fli.fr.
 */

export const PUBLIC_SITE_ORIGIN = "https://www.fli.fr";

/** Pages indexables (pas de tokens, pas de back-office). */
export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/register",
  "/reserver-test",
  "/conditions-generales",
  "/politique-de-confidentialite",
  "/auth",
] as const;

export function publicAbsoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `${PUBLIC_SITE_ORIGIN}/`;
  return `${PUBLIC_SITE_ORIGIN}${normalized}`;
}
