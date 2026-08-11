import { useQuery } from "@tanstack/react-query";
import { getPlacementQuestions } from "@/lib/placement-questions-data";

export function usePlacementQuestions(languageKey?: string) {
  return useQuery({
    queryKey: ["placement-questions", languageKey],
    queryFn: () => getPlacementQuestions(languageKey),
    enabled: !!languageKey,
    staleTime: Infinity,
  });
}
