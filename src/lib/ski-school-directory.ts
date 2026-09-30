/** Référentiel écoles de ski — /register (§4 SESSIONS_2026_2027). */

export const SKI_NETWORKS = [
  { value: "ESF", label: "ESF" },
  { value: "ESI", label: "ESI" },
  { value: "Evolution 2", label: "Evolution 2" },
  { value: "Prosneige", label: "Prosneige" },
  { value: "Oxygène", label: "Oxygène" },
  { value: "Indépendant.e", label: "Indépendant·e" },
  { value: "Autre", label: "Autre" },
] as const;

export type SkiNetworkValue = (typeof SKI_NETWORKS)[number]["value"];

/** Réseaux qui ont une liste fermée dans ski_school_directory. */
export const DIRECTORY_NETWORKS = [
  "ESF",
  "ESI",
  "Evolution 2",
  "Prosneige",
  "Oxygène",
] as const;

export type DirectoryNetwork = (typeof DIRECTORY_NETWORKS)[number];

export function isDirectoryNetwork(value: string | null | undefined): value is DirectoryNetwork {
  return DIRECTORY_NETWORKS.includes(value as DirectoryNetwork);
}

/** Option spéciale « Autre école » (hors liste) — crée une saisie libre. */
export const OTHER_SCHOOL_OPTION = "__autre__";

export interface SkiSchoolDirectoryRow {
  id: string;
  reseau: string;
  code: string;
  nom_affiche: string;
  station: string | null;
  departement: string | null;
}

/** Libellé affiché dans la liste : « ESF Val Cenis (73) ». */
export function formatSchoolOption(row: SkiSchoolDirectoryRow): string {
  const dept = row.departement ? ` (${row.departement})` : "";
  return `${row.nom_affiche}${dept}`;
}

/**
 * Construit le libellé `company` / skiSchool historique pour compat.
 * - école listée → nom_affiche
 * - Autre ESF / Autre → texte libre
 * - Indépendant → station ou vallée
 */
export function resolveSkiSchoolLabel(input: {
  skiNetwork?: string | null;
  skiSchoolCode?: string | null;
  skiSchoolName?: string | null;
  skiSchoolOther?: string | null;
  stationOrValley?: string | null;
}): string {
  if (input.skiNetwork === "Indépendant.e") {
    return input.stationOrValley?.trim() || "Indépendant·e";
  }
  if (input.skiSchoolOther?.trim()) {
    return input.skiSchoolOther.trim();
  }
  if (input.skiSchoolName?.trim()) {
    return input.skiSchoolName.trim();
  }
  return "";
}

/** Validation carte syndicale ESF : 5 chiffres, sauf si « pas encore ». */
export function isValidCarteSyndicale(
  value: string | null | undefined,
  pending: boolean
): boolean {
  if (pending) return true;
  return /^\d{5}$/.test((value || "").trim());
}
