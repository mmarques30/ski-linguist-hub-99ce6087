import type { PlacementQuestion, SlopeLevel } from "@/lib/placement-test-engine";

import anglais from "@/data/placement-questions/anglais.json";
import portugais from "@/data/placement-questions/portugais.json";
import russe from "@/data/placement-questions/russe.json";
import neerlandais from "@/data/placement-questions/neerlandais.json";
import allemand from "@/data/placement-questions/allemand.json";
import espagnol from "@/data/placement-questions/espagnol.json";
import italien from "@/data/placement-questions/italien.json";
import chinois from "@/data/placement-questions/chinois.json";
import fle from "@/data/placement-questions/fle.json";

type RawQuestion = {
  order_index: number;
  slope: SlopeLevel;
  category: string;
  question_text: string;
  options: string[];
  correct_answer: string;
};

const QUESTION_BANK: Record<string, RawQuestion[]> = {
  anglais,
  portugais,
  russe,
  neerlandais,
  allemand,
  espagnol,
  italien,
  chinois,
  fle,
} as unknown as Record<string, RawQuestion[]>;

/** Maps registration form language keys to question bank keys. */
export const PLACEMENT_QUESTION_LANGUAGE_MAP: Record<string, string> = {
  english: "anglais",
  portuguese: "portugais",
  russian: "russe",
  dutch: "neerlandais",
  german: "allemand",
  spanish: "espagnol",
  italian: "italien",
  chinese: "chinois",
  french: "fle",
};

export function getPlacementQuestions(languageKey?: string): PlacementQuestion[] {
  const bankKey = languageKey ? PLACEMENT_QUESTION_LANGUAGE_MAP[languageKey] : undefined;
  if (!bankKey || !QUESTION_BANK[bankKey]) return [];

  return QUESTION_BANK[bankKey].map((q) => ({
    id: `${bankKey}-${q.order_index}`,
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer,
    slope: q.slope,
    category: q.category,
    order_index: q.order_index,
  }));
}
