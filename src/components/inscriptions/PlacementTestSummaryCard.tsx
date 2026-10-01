import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DefinitionList, StatusPill, SurfaceCard } from "@/components/ui-kit";
import type { PillTone } from "@/components/ui-kit";
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
import {
  AUTO_DIAGNOSTIC_QUESTIONS,
  formatAutoDiagnosticSummary,
  substituteLanguagePlaceholder,
  type AutoDiagnosticAnswers,
} from "@/lib/auto-diagnostic";
import {
  hasAdaptedScale,
  SLOPE_LABELS,
  studentFacingPisteLabel,
  type SlopeLevel,
} from "@/lib/placement-test-engine";
import { CECRL_LEVELS } from "@/lib/certificate-progression";
import { supabase } from "@/integrations/supabase/client";
import { useConfirmAction } from "@/hooks/useConfirmAction";

interface Props {
  testId?: string | null;
  fallbackScore?: string | null;
  editable?: boolean;
  inscriptionEntryLevel?: string | null;
}

interface VocabAnswerDetail {
  questionId: string;
  questionText: string;
  selected: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface AdaptiveSummary {
  slopeResults?: Array<{ slope: string; correct: number; total: number; passed: boolean }>;
  passedSlopes?: string[];
  highestSlopeReached?: string;
  /** @deprecated ancien champ — remplacé par vocabScore */
  endedAtVocab?: boolean;
  vocabScore?: { correct: number; total: number };
  vocabAnswers?: VocabAnswerDetail[];
  presentationText?: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

interface StoredAnswers {
  summary?: AdaptiveSummary;
  autoDiagnostic?: {
    answers?: AutoDiagnosticAnswers;
    completedAt?: string;
  };
  responses?: Record<string, string>;
}

const SLOPE_TONES: Record<SlopeLevel, PillTone> = {
  verte: "success",
  bleue: "info",
  rouge: "danger",
  noire: "neutral",
  vocab_ski: "warning",
};

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
      <SurfaceCard title="Test adaptatif (pistes)" icon={Mountain}>
        <div className="space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-56" />
        </div>
      </SurfaceCard>
    );
  }

  const stored = test?.answers as StoredAnswers | null;
  const summary = stored?.summary;
  const pisteLabel = studentFacingPisteLabel({
    passedSlopes: summary?.passedSlopes,
    highestSlopeReached: summary?.highestSlopeReached,
  });
  const adapted = hasAdaptedScale(test?.language);
  const autoAnswers = stored?.autoDiagnostic?.answers;
  const slopeOnly = (summary?.slopeResults || []).filter((sr) => sr.slope !== "vocab_ski");
  const vocabFromResults = (summary?.slopeResults || []).find((sr) => sr.slope === "vocab_ski");
  const vocabScore = summary?.vocabScore ??
    (vocabFromResults
      ? { correct: vocabFromResults.correct, total: vocabFromResults.total }
      : null);

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
    <SurfaceCard
      title="Test adaptatif (pistes)"
      icon={Mountain}
      bodyClassName="space-y-4"
    >
        {adapted && (
          <StatusPill tone="warning" size="sm">
            Échelle adaptée
          </StatusPill>
        )}

        <DefinitionList
          columns={2}
          items={[
            {
              label: "Piste finale",
              value: <span className="text-xl font-bold">{pisteLabel}</span>,
            },
            {
              label: "Niveau déterminé",
              value: (
                <span className="text-xl font-bold tabular">
                  {test?.determined_level || "-"}
                </span>
              ),
            },
            {
              label: "Score global",
              value: (
                <span className="text-xl font-bold tabular">
                  {test
                    ? `${test.correct_answers}/${test.total_questions} (${test.score_percentage}%)`
                    : fallbackScore || "-"}
                </span>
              ),
            },
            ...(vocabScore
              ? [
                  {
                    label: "Vocabulaire ski",
                    value: (
                      <span className="text-xl font-bold tabular">
                        {vocabScore.correct}/{vocabScore.total}
                      </span>
                    ),
                  },
                ]
              : []),
          ]}
        />

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

        {slopeOnly.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Scores par piste</p>
            <div className="flex flex-wrap gap-2">
              {slopeOnly.map((sr) => (
                <StatusPill
                  key={sr.slope}
                  tone={sr.passed ? SLOPE_TONES[sr.slope as SlopeLevel] ?? "neutral" : "neutral"}
                  size="sm"
                >
                  {SLOPE_LABELS[sr.slope as SlopeLevel] || sr.slope} : {sr.correct}/{sr.total}
                </StatusPill>
              ))}
            </div>
          </div>
        )}

        {(summary?.vocabAnswers?.length || vocabScore) && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Vocabulaire ski
              {vocabScore ? ` · ${vocabScore.correct}/${vocabScore.total}` : ""}
            </p>
            {summary?.vocabAnswers && summary.vocabAnswers.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {summary.vocabAnswers.map((v) => (
                  <li
                    key={v.questionId}
                    className="rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] px-3 py-2"
                  >
                    <p className="text-muted-foreground">{v.questionText}</p>
                    <p className="mt-1">
                      Réponse : <span className="font-medium">{v.selected || "—"}</span>
                      {v.isCorrect ? (
                        <StatusPill tone="success" size="sm" className="ml-2">
                          OK
                        </StatusPill>
                      ) : (
                        <StatusPill tone="danger" size="sm" className="ml-2">
                          Incorrect
                        </StatusPill>
                      )}
                    </p>
                    {!v.isCorrect && (
                      <p className="text-xs text-muted-foreground">
                        Attendu : {v.correctAnswer}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        {typeof summary?.presentationText === "string" && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Présentation</p>
            {summary.presentationText.trim() ? (
              <p className="whitespace-pre-wrap rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] px-3 py-2 text-sm">
                {summary.presentationText}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Non renseignée</p>
            )}
          </div>
        )}

        {autoAnswers && Object.keys(autoAnswers).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Auto-diagnostic</p>
            <ul className="space-y-2 text-sm">
              {AUTO_DIAGNOSTIC_QUESTIONS.map((q) => {
                const raw = autoAnswers[String(q.order_index)];
                if (raw == null || raw === "" || (Array.isArray(raw) && !raw.length)) {
                  return null;
                }
                return (
                  <li key={q.order_index} className="border-b border-border pb-2 last:border-0">
                    <p className="text-muted-foreground">
                      {substituteLanguagePlaceholder(q.question, test?.language)}
                    </p>
                    <p className="font-medium">
                      {Array.isArray(raw) ? raw.join(" · ") : raw}
                    </p>
                  </li>
                );
              })}
            </ul>
            <details className="text-xs text-muted-foreground">
              <summary>Résumé texte</summary>
              <pre className="mt-1 whitespace-pre-wrap">
                {formatAutoDiagnosticSummary(autoAnswers, test?.language)}
              </pre>
            </details>
          </div>
        )}

      {confirmDialog}
    </SurfaceCard>
  );
}
