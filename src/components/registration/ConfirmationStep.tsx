import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, Phone, Sun, Sunset, User, Briefcase, BookOpen, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { RegistrationData } from "@/pages/register/Index";
import { submitRegistration } from "@/services/registrationService";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    inscriptionCode: string;
    timeSlot: "matin" | "apres-midi" | null;
    needsAdminCall: boolean;
    emailSent: boolean;
  } | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submission = await submitRegistration(data);
      setResult({
        inscriptionCode: submission.inscriptionCode,
        timeSlot: submission.timeSlot,
        needsAdminCall: submission.needsAdminCall,
        emailSent: submission.emailSent,
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la soumission. Veuillez réessayer."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold">Inscription enregistrée</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Merci de vous être inscrit chez France Langues International.
              {result.emailSent
                ? " Un email de confirmation vous a été envoyé."
                : " Notre équipe vous contactera prochainement."}
            </p>
            <div className="pt-2">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Code : {result.inscriptionCode}
              </Badge>
            </div>
            {result.timeSlot && (
              <Badge variant="secondary" className="gap-1">
                {result.timeSlot === "matin" ? (
                  <><Sun className="h-3.5 w-3.5" /> Groupe du matin</>
                ) : (
                  <><Sunset className="h-3.5 w-3.5" /> Groupe de l'après-midi</>
                )}
              </Badge>
            )}
            {result.needsAdminCall && (
              <Alert>
                <Phone className="h-4 w-4" />
                <AlertDescription>
                  Notre équipe vous contactera par téléphone suite à votre résultat au test.
                </AlertDescription>
              </Alert>
            )}
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

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4" />
            Niveau et certification
          </div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Niveau</span>
              <Badge>{data.currentLevel}</Badge>
            </div>
            {data.timeSlot && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créneau</span>
                <span className="font-medium">
                  {data.timeSlot === "matin" ? "Matin" : "Après-midi"}
                </span>
              </div>
            )}
            {data.correctAnswers !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Score test</span>
                <span className="font-medium">{data.correctAnswers}/20</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Certification</span>
              <span className="font-medium">{certificationLabels[data.certification] || data.certification}</span>
            </div>
          </div>
        </div>

        <Separator />

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
          disabled={!accepted || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            "Soumettre l'inscription"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
