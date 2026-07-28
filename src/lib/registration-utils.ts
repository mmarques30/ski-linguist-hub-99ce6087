/** Maps registration form language keys to DB inscription language labels. */
export const REGISTRATION_LANGUAGE_MAP: Record<string, string> = {
  english: "Anglais",
  portuguese: "Portugais",
  russian: "Russe",
  dutch: "Néerlandais",
};

/** Maps registration form language keys to placement_test_questions language values. */
export const PLACEMENT_QUESTION_LANGUAGE_MAP: Record<string, string> = {
  english: "anglais",
  portuguese: "portugais",
  russian: "russe",
  dutch: "neerlandais",
};

export const REGISTRATION_MODALITY_MAP: Record<string, string> = {
  in_person: "presentiel",
  online_individual: "en_ligne_individuel",
  online_group: "en_ligne_groupe",
};

export const REGISTRATION_FUNDING_MAP: Record<string, string> = {
  opco: "OPCO / FIFPL",
  company: "Entreprise",
  self: "Autofinancement",
};

export const LOCATION_LABELS: Record<string, string> = {
  valdisere: "Val d'Isère",
  courchevel: "Courchevel",
  meribel: "Méribel",
  lesarcs: "Les Arcs",
  chamonix: "Chamonix",
};

export const PLACEMENT_TEST_QUESTION_COUNT = 20;

/** Guide rule: 0-10 correct → morning, 11-20 → afternoon. */
export function getTimeSlotFromScore(correctAnswers: number): "matin" | "apres-midi" {
  return correctAnswers <= 10 ? "matin" : "apres-midi";
}

export function needsAdminCall(correctAnswers: number): boolean {
  return correctAnswers <= 2;
}

export function parseDurationHours(duration?: string): number | null {
  if (!duration) return null;
  const match = duration.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

export interface PlacementQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  level: string;
  order_index: number;
}

export function normalizeQuestionOptions(options: unknown): string[] {
  if (Array.isArray(options)) {
    return options.map((opt) => String(opt));
  }
  if (options && typeof options === "object") {
    return Object.values(options as Record<string, unknown>).map((opt) => String(opt));
  }
  return [];
}

/** Determine CEFR level from block performance (guide: Q1-5 A1 … Q19-20 C1). */
export function determineLevelFromAnswers(
  questions: PlacementQuestion[],
  answers: Record<string, string>
): string {
  const blocks = [
    { indices: [0, 1, 2, 3, 4], level: "A1", minCorrect: 3 },
    { indices: [5, 6, 7, 8, 9], level: "A2", minCorrect: 3 },
    { indices: [10, 11, 12, 13, 14], level: "B1", minCorrect: 3 },
    { indices: [15, 16, 17], level: "B2", minCorrect: 2 },
    { indices: [18, 19], level: "C1", minCorrect: 1 },
  ];

  let level = "A1";
  for (const block of blocks) {
    const correct = block.indices.filter((index) => {
      const question = questions[index];
      if (!question) return false;
      return answers[question.id] === question.correct_answer;
    }).length;

    if (correct >= block.minCorrect) {
      level = block.level;
    }
  }

  return level;
}

export function countCorrectAnswers(
  questions: PlacementQuestion[],
  answers: Record<string, string>
): number {
  return questions.filter((q) => answers[q.id] === q.correct_answer).length;
}
