import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Mountain } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePlacementTestDetails } from "@/hooks/usePlacementTestStats";
import { SLOPE_COLORS, SLOPE_LABELS, type SlopeLevel } from "@/lib/placement-test-engine";
import { CECRL_LEVELS } from "@/lib/certificate-progression";
import { supabase } from "@/integrations/supabase/client";
import { useConfirmAction } from "@/hooks/useConfirmAction";

interface Props {
  testId?: string | null;
  fallbackScore?: string | null;
  editable?: boolean;
  inscriptionEntryLevel?: string | null;
}

interface AdaptiveSummary {
  slopeResults?: Array<{ slope: string; correct: number; total: number; passed: boolean }>;
  passedSlopes?: string[];
  highestSlopeReached?: string;
  endedAtVocab?: boolean;
}

export function PlacementTestSummaryCard({
  testId,
  fallbackScore,
  editable = false,
  inscriptionEntryLevel,
}: Props) {
  const { data: test, isLoading } = usePlacementTestDetails(testId);
  const queryClient = useQueryClient();
  const { confirm, dialog: confirmDialog } = useConfirmAction();
  const [level, setLevel] = useState("A1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const current =
      test?.determined_level ||
      inscriptionEntryLevel ||
      "A1";
    const normalized = CECRL_LEVELS.includes(current as (typeof CECRL_LEVELS)[number])
      ? current
      : "A1";
    setLevel(normalized);
  }, [test?.determined_level, inscriptionEntryLevel]);

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

  const persistLevel = async () => {
    if (!testId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("placement_tests")
        .update({ determined_level: level })
        .eq("id", testId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["placement-test", testId] });
      toast.success("Niveau déterminé mis à jour");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLevel = () => {
    confirm({
      title: "Enregistrer le niveau déterminé ?",
      description: `Le niveau du test de placement sera fixé à ${level}.`,
      actionLabel: "Enregistrer",
      run: () => persistLevel(),
    });
  };

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

        {editable && testId && (
          <div className="flex flex-wrap items-end gap-3 pt-1">
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">Override admin (CECRL)</p>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CECRL_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              onClick={handleSaveLevel}
              disabled={saving || level === (test?.determined_level || "")}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </div>
        )}

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
      {confirmDialog}
    </Card>
  );
}
