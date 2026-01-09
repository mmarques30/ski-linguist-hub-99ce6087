import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RegistrationData } from "@/pages/register/Index";

interface ExpectationsStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

const certifications = [
  {
    value: "linguaskill",
    label: "Linguaskill",
    description: "Certificação Cambridge English reconhecida mundialmente",
  },
  {
    value: "bright",
    label: "Bright Language",
    description: "Certificação de avaliação de idiomas profissional",
  },
  {
    value: "none",
    label: "Sem certificação",
    description: "Não preciso de certificação no momento",
  },
];

export function ExpectationsStep({ data, onUpdate, onNext }: ExpectationsStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expectativas e Certificação</CardTitle>
        <CardDescription>
          Conte-nos sobre seus objetivos para esta formação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Expectations */}
          <div className="space-y-2">
            <Label htmlFor="expectations">Quais são suas expectativas para esta formação?</Label>
            <Textarea
              id="expectations"
              value={data.expectations || ""}
              onChange={(e) => onUpdate({ expectations: e.target.value })}
              placeholder="Descreva o que você espera alcançar com esta formação em idiomas..."
              className="min-h-[120px]"
            />
            <p className="text-sm text-muted-foreground">
              Isso nos ajuda a adaptar a formação às suas necessidades específicas
            </p>
          </div>

          {/* Certification */}
          <div className="space-y-3">
            <Label>Gostaria de obter uma certificação?</Label>
            <RadioGroup
              value={data.certification || ""}
              onValueChange={(value) => onUpdate({ certification: value })}
              className="space-y-3"
            >
              {certifications.map((cert) => (
                <div
                  key={cert.value}
                  className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={cert.value} id={cert.value} />
                  <div className="flex-1">
                    <Label htmlFor={cert.value} className="font-medium cursor-pointer">
                      {cert.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {cert.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={!data.certification}
          >
            Continuar para Confirmação
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
