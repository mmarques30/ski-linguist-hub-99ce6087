/** BL-002 — `inscriptions.entry_level` → CECRL (jamais un libellé piste). */

export const ENTRY_LEVEL_CECRL = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type EntryLevelCecrl = (typeof ENTRY_LEVEL_CECRL)[number];

const CECRL_RE = /^(A1|A2|B1|B2|C1|C2)\+?$/i;

/** U+008E (C1) : `é` latin1 mal décodé, pas UTF-8. */
export function replaceMisdecodedEAcute(raw: string): string {
  return raw.replace(/\u008E/g, "é");
}

/** Encodage, espaces, casse, accents — pour matcher la table validée. */
export function normalizeEntryLevelSource(raw: string | null | undefined): string {
  if (raw == null) return "";
  return replaceMisdecodedEAcute(raw)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Correspondance validée (Paula, 2026-09-14).
 * Non reconnu → `null` (vide). Ne jamais écrire un libellé piste.
 */
export function mapEntryLevelToCecrl(
  raw: string | null | undefined
): EntryLevelCecrl | null {
  if (raw == null) return null;
  const n = normalizeEntryLevelSource(raw);
  if (!n) return null;

  if (CECRL_RE.test(n)) {
    return n.replace(/\+$/, "").toUpperCase() as EntryLevelCecrl;
  }
  if (n === "1 - a2" || n === "1-a2") return "A2";
  if (n === "debutant") return "A1";
  if (n === "faux debutant") return "A2";
  if (n === "intermediaire") return "B1";
  if (n === "perfeccionement" || n === "perfectionnement") return "B2";
  return null;
}

export function classifyEntryLevelSource(raw: string | null | undefined): string {
  if (raw == null || String(raw).trim() === "") return "null";
  const n = normalizeEntryLevelSource(raw);
  const mapped = mapEntryLevelToCecrl(raw);
  if (mapped) {
    if (n === "debutant") return "debutant";
    if (n === "faux debutant") return "faux_debutant";
    if (n === "intermediaire") return "intermediaire";
    if (n === "perfeccionement" || n === "perfectionnement") return "perfectionnement";
    if (n === "1 - a2" || n === "1-a2") return "1_a2";
    return `already_${mapped.toLowerCase()}`;
  }
  if (n === "n/a") return "n_a";
  if (n === "je n'ai jamais ete evalue(e)") return "jamais_evalue";
  if (n === "je ne connais pas mon niveau") return "niveau_inconnu";
  if (n === "jamais pratique") return "jamais_pratique";
  return "phrase_libre";
}
