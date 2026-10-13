import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Award } from "lucide-react";
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

/**
 * Étape certification uniquement.
 * Les attentes viennent de l’auto-diagnostic (Q10) — plus de champ doublon ici.
 * Les moniteurs de ski n’ont pas de certification proposée : l’étape est sautée
 * par le routeur d’inscription (`Index.tsx`).
 */
export function ExpectationsStep({ data, onUpdate, onNext }: ExpectationsStepProps) {
  const isSkiInstructor = data.profession === "ski_instructor";
  const offersCertification = !isSkiInstructor;

  useEffect(() => {
    if (isSkiInstructor) {
      if (data.certification !== "none") {
        onUpdate({ certification: "none" });
      }
      onNext();
    }
  }, [isSkiInstructor, data.certification, onUpdate, onNext]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (offersCertification && !data.certification) return;
    onNext();
  };

  if (isSkiInstructor) {
    return null;
  }

  const canContinue = Boolean(data.certification);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StepCard
        title="Certification"
        description="Souhaitez-vous une certification en fin de formation ?"
        icon={Award}
      >
        <div className="space-y-3">
          <Label>Choix de certification</Label>
          <RadioGroup
            value={data.certification || ""}
            onValueChange={(value) => onUpdate({ certification: value })}
            className="space-y-3"
          >
            {certifications.map((cert) => (
              <OptionCard key={cert.value} selected={data.certification === cert.value}>
                <Label
                  htmlFor={cert.value}
                  className="flex cursor-pointer items-start gap-3 p-4 font-normal"
                >
                  <RadioGroupItem value={cert.value} id={cert.value} className="mt-0.5" />
                  <span className="min-w-0 space-y-1">
                    <span className="block font-medium text-foreground">{cert.label}</span>
                    <span className="block text-sm text-muted-foreground">
                      {cert.description}
                    </span>
                  </span>
                </Label>
              </OptionCard>
            ))}
          </RadioGroup>
        </div>
      </StepCard>

      <StepActions>
        <Button
          type="submit"
          className="h-12 w-full text-base sm:w-auto"
          disabled={!canContinue}
        >
          Continuer vers le paiement
        </Button>
      </StepActions>
    </form>
  );
}
