import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RegistrationData } from "@/pages/register/Index";

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
    <Card>
      <CardHeader>
        <CardTitle>Perfil Profissional</CardTitle>
        <CardDescription>
          Conte-nos sobre sua experiência profissional
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profession */}
          <div className="space-y-3">
            <Label>Qual é a sua profissão?</Label>
            <RadioGroup
              value={data.profession || ""}
              onValueChange={(value) => onUpdate({ profession: value as "ski_instructor" | "other" })}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="ski_instructor" id="ski_instructor" />
                <div>
                  <Label htmlFor="ski_instructor" className="font-medium cursor-pointer">
                    Instrutor de Esqui (Moniteur de ski)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Trabalho como instrutor de esqui em uma escola francesa
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="other" id="other" />
                <div>
                  <Label htmlFor="other" className="font-medium cursor-pointer">
                    Outra Profissão
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Tenho outra profissão
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Ski School - Only show for ski instructors */}
          {data.profession === "ski_instructor" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="skiSchool">Escola de Esqui</Label>
              <Input
                id="skiSchool"
                value={data.skiSchool || ""}
                onChange={(e) => onUpdate({ skiSchool: e.target.value })}
                placeholder="ex: ESF Val d'Isère, ESF Courchevel..."
                required
              />
              <p className="text-sm text-muted-foreground">
                Digite o nome da sua escola de esqui
              </p>
            </div>
          )}

          {data.profession === "other" && (
            <div className="rounded-lg bg-muted/50 p-4 animate-in fade-in slide-in-from-top-2">
              <p className="text-sm text-muted-foreground">
                Nossos programas de treinamento são projetados principalmente para instrutores de esqui. 
                Por favor, entre em contato conosco diretamente em <span className="font-medium text-foreground">contact@fli-langues.fr</span> para 
                discutir suas necessidades específicas.
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={!data.profession || (data.profession === "ski_instructor" && !data.skiSchool)}
          >
            Continuar para Configuração da Formação
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
