/**
 * Catalogue unique langues / modalités (PLANO Onda D2).
 * Remplace les listes divergentes register / inscriptions / sessions / pricing.
 */

export const LANGUAGE_CATALOG = [
  { key: "english", label: "Anglais", instructor: "anglais" },
  { key: "portuguese", label: "Portugais brésilien", instructor: "portugais brésilien" },
  { key: "russian", label: "Russe", instructor: "russe" },
  { key: "dutch", label: "Néerlandais", instructor: "néerlandais" },
  { key: "german", label: "Allemand", instructor: "allemand" },
  { key: "spanish", label: "Espagnol", instructor: "espagnol" },
  { key: "italian", label: "Italien", instructor: "italien" },
  { key: "chinese", label: "Chinois", instructor: "chinois" },
  { key: "french", label: "Français", instructor: "fle" },
] as const;

export const PORTUGUESE_LABEL = "Portugais brésilien";
export const PORTUGUESE_LABEL_LOWER = "portugais brésilien";

export type LanguageCatalogKey = (typeof LANGUAGE_CATALOG)[number]["key"];

/** Libellés UI (Title Case) pour selects inscription / session / pricing. */
export const LANGUAGE_LABELS = LANGUAGE_CATALOG.map((l) => l.label);

/** Valeurs minuscules fiches formateurs. */
export const INSTRUCTOR_LANGUAGE_VALUES = LANGUAGE_CATALOG.map((l) => l.instructor);

export const MODALITY_CATALOG = [
  { key: "presentiel", label: "Présentiel", session: "groupe", register: "in_person" },
  { key: "distanciel", label: "Distanciel", session: "individuel", register: "online" },
  { key: "hybride", label: "Hybride", session: "intensif", register: "hybrid" },
] as const;

export const MODALITY_LABELS = MODALITY_CATALOG.map((m) => m.label);

export function languageLabelFromKey(key: string | null | undefined): string {
  if (!key) return "";
  const hit = LANGUAGE_CATALOG.find((l) => l.key === key || l.instructor === key.toLowerCase());
  if (hit) return hit.label;
  return key;
}

export function languageKeyFromLabel(label: string | null | undefined): LanguageCatalogKey | null {
  if (!label) return null;
  const n = label.trim().toLowerCase();
  const hit = LANGUAGE_CATALOG.find(
    (l) =>
      l.label.toLowerCase() === n ||
      l.key === n ||
      l.instructor === n ||
      (n.includes("portugais") && l.key === "portuguese")
  );
  return hit?.key ?? null;
}

/** Options pour un Select (value = label affichage métier). */
export function languageSelectOptions(enabledKeys?: string[] | null): { value: string; label: string }[] {
  const list =
    enabledKeys && enabledKeys.length > 0
      ? LANGUAGE_CATALOG.filter((l) => enabledKeys.includes(l.key))
      : LANGUAGE_CATALOG;
  return list.map((l) => ({ value: l.label, label: l.label }));
}

export function modalitySelectOptions(): { value: string; label: string }[] {
  return MODALITY_CATALOG.map((m) => ({ value: m.label, label: m.label }));
}
