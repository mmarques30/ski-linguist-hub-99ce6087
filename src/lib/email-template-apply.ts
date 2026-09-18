/**
 * Substitution {{variable}} (Option A — consignes emails 17/09/2026).
 * Miroir de supabase/functions/_shared/fli-email.ts → applyEmailTemplate.
 * Toute modification ici doit être reportée dans _shared (et inversement).
 */
export function applyEmailTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.split(`{{${key}}}`).join(value ?? "");
  }
  const leftover = rendered.match(/\{\{[a-zA-Z0-9_]+\}\}/g);
  if (leftover?.length) {
    const unique = [...new Set(leftover)];
    throw new Error(`Variables manquantes dans le modèle : ${unique.join(", ")}`);
  }
  return rendered;
}
