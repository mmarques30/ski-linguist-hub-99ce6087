/**
 * Auto-diagnostic pré-test — feuille « Auto-diagnostic » de
 * FLI_Tests_Positionnement_2026.xlsx. Rempli avant le QCM adaptatif pistes.
 */

import autoDiagnosticRaw from "@/data/placement-questions/auto-diagnostic.json";
import { languageLabelFromKey } from "@/lib/language-catalog";

export type AutoDiagnosticResponseType =
  | "Oui/Non"
  | "Texte libre"
  | "Choix unique"
  | "Choix multiple"
  | "Choix multiple (max 3)";

export interface AutoDiagnosticQuestion {
  order_index: number;
  section: string;
  response_type: AutoDiagnosticResponseType;
  question: string;
  options: string[] | null;
  required: boolean;
  condition: string | null;
  notes: string | null;
  /** Max selections for multi-choice (undefined = unlimited). */
  maxSelections?: number;
}

/** Réponses indexées par order_index (string). Multi = liste. */
export type AutoDiagnosticAnswers = Record<string, string | string[]>;

export interface AutoDiagnosticPayload {
  version: 1;
  answers: AutoDiagnosticAnswers;
  completedAt: string;
}

function splitOptions(raw: string | null | undefined): string[] | null {
  if (!raw) return null;
  return raw.split("/").map((s) => s.trim()).filter(Boolean);
}

export const AUTO_DIAGNOSTIC_QUESTIONS: AutoDiagnosticQuestion[] = (
  autoDiagnosticRaw as Array<{
    order_index: number;
    section: string;
    response_type: string;
    question: string;
    options: string | null;
    required: boolean;
    condition: string | null;
    notes: string | null;
  }>
).map((q) => {
  const response_type = q.response_type as AutoDiagnosticResponseType;
  const maxSelections =
    response_type === "Choix multiple (max 3)"
      ? 3
      : response_type === "Choix multiple"
        ? undefined
        : undefined;
  return {
    order_index: q.order_index,
    section: q.section,
    response_type,
    question: q.question,
    options: splitOptions(q.options),
    required: q.required,
    condition: q.condition,
    notes: q.notes,
    maxSelections,
  };
});

export function substituteLanguagePlaceholder(
  text: string,
  languageKey: string | null | undefined
): string {
  const label = languageLabelFromKey(languageKey) || "cette langue";
  return text.replace(/\[langue\]/gi, label.toLowerCase());
}

function answerKey(orderIndex: number): string {
  return String(orderIndex);
}

function multiIncludesAutre(value: unknown): boolean {
  return Array.isArray(value) && value.some((v) => String(v).trim() === "Autre");
}

export function isAutoDiagnosticQuestionVisible(
  q: AutoDiagnosticQuestion,
  answers: AutoDiagnosticAnswers
): boolean {
  if (!q.condition) return true;
  const c = q.condition;
  if (c === "Si Q1 = Oui") return answers[answerKey(1)] === "Oui";
  if (c === "Si Q3 = Oui") return answers[answerKey(3)] === "Oui";
  if (c === "Si Q5 = Autre") return multiIncludesAutre(answers[answerKey(5)]);
  if (c === "Si Q7 = Autre") return multiIncludesAutre(answers[answerKey(7)]);
  if (c === "Si Q11 = Oui") return answers[answerKey(11)] === "Oui";
  return true;
}

export function validateAutoDiagnostic(answers: AutoDiagnosticAnswers): string | null {
  for (const q of AUTO_DIAGNOSTIC_QUESTIONS) {
    if (!isAutoDiagnosticQuestionVisible(q, answers)) continue;
    if (!q.required) continue;
    const value = answers[answerKey(q.order_index)];
    if (
      q.response_type === "Choix multiple" ||
      q.response_type === "Choix multiple (max 3)"
    ) {
      if (!Array.isArray(value) || value.length === 0) {
        return "Merci de sélectionner au moins une option pour chaque question à choix multiple.";
      }
      if (q.maxSelections != null && value.length > q.maxSelections) {
        return `Maximum ${q.maxSelections} sélections pour cette question.`;
      }
      continue;
    }
    if (typeof value !== "string" || !value.trim()) {
      return "Merci de répondre à toutes les questions obligatoires de l’auto-diagnostic.";
    }
  }
  return null;
}

/** Q10 Excel → champ `expectations` de l’inscription (plus d’étape Attentes dédiée). */
export function expectationsFromAutoDiagnostic(answers: AutoDiagnosticAnswers): string {
  const v = answers[answerKey(10)];
  return typeof v === "string" ? v.trim() : "";
}

export function buildAutoDiagnosticPayload(
  answers: AutoDiagnosticAnswers
): AutoDiagnosticPayload {
  return {
    version: 1,
    answers,
    completedAt: new Date().toISOString(),
  };
}

export function formatAutoDiagnosticSummary(
  answers: AutoDiagnosticAnswers,
  languageKey?: string | null
): string {
  const lines: string[] = ["Auto-diagnostic (avant test de niveau)"];
  for (const q of AUTO_DIAGNOSTIC_QUESTIONS) {
    if (!isAutoDiagnosticQuestionVisible(q, answers)) continue;
    const value = answers[answerKey(q.order_index)];
    if (value == null || value === "" || (Array.isArray(value) && !value.length)) continue;
    const label = substituteLanguagePlaceholder(q.question, languageKey);
    const display = Array.isArray(value) ? value.join(" · ") : value;
    lines.push(`• ${label} → ${display}`);
  }
  return lines.join("\n");
}

/** Toggle a multi-choice option; returns error message if max exceeded. */
export function toggleMultiChoice(
  current: string[] | undefined,
  option: string,
  maxSelections?: number
): { next: string[]; error: string | null } {
  const list = current ? [...current] : [];
  const idx = list.indexOf(option);
  if (idx >= 0) {
    list.splice(idx, 1);
    return { next: list, error: null };
  }
  if (maxSelections != null && list.length >= maxSelections) {
    return {
      next: list,
      error: `Vous pouvez sélectionner au maximum ${maxSelections} domaines.`,
    };
  }
  list.push(option);
  return { next: list, error: null };
}
