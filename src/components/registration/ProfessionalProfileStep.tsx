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
        <CardTitle>Profil professionnel</CardTitle>
        <CardDescription>
          Parlez-nous de votre expérience professionnelle
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profession */}
          <div className="space-y-3">
            <Label>Quelle est votre profession ?</Label>
            <RadioGroup
              value={data.profession || ""}
              onValueChange={(value) => onUpdate({ profession: value as "ski_instructor" | "other" })}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="ski_instructor" id="ski_instructor" />
                <div>
                  <Label htmlFor="ski_instructor" className="font-medium cursor-pointer">
                    Moniteur de ski
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Je travaille comme moniteur de ski dans une école française
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="other" id="other" />
                <div>
                  <Label htmlFor="other" className="font-medium cursor-pointer">
                    Autre profession
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    J'ai une autre profession
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* École de ski - Afficher uniquement pour les moniteurs */}
          {data.profession === "ski_instructor" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="skiSchool">École de ski</Label>
              <Input
                id="skiSchool"
                value={data.skiSchool || ""}
                onChange={(e) => onUpdate({ skiSchool: e.target.value })}
                placeholder="ex : ESF Val d'Isère, ESF Courchevel..."
                required
              />
              <p className="text-sm text-muted-foreground">
                Entrez le nom de votre école de ski
              </p>
            </div>
          )}

          {data.profession === "other" && (
            <div className="rounded-lg bg-muted/50 p-4 animate-in fade-in slide-in-from-top-2">
              <p className="text-sm text-muted-foreground">
                Nos programmes de formation sont principalement conçus pour les moniteurs de ski. 
                Veuillez nous contacter directement à <span className="font-medium text-foreground">contact@fli-langues.fr</span> pour 
                discuter de vos besoins spécifiques.
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={!data.profession || (data.profession === "ski_instructor" && !data.skiSchool)}
          >
            Continuer vers la configuration de la formation
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
