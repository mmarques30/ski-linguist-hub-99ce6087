import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { UserRound } from "lucide-react";
import type { RegistrationData } from "@/pages/register/Index";
import { OptionCard, StepActions, StepCard } from "./StepLayout";

interface PersonalInfoStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

export function PersonalInfoStep({ data, onUpdate, onNext }: PersonalInfoStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StepCard
        title="Informations personnelles"
        description="Veuillez renseigner vos informations personnelles pour l'inscription"
        icon={UserRound}
      >
        <div className="space-y-6">
          {/* Civilité */}
          <div className="space-y-3">
            <Label>Civilité</Label>
            <RadioGroup
              value={data.civility || ""}
              onValueChange={(value) => onUpdate({ civility: value })}
              className="grid gap-2 xs:grid-cols-2"
            >
              <OptionCard selected={data.civility === "madame"}>
                <Label
                  htmlFor="madame"
                  className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                >
                  <RadioGroupItem value="madame" id="madame" />
                  Madame
                </Label>
              </OptionCard>
              <OptionCard selected={data.civility === "monsieur"}>
                <Label
                  htmlFor="monsieur"
                  className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                >
                  <RadioGroupItem value="monsieur" id="monsieur" />
                  Monsieur
                </Label>
              </OptionCard>
            </RadioGroup>
          </div>

          {/* Nom */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={data.firstName || ""}
                onChange={(e) => onUpdate({ firstName: e.target.value })}
                placeholder="Votre prénom"
                autoComplete="given-name"
                className="h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={data.lastName || ""}
                onChange={(e) => onUpdate({ lastName: e.target.value })}
                placeholder="Votre nom"
                autoComplete="family-name"
                className="h-11"
                required
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={data.email || ""}
                onChange={(e) => onUpdate({ email: e.target.value })}
                placeholder="votre.email@exemple.com"
                className="h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone (portable)</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={data.phone || ""}
                onChange={(e) => onUpdate({ phone: e.target.value })}
                placeholder="+33 6 00 00 00 00"
                className="h-11"
                required
              />
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={data.address || ""}
              onChange={(e) => onUpdate({ address: e.target.value })}
              placeholder="Adresse complète"
              autoComplete="street-address"
              className="h-11"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal</Label>
              <Input
                id="postalCode"
                value={data.postalCode || ""}
                onChange={(e) => onUpdate({ postalCode: e.target.value })}
                placeholder="73000"
                inputMode="numeric"
                autoComplete="postal-code"
                className="h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={data.city || ""}
                onChange={(e) => onUpdate({ city: e.target.value })}
                placeholder="Nom de la ville"
                autoComplete="address-level2"
                className="h-11"
                required
              />
            </div>
          </div>

          {/* Handicap */}
          <div className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-border bg-[hsl(var(--surface-sunken))] p-4">
            <div className="min-w-0">
              <p className="font-medium">Accessibilité handicap</p>
              <p className="text-sm text-muted-foreground">
                Avez-vous besoin d'aménagements spéciaux en raison d'un handicap ?
              </p>
            </div>
            <Switch
              checked={data.hasHandicap || false}
              onCheckedChange={(checked) => onUpdate({ hasHandicap: checked })}
              aria-label="Accessibilité handicap"
            />
          </div>
        </div>
      </StepCard>

      <StepActions>
        <Button type="submit" className="h-12 w-full text-base sm:w-auto">
          Continuer vers le profil professionnel
        </Button>
      </StepActions>
    </form>
  );
}
