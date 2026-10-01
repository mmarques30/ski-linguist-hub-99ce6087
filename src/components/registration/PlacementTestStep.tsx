import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ClipboardList, Loader2, Mountain } from "lucide-react";
import type { RegistrationData } from "@/pages/register/Index";
import { usePlacementQuestions } from "@/hooks/usePlacementQuestions";
import { MeterRow, StatusPill, SurfaceCard } from "@/components/ui-kit";
import type { PillTone } from "@/components/ui-kit";
import {
  buildAdaptiveTestResult,
  evaluateSlope,
  getNextSlopeAfterSlope,
  getPresentationQuestion,
  getQuestionsForSlope,
  PASS_THRESHOLD,
  PRESENTATION_MAX_CHARS,
  QUESTIONS_PER_SLOPE,
  SLOPE_LABELS,
  studentFacingPisteLabel,
  type AdaptiveTestResult,
  type PlacementQuestion,
  type SlopeLevel,
  type SlopeResult,
} from "@/lib/placement-test-engine";
import {
  buildAutoDiagnosticPayload,
  expectationsFromAutoDiagnostic,
  type AutoDiagnosticAnswers,
} from "@/lib/auto-diagnostic";
import {
  expectsStationGroupAssignment,
  STATION_GROUP_NOTICE_AFTER_TEST,
  STATION_GROUP_NOTICE_BEFORE_TEST,
  STATION_GROUP_SIGNATURE,
} from "@/lib/registration-group-notice";
import { AutoDiagnosticForm } from "./AutoDiagnosticForm";
import { StepActions, StepCard, SummaryPanel } from "./StepLayout";

const SLOPE_TONES: Record<SlopeLevel, PillTone> = {
  verte: "success",
  bleue: "info",
  rouge: "danger",
  noire: "neutral",
  vocab_ski: "warning",
};

type Phase = "intro" | "auto_diagnostic" | "mcq" | "presentation" | "results";

interface PlacementTestStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

export function PlacementTestStep({ data, onUpdate, onNext }: PlacementTestStepProps) {
  const isStationGroup = expectsStationGroupAssignment(data.modality);
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentSlope, setCurrentSlope] = useState<SlopeLevel>("verte");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [slopeResults, setSlopeResults] = useState<SlopeResult[]>([]);
  const [passedSlopes, setPassedSlopes] = useState<SlopeLevel[]>([]);
  const [presentationText, setPresentationText] = useState("");
  const [result, setResult] = useState<AdaptiveTestResult | null>(null);
  /** Contrôle le RadioGroup : toujours vide jusqu’au clic (évite la sélection fantôme). */
  const [mcqChoice, setMcqChoice] = useState<string>("");
  /** Désactive le hover tant que le pointeur n’a pas bougé (évite la ligne « plus foncée » sous le curseur). */
  const [mcqHoverReady, setMcqHoverReady] = useState(false);
  /** Bloque les clics brièvement après un changement de question (anti ghost-click). */
  const [mcqInputLocked, setMcqInputLocked] = useState(false);
  const startedAtRef = useRef<string | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const slopeResultsRef = useRef<SlopeResult[]>([]);
  const passedSlopesRef = useRef<SlopeLevel[]>([]);
  const advancingRef = useRef(false);

  const { data: allQuestions = [], isLoading } = usePlacementQuestions(data.language);

  const scoredQuestions = useMemo(
    () => allQuestions.filter((q) => q.slope !== "presentation"),
    [allQuestions]
  );

  const slopeQuestions = useMemo(
    () => getQuestionsForSlope(allQuestions, currentSlope),
    [allQuestions, currentSlope]
  );

  const presentationQuestion = useMemo(
    () => getPresentationQuestion(allQuestions),
    [allQuestions]
  );

  const currentQuestion: PlacementQuestion | undefined = slopeQuestions[questionIndex];

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    slopeResultsRef.current = slopeResults;
  }, [slopeResults]);
  useEffect(() => {
    passedSlopesRef.current = passedSlopes;
  }, [passedSlopes]);

  /** Nouvelle question : reset sélection + anti-hover sticky + anti ghost-click. */
  useEffect(() => {
    setMcqChoice("");
    setMcqHoverReady(false);
    advancingRef.current = false;
    setMcqInputLocked(true);
    const unlock = window.setTimeout(() => setMcqInputLocked(false), 150);
    return () => window.clearTimeout(unlock);
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (phase === "mcq" && !startedAtRef.current) {
      startedAtRef.current = new Date().toISOString();
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "presentation" || presentationQuestion) return;
    const testResult = buildAdaptiveTestResult(
      allQuestions,
      answers,
      slopeResults,
      passedSlopes,
      ""
    );
    setResult(testResult);
    const completedAt = new Date().toISOString();
    onUpdate({
      hasBeenEvaluated: false,
      testScore: Math.round(
        (testResult.correctAnswers / Math.max(testResult.totalAnswered, 1)) * 100
      ),
      correctAnswers: testResult.correctAnswers,
      totalAnswered: testResult.totalAnswered,
      currentLevel: testResult.determinedLevel,
      needsAdminCall: testResult.needsAdminCall,
      testAnswers: testResult.answers,
      testSummary: {
        slopeResults: testResult.slopeResults,
        passedSlopes: testResult.passedSlopes,
        highestSlopeReached: testResult.highestSlopeReached,
        vocabScore: testResult.vocabScore,
        vocabAnswers: testResult.vocabAnswers,
        presentationText: testResult.presentationText,
        startedAt: startedAtRef.current,
        completedAt,
      },
    });
    setPhase("results");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot bank fallback
  }, [phase, presentationQuestion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const startAutoDiagnostic = () => {
    setPhase("auto_diagnostic");
  };

  const handleAutoDiagnosticComplete = (diagAnswers: AutoDiagnosticAnswers) => {
    const payload = buildAutoDiagnosticPayload(diagAnswers);
    const expectations = expectationsFromAutoDiagnostic(diagAnswers);
    onUpdate({
      autoDiagnostic: payload,
      ...(expectations ? { expectations } : {}),
    });
    setPhase("mcq");
    setCurrentSlope("verte");
    setQuestionIndex(0);
    setAnswers({});
    setSlopeResults([]);
    setPassedSlopes([]);
    setPresentationText("");
    setResult(null);
    startedAtRef.current = null;
    answersRef.current = {};
    slopeResultsRef.current = [];
    passedSlopesRef.current = [];
    advancingRef.current = false;
    setMcqChoice("");
  };

  const startMcq = () => {
    if (scoredQuestions.length === 0) return;
    if (!data.autoDiagnostic) {
      setPhase("auto_diagnostic");
      return;
    }
    setPhase("mcq");
    setCurrentSlope("verte");
    setQuestionIndex(0);
    setAnswers({});
    setSlopeResults([]);
    setPassedSlopes([]);
    setPresentationText("");
    setResult(null);
    startedAtRef.current = null;
    answersRef.current = {};
    slopeResultsRef.current = [];
    passedSlopesRef.current = [];
    advancingRef.current = false;
    setMcqChoice("");
  };

  const finishTest = (
    finalAnswers: Record<string, string>,
    finalSlopeResults: SlopeResult[],
    finalPassedSlopes: SlopeLevel[],
    finalPresentation: string
  ) => {
    const testResult = buildAdaptiveTestResult(
      allQuestions,
      finalAnswers,
      finalSlopeResults,
      finalPassedSlopes,
      finalPresentation
    );
    setResult(testResult);
    const completedAt = new Date().toISOString();
    onUpdate({
      hasBeenEvaluated: false,
      testScore: Math.round((testResult.correctAnswers / Math.max(testResult.totalAnswered, 1)) * 100),
      correctAnswers: testResult.correctAnswers,
      totalAnswered: testResult.totalAnswered,
      currentLevel: testResult.determinedLevel,
      needsAdminCall: testResult.needsAdminCall,
      testAnswers: testResult.answers,
      testSummary: {
        slopeResults: testResult.slopeResults,
        passedSlopes: testResult.passedSlopes,
        highestSlopeReached: testResult.highestSlopeReached,
        vocabScore: testResult.vocabScore,
        vocabAnswers: testResult.vocabAnswers,
        presentationText: testResult.presentationText,
        startedAt: startedAtRef.current,
        completedAt,
      },
    });
    setPhase("results");
  };

  const goToPresentation = (
    finalAnswers: Record<string, string>,
    finalSlopeResults: SlopeResult[],
    finalPassedSlopes: SlopeLevel[]
  ) => {
    setAnswers(finalAnswers);
    setSlopeResults(finalSlopeResults);
    setPassedSlopes(finalPassedSlopes);
    setPhase("presentation");
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

    slopeResultsRef.current = newSlopeResults;
    passedSlopesRef.current = newPassedSlopes;
    answersRef.current = slopeAnswers;
    setSlopeResults(newSlopeResults);
    setPassedSlopes(newPassedSlopes);
    setAnswers(slopeAnswers);

    // Échec (ou noire validée) → vocab ; sinon piste suivante.
    setCurrentSlope(next === "vocab_ski" ? "vocab_ski" : next);
    setQuestionIndex(0);
  };

  const selectAnswer = (answer: string) => {
    if (!currentQuestion || advancingRef.current) return;
    // Verrouille immédiatement : le même clic ne doit pas retomber sur la question suivante.
    advancingRef.current = true;

    const questionId = currentQuestion.id;
    const slopeAtClick = currentSlope;
    const indexAtClick = questionIndex;
    const questionsAtClick = slopeQuestions;
    const newAnswers = { ...answersRef.current, [questionId]: answer };
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
    setMcqChoice(""); // aucune option sélectionnée pendant la transition

    // Différer le changement d’écran après la fin du geste pointeur (anti ghost-click).
    window.setTimeout(() => {
      if (indexAtClick < questionsAtClick.length - 1) {
        setQuestionIndex(indexAtClick + 1);
        return;
      }

      if (slopeAtClick === "vocab_ski") {
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
        const nextResults = [...slopeResultsRef.current, vocabResult];
        slopeResultsRef.current = nextResults;
        goToPresentation(newAnswers, nextResults, passedSlopesRef.current);
        return;
      }

      completeSlope(
        slopeAtClick,
        newAnswers,
        slopeResultsRef.current,
        passedSlopesRef.current
      );
    }, 0);
  };

  const submitPresentation = () => {
    finishTest(answers, slopeResults, passedSlopes, presentationText.trim());
  };

  if (phase === "auto_diagnostic") {
    return (
      <AutoDiagnosticForm
        languageKey={data.language}
        initialAnswers={data.autoDiagnostic?.answers}
        onComplete={handleAutoDiagnosticComplete}
      />
    );
  }

  if (phase === "results" && result) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <StepCard
          title={
            <span className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 shrink-0 text-[hsl(var(--status-good))]" aria-hidden />
              Test terminé
            </span>
          }
          description="Votre parcours adaptatif FLI est enregistré"
        >
          <div className="space-y-6">
            <SummaryPanel className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">Votre piste</p>
              <div className="flex justify-center">
                <StatusPill
                  tone={
                    SLOPE_TONES[
                      (result.passedSlopes[result.passedSlopes.length - 1] as SlopeLevel) ||
                        "verte"
                    ]
                  }
                  className="px-4 py-1.5 text-base"
                >
                  {studentFacingPisteLabel({
                    passedSlopes: result.passedSlopes,
                    highestSlopeReached: result.highestSlopeReached,
                  })}
                </StatusPill>
              </div>
            </SummaryPanel>

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
            {data.profession === "ski_instructor"
              ? "Continuer vers le paiement"
              : "Continuer vers la certification"}
          </Button>
        </StepActions>
      </form>
    );
  }

  if (phase === "presentation" && presentationQuestion) {
    return (
      <SurfaceCard
        title="Présentation (facultative)"
        description="Quelques phrases dans la langue du test — lues par le formateur avant la 1re séance"
      >
        <div className="space-y-4">
          <p className="text-base leading-snug text-foreground">
            {presentationQuestion.question_text}
          </p>
          <Textarea
            value={presentationText}
            onChange={(e) =>
              setPresentationText(e.target.value.slice(0, PRESENTATION_MAX_CHARS))
            }
            maxLength={PRESENTATION_MAX_CHARS}
            className="min-h-[140px]"
            placeholder="Votre présentation (facultatif)"
          />
          <p className="text-xs text-muted-foreground tabular-nums">
            {presentationText.length}/{PRESENTATION_MAX_CHARS}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={submitPresentation}>
              Passer
            </Button>
            <Button type="button" onClick={submitPresentation}>
              Terminer le test
            </Button>
          </div>
        </div>
      </SurfaceCard>
    );
  }

  if (phase === "presentation" && !presentationQuestion) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Finalisation…
      </div>
    );
  }

  if (phase === "mcq") {
    if (!currentQuestion) {
      return (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Préparation du test de niveau…
        </div>
      );
    }

    const questionNumber = questionIndex + 1;
    const questionsInSlope = slopeQuestions.length;
    const slopeLabelLower = SLOPE_LABELS[currentSlope].toLowerCase();
    const progressLabel = `${questionNumber}/${questionsInSlope} ${slopeLabelLower}`;
    const progressValue = (questionNumber / questionsInSlope) * 100;
    const options = currentQuestion.options ?? [];

    return (
      <SurfaceCard
        title="Test de niveau adaptatif"
        description={
          currentSlope === "vocab_ski"
            ? "Partie commune à tous les niveaux — vocabulaire technique du ski"
            : `Comme au ski : ${QUESTIONS_PER_SLOPE} questions sur cette piste. Il faut au moins ${PASS_THRESHOLD} bonnes réponses pour passer à la suivante.`
        }
        actions={
          <StatusPill tone={SLOPE_TONES[currentSlope]} dot>
            {SLOPE_LABELS[currentSlope]}
          </StatusPill>
        }
        toolbar={
          <MeterRow
            label="Progression"
            value={progressValue}
            display={progressLabel}
          />
        }
      >
        <div
          className="space-y-5"
          onPointerMove={() => {
            if (!mcqHoverReady) setMcqHoverReady(true);
            if (mcqInputLocked) setMcqInputLocked(false);
          }}
        >
          <div className="rounded-[var(--radius-card)] bg-[hsl(var(--surface-sunken))] p-4 sm:p-5">
            <p className="text-lg font-medium leading-snug text-balance text-foreground">
              {currentQuestion.question_text}
            </p>
          </div>

          {/* value = index (pas le texte) : « je ne sais pas » ne reste plus coché d’une question à l’autre.
              Délai d’avance + lock 150ms : le clic ne retombe pas sur la même ligne de la question suivante. */}
          <RadioGroup
            key={currentQuestion.id}
            value={mcqChoice}
            onValueChange={(value) => {
              if (mcqInputLocked || advancingRef.current) return;
              const option = options[Number(value)];
              if (!option) return;
              setMcqChoice(value);
              selectAnswer(option);
            }}
            className={`space-y-3 ${mcqInputLocked ? "pointer-events-none" : ""}`}
            aria-label={currentQuestion.question_text}
          >
            {options.map((option, index) => (
              <div
                key={`${currentQuestion.id}-${index}`}
                className={
                  mcqHoverReady
                    ? "rounded-[var(--radius-card)] border border-border bg-card transition-colors hover:bg-[hsl(var(--surface-sunken))]"
                    : "rounded-[var(--radius-card)] border border-border bg-card"
                }
              >
                <Label
                  htmlFor={`option-${currentQuestion.id}-${index}`}
                  className="flex min-h-14 cursor-pointer items-center gap-3 p-4 text-base font-normal leading-snug"
                >
                  <RadioGroupItem
                    value={String(index)}
                    id={`option-${currentQuestion.id}-${index}`}
                    className="shrink-0"
                  />
                  <span className="min-w-0">{option}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </SurfaceCard>
    );
  }

  const autoDone = Boolean(data.autoDiagnostic);

  return (
    <StepCard
      title="Test de niveau obligatoire"
      description="D’abord un auto-diagnostic, puis le parcours adaptatif par pistes de ski"
      icon={Mountain}
    >
      <div className="space-y-5">
        <Alert>
          <Mountain className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <p>
              <strong className="font-medium text-foreground">1. Auto-diagnostic</strong> — vos
              besoins, votre parcours et votre aisance. Il prépare l’équipe FLI et ne remplace pas
              le test.
            </p>
            <p>
              <strong className="font-medium text-foreground">2. Test de niveau</strong> — où vous
              commencez en{" "}
              <strong className="font-medium text-foreground">piste verte</strong>, puis{" "}
              <strong className="font-medium text-foreground">bleue</strong>,{" "}
              <strong className="font-medium text-foreground">rouge</strong> et{" "}
              <strong className="font-medium text-foreground">noire</strong> si vous validez chaque
              étape ({PASS_THRESHOLD} bonnes réponses sur {QUESTIONS_PER_SLOPE}).
            </p>
            <p>
              Ensuite, tous les stagiaires passent le{" "}
              <strong className="font-medium text-foreground">Vocabulaire du ski</strong> (score
              séparé), puis une présentation facultative. Comment ça fonctionne : comme les pistes
              de ski.
            </p>
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
        ) : scoredQuestions.length === 0 ? (
          <Alert variant="destructive">
            <AlertDescription>
              Le test n&apos;est pas disponible pour cette langue pour le moment. Merci de
              contacter FLI à info@fli.fr.
            </AlertDescription>
          </Alert>
        ) : autoDone ? (
          <div className="space-y-3">
            <Alert>
              <ClipboardList className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Auto-diagnostic enregistré. Vous pouvez passer au test de niveau.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={startAutoDiagnostic}
                className="h-12 w-full text-base sm:w-auto"
              >
                Modifier l&apos;auto-diagnostic
              </Button>
              <Button type="button" onClick={startMcq} className="h-12 w-full text-base sm:w-auto">
                Commencer le test (piste verte)
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" onClick={startAutoDiagnostic} className="h-12 w-full text-base">
            Commencer l&apos;auto-diagnostic
          </Button>
        )}
      </div>
    </StepCard>
  );
}
