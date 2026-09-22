import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Target } from "lucide-react";
import type { RegistrationData } from "@/pages/register/Index";
import { OptionCard, StepActions, StepCard } from "./StepLayout";

interface ExpectationsStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

const certifications = [
  {
    value: "linguaskill",
    label: "Linguaskill",
    description: "Certification Cambridge English reconnue mondialement",
  },
  {
    value: "bright",
    label: "Bright Language",
    description: "Certification d'évaluation linguistique professionnelle",
  },
  {
    value: "none",
    label: "Sans certification",
    description: "Je n'ai pas besoin de certification pour le moment",
  },
];

export function ExpectationsStep({ data, onUpdate, onNext }: ExpectationsStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StepCard
        title="Attentes et certification"
        description="Parlez-nous de vos objectifs pour cette formation"
        icon={Target}
      >
        <div className="space-y-6">
          {/* Attentes */}
          <div className="space-y-2">
            <Label htmlFor="expectations">Quelles sont vos attentes pour cette formation ?</Label>
            <Textarea
              id="expectations"
              value={data.expectations || ""}
              onChange={(e) => onUpdate({ expectations: e.target.value })}
              placeholder="Décrivez ce que vous espérez accomplir avec cette formation linguistique..."
              className="min-h-[120px]"
            />
            <p className="text-sm text-muted-foreground">
              Cela nous aide à adapter la formation à vos besoins spécifiques
            </p>
          </div>

          {/* Certification */}
          <div className="space-y-3">
            <Label>Souhaitez-vous obtenir une certification ?</Label>
            <RadioGroup
              value={data.certification || ""}
              onValueChange={(value) => onUpdate({ certification: value })}
              className="space-y-3"
            >
              {certifications.map((cert) => (
                <OptionCard key={cert.value} selected={data.certification === cert.value}>
                  <Label htmlFor={cert.value} className="flex cursor-pointer items-start gap-3 p-4 font-normal">
                    <RadioGroupItem value={cert.value} id={cert.value} className="mt-0.5" />
                    <span className="min-w-0 space-y-1">
                      <span className="block font-medium text-foreground">{cert.label}</span>
                      <span className="block text-sm text-muted-foreground">{cert.description}</span>
                    </span>
                  </Label>
                </OptionCard>
              ))}
            </RadioGroup>
          </div>
        </div>
      </StepCard>

      <StepActions>
        <Button type="submit" className="h-12 w-full text-base sm:w-auto" disabled={!data.certification}>
          Continuer vers la confirmation
        </Button>
      </StepActions>
    </form>
  );
}
