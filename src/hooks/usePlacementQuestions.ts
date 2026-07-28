import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  PLACEMENT_QUESTION_LANGUAGE_MAP,
  normalizeQuestionOptions,
  PLACEMENT_TEST_QUESTION_COUNT,
  type PlacementQuestion,
} from "@/lib/registration-utils";
import { FALLBACK_PLACEMENT_QUESTIONS } from "@/data/placement-questions-fallback";

export function usePlacementQuestions(languageKey?: string) {
  const dbLanguage = languageKey ? PLACEMENT_QUESTION_LANGUAGE_MAP[languageKey] : undefined;

  return useQuery({
    queryKey: ["placement-questions", dbLanguage],
    queryFn: async (): Promise<PlacementQuestion[]> => {
      if (!dbLanguage) return [];

      const { data, error } = await supabase
        .from("placement_test_questions")
        .select("id, question_text, options, correct_answer, level, order_index")
        .eq("language", dbLanguage)
        .eq("is_active", true)
        .order("order_index", { ascending: true })
        .limit(PLACEMENT_TEST_QUESTION_COUNT);

      if (error) throw error;

      if (data && data.length >= PLACEMENT_TEST_QUESTION_COUNT) {
        return data.map((row) => ({
          id: row.id,
          question_text: row.question_text,
          options: normalizeQuestionOptions(row.options),
          correct_answer: row.correct_answer,
          level: row.level,
          order_index: row.order_index ?? 0,
        }));
      }

      return FALLBACK_PLACEMENT_QUESTIONS[dbLanguage] ?? FALLBACK_PLACEMENT_QUESTIONS.anglais;
    },
    enabled: !!dbLanguage,
    staleTime: 5 * 60 * 1000,
  });
}
