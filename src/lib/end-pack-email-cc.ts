/**
 * Copies CC connues pour l'envoi manuel du pack fin.
 * Clé = inscription_id.
 */
export const END_PACK_KNOWN_CC: Record<
  string,
  Array<{ name: string; email: string }>
> = {
  // Tom Boniface — maman
  "5f3452cf-de23-4a3c-a1b7-62b5c6b6198a": [
    { name: "Anne Boniface", email: "ab732@icloud.com" },
  ],
};

export function formatEndPackCcAddress(entry: {
  name: string;
  email: string;
}): string {
  const name = entry.name.trim();
  const email = entry.email.trim();
  if (!email) return "";
  return name ? `${name} <${email}>` : email;
}

export function defaultEndPackCcForInscription(
  inscriptionId: string
): string[] {
  return (END_PACK_KNOWN_CC[inscriptionId] || [])
    .map(formatEndPackCcAddress)
    .filter(Boolean);
}

/** Parse un champ UI « a@b.fr, Nom <c@d.fr> » en liste CC. */
export function parseEndPackCcInput(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}
