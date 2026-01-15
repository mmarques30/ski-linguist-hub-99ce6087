import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RegistrationData } from "@/pages/register/Index";

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
    <Card>
      <CardHeader>
        <CardTitle>Informations personnelles</CardTitle>
        <CardDescription>
          Veuillez renseigner vos informations personnelles pour l'inscription
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Civilité */}
          <div className="space-y-3">
            <Label>Civilité</Label>
            <RadioGroup
              value={data.civility || ""}
              onValueChange={(value) => onUpdate({ civility: value })}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="madame" id="madame" />
                <Label htmlFor="madame" className="font-normal">Madame</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monsieur" id="monsieur" />
                <Label htmlFor="monsieur" className="font-normal">Monsieur</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Nom */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={data.firstName || ""}
                onChange={(e) => onUpdate({ firstName: e.target.value })}
                placeholder="Votre prénom"
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
                required
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={data.email || ""}
                onChange={(e) => onUpdate({ email: e.target.value })}
                placeholder="votre.email@exemple.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone (portable)</Label>
              <Input
                id="phone"
                type="tel"
                value={data.phone || ""}
                onChange={(e) => onUpdate({ phone: e.target.value })}
                placeholder="+33 6 00 00 00 00"
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
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal</Label>
              <Input
                id="postalCode"
                value={data.postalCode || ""}
                onChange={(e) => onUpdate({ postalCode: e.target.value })}
                placeholder="73000"
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
                required
              />
            </div>
          </div>

          {/* Handicap */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Accessibilité handicap</p>
              <p className="text-sm text-muted-foreground">
                Avez-vous besoin d'aménagements spéciaux en raison d'un handicap ?
              </p>
            </div>
            <Switch
              checked={data.hasHandicap || false}
              onCheckedChange={(checked) => onUpdate({ hasHandicap: checked })}
            />
          </div>

          <Button type="submit" className="w-full">
            Continuer vers le profil professionnel
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
