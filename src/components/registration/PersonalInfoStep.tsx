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
        <CardTitle>Dados Pessoais</CardTitle>
        <CardDescription>
          Por favor, forneça seus dados pessoais para a inscrição
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Civility */}
          <div className="space-y-3">
            <Label>Tratamento</Label>
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

          {/* Name */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                value={data.firstName || ""}
                onChange={(e) => onUpdate({ firstName: e.target.value })}
                placeholder="Digite seu nome"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                value={data.lastName || ""}
                onChange={(e) => onUpdate({ lastName: e.target.value })}
                placeholder="Digite seu sobrenome"
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
                placeholder="seu.email@exemplo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (Celular)</Label>
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

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={data.address || ""}
              onChange={(e) => onUpdate({ address: e.target.value })}
              placeholder="Endereço completo"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Código Postal</Label>
              <Input
                id="postalCode"
                value={data.postalCode || ""}
                onChange={(e) => onUpdate({ postalCode: e.target.value })}
                placeholder="73000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={data.city || ""}
                onChange={(e) => onUpdate({ city: e.target.value })}
                placeholder="Nome da cidade"
                required
              />
            </div>
          </div>

          {/* Handicap */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Acessibilidade para Deficiência</p>
              <p className="text-sm text-muted-foreground">
                Você necessita de alguma acomodação especial devido a uma deficiência?
              </p>
            </div>
            <Switch
              checked={data.hasHandicap || false}
              onCheckedChange={(checked) => onUpdate({ hasHandicap: checked })}
            />
          </div>

          <Button type="submit" className="w-full">
            Continuar para Perfil Profissional
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
