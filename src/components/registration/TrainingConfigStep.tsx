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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RegistrationData } from "@/pages/register/Index";
import { REGISTRATION_LANGUAGES } from "@/lib/registration-languages";

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

export function TrainingConfigStep({ data, onUpdate, onNext }: TrainingConfigStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration de la formation</CardTitle>
        <CardDescription>
          Sélectionnez vos préférences de formation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type de financement */}
          <div className="space-y-3">
            <Label>Mode de financement</Label>
            <RadioGroup
              value={data.fundingType || ""}
              onValueChange={(value) => onUpdate({ fundingType: value })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="opco" id="opco" />
                <Label htmlFor="opco" className="font-normal cursor-pointer flex-1">
                  OPCO / FIFPL (Financé par l'organisme)
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="company" id="company" />
                <Label htmlFor="company" className="font-normal cursor-pointer flex-1">
                  Entreprise (L'école de ski paie)
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="self" id="self" />
                <Label htmlFor="self" className="font-normal cursor-pointer flex-1">
                  Autofinancement
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Modalité */}
          <div className="space-y-3">
            <Label>Modalité de formation</Label>
            <RadioGroup
              value={data.modality || ""}
              onValueChange={(value) => onUpdate({ modality: value })}
              className="grid gap-2 md:grid-cols-3"
            >
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="in_person" id="in_person" />
                <Label htmlFor="in_person" className="font-normal cursor-pointer">
                  Présentiel
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="online_individual" id="online_individual" />
                <Label htmlFor="online_individual" className="font-normal cursor-pointer">
                  En ligne (Individuel)
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="online_group" id="online_group" />
                <Label htmlFor="online_group" className="font-normal cursor-pointer">
                  En ligne (Groupe)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Langue */}
          <div className="space-y-2">
            <Label>Langue à apprendre</Label>
            <Select
              value={data.language || ""}
              onValueChange={(value) => onUpdate({ language: value })}
            >
              <SelectTrigger>
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
              className="grid gap-2 md:grid-cols-3 lg:grid-cols-5"
            >
              {durations.map((duration) => (
                <div
                  key={duration.value}
                  className="flex flex-col items-center rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={duration.value} id={duration.value} className="sr-only" />
                  <Label
                    htmlFor={duration.value}
                    className={`cursor-pointer text-center w-full p-2 rounded ${
                      data.duration === duration.value
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }`}
                  >
                    <span className="block font-semibold">{duration.label}</span>
                    <span className="block text-sm opacity-80">{duration.price} EUR</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Lieu - Uniquement pour le présentiel */}
          {data.modality === "in_person" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label>Lieu de la formation</Label>
              <Select
                value={data.location || ""}
                onValueChange={(value) => onUpdate({ location: value })}
              >
                <SelectTrigger>
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

          <Button 
            type="submit" 
            className="w-full"
            disabled={!data.fundingType || !data.modality || !data.language || !data.duration}
          >
            Continuer vers le test de niveau
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
