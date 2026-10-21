/**
 * Niveaux CECRL par stagiaire (début + fin) — une ligne = une inscription.
 * En collectif, le formateur renseigne tout le groupe ; l'app synchronise
 * chaque dossier (amélioration vs grille Google Forms).
 */

import { isBlank } from "@/lib/certificate-progression";
import type { FormateurInscriptionRow } from "@/lib/formateur-portal";

function hasCecrlLevel(value: string | null | undefined): boolean {
  if (isBlank(value)) return false;
  const v = String(value).trim().toLowerCase();
  if (v.startsWith("non évalu")) return false;
  if (v.includes("pas été évalu")) return false;
  return true;
}

export type FormateurStagiaireNiveauRow = {
  inscription_id: string;
  student_id: string | null;
  student_name: string;
  /** Niveau général (entrée ou sortie selon le formulaire). */
  niveau_general: string | null;
  /** Niveau technique / spécifique. */
  niveau_technique: string | null;
};

export function emptyStagiaireNiveauRow(
  inscription: Pick<
    FormateurInscriptionRow,
    "id" | "student_id" | "student_name"
  > & {
    niveau_general?: string | null;
    niveau_technique?: string | null;
  }
): FormateurStagiaireNiveauRow {
  return {
    inscription_id: inscription.id,
    student_id: inscription.student_id,
    student_name: inscription.student_name?.trim() || "Stagiaire",
    niveau_general: inscription.niveau_general ?? null,
    niveau_technique: inscription.niveau_technique ?? null,
  };
}

export function isStagiaireNiveauRowComplete(
  row: FormateurStagiaireNiveauRow
): boolean {
  return hasCecrlLevel(row.niveau_general) && hasCecrlLevel(row.niveau_technique);
}

export function areStagiairesNiveauxComplete(
  rows: FormateurStagiaireNiveauRow[] | null | undefined
): boolean {
  if (!rows || rows.length === 0) return false;
  return rows.every(isStagiaireNiveauRowComplete);
}

/**
 * Missions du même groupe / session (formateur) pour saisir les niveaux
 * de tous les stagiaires d'un coup.
 */
export function cohortInscriptionsFor(
  pivot: FormateurInscriptionRow,
  all: FormateurInscriptionRow[]
): FormateurInscriptionRow[] {
  const group = pivot.group_name?.trim();
  const siblings = all.filter((row) => {
    if (row.id === pivot.id) return true;
    if (group && row.group_name?.trim() === group) return true;
    const sameLang =
      (row.language || "").toLowerCase() === (pivot.language || "").toLowerCase();
    const sameStart = (row.start_date || "") === (pivot.start_date || "");
    const sameEnd = (row.end_date || "") === (pivot.end_date || "");
    const samePlace =
      (row.course_location || "").trim().toLowerCase() ===
      (pivot.course_location || "").trim().toLowerCase();
    return sameLang && sameStart && sameEnd && samePlace;
  });

  return [...siblings].sort((a, b) =>
    (a.student_name || "").localeCompare(b.student_name || "", "fr")
  );
}

export function buildNiveauxFromCohort(
  cohort: FormateurInscriptionRow[],
  kind: "entree" | "sortie",
  existing?: FormateurStagiaireNiveauRow[] | null
): FormateurStagiaireNiveauRow[] {
  const byId = new Map((existing || []).map((r) => [r.inscription_id, r]));
  return cohort.map((ins) => {
    const prev = byId.get(ins.id);
    if (prev) {
      return {
        ...prev,
        student_name: ins.student_name?.trim() || prev.student_name,
        student_id: ins.student_id,
      };
    }
    return emptyStagiaireNiveauRow({
      id: ins.id,
      student_id: ins.student_id,
      student_name: ins.student_name,
      niveau_general:
        kind === "entree"
          ? ins.niveau_general_entree ?? null
          : ins.niveau_general_sortie ?? null,
      niveau_technique:
        kind === "entree"
          ? (ins as { niveau_technique_entree?: string | null })
              .niveau_technique_entree ?? null
          : (ins as { niveau_technique_sortie?: string | null })
              .niveau_technique_sortie ?? null,
    });
  });
}
