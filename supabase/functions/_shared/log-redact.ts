/**
 * Helpers de journalisation sans PII (e-mails, téléphones).
 * Deno-only — pas de miroir src/lib requis.
 */

/** a***@domain.tld — conserve le domaine pour le debug ops. */
export function redactEmail(email: string | null | undefined): string {
  const value = (email ?? "").trim().toLowerCase();
  if (!value) return "[empty]";
  const at = value.lastIndexOf("@");
  if (at <= 0) return "[redacted]";
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const head = local.slice(0, 1) || "*";
  return `${head}***@${domain || "?"}`;
}
