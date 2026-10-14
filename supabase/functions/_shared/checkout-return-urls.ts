/**
 * Allowlist des URL de retour Stripe (success / cancel).
 * Miroir : src/lib/checkout-return-urls.ts
 */

const LOCAL_DEV_ORIGINS = new Set(["http://localhost:8080", "http://127.0.0.1:8080"]);

const EXACT_ORIGINS = new Set([
  "https://plateforme.fli.fr",
  "https://ski-linguist-hub.lovable.app",
  ...LOCAL_DEV_ORIGINS,
]);

function isLovablePreviewHost(hostname: string): boolean {
  return hostname === "lovable.app" || hostname.endsWith(".lovable.app");
}

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

  const origin = parsed.origin;
  if (EXACT_ORIGINS.has(origin)) return true;

  if (parsed.protocol === "https:" && isLovablePreviewHost(parsed.hostname)) {
    return true;
  }

  return false;
}
