/**
 * Allowlist des URL de retour Stripe (success / cancel).
 * Miroir : src/lib/checkout-return-urls.ts
 *
 * Pas de wildcard *.lovable.app : un preview Lovable tiers pourrait
 * phisher après paiement. Uniquement les origines exactes ci-dessous.
 */

const LOCAL_DEV_ORIGINS = new Set(["http://localhost:8080", "http://127.0.0.1:8080"]);

const EXACT_ORIGINS = new Set([
  "https://plateforme.fli.fr",
  "https://www.fli.fr",
  "https://fli.fr",
  "https://ski-linguist-hub.lovable.app",
  // Preview Lovable du projet FLI uniquement (pas de wildcard *.lovable.app).
  "https://id-preview--34e71e1a-49f7-433e-bb36-fc4d26e86f8e.lovable.app",
  ...LOCAL_DEV_ORIGINS,
]);

/**
 * True si l'URL est une origine autorisée (ou un chemin sous cette origine).
 * Hors liste → le checkout doit répondre 400.
 */
export function isAllowedStripeCheckoutReturnUrl(raw: string): boolean {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return false;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  if (parsed.username || parsed.password) return false;

  return EXACT_ORIGINS.has(parsed.origin);
}
