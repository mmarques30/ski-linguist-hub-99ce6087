import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, User, Briefcase, BookOpen, Target } from "lucide-react";
import { useState } from "react";
import type { RegistrationData } from "@/pages/register/Index";

interface ConfirmationStepProps {
  data: RegistrationData;
}

const languageLabels: Record<string, string> = {
  english: "Anglais",
  portuguese: "Portugais",
  russian: "Russe",
  dutch: "Néerlandais",
};

const modalityLabels: Record<string, string> = {
  in_person: "Présentiel",
  online_individual: "En ligne (Individuel)",
  online_group: "En ligne (Groupe)",
};

const fundingLabels: Record<string, string> = {
  opco: "OPCO / FIFPL",
  company: "Entreprise",
  self: "Autofinancement",
};

const certificationLabels: Record<string, string> = {
  linguaskill: "Linguaskill",
  bright: "Bright Language",
  none: "Sans certification",
};

export function ConfirmationStep({ data }: ConfirmationStepProps) {
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // Ici on enverrait les données à la base de données
    console.log("Soumission de l'inscription:", data);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold">Inscription terminée</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Merci de vous être inscrit chez France Langues International. 
              Vous recevrez prochainement un email de confirmation avec plus d'instructions.
            </p>
            <div className="pt-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                ID d'inscription : FLI-{Date.now().toString(36).toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirmez votre inscription</CardTitle>
        <CardDescription>
          Veuillez vérifier vos informations avant de soumettre
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations personnelles */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4" />
            Informations personnelles
          </div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium">{data.civility === "madame" ? "Mme" : "M."} {data.firstName} {data.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{data.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Téléphone</span>
              <span className="font-medium">{data.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adresse</span>
              <span className="font-medium">{data.address}, {data.postalCode} {data.city}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Profil professionnel */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Briefcase className="h-4 w-4" />
            Profil professionnel
          </div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profession</span>
              <span className="font-medium">
                {data.profession === "ski_instructor" ? "Moniteur de ski" : "Autre"}
              </span>
            </div>
            {data.skiSchool && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">École de ski</span>
                <span className="font-medium">{data.skiSchool}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Configuration de la formation */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BookOpen className="h-4 w-4" />
            Configuration de la formation
          </div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Langue</span>
              <span className="font-medium">{languageLabels[data.language] || data.language}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durée</span>
              <span className="font-medium">{data.duration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modalité</span>
              <span className="font-medium">{modalityLabels[data.modality] || data.modality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Financement</span>
              <span className="font-medium">{fundingLabels[data.fundingType] || data.fundingType}</span>
            </div>
            {data.location && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lieu</span>
                <span className="font-medium">{data.location}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Niveau et certification */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4" />
            Niveau et certification
          </div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Niveau actuel</span>
              <Badge>{data.currentLevel}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Certification</span>
              <span className="font-medium">{certificationLabels[data.certification] || data.certification}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Conditions générales */}
        <div className="flex items-start space-x-3 rounded-lg border p-4">
          <Checkbox
            id="terms"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
          />
          <div className="space-y-1">
            <Label htmlFor="terms" className="cursor-pointer">
              J'accepte les conditions générales
            </Label>
            <p className="text-sm text-muted-foreground">
              En soumettant cette inscription, je confirme que les informations fournies sont exactes 
              et j'accepte les conditions générales de formation de France Langues International.
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          className="w-full"
          disabled={!accepted}
        >
          Soumettre l'inscription
        </Button>
      </CardContent>
    </Card>
  );
}
