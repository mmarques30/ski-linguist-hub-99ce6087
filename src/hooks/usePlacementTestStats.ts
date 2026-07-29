import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PLACEMENT_QUESTION_LANGUAGE_MAP } from "@/lib/placement-questions-data";

export interface PlacementTestStatsRow {
  languageKey: string;
  languageLabel: string;
  totalQuestions: number;
  completedTests: number;
  averageScore: number;
  levelDistribution: { level: string; count: number; percentage: number }[];
}

const LANGUAGE_KEY_BY_LABEL = Object.fromEntries(
  Object.entries(PLACEMENT_QUESTION_LANGUAGE_MAP).map(([key, bank]) => {
    const label =
      {
        anglais: "Anglais",
        portugais: "Portugais",
        russe: "Russe",
        neerlandais: "Néerlandais",
        allemand: "Allemand",
        espagnol: "Espagnol",
        italien: "Italien",
        chinois: "Chinois",
        fle: "Français",
      }[bank] || bank;
    return [label, key];
  })
);

export function usePlacementTestStats() {
  return useQuery({
    queryKey: ["placement-test-stats"],
    queryFn: async (): Promise<PlacementTestStatsRow[]> => {
      const { data, error } = await supabase
        .from("placement_tests")
        .select("language, total_questions, score_percentage, determined_level, status")
        .eq("status", "completed");

      if (error) throw error;

      const byLanguage = new Map<
        string,
        { totalQuestions: number; scores: number[]; levels: Record<string, number> }
      >();

      for (const row of data || []) {
        const lang = row.language || "Inconnu";
        if (!byLanguage.has(lang)) {
          byLanguage.set(lang, { totalQuestions: row.total_questions || 0, scores: [], levels: {} });
        }
        const bucket = byLanguage.get(lang)!;
        if (row.total_questions && row.total_questions > bucket.totalQuestions) {
          bucket.totalQuestions = row.total_questions;
        }
        if (row.score_percentage != null) bucket.scores.push(row.score_percentage);
        const level = row.determined_level || "?";
        bucket.levels[level] = (bucket.levels[level] || 0) + 1;
      }

      return Array.from(byLanguage.entries()).map(([languageLabel, stats]) => {
        const completedTests = stats.scores.length;
        const averageScore =
          completedTests > 0
            ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / completedTests)
            : 0;
        const levelDistribution = Object.entries(stats.levels)
          .map(([level, count]) => ({
            level,
            count,
            percentage: completedTests > 0 ? Math.round((count / completedTests) * 100) : 0,
          }))
          .sort((a, b) => a.level.localeCompare(b.level));

        return {
          languageKey: LANGUAGE_KEY_BY_LABEL[languageLabel] || languageLabel.toLowerCase(),
          languageLabel,
          totalQuestions: stats.totalQuestions,
          completedTests,
          averageScore,
          levelDistribution,
        };
      });
    },
  });
}

export function usePlacementTestDetails(testId?: string | null) {
  return useQuery({
    queryKey: ["placement-test", testId],
    queryFn: async () => {
      if (!testId) return null;
      const { data, error } = await supabase
        .from("placement_tests")
        .select("*")
        .eq("id", testId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!testId,
  });
}
