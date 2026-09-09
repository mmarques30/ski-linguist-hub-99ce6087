import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Mail, Link2, CreditCard, Eye } from "lucide-react";
import { toast } from "sonner";
import { CopyLinkRow } from "@/components/shared/CopyLinkRow";
import { useInscriptionClientAccess } from "@/hooks/useInscriptionClientAccess";
import { useCreateSurveyForInscription } from "@/hooks/useSatisfactionSurvey";
import {
  buildPublicRegistrationUrl,
  buildStudentPortalPreviewUrl,
  buildSurveyUrl,
} from "@/lib/client-links";

interface InscriptionClientAccessCardProps {
  inscriptionId: string;
  studentId: string;
  inscriptionCode?: string | null;
  language?: string | null;
  studentEmail?: string | null;
  studentName?: string | null;
  status?: string | null;
  paymentMethod?: string | null;
}

const EMAIL_TEMPLATE_LABELS: Record<string, string> = {
  inscription_confirmation: "Confirmation d'inscription",
  inscription_ski_monitor_welcome: "Documents moniteur de ski",
};

export function InscriptionClientAccessCard({
  inscriptionId,
  studentId,
  inscriptionCode,
  language,
  studentEmail,
  studentName,
  status,
  paymentMethod,
}: InscriptionClientAccessCardProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const { data, isLoading, refetch } = useInscriptionClientAccess(inscriptionId);
  const createSurvey = useCreateSurveyForInscription();

  const registrationUrl = buildPublicRegistrationUrl(origin, language);
  const portalPreviewUrl = buildStudentPortalPreviewUrl(origin, studentId);
  const latestSurvey = data?.surveys[0];

  const handleCreateSurvey = async () => {
    try {
      await createSurvey.mutateAsync({ inscriptionId, studentId });
      await refetch();
      toast.success("Lien enquête de satisfaction créé");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Link2 className="h-4 w-4" />
        <AlertTitle>Liens à partager avec le stagiaire</AlertTitle>
        <AlertDescription>
          Tous les liens utiles pour {studentName || "ce stagiaire"} — copiez et renvoyez à tout moment.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Liens publics
          </CardTitle>
          <CardDescription>Inscription, enquête et espace stagiaire</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {inscriptionCode && (
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <p className="text-sm text-muted-foreground">Code inscription</p>
              <p className="text-lg font-semibold tracking-wide">{inscriptionCode}</p>
            </div>
          )}

          <CopyLinkRow
            label="Formulaire d'inscription public"
            description={
              language
                ? `Pré-sélection langue : ${language}`
                : "Lien générique /register"
            }
            url={registrationUrl}
            badge="Public"
          />

          {latestSurvey ? (
            <CopyLinkRow
              label="Enquête de satisfaction"
              description={
                latestSurvey.completed_at
                  ? `Complétée le ${format(new Date(latestSurvey.completed_at), "dd MMM yyyy", { locale: fr })}`
                  : "En attente de réponse"
              }
              url={buildSurveyUrl(origin, latestSurvey.token)}
              badge={latestSurvey.completed_at ? "Complétée" : "En attente"}
              badgeVariant={latestSurvey.completed_at ? "default" : "outline"}
            />
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Enquête de satisfaction</p>
                <p className="text-sm text-muted-foreground">Aucun lien généré pour cette inscription</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={createSurvey.isPending}
                onClick={handleCreateSurvey}
              >
                {createSurvey.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Créer le lien
              </Button>
            </div>
          )}

          <CopyLinkRow
            label="Espace stagiaire (prévisualisation admin)"
            description="Voir ce que le stagiaire verra dans son portail — lecture seule"
            url={portalPreviewUrl}
            badge="Admin"
            badgeVariant="outline"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Paiement & statut
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {status && <Badge variant="outline">Statut : {status}</Badge>}
            {paymentMethod && <Badge variant="outline">Mode : {paymentMethod}</Badge>}
          </div>
          {!data?.payments.length ? (
            <p className="text-sm text-muted-foreground">Aucun paiement enregistré pour cette inscription.</p>
          ) : (
            <div className="space-y-2">
              {data.payments.map((payment) => (
                <div key={payment.id} className="rounded-lg border px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{payment.amount} €</span>
                    <Badge variant="secondary">{payment.status}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {payment.payment_method} · {payment.payment_type}
                    {payment.payment_date
                      ? ` · ${format(new Date(payment.payment_date), "dd/MM/yyyy")}`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Emails envoyés
          </CardTitle>
          <CardDescription>
            Historique des envois automatiques{studentEmail ? ` à ${studentEmail}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.emails.length ? (
            <p className="text-sm text-muted-foreground">Aucun email enregistré pour cette inscription.</p>
          ) : (
            <div className="space-y-2">
              {data.emails.map((email) => (
                <div key={email.id} className="rounded-lg border px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {EMAIL_TEMPLATE_LABELS[email.template_slug] || email.template_slug}
                    </span>
                    <Badge variant={email.status === "sent" ? "default" : "destructive"}>
                      {email.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {format(new Date(email.sent_at), "dd MMM yyyy à HH:mm", { locale: fr })} ·{" "}
                    {email.recipient_email}
                  </p>
                  {email.error_message && (
                    <p className="text-destructive text-xs mt-1">{email.error_message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" asChild>
          <a href={portalPreviewUrl} target="_blank" rel="noreferrer">
            <Eye className="mr-2 h-4 w-4" />
            Ouvrir la prévisualisation stagiaire
          </a>
        </Button>
      </div>
    </div>
  );
}
