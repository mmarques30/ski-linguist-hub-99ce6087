import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle } from "lucide-react";
import type { RegistrationData } from "@/pages/register/Index";

interface PlacementTestStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Sample questions - will be replaced with actual questions from the database
const sampleQuestions = [
  {
    id: 1,
    question: "_____ name is John.",
    options: ["My", "I", "Me", "Mine"],
    correct: 0,
  },
  {
    id: 2,
    question: "She _____ to work every day.",
    options: ["go", "goes", "going", "gone"],
    correct: 1,
  },
  {
    id: 3,
    question: "They _____ tennis yesterday.",
    options: ["play", "plays", "played", "playing"],
    correct: 2,
  },
  {
    id: 4,
    question: "The ski bindings are _____.",
    options: ["tight", "lose", "soft", "quick"],
    correct: 0,
  },
  {
    id: 5,
    question: "Be careful not to hurt your _____ when skiing.",
    options: ["ankles", "angels", "angles", "anchors"],
    correct: 0,
  },
];

export function PlacementTestStep({ data, onUpdate, onNext }: PlacementTestStepProps) {
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [testCompleted, setTestCompleted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const startTest = () => {
    setTestStarted(true);
    setCurrentQuestion(0);
    setAnswers([]);
  };

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      const correctAnswers = newAnswers.filter(
        (answer, index) => answer === sampleQuestions[index].correct
      ).length;
      const score = Math.round((correctAnswers / sampleQuestions.length) * 100);
      
      // Determine level based on score
      let level = "A1";
      if (score >= 90) level = "C1";
      else if (score >= 75) level = "B2";
      else if (score >= 60) level = "B1";
      else if (score >= 40) level = "A2";
      
      onUpdate({ testScore: score, currentLevel: level, hasBeenEvaluated: true });
      setTestCompleted(true);
    }
  };

  if (testCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            Teste Concluído
          </CardTitle>
          <CardDescription>
            Seu teste de nível foi avaliado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground mb-2">Seu Nível</p>
            <Badge className="text-2xl px-6 py-2">{data.currentLevel}</Badge>
            <p className="mt-4 text-sm text-muted-foreground">
              Pontuação: {data.testScore}%
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Com base nos seus resultados, você será alocado em um grupo correspondente ao seu nível.
          </p>

          <Button onClick={handleSubmit} className="w-full">
            Continuar para Expectativas
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (testStarted) {
    const question = sampleQuestions[currentQuestion];
    const progress = ((currentQuestion) / sampleQuestions.length) * 100;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Teste de Nível</CardTitle>
            <Badge variant="outline">
              Pergunta {currentQuestion + 1} de {sampleQuestions.length}
            </Badge>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-lg font-medium">{question.question}</p>
          </div>

          <RadioGroup
            onValueChange={(value) => selectAnswer(parseInt(value))}
            className="space-y-3"
          >
            {question.options.map((option, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
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
        <CardTitle>Teste de Nível</CardTitle>
        <CardDescription>
          Precisamos avaliar seu nível atual para alocá-lo no grupo correto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Already evaluated option */}
          <div className="space-y-3">
            <Label>Você já foi avaliado anteriormente?</Label>
            <RadioGroup
              value={data.hasBeenEvaluated?.toString() || ""}
              onValueChange={(value) => onUpdate({ hasBeenEvaluated: value === "true" })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="true" id="evaluated-yes" />
                <div className="flex-1">
                  <Label htmlFor="evaluated-yes" className="font-medium cursor-pointer">
                    Sim, eu sei meu nível
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Já fui avaliado e conheço meu nível CEFR
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="false" id="evaluated-no" />
                <div className="flex-1">
                  <Label htmlFor="evaluated-no" className="font-medium cursor-pointer">
                    Não, preciso fazer o teste
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Gostaria de fazer o teste de nível agora
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Level selection if already evaluated */}
          {data.hasBeenEvaluated === true && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <Label>Qual é o seu nível atual?</Label>
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

          {/* Start test button */}
          {data.hasBeenEvaluated === false && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm">
                  O teste de nível consiste em <strong>{sampleQuestions.length} perguntas</strong> cobrindo 
                  gramática, vocabulário e terminologia específica de esqui. Leva aproximadamente 5-10 minutos.
                </p>
              </div>
              <Button type="button" onClick={startTest} className="w-full">
                Iniciar Teste de Nível
              </Button>
            </div>
          )}

          {/* Continue button for those who already know their level */}
          {data.hasBeenEvaluated === true && data.currentLevel && (
            <Button type="submit" className="w-full">
              Continuar para Expectativas
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
