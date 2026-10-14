/**
 * Substitution {{variable}} (Option A — consignes emails 17/09/2026).
 * Miroir de supabase/functions/_shared/fli-email.ts → applyEmailTemplate.
 * Toute modification ici doit être reportée dans _shared (et inversement).
 *
 * Sécurité (scan 14/10/2026) : toute valeur est échappée HTML avant insertion,
 * sauf les clés de contenu HTML de confiance (`*_html` ou liste explicite).
 */

/** Échappe &, <, >, " pour insertion sûre dans un corps HTML d'e-mail. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Clés dont la valeur est déjà du HTML généré côté serveur (pas de saisie utilisateur brute).
 * Les fragments internes doivent eux-mêmes échapper les noms / textes libres.
 */
const TRUSTED_HTML_KEYS = new Set(["groups_html", "funding_next_steps"]);

export function isTrustedEmailHtmlKey(key: string): boolean {
  return key.endsWith("_html") || TRUSTED_HTML_KEYS.has(key);
}

export function escapeEmailTemplateValue(key: string, value: string): string {
  if (isTrustedEmailHtmlKey(key)) return value ?? "";
  return escapeHtml(value ?? "");
}

export function applyEmailTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered
      .split(`{{${key}}}`)
      .join(escapeEmailTemplateValue(key, value ?? ""));
  }
  const leftover = rendered.match(/\{\{[a-zA-Z0-9_]+\}\}/g);
  if (leftover?.length) {
    const unique = [...new Set(leftover)];
    throw new Error(`Variables manquantes dans le modèle : ${unique.join(", ")}`);
  }
  return rendered;
}
