import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, Phone, Sun, Sunset } from "lucide-react";
import type { RegistrationData } from "@/pages/register/Index";
import { usePlacementQuestions } from "@/hooks/usePlacementQuestions";
import {
  countCorrectAnswers,
  determineLevelFromAnswers,
  getTimeSlotFromScore,
  needsAdminCall,
  PLACEMENT_TEST_QUESTION_COUNT,
} from "@/lib/registration-utils";

interface PlacementTestStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function PlacementTestStep({ data, onUpdate, onNext }: PlacementTestStepProps) {
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [result, setResult] = useState<{
    correctAnswers: number;
    level: string;
    timeSlot: "matin" | "apres-midi";
    needsCall: boolean;
  } | null>(null);

  const { data: questions = [], isLoading } = usePlacementQuestions(data.language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const startTest = () => {
    if (questions.length < PLACEMENT_TEST_QUESTION_COUNT) return;
    setTestStarted(true);
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
  };

  const selectAnswer = (answer: string) => {
    const question = questions[currentQuestion];
    if (!question) return;

    const newAnswers = { ...answers, [question.id]: answer };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      return;
    }

    const correctAnswers = countCorrectAnswers(questions, newAnswers);
    const level = determineLevelFromAnswers(questions, newAnswers);
    const timeSlot = getTimeSlotFromScore(correctAnswers);
    const callRequired = needsAdminCall(correctAnswers);

    const testResult = { correctAnswers, level, timeSlot, needsCall: callRequired };
    setResult(testResult);
    onUpdate({
      testScore: Math.round((correctAnswers / PLACEMENT_TEST_QUESTION_COUNT) * 100),
      correctAnswers,
      currentLevel: level,
      timeSlot,
      needsAdminCall: callRequired,
      testAnswers: newAnswers,
    });
    setTestCompleted(true);
  };

  if (testCompleted && result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            Test terminé
          </CardTitle>
          <CardDescription>Votre test de niveau a été évalué</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">Niveau estimé</p>
              <Badge className="text-xl px-4 py-1">{result.level}</Badge>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">Score</p>
              <p className="text-2xl font-bold">{result.correctAnswers}/{PLACEMENT_TEST_QUESTION_COUNT}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">Créneau suggéré</p>
              <Badge variant="outline" className="text-base px-3 py-1 gap-1">
                {result.timeSlot === "matin" ? (
                  <><Sun className="h-4 w-4" /> Matin</>
                ) : (
                  <><Sunset className="h-4 w-4" /> Après-midi</>
                )}
              </Badge>
            </div>
          </div>

          {result.needsCall && (
            <Alert variant="destructive">
              <Phone className="h-4 w-4" />
              <AlertDescription>
                Votre score est faible. Notre équipe vous contactera par téléphone pour mieux
                évaluer votre niveau avant l'allocation en groupe.
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground text-center">
            {result.timeSlot === "matin"
              ? "Score 0-10 : vous serez orienté vers un groupe du matin."
              : "Score 11-20 : vous serez orienté vers un groupe de l'après-midi."}
          </p>

          <Button onClick={handleSubmit} className="w-full">
            Continuer vers les attentes
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (testStarted && questions.length > 0) {
    const question = questions[currentQuestion];
    const progress = (currentQuestion / questions.length) * 100;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Test de niveau</CardTitle>
            <Badge variant="outline">
              Question {currentQuestion + 1} sur {questions.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{question.level}</Badge>
            <Progress value={progress} className="mt-2 flex-1" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-lg font-medium">{question.question_text}</p>
          </div>

          <RadioGroup
            onValueChange={selectAnswer}
            className="space-y-3"
          >
            {question.options.map((option, index) => (
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
          Nous devons évaluer votre niveau pour vous orienter vers le bon groupe
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
                  <p className="text-sm text-muted-foreground">
                    J'ai déjà été évalué et je connais mon niveau
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="false" id="evaluated-no" />
                <div className="flex-1">
                  <Label htmlFor="evaluated-no" className="font-medium cursor-pointer">
                    Non, je souhaite passer le test
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {PLACEMENT_TEST_QUESTION_COUNT} questions — environ 10 minutes
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
              <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
                <p>
                  Le test comporte <strong>{PLACEMENT_TEST_QUESTION_COUNT} questions</strong> avec
                  une difficulté progressive (A1 → C1).
                </p>
                <p>
                  <strong>0-10 bonnes réponses</strong> → groupe du matin ·{" "}
                  <strong>11-20</strong> → groupe de l'après-midi
                </p>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={startTest}
                  className="w-full"
                  disabled={questions.length < PLACEMENT_TEST_QUESTION_COUNT}
                >
                  Commencer le test de niveau
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
