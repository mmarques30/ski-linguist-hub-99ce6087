/**
 * Banque de phrases du point 7.
 *
 * Les étiquettes de langue et de catégorie viennent de test_phrases_complete.json
 * et sont conservées telles quelles en base. Ce module ne fait que les présenter et
 * les filtrer : aucun renommage, aucun dédoublonnage.
 *
 * Les catégories du fichier (PRONONCIATION, GRAMMAIRE, VOCABULAIRE…) sont
 * indépendantes des quatre blocs du compte-rendu : n'importe quelle phrase peut
 * être insérée dans n'importe quel bloc.
 */

export const PHRASE_BANK_ALL = "all" as const;

/** COMMON = phrase valable pour toutes les langues du fichier. */
export const PHRASE_BANK_COMMON = "COMMON" as const;

export const FILE_LANGUAGE_LABELS: Record<string, string> = {
  COMMON: "Toutes langues",
  FR: "Français langue étrangère",
  EN: "Anglais",
  DE: "Allemand",
  ES: "Espagnol",
  IT: "Italien",
  NL: "Néerlandais",
  PT: "Portugais brésilien",
  RU: "Russe",
  ZH: "Chinois (mandarin)",
};

export const FILE_LANGUAGE_FLAGS: Record<string, string> = {
  COMMON: "🌍",
  FR: "🇫🇷",
  EN: "🇬🇧",
  DE: "🇩🇪",
  ES: "🇪🇸",
  IT: "🇮🇹",
  NL: "🇳🇱",
  PT: "🇧🇷",
  RU: "🇷🇺",
  ZH: "🇨🇳",
};

export const FILE_CATEGORY_LABELS: Record<string, string> = {
  INTRODUCTION: "Introduction",
  COMPREHENSION: "Compréhension",
  CONCLUSION: "Conclusion",
  PRONONCIATION: "Prononciation",
  GRAMMAIRE: "Grammaire",
  VOCABULAIRE: "Vocabulaire",
};

/** Codes langue de l'application (test_bookings.language) vers étiquettes du fichier. */
const APP_TO_FILE_LANGUAGE: Record<string, string> = {
  all: PHRASE_BANK_COMMON,
  anglais: "EN",
  allemand: "DE",
  espagnol: "ES",
  italien: "IT",
  neerlandais: "NL",
  portugais: "PT",
  russe: "RU",
  chinois: "ZH",
  fle: "FR",
};

/**
 * Langue du fichier correspondant à la langue d'un test.
 * Une étiquette déjà au format fichier (EN, PT…) est renvoyée inchangée.
 */
export function fileLanguageForBooking(language: string | null | undefined): string {
  if (!language) return PHRASE_BANK_COMMON;
  const direct = APP_TO_FILE_LANGUAGE[language.toLowerCase()];
  if (direct) return direct;
  const upper = language.toUpperCase();
  return FILE_LANGUAGE_LABELS[upper] ? upper : PHRASE_BANK_COMMON;
}

export function fileLanguageLabel(code: string): string {
  return FILE_LANGUAGE_LABELS[code] ?? code;
}

export function fileCategoryLabel(code: string): string {
  return FILE_CATEGORY_LABELS[code] ?? code;
}

export interface PhraseBankItem {
  id: string;
  code: string | null;
  language: string;
  category: string;
  text_fr: string;
  context?: string | null;
  error_type?: string | null;
  is_correction?: boolean | null;
  order_index: number;
}

export interface PhraseBankFilters {
  /** Étiquette du fichier, ou "all" pour ne pas filtrer. */
  language: string;
  /** Étiquette du fichier, ou "all" pour ne pas filtrer. */
  category: string;
  search?: string;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Options de langue réellement présentes dans les données, COMMON d'abord. */
export function phraseBankLanguages(phrases: PhraseBankItem[]): string[] {
  const codes = Array.from(new Set(phrases.map((p) => p.language)));
  return codes.sort((a, b) => {
    if (a === PHRASE_BANK_COMMON) return -1;
    if (b === PHRASE_BANK_COMMON) return 1;
    return fileLanguageLabel(a).localeCompare(fileLanguageLabel(b), "fr");
  });
}

/** Options de catégorie réellement présentes, dans l'ordre du fichier. */
export function phraseBankCategories(phrases: PhraseBankItem[]): string[] {
  const order = Object.keys(FILE_CATEGORY_LABELS);
  const codes = Array.from(new Set(phrases.map((p) => p.category)));
  return codes.sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, "fr");
  });
}

/**
 * Filtre langue + catégorie + recherche libre.
 * Une langue précise remonte aussi les phrases COMMON, valables partout.
 */
export function filterPhraseBank(
  phrases: PhraseBankItem[],
  filters: PhraseBankFilters,
): PhraseBankItem[] {
  const search = filters.search?.trim() ? normalize(filters.search) : null;

  return phrases
    .filter((phrase) => {
      if (
        filters.language !== PHRASE_BANK_ALL &&
        phrase.language !== filters.language &&
        phrase.language !== PHRASE_BANK_COMMON
      ) {
        return false;
      }
      if (filters.category !== PHRASE_BANK_ALL && phrase.category !== filters.category) {
        return false;
      }
      if (search) {
        const haystack = normalize(
          [phrase.text_fr, phrase.code ?? "", phrase.error_type ?? "", phrase.context ?? ""].join(" "),
        );
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.language !== b.language) {
        if (a.language === PHRASE_BANK_COMMON) return -1;
        if (b.language === PHRASE_BANK_COMMON) return 1;
        return a.language.localeCompare(b.language);
      }
      return a.order_index - b.order_index;
    });
}

/**
 * Réattribue les phrases d'un brouillon au bon bloc.
 *
 * `selected_phrase_ids` est stocké à plat : la catégorie du fichier ne dit plus dans
 * quel bloc la phrase a été insérée. On retrouve le bloc par le texte déjà composé.
 */
export function phraseIdsForBloc(
  selectedIds: string[] | null | undefined,
  phrases: Pick<PhraseBankItem, "id" | "text_fr">[],
  blocText: string | null | undefined,
): string[] {
  if (!selectedIds?.length || !blocText) return [];
  return selectedIds.filter((id) => {
    const phrase = phrases.find((p) => p.id === id);
    return Boolean(phrase?.text_fr) && blocText.includes(phrase!.text_fr);
  });
}

/**
 * Commentaire libre d'un bloc quand la colonne `comments_<bloc>` est vide.
 *
 * Le bloc enregistré est « textes des phrases + commentaire ». Sans retirer les
 * phrases retrouvées, elles seraient réécrites une seconde fois à l'enregistrement.
 */
export function blocCommentsWithoutPhrases(
  blocText: string | null | undefined,
  phraseTexts: string[],
): string {
  if (!blocText) return "";
  let rest = blocText;
  for (const text of phraseTexts) {
    if (!text) continue;
    rest = rest.replace(text, " ");
  }
  return rest.replace(/\s+/g, " ").trim();
}

/** Comptages du rapport d'import : par langue et par catégorie. */
export function phraseBankCounts(phrases: PhraseBankItem[]): {
  total: number;
  byLanguage: Record<string, number>;
  byCategory: Record<string, number>;
} {
  const byLanguage: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const phrase of phrases) {
    byLanguage[phrase.language] = (byLanguage[phrase.language] ?? 0) + 1;
    byCategory[phrase.category] = (byCategory[phrase.category] ?? 0) + 1;
  }
  return { total: phrases.length, byLanguage, byCategory };
}
