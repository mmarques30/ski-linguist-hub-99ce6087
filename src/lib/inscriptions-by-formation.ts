/**
 * Regroupement des inscriptions par « formation » opérationnelle.
 *
 * Une formation = même lieu, langue, modalités et dates (début / fin).
 * Pas de FK catalogue aujourd'hui : on déduit la clé des colonnes
 * dénormalisées sur `inscriptions` / `inscriptions_complete`.
 */

export const FORMATION_NO_LOCATION_LABEL = "Sans lieu";

export interface FormationInscriptionRow {
  id: string;
  language: string;
  start_date: string;
  end_date: string;
  course_location?: string | null;
  modality?: string | null;
  dates_to_confirm?: boolean | null;
  student_name?: string | null;
  status?: string | null;
}

export interface FormationGroupOf<T extends FormationInscriptionRow> {
  key: string;
  language: string;
  location: string;
  startDate: string;
  endDate: string;
  modality: string | null;
  datesToConfirm: boolean;
  inscriptions: T[];
}

/** Normalise le lieu pour la clé et l'affichage. */
export function formationLocationLabel(
  courseLocation: string | null | undefined
): string {
  const trimmed = courseLocation?.trim();
  return trimmed ? trimmed : FORMATION_NO_LOCATION_LABEL;
}

/**
 * Clé stable d'une formation : dates + langue + lieu + modalité + flag
 * « dates à planifier » (un souhait de date n'est pas encore une session
 * confirmée — on ne le mélange pas avec les dossiers calés).
 */
export function formationGroupKey(row: FormationInscriptionRow): string {
  return [
    row.start_date,
    row.end_date,
    row.language,
    formationLocationLabel(row.course_location),
    (row.modality ?? "").trim(),
    row.dates_to_confirm ? "1" : "0",
  ].join("::");
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, "fr", { sensitivity: "base" });
}

/**
 * Regroupe les inscriptions par formation.
 * Ordre des groupes : date de début croissante, puis langue, puis lieu.
 * Dans un groupe : nom de stagiaire, puis id.
 */
export function groupInscriptionsByFormation<T extends FormationInscriptionRow>(
  rows: T[]
): FormationGroupOf<T>[] {
  const groups = new Map<string, FormationGroupOf<T>>();

  for (const row of rows) {
    const key = formationGroupKey(row);
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        language: row.language,
        location: formationLocationLabel(row.course_location),
        startDate: row.start_date,
        endDate: row.end_date,
        modality: row.modality?.trim() || null,
        datesToConfirm: Boolean(row.dates_to_confirm),
        inscriptions: [],
      };
      groups.set(key, group);
    }
    group.inscriptions.push(row);
  }

  const result = Array.from(groups.values());

  for (const group of result) {
    group.inscriptions.sort((a, b) => {
      const byName = compareText(a.student_name ?? "", b.student_name ?? "");
      if (byName !== 0) return byName;
      return a.id.localeCompare(b.id);
    });
  }

  result.sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
    const byLang = compareText(a.language, b.language);
    if (byLang !== 0) return byLang;
    const byLoc = compareText(a.location, b.location);
    if (byLoc !== 0) return byLoc;
    return compareText(a.modality ?? "", b.modality ?? "");
  });

  return result;
}

/** Titre carte : « Val d'Isère · Anglais » (lieu d'abord, signal métier). */
export function formationGroupTitle(group: {
  location: string;
  language: string;
}): string {
  return `${group.location} · ${group.language}`;
}
