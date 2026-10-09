/**
 * Formulaires formateur début / fin de formation — alignés sur les Google Forms FLI.
 * Les colonnes certificat (niveau_* / objectif / commentaire) restent la synthèse
 * utilisée par le pack de fin ; le détail complet vit en JSONB.
 */

import {
  isBlank,
  OBJECTIF_ATTEINT_VALUES,
  type ObjectifAtteint,
  type ProgressionEntryFields,
  type ProgressionExitFields,
} from "@/lib/certificate-progression";

/** Échelle utilisée dans les Google Forms (avec demi-niveaux). */
export const FORMATEUR_CECRL_LEVELS = [
  "Débutant complet",
  "A1",
  "A1+",
  "A2",
  "A2+",
  "B1",
  "B1+",
  "B2",
  "B2+",
  "C1",
  "C2",
] as const;

export type FormateurCecrlLevel = (typeof FORMATEUR_CECRL_LEVELS)[number];

export const FORMATION_TYPE_VALUES = ["individuelle", "collective"] as const;
export type FormationTypeFormateur = (typeof FORMATION_TYPE_VALUES)[number];

export const FORMATION_TYPE_LABELS: Record<FormationTypeFormateur, string> = {
  individuelle: "Formation individuelle",
  collective: "Formation collective",
};

export interface FormateurSkillLevels {
  comprehension_ecrite: string | null;
  comprehension_orale: string | null;
  expression_ecrite: string | null;
  expression_orale: string | null;
  connaissances_grammaticales: string | null;
}

export interface FormulaireEntreeFormateur extends FormateurSkillLevels {
  version: 1;
  type_formation: FormationTypeFormateur;
  /** Individuel */
  attentes_stagiaire: string | null;
  competences_a_developper: string | null;
  themes_a_travailler: string | null;
  /** Collectif */
  niveau_general_groupe: string | null;
  remarques_groupe: string | null;
  attentes_groupe: string | null;
  competences_groupe: string | null;
  themes_groupe: string | null;
  absents: string | null;
  /** Commun */
  adequation_moyens: string | null;
  formateur_nom: string | null;
  source: "app" | "google_form";
  submitted_at: string | null;
}

export interface FormulaireSortieFormateur {
  version: 1;
  type_formation: FormationTypeFormateur;
  /** Individuel — compétences (souvent partiellement remplies sur les exports) */
  comprehension_ecrite: string | null;
  expression_orale: string | null;
  connaissances_grammaticales: string | null;
  /** Synthèse certificat */
  niveau_general: string | null;
  niveau_specifique: string | null;
  objectif_atteint: ObjectifAtteint | null;
  objectif_ecart_detail: string | null;
  commentaire_assiduite: string | null;
  commentaire_logistique: string | null;
  /** Collectif */
  niveau_general_groupe: string | null;
  remarques_heterogeneite: string | null;
  objectifs_groupe_atteints: string | null;
  objectifs_groupe_ecarts: string | null;
  commentaire_dynamique_groupe: string | null;
  formateur_nom: string | null;
  source: "app" | "google_form";
  submitted_at: string | null;
}

export function emptyFormulaireEntree(
  overrides?: Partial<FormulaireEntreeFormateur>
): FormulaireEntreeFormateur {
  return {
    version: 1,
    type_formation: "individuelle",
    comprehension_ecrite: null,
    comprehension_orale: null,
    expression_ecrite: null,
    expression_orale: null,
    connaissances_grammaticales: null,
    attentes_stagiaire: null,
    competences_a_developper: null,
    themes_a_travailler: null,
    niveau_general_groupe: null,
    remarques_groupe: null,
    attentes_groupe: null,
    competences_groupe: null,
    themes_groupe: null,
    absents: null,
    adequation_moyens: null,
    formateur_nom: null,
    source: "app",
    submitted_at: null,
    ...overrides,
  };
}

export function emptyFormulaireSortie(
  overrides?: Partial<FormulaireSortieFormateur>
): FormulaireSortieFormateur {
  return {
    version: 1,
    type_formation: "individuelle",
    comprehension_ecrite: null,
    expression_orale: null,
    connaissances_grammaticales: null,
    niveau_general: null,
    niveau_specifique: null,
    objectif_atteint: null,
    objectif_ecart_detail: null,
    commentaire_assiduite: null,
    commentaire_logistique: null,
    niveau_general_groupe: null,
    remarques_heterogeneite: null,
    objectifs_groupe_atteints: null,
    objectifs_groupe_ecarts: null,
    commentaire_dynamique_groupe: null,
    formateur_nom: null,
    source: "app",
    submitted_at: null,
    ...overrides,
  };
}

export function parseFormulaireEntree(
  value: unknown
): FormulaireEntreeFormateur | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<FormulaireEntreeFormateur>;
  if (raw.version !== 1) return null;
  return emptyFormulaireEntree(raw);
}

export function parseFormulaireSortie(
  value: unknown
): FormulaireSortieFormateur | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<FormulaireSortieFormateur>;
  if (raw.version !== 1) return null;
  return emptyFormulaireSortie(raw);
}

export function normalizeObjectifAtteint(
  value: string | null | undefined
): ObjectifAtteint | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === "oui" || v === "yes") return "oui";
  if (v === "non" || v === "no") return "non";
  if (v.startsWith("partiel")) return "partiellement";
  if (OBJECTIF_ATTEINT_VALUES.includes(v as ObjectifAtteint)) {
    return v as ObjectifAtteint;
  }
  return null;
}

/** Synthèse certificat depuis le formulaire d'entrée Google Form / app. */
export function deriveEntryCertificateFields(
  form: FormulaireEntreeFormateur
): ProgressionEntryFields {
  const general =
    form.expression_orale?.trim() ||
    form.comprehension_orale?.trim() ||
    form.niveau_general_groupe?.trim() ||
    null;
  const technique =
    form.connaissances_grammaticales?.trim() ||
    form.expression_ecrite?.trim() ||
    null;

  const remarquesParts = [
    form.attentes_stagiaire?.trim()
      ? `Attentes : ${form.attentes_stagiaire.trim()}`
      : null,
    form.competences_a_developper?.trim()
      ? `Compétences : ${form.competences_a_developper.trim()}`
      : null,
    form.themes_a_travailler?.trim()
      ? `Thèmes : ${form.themes_a_travailler.trim()}`
      : null,
    form.attentes_groupe?.trim()
      ? `Attentes groupe : ${form.attentes_groupe.trim()}`
      : null,
    form.adequation_moyens?.trim()
      ? `Moyens : ${form.adequation_moyens.trim()}`
      : null,
    form.remarques_groupe?.trim() || null,
  ].filter(Boolean);

  return {
    niveau_general_entree: general,
    niveau_technique_entree: technique,
    remarques_entree: remarquesParts.length ? remarquesParts.join("\n") : null,
  };
}

/** Synthèse certificat depuis le formulaire de sortie. */
export function deriveExitCertificateFields(
  form: FormulaireSortieFormateur
): ProgressionExitFields {
  const commentaireParts = [
    form.commentaire_assiduite?.trim() || null,
    form.commentaire_logistique?.trim()
      ? `Logistique : ${form.commentaire_logistique.trim()}`
      : null,
    form.objectif_ecart_detail?.trim()
      ? `Écarts objectifs : ${form.objectif_ecart_detail.trim()}`
      : null,
    form.commentaire_dynamique_groupe?.trim() || null,
  ].filter(Boolean);

  return {
    niveau_general_sortie:
      form.niveau_general?.trim() ||
      form.expression_orale?.trim() ||
      form.niveau_general_groupe?.trim() ||
      null,
    niveau_technique_sortie:
      form.niveau_specifique?.trim() ||
      form.connaissances_grammaticales?.trim() ||
      null,
    objectif_atteint: form.objectif_atteint,
    commentaire_sortie: commentaireParts.length
      ? commentaireParts.join("\n")
      : null,
  };
}

export function isFormulaireEntreeComplete(
  form: FormulaireEntreeFormateur
): boolean {
  if (form.type_formation === "collective") {
    return (
      !isBlank(form.niveau_general_groupe) &&
      !isBlank(form.comprehension_ecrite) &&
      !isBlank(form.comprehension_orale) &&
      !isBlank(form.expression_ecrite) &&
      !isBlank(form.expression_orale) &&
      !isBlank(form.connaissances_grammaticales)
    );
  }
  return (
    !isBlank(form.comprehension_ecrite) &&
    !isBlank(form.comprehension_orale) &&
    !isBlank(form.expression_ecrite) &&
    !isBlank(form.expression_orale) &&
    !isBlank(form.connaissances_grammaticales)
  );
}

export function isFormulaireSortieComplete(
  form: FormulaireSortieFormateur
): boolean {
  const derived = deriveExitCertificateFields(form);
  return (
    !isBlank(derived.niveau_general_sortie) &&
    !isBlank(derived.niveau_technique_sortie) &&
    OBJECTIF_ATTEINT_VALUES.includes(
      derived.objectif_atteint as ObjectifAtteint
    ) &&
    !isBlank(derived.commentaire_sortie)
  );
}

/** Données Montaine Gros-Deleglise — exports Google Forms 2026-09 / 2026-10. */
export const MONTAINE_FORMULAIRE_ENTREE: FormulaireEntreeFormateur =
  emptyFormulaireEntree({
    type_formation: "individuelle",
    comprehension_ecrite: "B1",
    comprehension_orale: "B1+",
    expression_ecrite: "B1",
    expression_orale: "B1+",
    connaissances_grammaticales: "B1",
    attentes_stagiaire: "Obtenir le niveau B2",
    adequation_moyens: "Teams, YouTube, quizz",
    formateur_nom: "Maxime Goy",
    source: "google_form",
    submitted_at: "2026-09-17T18:16:40",
  });

export const MONTAINE_FORMULAIRE_SORTIE: FormulaireSortieFormateur =
  emptyFormulaireSortie({
    type_formation: "individuelle",
    niveau_general: "B2",
    niveau_specifique: "B2",
    objectif_atteint: "oui",
    objectif_ecart_detail: "All good",
    commentaire_assiduite:
      "Très assidue, volontaire. Montaine s'est énormément investie dans ce cours.",
    commentaire_logistique: "All good",
    formateur_nom: "Maxime Goy",
    source: "google_form",
    submitted_at: "2026-10-07T19:03:22",
  });

export const MONTAINE_INSCRIPTION_ID =
  "bd253789-d03b-4402-8bbd-ef93366e1c58" as const;
