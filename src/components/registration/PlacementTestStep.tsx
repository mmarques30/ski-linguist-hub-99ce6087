import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, Phone, Mountain } from "lucide-react";
import type { RegistrationData } from "@/pages/register/Index";
import { usePlacementQuestions } from "@/hooks/usePlacementQuestions";
import {
  buildAdaptiveTestResult,
  evaluateSlope,
  getNextSlopeAfterSlope,
  getQuestionsForSlope,
  QUESTIONS_PER_SLOPE,
  SLOPE_COLORS,
  SLOPE_LABELS,
  type AdaptiveTestResult,
  type PlacementQuestion,
  type SlopeLevel,
  type SlopeResult,
} from "@/lib/placement-test-engine";

interface PlacementTestStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function PlacementTestStep({ data, onUpdate, onNext }: PlacementTestStepProps) {
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
      testScore: Math.round((testResult.correctAnswers / testResult.totalAnswered) * 100),
      correctAnswers: testResult.correctAnswers,
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            Test terminé
          </CardTitle>
          <CardDescription>Votre niveau a été évalué selon le parcours adaptatif FLI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">Niveau estimé</p>
              <Badge className="text-xl px-4 py-1">{result.determinedLevel}</Badge>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">Score global</p>
              <p className="text-2xl font-bold">
                {result.correctAnswers}/{result.totalAnswered}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Parcours des pistes</p>
            <div className="flex flex-wrap gap-2">
              {result.slopeResults.map((sr) => (
                <Badge
                  key={sr.slope}
                  variant={sr.passed ? "default" : "secondary"}
                  className={sr.passed ? SLOPE_COLORS[sr.slope] : ""}
                >
                  {SLOPE_LABELS[sr.slope]}: {sr.correct}/{sr.total}
                </Badge>
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

          <Alert>
            <Mountain className="h-4 w-4" />
            <AlertDescription>
              L'affectation au groupe du matin ou de l'après-midi sera définie par notre équipe
              environ 10 jours avant le début des cours, après analyse de l'ensemble des inscrits.
            </AlertDescription>
          </Alert>

          <Button onClick={handleSubmit} className="w-full">
            Continuer vers les attentes
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (testStarted && currentQuestion) {
    const progressInSlope = ((questionIndex) / slopeQuestions.length) * 100;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Test de niveau adaptatif</CardTitle>
            <Badge className={SLOPE_COLORS[currentSlope]}>
              {SLOPE_LABELS[currentSlope]}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Question {questionIndex + 1} / {slopeQuestions.length}
            </Badge>
            <Progress value={progressInSlope} className="flex-1" />
          </div>
          <CardDescription>
            {currentSlope === "vocab_ski"
              ? "Vocabulaire technique du ski"
              : `Répondez à ${QUESTIONS_PER_SLOPE} questions — il faut ${QUESTIONS_PER_SLOPE - 2} bonnes réponses ou plus pour passer à la piste suivante`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-lg font-medium">{currentQuestion.question_text}</p>
          </div>

          <RadioGroup onValueChange={selectAnswer} className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="font-normal cursor-pointer flex-1">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test de niveau</CardTitle>
        <CardDescription>
          Test adaptatif par pistes (verte → bleue → rouge → noire)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Avez-vous déjà été évalué ?</Label>
            <RadioGroup
              value={data.hasBeenEvaluated === undefined ? "" : String(data.hasBeenEvaluated)}
              onValueChange={(value) => onUpdate({ hasBeenEvaluated: value === "true" })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="true" id="evaluated-yes" />
                <div className="flex-1">
                  <Label htmlFor="evaluated-yes" className="font-medium cursor-pointer">
                    Oui, je connais mon niveau CEFR
                  </Label>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="false" id="evaluated-no" />
                <div className="flex-1">
                  <Label htmlFor="evaluated-no" className="font-medium cursor-pointer">
                    Non, je souhaite passer le test adaptatif
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Commence par la piste verte — 5 questions par piste, minimum 3 bonnes réponses pour continuer
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {data.hasBeenEvaluated === true && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <Label>Quel est votre niveau actuel ?</Label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {levels.map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={data.currentLevel === level ? "default" : "outline"}
                    onClick={() => onUpdate({ currentLevel: level })}
                    className="w-full"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {data.hasBeenEvaluated === false && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <Alert>
                <Mountain className="h-4 w-4" />
                <AlertDescription>
                  Le groupe matin/après-midi sera attribué par l'équipe FLI environ 10 jours avant
                  le début des cours, après validation par Paula.
                </AlertDescription>
              </Alert>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={startTest}
                  className="w-full"
                  disabled={allQuestions.length === 0}
                >
                  Commencer le test (piste verte)
                </Button>
              )}
            </div>
          )}

          {data.hasBeenEvaluated === true && data.currentLevel && (
            <Button type="submit" className="w-full">
              Continuer vers les attentes
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
