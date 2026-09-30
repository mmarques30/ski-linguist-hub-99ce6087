import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import {
  AUTO_DIAGNOSTIC_QUESTIONS,
  DIFFICULTY_RANKING_ITEMS,
  type AutoDiagnosticAnswers,
  isAutoDiagnosticQuestionVisible,
  substituteLanguagePlaceholder,
  validateAutoDiagnostic,
} from "@/lib/auto-diagnostic";
import { OptionCard, StepActions, StepCard } from "./StepLayout";

interface AutoDiagnosticFormProps {
  languageKey?: string;
  initialAnswers?: AutoDiagnosticAnswers;
  onComplete: (answers: AutoDiagnosticAnswers) => void;
}

function keyOf(orderIndex: number): string {
  return String(orderIndex);
}

export function AutoDiagnosticForm({
  languageKey,
  initialAnswers,
  onComplete,
}: AutoDiagnosticFormProps) {
  const [answers, setAnswers] = useState<AutoDiagnosticAnswers>(() => {
    if (initialAnswers && Object.keys(initialAnswers).length) return initialAnswers;
    return {
      [keyOf(5)]: [...DIFFICULTY_RANKING_ITEMS],
    };
  });

  const visibleQuestions = useMemo(
    () => AUTO_DIAGNOSTIC_QUESTIONS.filter((q) => isAutoDiagnosticQuestionVisible(q, answers)),
    [answers]
  );

  const setAnswer = (orderIndex: number, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [keyOf(orderIndex)]: value }));
  };

  const ranking = (answers[keyOf(5)] as string[] | undefined) ?? [...DIFFICULTY_RANKING_ITEMS];

  const moveRank = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= ranking.length) return;
    const copy = [...ranking];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setAnswer(5, copy);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateAutoDiagnostic(answers);
    if (error) {
      toast.error(error);
      return;
    }
    onComplete(answers);
  };

  let lastSection = "";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StepCard
        title="Auto-diagnostic"
        description="Quelques questions sur votre parcours et vos besoins — ensuite le test de niveau par pistes"
        icon={ClipboardList}
      >
        <div className="space-y-6">
          <Alert>
            <ClipboardList className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Cet auto-diagnostic aide l’équipe FLI à mieux vous connaître. Il ne remplace pas le
              test de niveau adaptatif, que vous passerez juste après.
            </AlertDescription>
          </Alert>

          {visibleQuestions.map((q) => {
            const showSection = q.section !== lastSection;
            lastSection = q.section;
            const label = substituteLanguagePlaceholder(q.question, languageKey);
            const value = answers[keyOf(q.order_index)];

            return (
              <div key={q.order_index} className="space-y-3">
                {showSection && (
                  <p className="border-t border-border pt-4 text-sm font-medium text-foreground first:border-t-0 first:pt-0">
                    {q.section}
                  </p>
                )}

                <div className="space-y-2">
                  <Label>
                    {label}
                    {q.required ? " *" : ""}
                  </Label>

                  {q.response_type === "Oui/Non" && q.options && (
                    <RadioGroup
                      value={typeof value === "string" ? value : ""}
                      onValueChange={(v) => setAnswer(q.order_index, v)}
                      className="grid gap-2 sm:grid-cols-2"
                    >
                      {q.options.map((opt) => (
                        <OptionCard
                          key={opt}
                          selected={value === opt}
                        >
                          <Label
                            htmlFor={`ad-${q.order_index}-${opt}`}
                            className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                          >
                            <RadioGroupItem
                              value={opt}
                              id={`ad-${q.order_index}-${opt}`}
                            />
                            {opt}
                          </Label>
                        </OptionCard>
                      ))}
                    </RadioGroup>
                  )}

                  {q.response_type === "Choix unique" && q.options && (
                    <RadioGroup
                      value={typeof value === "string" ? value : ""}
                      onValueChange={(v) => setAnswer(q.order_index, v)}
                      className="space-y-2"
                    >
                      {q.options.map((opt) => (
                        <OptionCard key={opt} selected={value === opt}>
                          <Label
                            htmlFor={`ad-${q.order_index}-${opt}`}
                            className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                          >
                            <RadioGroupItem
                              value={opt}
                              id={`ad-${q.order_index}-${opt}`}
                            />
                            <span className="min-w-0">{opt}</span>
                          </Label>
                        </OptionCard>
                      ))}
                    </RadioGroup>
                  )}

                  {q.response_type === "Texte libre" && (
                    q.order_index === 2 || q.order_index === 4 || q.order_index === 6 || q.order_index === 11 || q.order_index === 13 ? (
                      <Input
                        value={typeof value === "string" ? value : ""}
                        onChange={(e) => setAnswer(q.order_index, e.target.value)}
                        className="h-11"
                      />
                    ) : (
                      <Textarea
                        value={typeof value === "string" ? value : ""}
                        onChange={(e) => setAnswer(q.order_index, e.target.value)}
                        className="min-h-[96px]"
                      />
                    )
                  )}

                  {q.response_type === "Ranking" && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        1 = difficulté la plus importante. Utilisez les flèches pour réordonner.
                      </p>
                      <ul className="space-y-2">
                        {ranking.map((item, index) => (
                          <li
                            key={item}
                            className="flex items-center gap-2 rounded-[var(--radius-card)] border border-border bg-card px-3 py-2"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--surface-sunken))] text-xs font-semibold tabular-nums">
                              {index + 1}
                            </span>
                            <span className="min-w-0 flex-1 text-sm">{item}</span>
                            <div className="flex shrink-0 flex-col gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={index === 0}
                                onClick={() => moveRank(index, -1)}
                                aria-label={`Monter ${item}`}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={index === ranking.length - 1}
                                onClick={() => moveRank(index, 1)}
                                aria-label={`Descendre ${item}`}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </StepCard>

      <StepActions>
        <Button type="submit" className="h-12 w-full text-base sm:w-auto">
          Continuer vers le test de niveau
        </Button>
      </StepActions>
    </form>
  );
}
