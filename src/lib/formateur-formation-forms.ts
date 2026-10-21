/**
 * Formulaires formateur début / fin de formation — alignés sur les Google Forms FLI.
 * Les colonnes certificat (niveau_* / objectif / commentaire) restent la synthèse
 * utilisée par le pack de fin ; le détail complet vit en JSONB.
 */

import {
  CECRL_LEVELS,
  isBlank,
  OBJECTIF_ATTEINT_VALUES,
  type ObjectifAtteint,
  type ProgressionEntryFields,
  type ProgressionExitFields,
} from "@/lib/certificate-progression";
import { displayPisteLabel } from "@/lib/placement-test-engine";

/**
 * Échelle Google Forms (demi-niveaux + C1+).
 * Alias de `CECRL_LEVELS` pour les libellés formateur.
 */
export const FORMATEUR_CECRL_LEVELS = CECRL_LEVELS;
export type FormateurCecrlLevel = (typeof FORMATEUR_CECRL_LEVELS)[number];

/**
 * Option Google Form « Cette compétence n'a pas été évaluée »
 * (typo historique « compétance » tolérée à l'import).
 */
export const FORMATEUR_SKILL_UNEVALUATED = "Non évaluée";

export const FORMATEUR_SKILL_UNEVALUATED_ALIASES = [
  FORMATEUR_SKILL_UNEVALUATED,
  "Cette compétence n'a pas été évaluée",
  "Cette compétance n'a pas été évaluée",
] as const;

/** Niveaux saisis par compétence (CECRL + non évaluée). */
export const FORMATEUR_SKILL_LEVEL_OPTIONS = [
  ...FORMATEUR_CECRL_LEVELS,
  FORMATEUR_SKILL_UNEVALUATED,
] as const;

export function isUnevaluatedSkillLevel(
  value: string | null | undefined
): boolean {
  if (isBlank(value)) return false;
  const v = String(value).trim().toLowerCase();
  return FORMATEUR_SKILL_UNEVALUATED_ALIASES.some(
    (alias) => alias.toLowerCase() === v
  );
}

/** Valeur CECRL utilisable pour la synthèse certificat (ignore non évaluée). */
export function usableCecrlSkillLevel(
  value: string | null | undefined
): string | null {
  if (isBlank(value) || isUnevaluatedSkillLevel(value)) return null;
  return String(value).trim();
}

export const FORMATION_TYPE_VALUES = ["individuelle", "collective"] as const;
export type FormationTypeFormateur = (typeof FORMATION_TYPE_VALUES)[number];

export const FORMATION_TYPE_LABELS: Record<FormationTypeFormateur, string> = {
  individuelle: "Formation individuelle",
  collective: "Formation collective",
};

/** Contexte inscription prérempli (lecture seule à l'écran — pas re-saisi). */
export type FormateurFormationContext = {
  studentName?: string | null;
  inscriptionCode?: string | null;
  language?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  modality?: string | null;
  formateurName?: string | null;
  durationHours?: number | null;
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
  source: "app" | "google_form" | "legacy_flat";
  submitted_at: string | null;
}

/**
 * Sortie — aligné Google Form « Formulaire de fin de formation ».
 * Individuel : Q9–10 niveaux + Q18–21 assiduité / objectif / logistique.
 * Collectif : Q7–8 groupe + Q11 dynamique + niveaux de CE stagiaire (1 dossier app
 * remplace la grille Google à 12 stagiaires).
 */
export interface FormulaireSortieFormateur extends FormateurSkillLevels {
  version: 1;
  type_formation: FormationTypeFormateur;
  /** Q9 — Niveau général * (CECRL ou Non évaluée) */
  niveau_general: string | null;
  /** Q10 — Niveau spécifique * */
  niveau_specifique: string | null;
  /** Q15 / Q19 — objectifs pédagogiques */
  objectif_atteint: ObjectifAtteint | null;
  /** Q16 / Q20 — si non / partiel */
  objectif_ecart_detail: string | null;
  /** Q18 — assiduité individuelle * */
  commentaire_assiduite: string | null;
  /** Q17 / Q21 — moyens techniques et logistiques (* en individuel) */
  commentaire_logistique: string | null;
  /** Q7 — Niveau général du groupe * */
  niveau_general_groupe: string | null;
  /** Q8 — Remarques si hétérogénéité */
  remarques_heterogeneite: string | null;
  /** Texte libre legacy / notes objectifs groupe */
  objectifs_groupe_atteints: string | null;
  objectifs_groupe_ecarts: string | null;
  /** Q11 — assiduité, ponctualité, cohésion et dynamique de groupe * */
  commentaire_dynamique_groupe: string | null;
  /**
   * Q12 — liste numérotée des stagiaires du groupe (optionnel dans l'app :
   * un bilan par dossier ; utile pour notes de cohorte).
   */
  stagiaires_liste: string | null;
  formateur_nom: string | null;
  source: "app" | "google_form" | "legacy_flat";
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
    comprehension_orale: null,
    expression_ecrite: null,
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
    stagiaires_liste: null,
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

/**
 * Réouvre un formulaire d'entrée : JSONB v1 si présent, sinon hydrate depuis
 * les anciennes colonnes plates (pré-migration 2026-10-09) pour ne pas afficher
 * un formulaire vide alors que la synthèse certificat est encore remplie.
 */
export function resolveFormulaireEntree(
  jsonb: unknown,
  flat?: ProgressionEntryFields | null
): FormulaireEntreeFormateur {
  const parsed = parseFormulaireEntree(jsonb);
  if (parsed) return parsed;

  const hasFlat =
    !!flat &&
    (!isBlank(flat.niveau_general_entree) ||
      !isBlank(flat.niveau_technique_entree) ||
      !isBlank(flat.remarques_entree));
  if (!hasFlat || !flat) return emptyFormulaireEntree();

  return emptyFormulaireEntree({
    // Meilleur effort : les colonnes plates n'avaient qu'un niveau général /
    // technique, pas les 5 compétences CECRL.
    expression_orale: flat.niveau_general_entree,
    comprehension_orale: flat.niveau_general_entree,
    connaissances_grammaticales: flat.niveau_technique_entree,
    expression_ecrite: flat.niveau_technique_entree,
    attentes_stagiaire: flat.remarques_entree,
    source: "legacy_flat",
  });
}

/** Idem pour le formulaire de sortie (mapping 1:1 vers la synthèse certificat). */
export function resolveFormulaireSortie(
  jsonb: unknown,
  flat?: ProgressionExitFields | null
): FormulaireSortieFormateur {
  const parsed = parseFormulaireSortie(jsonb);
  if (parsed) return parsed;

  const hasFlat =
    !!flat &&
    (!isBlank(flat.niveau_general_sortie) ||
      !isBlank(flat.niveau_technique_sortie) ||
      !isBlank(flat.objectif_atteint) ||
      !isBlank(flat.commentaire_sortie));
  if (!hasFlat || !flat) {
    return emptyFormulaireSortie({ objectif_atteint: "oui" });
  }

  return emptyFormulaireSortie({
    niveau_general: flat.niveau_general_sortie,
    niveau_specifique: flat.niveau_technique_sortie,
    objectif_atteint: normalizeObjectifAtteint(flat.objectif_atteint) ?? "oui",
    commentaire_assiduite: flat.commentaire_sortie,
    source: "legacy_flat",
  });
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

function skillAnswered(value: string | null | undefined): boolean {
  return !isBlank(value);
}

/** Synthèse certificat depuis le formulaire d'entrée Google Form / app. */
export function deriveEntryCertificateFields(
  form: FormulaireEntreeFormateur
): ProgressionEntryFields {
  const general =
    usableCecrlSkillLevel(form.expression_orale) ||
    usableCecrlSkillLevel(form.comprehension_orale) ||
    usableCecrlSkillLevel(form.niveau_general_groupe) ||
    null;
  const technique =
    usableCecrlSkillLevel(form.connaissances_grammaticales) ||
    usableCecrlSkillLevel(form.expression_ecrite) ||
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
    form.competences_groupe?.trim()
      ? `Compétences groupe : ${form.competences_groupe.trim()}`
      : null,
    form.themes_groupe?.trim()
      ? `Thèmes groupe : ${form.themes_groupe.trim()}`
      : null,
    form.adequation_moyens?.trim()
      ? `Moyens : ${form.adequation_moyens.trim()}`
      : null,
    form.absents?.trim() ? `Absents : ${form.absents.trim()}` : null,
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
    form.commentaire_dynamique_groupe?.trim()
      ? `Groupe : ${form.commentaire_dynamique_groupe.trim()}`
      : null,
    form.commentaire_assiduite?.trim() || null,
    form.commentaire_logistique?.trim()
      ? `Logistique : ${form.commentaire_logistique.trim()}`
      : null,
    form.objectif_ecart_detail?.trim()
      ? `Écarts objectifs : ${form.objectif_ecart_detail.trim()}`
      : null,
    form.objectifs_groupe_atteints?.trim()
      ? `Objectifs groupe : ${form.objectifs_groupe_atteints.trim()}`
      : null,
    form.objectifs_groupe_ecarts?.trim()
      ? `Écarts groupe : ${form.objectifs_groupe_ecarts.trim()}`
      : null,
    form.stagiaires_liste?.trim()
      ? `Liste groupe : ${form.stagiaires_liste.trim()}`
      : null,
  ].filter(Boolean);

  return {
    niveau_general_sortie:
      usableCecrlSkillLevel(form.niveau_general) ||
      usableCecrlSkillLevel(form.expression_orale) ||
      usableCecrlSkillLevel(form.niveau_general_groupe) ||
      null,
    niveau_technique_sortie:
      usableCecrlSkillLevel(form.niveau_specifique) ||
      usableCecrlSkillLevel(form.connaissances_grammaticales) ||
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
  const skillsOk =
    skillAnswered(form.comprehension_ecrite) &&
    skillAnswered(form.comprehension_orale) &&
    skillAnswered(form.expression_ecrite) &&
    skillAnswered(form.expression_orale) &&
    skillAnswered(form.connaissances_grammaticales);

  if (!skillsOk) return false;

  // Au moins une compétence CECRL réelle pour la synthèse certificat.
  const derived = deriveEntryCertificateFields(form);
  if (
    isBlank(derived.niveau_general_entree) ||
    isBlank(derived.niveau_technique_entree)
  ) {
    return false;
  }

  if (form.type_formation === "collective") {
    return (
      !isBlank(form.niveau_general_groupe) &&
      !isBlank(form.remarques_groupe) &&
      !isBlank(form.attentes_groupe) &&
      !isBlank(form.competences_groupe) &&
      !isBlank(form.themes_groupe) &&
      !isBlank(form.adequation_moyens)
    );
  }

  return (
    !isBlank(form.attentes_stagiaire) &&
    !isBlank(form.competences_a_developper) &&
    !isBlank(form.themes_a_travailler) &&
    !isBlank(form.adequation_moyens)
  );
}

export function isFormulaireSortieComplete(
  form: FormulaireSortieFormateur
): boolean {
  const derived = deriveExitCertificateFields(form);
  const synthesisOk =
    !isBlank(derived.niveau_general_sortie) &&
    !isBlank(derived.niveau_technique_sortie) &&
    OBJECTIF_ATTEINT_VALUES.includes(
      derived.objectif_atteint as ObjectifAtteint
    );

  if (!synthesisOk) return false;

  if (form.objectif_atteint && form.objectif_atteint !== "oui") {
    if (
      isBlank(form.objectif_ecart_detail) &&
      isBlank(form.objectifs_groupe_ecarts)
    ) {
      return false;
    }
  }

  if (form.type_formation === "collective") {
    return (
      !isBlank(form.niveau_general_groupe) &&
      !isBlank(form.commentaire_dynamique_groupe) &&
      // Certificat : niveaux de CE stagiaire (1 dossier = 1 ligne de la grille Google)
      !isBlank(usableCecrlSkillLevel(form.niveau_general)) &&
      !isBlank(usableCecrlSkillLevel(form.niveau_specifique))
    );
  }

  // Individuel — Google Q18 assiduité * + Q21 logistique *
  return (
    !isBlank(form.commentaire_assiduite) &&
    !isBlank(form.commentaire_logistique) &&
    !isBlank(usableCecrlSkillLevel(form.niveau_general)) &&
    !isBlank(usableCecrlSkillLevel(form.niveau_specifique))
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
    competences_a_developper: "Fluidité à l'oral, précision grammaticale",
    themes_a_travailler: "Accueil clients, sécurité, vocabulaire technique",
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

const CECRL_SET = new Set<string>(CECRL_LEVELS);

/**
 * Affichage des niveaux saisis au formulaire formateur.
 * Les CECRL (y compris demi-niveaux) restent tels quels ; les anciennes
 * saisies « Piste … » passent encore par le libellé piste.
 */
export function formatFormateurLevelDisplay(
  level: string | null | undefined,
  emptyLabel = "—"
): string {
  if (isBlank(level)) return emptyLabel;
  const trimmed = String(level).trim();
  if (CECRL_SET.has(trimmed)) return trimmed;
  if (/^(A1|A2|B1|B2|C1|C2)\+?$/i.test(trimmed)) return trimmed;
  if (/^débutant/i.test(trimmed)) return trimmed;
  if (/^piste\s/i.test(trimmed)) return trimmed;
  return displayPisteLabel(trimmed, emptyLabel);
}
