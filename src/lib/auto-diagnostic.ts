/**
 * Auto-diagnostic pré-test — feuille « Auto-diagnostic » de
 * FLI_Tests_Complet_CORRIGE.xlsx (déjà miroir dans auto-diagnostic.json).
 * Rempli avant le QCM adaptatif pistes lors de /register.
 */

import autoDiagnosticRaw from "@/data/placement-questions/auto-diagnostic.json";
import { languageLabelFromKey } from "@/lib/language-catalog";

export type AutoDiagnosticResponseType =
  | "Oui/Non"
  | "Texte libre"
  | "Choix unique"
  | "Ranking";

export interface AutoDiagnosticQuestion {
  order_index: number;
  section: string;
  response_type: AutoDiagnosticResponseType;
  question: string;
  options: string[] | null;
  required: boolean;
  condition: string | null;
  notes: string | null;
}

/** Réponses indexées par order_index (string). Ranking = liste ordonnée. */
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
).map((q) => ({
  order_index: q.order_index,
  section: q.section,
  response_type: q.response_type as AutoDiagnosticResponseType,
  question: q.question,
  options: splitOptions(q.options),
  required: q.required,
  condition: q.condition,
  notes: q.notes,
}));

export const DIFFICULTY_RANKING_ITEMS = AUTO_DIAGNOSTIC_QUESTIONS.find(
  (q) => q.order_index === 5
)?.options ?? [
  "Expression orale (parler)",
  "Compréhension orale (écouter)",
  "Grammaire",
  "Vocabulaire général",
  "Prononciation",
  "Vocabulaire technique ski",
  "Autre",
];

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

export function isAutoDiagnosticQuestionVisible(
  q: AutoDiagnosticQuestion,
  answers: AutoDiagnosticAnswers
): boolean {
  if (!q.condition) return true;
  const c = q.condition;
  if (c === "Si Q1 = Oui") return answers[answerKey(1)] === "Oui";
  if (c === "Si Q3 = Oui") return answers[answerKey(3)] === "Oui";
  if (c === "Si Q10 = Oui") return answers[answerKey(10)] === "Oui";
  if (c === "Si 'Autre' classé") {
    const ranking = answers[answerKey(5)];
    return Array.isArray(ranking) && ranking.includes("Autre");
  }
  return true;
}

export function validateAutoDiagnostic(answers: AutoDiagnosticAnswers): string | null {
  for (const q of AUTO_DIAGNOSTIC_QUESTIONS) {
    if (!isAutoDiagnosticQuestionVisible(q, answers)) continue;
    if (!q.required) continue;
    const value = answers[answerKey(q.order_index)];
    if (q.response_type === "Ranking") {
      if (!Array.isArray(value) || value.length !== DIFFICULTY_RANKING_ITEMS.length) {
        return "Classez toutes vos difficultés (de la plus à la moins importante).";
      }
      continue;
    }
    if (typeof value !== "string" || !value.trim()) {
      return "Merci de répondre à toutes les questions obligatoires de l’auto-diagnostic.";
    }
  }
  return null;
}

/** Q8 Excel → préremplit l’étape Attentes. */
export function expectationsFromAutoDiagnostic(answers: AutoDiagnosticAnswers): string {
  const v = answers[answerKey(8)];
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
    const display = Array.isArray(value) ? value.join(" > ") : value;
    lines.push(`• ${label} → ${display}`);
  }
  return lines.join("\n");
}
