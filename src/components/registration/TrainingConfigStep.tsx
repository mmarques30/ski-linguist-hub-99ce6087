import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";
import type { RegistrationData } from "@/pages/register/Index";
import { REGISTRATION_LANGUAGES } from "@/lib/registration-languages";
import { OptionCard, StepActions, StepCard } from "./StepLayout";

interface TrainingConfigStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

const durations = [
  { value: "6h", label: "6 heures", price: "150" },
  { value: "12h", label: "12 heures", price: "300" },
  { value: "15h", label: "15 heures", price: "375" },
  { value: "18h", label: "18 heures", price: "450" },
  { value: "20h", label: "20 heures", price: "500" },
];

const locations = [
  { value: "valdisere", label: "Val d'Isère" },
  { value: "courchevel", label: "Courchevel" },
  { value: "meribel", label: "Méribel" },
  { value: "lesarcs", label: "Les Arcs" },
  { value: "chamonix", label: "Chamonix" },
];

const modalities = [
  { value: "in_person", label: "Présentiel" },
  { value: "online_individual", label: "En ligne (Individuel)" },
  { value: "online_group", label: "En ligne (Groupe)" },
];

export function TrainingConfigStep({ data, onUpdate, onNext }: TrainingConfigStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StepCard
        title="Configuration de la formation"
        description="Sélectionnez vos préférences de formation"
        icon={SlidersHorizontal}
      >
        <div className="space-y-6">
          {/* Type de financement */}
          <div className="space-y-3">
            <Label>Mode de financement</Label>
            <RadioGroup
              value={data.fundingType || ""}
              onValueChange={(value) => onUpdate({ fundingType: value })}
              className="space-y-2"
            >
              <OptionCard selected={data.fundingType === "fifpl"}>
                <Label
                  htmlFor="fifpl"
                  className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                >
                  <RadioGroupItem value="fifpl" id="fifpl" />
                  FIFPL (Financé par le FIFPL)
                </Label>
              </OptionCard>
              <OptionCard selected={data.fundingType === "opco"}>
                <Label htmlFor="opco" className="flex cursor-pointer flex-col gap-1 px-4 py-3 font-normal">
                  <span className="flex min-h-6 items-center gap-3">
                    <RadioGroupItem value="opco" id="opco" />
                    OPCO (Financé par votre OPCO)
                  </span>
                  <span className="block pl-7 text-xs text-muted-foreground">
                    Contactez FLI pour les modalités de prise en charge. Aucun frais de dossier
                    automatique à cette étape.
                  </span>
                </Label>
              </OptionCard>
              <OptionCard selected={data.fundingType === "company"}>
                <Label
                  htmlFor="company"
                  className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                >
                  <RadioGroupItem value="company" id="company" />
                  Entreprise (L'école de ski paie)
                </Label>
              </OptionCard>
              <OptionCard selected={data.fundingType === "self"}>
                <Label
                  htmlFor="self"
                  className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                >
                  <RadioGroupItem value="self" id="self" />
                  Autofinancement
                </Label>
              </OptionCard>
            </RadioGroup>
          </div>

          {/* Modalité */}
          <div className="space-y-3">
            <Label>Modalité de formation</Label>
            <RadioGroup
              value={data.modality || ""}
              onValueChange={(value) => onUpdate({ modality: value })}
              className="grid gap-2 sm:grid-cols-3"
            >
              {modalities.map((modality) => (
                <OptionCard key={modality.value} selected={data.modality === modality.value}>
                  <Label
                    htmlFor={modality.value}
                    className="flex min-h-12 cursor-pointer items-center gap-2.5 px-3 py-3 font-normal"
                  >
                    <RadioGroupItem value={modality.value} id={modality.value} />
                    <span className="min-w-0">{modality.label}</span>
                  </Label>
                </OptionCard>
              ))}
            </RadioGroup>
          </div>

          {/* Langue */}
          <div className="space-y-2">
            <Label>Langue à apprendre</Label>
            <Select
              value={data.language || ""}
              onValueChange={(value) => onUpdate({ language: value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Sélectionnez une langue" />
              </SelectTrigger>
              <SelectContent>
                {REGISTRATION_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Durée */}
          <div className="space-y-3">
            <Label>Durée de la formation</Label>
            <RadioGroup
              value={data.duration || ""}
              onValueChange={(value) => onUpdate({ duration: value })}
              className="grid gap-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
            >
              {durations.map((duration) => (
                <OptionCard key={duration.value} selected={data.duration === duration.value}>
                  <RadioGroupItem value={duration.value} id={duration.value} className="sr-only" />
                  <Label
                    htmlFor={duration.value}
                    className="flex min-h-16 w-full cursor-pointer flex-col items-center justify-center gap-0.5 p-3 text-center"
                  >
                    <span className="block font-semibold text-foreground">{duration.label}</span>
                    <span className="block text-sm tabular text-muted-foreground">
                      {duration.price} EUR
                    </span>
                  </Label>
                </OptionCard>
              ))}
            </RadioGroup>
          </div>

          {/* Lieu - Uniquement pour le présentiel */}
          {data.modality === "in_person" && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
              <Label>Lieu de la formation</Label>
              <Select
                value={data.location || ""}
                onValueChange={(value) => onUpdate({ location: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Sélectionnez un lieu" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.value} value={loc.value}>
                      {loc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </StepCard>

      <StepActions>
        <Button
          type="submit"
          className="h-12 w-full text-base sm:w-auto"
          disabled={!data.fundingType || !data.modality || !data.language || !data.duration}
        >
          Continuer vers le test de niveau
        </Button>
      </StepActions>
    </form>
  );
}
