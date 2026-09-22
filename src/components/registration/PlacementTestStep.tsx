import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, Phone, Mountain } from "lucide-react";
import type { RegistrationData } from "@/pages/register/Index";
import { usePlacementQuestions } from "@/hooks/usePlacementQuestions";
import { MeterRow, StatusPill, SurfaceCard } from "@/components/ui-kit";
import type { PillTone } from "@/components/ui-kit";
import {
  buildAdaptiveTestResult,
  evaluateSlope,
  getNextSlopeAfterSlope,
  getQuestionsForSlope,
  QUESTIONS_PER_SLOPE,
  SLOPE_LABELS,
  studentFacingPisteLabel,
  type AdaptiveTestResult,
  type PlacementQuestion,
  type SlopeLevel,
  type SlopeResult,
} from "@/lib/placement-test-engine";
import {
  expectsStationGroupAssignment,
  STATION_GROUP_NOTICE_AFTER_TEST,
  STATION_GROUP_NOTICE_BEFORE_TEST,
  STATION_GROUP_SIGNATURE,
} from "@/lib/registration-group-notice";
import { StepActions, StepCard, SummaryPanel } from "./StepLayout";

/**
 * Teinte de pastille par piste. Les couleurs en dur de `SLOPE_COLORS`
 * (bg-emerald-500…) ne passent pas en thème sombre : on garde le libellé du
 * moteur métier et on habille avec les jetons du design system.
 */
const SLOPE_TONES: Record<SlopeLevel, PillTone> = {
  verte: "success",
  bleue: "info",
  rouge: "danger",
  noire: "neutral",
  vocab_ski: "warning",
};

interface PlacementTestStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

export function PlacementTestStep({ data, onUpdate, onNext }: PlacementTestStepProps) {
  const isStationGroup = expectsStationGroupAssignment(data.modality);
  const [testStarted, setTestStarted] = useState(false);
  const [currentSlope, setCurrentSlope] = useState<SlopeLevel>("verte");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [slopeResults, setSlopeResults] = useState<SlopeResult[]>([]);
  const [passedSlopes, setPassedSlopes] = useState<SlopeLevel[]>([]);
  const [testCompleted, setTestCompleted] = useState(false);
  const [result, setResult] = useState<AdaptiveTestResult | null>(null);

  const { data: allQuestions = [], isLoading } = usePlacementQuestions(data.language);

  const slopeQuestions = useMemo(
    () => getQuestionsForSlope(allQuestions, currentSlope),
    [allQuestions, currentSlope]
  );

  const currentQuestion: PlacementQuestion | undefined = slopeQuestions[questionIndex];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const startTest = () => {
    if (allQuestions.length === 0) return;
    setTestStarted(true);
    setCurrentSlope("verte");
    setQuestionIndex(0);
    setAnswers({});
    setSlopeResults([]);
    setPassedSlopes([]);
    setResult(null);
  };

  const finishTest = (
    finalAnswers: Record<string, string>,
    finalSlopeResults: SlopeResult[],
    finalPassedSlopes: SlopeLevel[],
    endedAtVocab: boolean
  ) => {
    const testResult = buildAdaptiveTestResult(
      allQuestions,
      finalAnswers,
      finalSlopeResults,
      finalPassedSlopes,
      endedAtVocab
    );
    setResult(testResult);
    onUpdate({
      hasBeenEvaluated: false,
      testScore: Math.round((testResult.correctAnswers / testResult.totalAnswered) * 100),
      correctAnswers: testResult.correctAnswers,
      totalAnswered: testResult.totalAnswered,
      currentLevel: testResult.determinedLevel,
      needsAdminCall: testResult.needsAdminCall,
      testAnswers: testResult.answers,
      testSummary: {
        slopeResults: testResult.slopeResults,
        passedSlopes: testResult.passedSlopes,
        highestSlopeReached: testResult.highestSlopeReached,
        endedAtVocab: testResult.endedAtVocab,
      },
    });
    setTestCompleted(true);
  };

  const completeSlope = (
    slope: SlopeLevel,
    slopeAnswers: Record<string, string>,
    prevSlopeResults: SlopeResult[],
    prevPassedSlopes: SlopeLevel[]
  ) => {
    const questions = getQuestionsForSlope(allQuestions, slope);
    const correct = questions.filter((q) => slopeAnswers[q.id] === q.correct_answer).length;
    const passed = evaluateSlope(correct);
    const slopeResult: SlopeResult = { slope, correct, total: questions.length, passed };
    const newSlopeResults = [...prevSlopeResults, slopeResult];
    const newPassedSlopes = passed ? [...prevPassedSlopes, slope] : prevPassedSlopes;
    const next = getNextSlopeAfterSlope(slope, passed);

    if (next === "done") {
      finishTest(slopeAnswers, newSlopeResults, newPassedSlopes, false);
      return;
    }

    if (next === "vocab_ski") {
      setSlopeResults(newSlopeResults);
      setPassedSlopes(newPassedSlopes);
      setCurrentSlope("vocab_ski");
      setQuestionIndex(0);
      return;
    }

    setSlopeResults(newSlopeResults);
    setPassedSlopes(newPassedSlopes);
    setCurrentSlope(next);
    setQuestionIndex(0);
  };

  const selectAnswer = (answer: string) => {
    if (!currentQuestion) return;

    const newAnswers = { ...answers, [currentQuestion.id]: answer };

    if (questionIndex < slopeQuestions.length - 1) {
      setAnswers(newAnswers);
      setQuestionIndex(questionIndex + 1);
      return;
    }

    // Last question in current slope
    setAnswers(newAnswers);

    if (currentSlope === "vocab_ski") {
      const vocabQuestions = getQuestionsForSlope(allQuestions, "vocab_ski");
      const correct = vocabQuestions.filter(
        (q) => newAnswers[q.id] === q.correct_answer
      ).length;
      const vocabResult: SlopeResult = {
        slope: "vocab_ski",
        correct,
        total: vocabQuestions.length,
        passed: evaluateSlope(correct),
      };
      finishTest(
        newAnswers,
        [...slopeResults, vocabResult],
        passedSlopes,
        true
      );
      return;
    }

    completeSlope(currentSlope, newAnswers, slopeResults, passedSlopes);
  };

  if (testCompleted && result) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <StepCard
          title={
            <span className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 shrink-0 text-[hsl(var(--status-good))]" aria-hidden />
              Test terminé
            </span>
          }
          description="Votre niveau a été évalué selon le parcours adaptatif FLI"
        >
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryPanel className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">Votre piste</p>
                <div className="flex justify-center">
                  <StatusPill
                    tone={
                      SLOPE_TONES[result.highestSlopeReached as SlopeLevel] ?? "neutral"
                    }
                    className="px-4 py-1.5 text-base"
                  >
                    {studentFacingPisteLabel({
                      passedSlopes: result.passedSlopes,
                      highestSlopeReached: result.highestSlopeReached,
                      endedAtVocab: result.endedAtVocab,
                    })}
                  </StatusPill>
                </div>
              </SummaryPanel>
              <SummaryPanel className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">Score global</p>
                <p className="text-metric tabular text-foreground">
                  {result.correctAnswers}/{result.totalAnswered}
                </p>
              </SummaryPanel>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Parcours des pistes</p>
              <div className="flex flex-wrap gap-2">
                {result.slopeResults.map((sr) => (
                  <StatusPill
                    key={sr.slope}
                    tone={sr.passed ? SLOPE_TONES[sr.slope] : "neutral"}
                    dot
                  >
                    {SLOPE_LABELS[sr.slope]} · {sr.correct}/{sr.total}
                  </StatusPill>
                ))}
              </div>
            </div>

            {result.needsAdminCall && (
              <Alert variant="destructive">
                <Phone className="h-4 w-4" />
                <AlertDescription>
                  Notre équipe vous contactera par téléphone pour affiner votre niveau.
                </AlertDescription>
              </Alert>
            )}

            {isStationGroup && (
              <Alert>
                <Mountain className="h-4 w-4" />
                <AlertDescription>
                  {STATION_GROUP_NOTICE_AFTER_TEST} — {STATION_GROUP_SIGNATURE}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </StepCard>

        <StepActions>
          <Button type="submit" className="h-12 w-full text-base sm:w-auto">
            Continuer vers les attentes
          </Button>
        </StepActions>
      </form>
    );
  }

  if (testStarted && currentQuestion) {
    const progressInSlope = ((questionIndex) / slopeQuestions.length) * 100;

    return (
      <SurfaceCard
        title="Test de niveau adaptatif"
        description={
          currentSlope === "vocab_ski"
            ? "Vocabulaire technique du ski"
            : `Répondez à ${QUESTIONS_PER_SLOPE} questions — il faut ${QUESTIONS_PER_SLOPE - 2} bonnes réponses ou plus pour passer à la piste suivante`
        }
        actions={
          <StatusPill tone={SLOPE_TONES[currentSlope]} dot>
            {SLOPE_LABELS[currentSlope]}
          </StatusPill>
        }
        toolbar={
          <MeterRow
            label={`Question ${questionIndex + 1} / ${slopeQuestions.length}`}
            value={progressInSlope}
            display={`${Math.round(progressInSlope)} %`}
          />
        }
      >
        <div className="space-y-5">
          <div className="rounded-[var(--radius-card)] bg-[hsl(var(--surface-sunken))] p-4 sm:p-5">
            <p className="text-lg font-medium leading-snug text-balance text-foreground">
              {currentQuestion.question_text}
            </p>
          </div>

          <RadioGroup onValueChange={selectAnswer} className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className="rounded-[var(--radius-card)] border border-border bg-card transition-colors hover:bg-[hsl(var(--surface-sunken))]"
              >
                <Label
                  htmlFor={`option-${index}`}
                  className="flex min-h-14 cursor-pointer items-center gap-3 p-4 text-base font-normal leading-snug"
                >
                  <RadioGroupItem value={option} id={`option-${index}`} className="shrink-0" />
                  <span className="min-w-0">{option}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <StepCard
      title="Test de niveau obligatoire"
      description="Test adaptatif par pistes (verte → bleue → rouge → noire) — requis pour toutes les inscriptions, même si vous connaissez déjà votre niveau"
      icon={Mountain}
    >
      <div className="space-y-5">
        <Alert>
          <Mountain className="h-4 w-4" />
          <AlertDescription>
            Ce test permet à FLI de placer chaque stagiaire dans le groupe adapté. Il est
            obligatoire et ne peut pas être remplacé par une auto-évaluation.
          </AlertDescription>
        </Alert>

        {isStationGroup && (
          <Alert className="border-primary/20 bg-[hsl(var(--surface-sunken))]">
            <AlertDescription className="text-sm">
              {STATION_GROUP_NOTICE_BEFORE_TEST} — {STATION_GROUP_SIGNATURE}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement des questions…
          </div>
        ) : allQuestions.length === 0 ? (
          <Alert variant="destructive">
            <AlertDescription>
              Le test n'est pas disponible pour cette langue pour le moment. Merci de contacter
              FLI à info@fli.fr.
            </AlertDescription>
          </Alert>
        ) : (
          <Button type="button" onClick={startTest} className="h-12 w-full text-base">
            Commencer le test (piste verte)
          </Button>
        )}
      </div>
    </StepCard>
  );
}
