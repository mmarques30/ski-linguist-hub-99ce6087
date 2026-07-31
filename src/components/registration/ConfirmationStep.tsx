import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, Phone, Mountain } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { RegistrationData } from "@/pages/register/Index";
import { submitRegistration } from "@/services/registrationService";
import { formatPriceEUR } from "@/lib/registration-offerings";

interface ConfirmationStepProps {
  data: RegistrationData;
}

const languageLabels: Record<string, string> = {
  english: "Anglais",
  portuguese: "Portugais",
  russian: "Russe",
  dutch: "Néerlandais",
  german: "Allemand",
  spanish: "Espagnol",
  italian: "Italien",
  chinese: "Chinois",
  french: "Français",
};

const modalityLabels: Record<string, string> = {
  in_person: "Présentiel (collectif)",
  online_individual: "En ligne (individuel)",
  online_group: "En ligne (groupe)",
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
    needsAdminCall: boolean;
    emailSent: boolean;
  } | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submission = await submitRegistration(data);
      setResult({
        inscriptionCode: submission.inscriptionCode,
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
            <Alert>
              <Mountain className="h-4 w-4" />
              <AlertDescription>
                Votre groupe (matin ou après-midi) sera confirmé environ 10 jours avant le début
                des cours, après validation par notre équipe.
              </AlertDescription>
            </Alert>
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
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="text-sm font-medium">Formation sélectionnée</div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lieu</span>
              <span className="font-medium">{data.locationLabel || data.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Langue</span>
              <span className="font-medium">{languageLabels[data.language] || data.language}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durée</span>
              <span className="font-medium">{data.duration} heures</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modalité</span>
              <span className="font-medium">{modalityLabels[data.modality] || data.modality}</span>
            </div>
            {(data.dateLabel || data.dates) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dates</span>
                <span className="font-medium text-right max-w-[60%]">
                  {data.dateLabel || data.dates}
                </span>
              </div>
            )}
            {data.price != null && data.price > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarif</span>
                <span className="font-semibold">{formatPriceEUR(data.price)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Financement</span>
              <span className="font-medium">{fundingLabels[data.fundingType] || data.fundingType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Niveau</span>
              <Badge>{data.currentLevel}</Badge>
            </div>
            {data.correctAnswers !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Score test</span>
                <span className="font-medium">{data.correctAnswers} bonnes réponses</span>
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
