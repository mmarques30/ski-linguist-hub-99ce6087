/**
 * Libellés de langues enseignées / filtrées dans l'app.
 * Règle produit : jamais « Portugais » seul — toujours « Portugais brésilien ».
 * Catalogue unique : `language-catalog.ts` (Onda D2).
 */

import {
  INSTRUCTOR_LANGUAGE_VALUES,
  PORTUGUESE_LABEL as CAT_PT,
  PORTUGUESE_LABEL_LOWER as CAT_PT_LOWER,
} from "./language-catalog";

export const PORTUGUESE_LABEL = CAT_PT;
export const PORTUGUESE_LABEL_LOWER = CAT_PT_LOWER;

/** Langues proposées sur les fiches formateurs (stockage en minuscules, comme en base). */
export const INSTRUCTOR_LANGUAGES = INSTRUCTOR_LANGUAGE_VALUES;

export function isPortugueseLanguage(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return (
    normalized.includes("portugais") ||
    normalized.includes("portuguese") ||
    normalized === "pt" ||
    normalized === "pt-br" ||
    normalized === "pt_br"
  );
}

/** Affichage UI : remplace tout libellé portugais ambigu. */
export function displayLanguageLabel(value: string | null | undefined): string {
  if (!value) return "";
  if (isPortugueseLanguage(value)) return PORTUGUESE_LABEL;
  return value;
}

/** Canonicalise une langue enseignée pour les formateurs (minuscules). */
export function normalizeInstructorLanguage(value: string): string {
  if (isPortugueseLanguage(value)) return PORTUGUESE_LABEL_LOWER;
  return value.trim().toLowerCase();
}

export function languagesInclude(
  languages: string[] | null | undefined,
  needle: string,
): boolean {
  if (!languages?.length) return false;
  const n = needle.toLowerCase();
  return languages.some((lang) => {
    const l = lang.toLowerCase();
    if (l === n || l.includes(n) || n.includes(l)) return true;
    if (isPortugueseLanguage(needle) && isPortugueseLanguage(lang)) return true;
    return false;
  });
}
