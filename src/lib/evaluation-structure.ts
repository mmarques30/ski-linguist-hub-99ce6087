/** Motifs de structure du compte-rendu (C.4). */

import { BLOC_CATEGORIES, CATEGORY_LABELS, scoreToLevel } from "./evaluation-utils";
import { isScoreAdjustmentAllowed } from "./evaluation-scores";
import { collectTutoiement } from "./vouvoiement";

export type StructureMotif = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type EvaluationStructureInput = {
  bloc_introduction: string | null | undefined;
  bloc_comprehension: string | null | undefined;
  bloc_technique: string | null | undefined;
  bloc_conclusion: string | null | undefined;
  score_comprehension: number;
  score_expression: number;
  score_structure: number;
  score_technique: number;
  score_conversation: number;
  score_general: number;
  score_general_calcule: number;
  note_methodologique: string | null | undefined;
  cecrl_label: string | null | undefined;
  scoring_system?: string | null;
};

function blocText(
  evaluation: EvaluationStructureInput,
  category: (typeof BLOC_CATEGORIES)[number]
): string {
  const key = `bloc_${category}` as const;
  return (evaluation[key] ?? "").trim();
}

export function listStructureMotifs(
  evaluation: EvaluationStructureInput
): StructureMotif[] {
  const emptyBlocs = BLOC_CATEGORIES.filter((cat) => !blocText(evaluation, cat));
  const tutoiement = collectTutoiement(
    BLOC_CATEGORIES.map((cat) => ({
      label: CATEGORY_LABELS[cat],
      text: blocText(evaluation, cat),
    }))
  );
  const scores = [
    evaluation.score_comprehension,
    evaluation.score_expression,
    evaluation.score_structure,
    evaluation.score_technique,
    evaluation.score_conversation,
  ];
  const scoresOk = scores.every(
    (s) => s >= 0 && s <= 5 && Math.round(s * 2) === s * 2
  );
  const adjustOk = isScoreAdjustmentAllowed(
    evaluation.score_general,
    evaluation.score_general_calcule
  );
  const expectedLabel = scoreToLevel(
    evaluation.score_general,
    evaluation.scoring_system === "sur_20" ? "sur_20" : "sur_5"
  );
  const labelOk =
    !evaluation.cecrl_label || evaluation.cecrl_label === expectedLabel;

  return [
    {
      id: "blocs",
      label: "Quatre blocs renseignés",
      ok: emptyBlocs.length === 0,
      detail:
        emptyBlocs.length === 0
          ? "Introduction, compréhension, technique, conclusion."
          : `Manquant : ${emptyBlocs.map((c) => CATEGORY_LABELS[c]).join(", ")}.`,
    },
    {
      id: "vouvoiement",
      label: "Vouvoiement",
      ok: tutoiement.length === 0,
      detail:
        tutoiement.length === 0
          ? "Aucun tutoiement détecté."
          : tutoiement.map((h) => `${h.label} (${h.matches.join(", ")})`).join(" · "),
    },
    {
      id: "notes",
      label: "Cinq notes sur 5 (demi-points)",
      ok: scoresOk,
      detail: scoresOk
        ? scores.join(" / ")
        : "Au moins une note hors 0–5 ou hors demi-point.",
    },
    {
      id: "ecart",
      label: "Appréciation générale cohérente",
      ok: adjustOk,
      detail: adjustOk
        ? "Écart d'au plus un point avec les cinq compétences."
        : "note générale incohérente avec les cinq compétences",
    },
    {
      id: "cecrl",
      label: "Libellé CECRL cohérent",
      ok: labelOk,
      detail: `Attendu ${expectedLabel}${
        evaluation.cecrl_label ? ` · saisi ${evaluation.cecrl_label}` : ""
      }.`,
    },
  ];
}

export function structureAllowsValidation(motifs: StructureMotif[]): boolean {
  return motifs.every((m) => m.ok);
}

export const ABSOLUTE_RULES = [
  "Vouvoiement obligatoire — le tutoiement bloque la validation.",
  "Quatre blocs : introduction, compréhension, technique, conclusion.",
  "Écart maximal de 1 point entre l'appréciation générale et la moyenne des cinq compétences. Au-delà : « note générale incohérente avec les cinq compétences ». Entre 0,5 et 1 : note méthodologique proposée, non imposée. Écart nul ou 0,5 : rien.",
  "Relecture orthographique : propositions acceptées une à une — jamais de réécriture automatique du texte.",
  "Valider → statut valide. Refuser → brouillon, avec commentaire au formateur.",
] as const;
