import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mountain } from "lucide-react";
import { usePlacementTestDetails } from "@/hooks/usePlacementTestStats";
import { SLOPE_COLORS, SLOPE_LABELS, type SlopeLevel } from "@/lib/placement-test-engine";

interface Props {
  testId?: string | null;
  fallbackScore?: string | null;
}

interface AdaptiveSummary {
  slopeResults?: Array<{ slope: string; correct: number; total: number; passed: boolean }>;
  passedSlopes?: string[];
  highestSlopeReached?: string;
  endedAtVocab?: boolean;
}

export function PlacementTestSummaryCard({ testId, fallbackScore }: Props) {
  const { data: test, isLoading } = usePlacementTestDetails(testId);

  if (!testId && !fallbackScore) return null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const answers = test?.answers as { summary?: AdaptiveSummary } | null;
  const summary = answers?.summary;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Mountain className="h-4 w-4" />
          Test adaptatif (pistes)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Niveau déterminé</p>
            <p className="text-xl font-bold">{test?.determined_level || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Score</p>
            <p className="text-xl font-bold">
              {test
                ? `${test.correct_answers}/${test.total_questions} (${test.score_percentage}%)`
                : fallbackScore || "-"}
            </p>
          </div>
        </div>

        {summary?.slopeResults && summary.slopeResults.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {summary.slopeResults.map((sr) => (
              <Badge
                key={sr.slope}
                variant={sr.passed ? "default" : "secondary"}
                className={sr.passed ? SLOPE_COLORS[sr.slope as SlopeLevel] : ""}
              >
                {SLOPE_LABELS[sr.slope as SlopeLevel] || sr.slope}: {sr.correct}/{sr.total}
              </Badge>
            ))}
          </div>
        )}

        {summary?.endedAtVocab && (
          <p className="text-sm text-muted-foreground">
            Parcours terminé par le vocabulaire ski après une piste non validée.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
