/**
 * Regroupement des inscriptions par « formation » opérationnelle.
 *
 * Une formation = même lieu, langue, modalités et dates (début / fin).
 * Pas de FK catalogue aujourd'hui : on déduit la clé des colonnes
 * dénormalisées sur `inscriptions` / `inscriptions_complete`.
 *
 * Langue : « Portugais » et « Portugais brésilien » sont la même formation
 * (libellé canonique via `displayLanguageLabel`).
 *
 * Mode « groupe » : scinde en Matin / Après-midi (créneau FLI) quand on peut
 * l'inférer ; sinon `group_name`, sinon l'horaire libre, sinon « Sans groupe ».
 * « Groupe matin » et « de 8h30 à 12h30 » fusionnent donc en « Matin ».
 */

import {
  FLI_SCHEDULE_SLOT_LABELS,
  inferSlotFromSchedule,
  type FliScheduleSlot,
} from "@/lib/fli-schedule-slots";
import { displayLanguageLabel } from "@/lib/taught-languages";

export const FORMATION_NO_LOCATION_LABEL = "Sans lieu";
export const FORMATION_NO_GROUP_LABEL = "Sans groupe";

export type FormationViewMode = "formation" | "groupe";

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
  group_name?: string | null;
  schedule?: string | null;
  schedule_status?: string | null;
}

export interface FormationGroupOf<T extends FormationInscriptionRow> {
  key: string;
  language: string;
  location: string;
  startDate: string;
  endDate: string;
  modality: string | null;
  datesToConfirm: boolean;
  /** Présent en mode groupe ; null en mode formation. */
  groupLabel: string | null;
  inscriptions: T[];
}

/** Normalise le lieu pour la clé et l'affichage. */
export function formationLocationLabel(
  courseLocation: string | null | undefined
): string {
  const trimmed = courseLocation?.trim();
  return trimmed ? trimmed : FORMATION_NO_LOCATION_LABEL;
}

/** Créneau FLI depuis un libellé de groupe (« Groupe matin », « Après-midi »…). */
export function inferSlotFromGroupName(
  groupName: string | null | undefined
): FliScheduleSlot | null {
  if (!groupName) return null;
  const normalized = groupName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
  if (/\bapres[- ]?midi\b/.test(normalized)) return "apres-midi";
  if (/\bmatin\b/.test(normalized)) return "matin";
  return null;
}

/**
 * Libellé de groupe pédagogique canonique.
 * Priorité : créneau Matin / Après-midi (status, horaire FLI, ou nom de groupe),
 * puis `group_name`, puis horaire libre, puis « Sans groupe ».
 */
export function formationGroupNameLabel(
  groupName: string | null | undefined,
  schedule?: string | null,
  scheduleStatus?: string | null
): string {
  const status = scheduleStatus?.trim().toLowerCase();
  let slot: FliScheduleSlot | null =
    status === "matin" || status === "apres-midi"
      ? (status as FliScheduleSlot)
      : null;
  if (!slot) slot = inferSlotFromSchedule(schedule);
  if (!slot) slot = inferSlotFromGroupName(groupName);
  if (slot) return FLI_SCHEDULE_SLOT_LABELS[slot];

  const name = groupName?.trim();
  if (name) return name;
  const hours = schedule?.trim();
  if (hours) return hours;
  return FORMATION_NO_GROUP_LABEL;
}

/**
 * Clé stable d'une formation : dates + langue + lieu + modalité + flag
 * « dates à planifier » (un souhait de date n'est pas encore une session
 * confirmée — on ne le mélange pas avec les dossiers calés).
 */
/** Libellé langue pour clé / carte — unifie les variantes portugais. */
export function formationLanguageLabel(
  language: string | null | undefined
): string {
  return displayLanguageLabel(language) || (language ?? "").trim();
}

export function formationGroupKey(
  row: FormationInscriptionRow,
  mode: FormationViewMode = "formation"
): string {
  const base = [
    row.start_date,
    row.end_date,
    formationLanguageLabel(row.language),
    formationLocationLabel(row.course_location),
    (row.modality ?? "").trim(),
    row.dates_to_confirm ? "1" : "0",
  ].join("::");

  if (mode !== "groupe") return base;
  return `${base}::${formationGroupNameLabel(
    row.group_name,
    row.schedule,
    row.schedule_status
  )}`;
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, "fr", { sensitivity: "base" });
}

/**
 * Regroupe les inscriptions par formation (ou par groupe pédagogique).
 * Ordre des groupes : date de début croissante, puis langue, puis lieu,
 * puis libellé de groupe. Dans un groupe : nom de stagiaire, puis id.
 */
export function groupInscriptionsByFormation<T extends FormationInscriptionRow>(
  rows: T[],
  mode: FormationViewMode = "formation"
): FormationGroupOf<T>[] {
  const groups = new Map<string, FormationGroupOf<T>>();

  for (const row of rows) {
    const key = formationGroupKey(row, mode);
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        language: formationLanguageLabel(row.language),
        location: formationLocationLabel(row.course_location),
        startDate: row.start_date,
        endDate: row.end_date,
        modality: row.modality?.trim() || null,
        datesToConfirm: Boolean(row.dates_to_confirm),
        groupLabel:
          mode === "groupe"
            ? formationGroupNameLabel(
                row.group_name,
                row.schedule,
                row.schedule_status
              )
            : null,
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
    const byMod = compareText(a.modality ?? "", b.modality ?? "");
    if (byMod !== 0) return byMod;
    return compareText(a.groupLabel ?? "", b.groupLabel ?? "");
  });

  return result;
}

/** Titre carte : « Val d'Isère · Anglais » (+ « · Groupe 1 » en mode groupe). */
export function formationGroupTitle(group: {
  location: string;
  language: string;
  groupLabel?: string | null;
}): string {
  const base = `${group.location} · ${group.language}`;
  const groupLabel = group.groupLabel?.trim();
  return groupLabel ? `${base} · ${groupLabel}` : base;
}
