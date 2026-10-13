import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import {
  AUTO_DIAGNOSTIC_QUESTIONS,
  type AutoDiagnosticAnswers,
  isAutoDiagnosticQuestionVisible,
  substituteLanguagePlaceholder,
  toggleMultiChoice,
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

const SHORT_TEXT_ORDERS = new Set([2, 4, 6, 8, 12, 13]);

export function AutoDiagnosticForm({
  languageKey,
  initialAnswers,
  onComplete,
}: AutoDiagnosticFormProps) {
  const [answers, setAnswers] = useState<AutoDiagnosticAnswers>(() => {
    if (initialAnswers && Object.keys(initialAnswers).length) return initialAnswers;
    return {};
  });

  const visibleQuestions = useMemo(
    () => AUTO_DIAGNOSTIC_QUESTIONS.filter((q) => isAutoDiagnosticQuestionVisible(q, answers)),
    [answers]
  );

  const setAnswer = (orderIndex: number, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [keyOf(orderIndex)]: value }));
  };

  const handleMultiToggle = (
    orderIndex: number,
    option: string,
    maxSelections?: number
  ) => {
    const current = answers[keyOf(orderIndex)];
    const { next, error } = toggleMultiChoice(
      Array.isArray(current) ? current : undefined,
      option,
      maxSelections
    );
    if (error) {
      toast.error(error);
      return;
    }
    setAnswer(orderIndex, next);
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
            const isMulti =
              q.response_type === "Choix multiple" ||
              q.response_type === "Choix multiple (max 3)";
            const selectedMulti = Array.isArray(value) ? value : [];

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
                  {isMulti && (
                    <p className="text-xs text-muted-foreground">
                      {q.maxSelections != null
                        ? `Plusieurs réponses possibles — ${q.maxSelections} maximum.`
                        : "Plusieurs réponses possibles."}
                    </p>
                  )}

                  {q.response_type === "Oui/Non" && q.options && (
                    <RadioGroup
                      value={typeof value === "string" ? value : ""}
                      onValueChange={(v) => setAnswer(q.order_index, v)}
                      className="grid gap-2 sm:grid-cols-2"
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

                  {isMulti && q.options && (
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const checked = selectedMulti.includes(opt);
                        const id = `ad-multi-${q.order_index}-${opt}`;
                        return (
                          <OptionCard key={opt} selected={checked}>
                            <Label
                              htmlFor={id}
                              className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                            >
                              <Checkbox
                                id={id}
                                checked={checked}
                                onCheckedChange={() =>
                                  handleMultiToggle(q.order_index, opt, q.maxSelections)
                                }
                              />
                              <span className="min-w-0">{opt}</span>
                            </Label>
                          </OptionCard>
                        );
                      })}
                    </div>
                  )}

                  {q.response_type === "Texte libre" &&
                    (SHORT_TEXT_ORDERS.has(q.order_index) ? (
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
                    ))}
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
