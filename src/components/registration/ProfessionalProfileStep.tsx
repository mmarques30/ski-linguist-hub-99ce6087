import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Briefcase } from "lucide-react";
import type { RegistrationData } from "@/pages/register/Index";
import { OptionCard, StepActions, StepCard } from "./StepLayout";

interface ProfessionalProfileStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

export function ProfessionalProfileStep({ data, onUpdate, onNext }: ProfessionalProfileStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StepCard
        title="Profil professionnel"
        description="Parlez-nous de votre expérience professionnelle"
        icon={Briefcase}
      >
        <div className="space-y-6">
          {/* Profession */}
          <div className="space-y-3">
            <Label>Quelle est votre profession ?</Label>
            <RadioGroup
              value={data.profession || ""}
              onValueChange={(value) => onUpdate({ profession: value as "ski_instructor" | "other" })}
              className="space-y-3"
            >
              <OptionCard selected={data.profession === "ski_instructor"}>
                <Label
                  htmlFor="ski_instructor"
                  className="flex cursor-pointer items-start gap-3 p-4 font-normal"
                >
                  <RadioGroupItem value="ski_instructor" id="ski_instructor" className="mt-0.5" />
                  <span className="min-w-0 space-y-1">
                    <span className="block font-medium text-foreground">Moniteur de ski</span>
                    <span className="block text-sm text-muted-foreground">
                      Je travaille comme moniteur de ski dans une école française
                    </span>
                  </span>
                </Label>
              </OptionCard>
              <OptionCard selected={data.profession === "other"}>
                <Label htmlFor="other" className="flex cursor-pointer items-start gap-3 p-4 font-normal">
                  <RadioGroupItem value="other" id="other" className="mt-0.5" />
                  <span className="min-w-0 space-y-1">
                    <span className="block font-medium text-foreground">Autre profession</span>
                    <span className="block text-sm text-muted-foreground">J'ai une autre profession</span>
                  </span>
                </Label>
              </OptionCard>
            </RadioGroup>
          </div>

          {/* École de ski - Afficher uniquement pour les moniteurs */}
          {data.profession === "ski_instructor" && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
              <Label htmlFor="skiSchool">École de ski</Label>
              <Input
                id="skiSchool"
                value={data.skiSchool || ""}
                onChange={(e) => onUpdate({ skiSchool: e.target.value })}
                placeholder="ex : ESF Val d'Isère, ESF Courchevel..."
                className="h-11"
                required
              />
              <p className="text-sm text-muted-foreground">Entrez le nom de votre école de ski</p>
            </div>
          )}

          {data.profession === "other" && (
            <div className="animate-in fade-in slide-in-from-top-2 rounded-[var(--radius-card)] bg-[hsl(var(--surface-sunken))] p-4">
              <p className="text-sm text-muted-foreground">
                Nos programmes de formation sont principalement conçus pour les moniteurs de ski.
                Veuillez nous contacter directement à{" "}
                <span className="font-medium text-foreground">info@fli.fr</span> pour discuter de vos
                besoins spécifiques.
              </p>
            </div>
          )}
        </div>
      </StepCard>

      <StepActions>
        <Button
          type="submit"
          className="h-12 w-full text-base sm:w-auto"
          disabled={!data.profession || (data.profession === "ski_instructor" && !data.skiSchool)}
        >
          Continuer vers le test de niveau
        </Button>
      </StepActions>
    </form>
  );
}
