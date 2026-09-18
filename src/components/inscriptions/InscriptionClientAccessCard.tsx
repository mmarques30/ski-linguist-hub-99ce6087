import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Mail, Link2, CreditCard, Copy, Check, Eye, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyLinkRow } from "@/components/shared/CopyLinkRow";
import { useInscriptionClientAccess } from "@/hooks/useInscriptionClientAccess";
import { useCreateSurveyForInscription } from "@/hooks/useSatisfactionSurvey";
import {
  buildInscriptionSuiviUrl,
  buildPublicRegistrationUrl,
  buildSurveyUrl,
  studentAssistPath,
} from "@/lib/client-links";
import { supabase } from "@/integrations/supabase/client";

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
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useInscriptionClientAccess(inscriptionId);
  const createSurvey = useCreateSurveyForInscription();
  const [codeCopied, setCodeCopied] = useState(false);

  const { data: accessToken, isLoading: tokenLoading } = useQuery({
    queryKey: ["inscription-access-token", inscriptionId],
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from("inscriptions")
        .select("access_token")
        .eq("id", inscriptionId)
        .maybeSingle();
      if (error) throw error;
      return (row as { access_token?: string } | null)?.access_token ?? null;
    },
  });

  const regenerateToken = useMutation({
    mutationFn: async () => {
      const { data: token, error } = await supabase.rpc(
        "regenerate_inscription_access_token",
        { p_inscription_id: inscriptionId }
      );
      if (error) throw error;
      return token as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inscription-access-token", inscriptionId] });
      toast.success("Lien de suivi renouvelé");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Impossible de renouveler le lien");
    },
  });

  const registrationUrl = buildPublicRegistrationUrl(origin, language);
  const assistUrl = `${origin}${studentAssistPath(studentId, "dashboard")}`;
  const suiviUrl = accessToken ? buildInscriptionSuiviUrl(origin, accessToken) : null;
  const latestSurvey = data?.surveys[0];

  const handleCopyCode = async () => {
    if (!inscriptionCode) return;
    try {
      await navigator.clipboard.writeText(inscriptionCode);
      setCodeCopied(true);
      toast.success("Code d'inscription copié");
      window.setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const handleCreateSurvey = async () => {
    try {
      await createSurvey.mutateAsync({ inscriptionId, studentId });
      await refetch();
      toast.success("Lien enquête de satisfaction créé");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création");
    }
  };

  if (isLoading || tokenLoading) {
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
          <CardDescription>Suivi, inscription, enquête et espace stagiaire</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {inscriptionCode && (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm text-muted-foreground">Code inscription</p>
                <p className="text-lg font-semibold tracking-wide">{inscriptionCode}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                aria-label="Copier le code d'inscription"
              >
                {codeCopied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="ml-2">{codeCopied ? "Copié" : "Copier"}</span>
              </Button>
            </div>
          )}

          {suiviUrl ? (
            <div className="space-y-2">
              <CopyLinkRow
                label="Lien de suivi"
                description="Page publique sans login — statut, dates, documents, paiement"
                url={suiviUrl}
                badge="Client"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={regenerateToken.isPending}
                onClick={() => regenerateToken.mutate()}
              >
                {regenerateToken.isPending ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                )}
                Renouveler le lien
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Lien de suivi indisponible (jeton manquant).
            </p>
          )}

          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <Eye className="h-4 w-4" />
            <AlertTitle>Mode Assister (staff)</AlertTitle>
            <AlertDescription>
              « Voir comme le stagiaire » ouvre les vrais écrans du portail sous
              bandeau ambre. Ne pas envoyer ce lien au client.
            </AlertDescription>
          </Alert>

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
            label="Assister stagiaire (staff)"
            description="Vrais composants /student/* — lecture seule"
            url={assistUrl}
            badge="Admin"
            badgeVariant="outline"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Statut &amp; mode de paiement
          </CardTitle>
          <CardDescription>
            Les paiements et relances sont gérés dans l&apos;onglet Financier.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {status && <Badge variant="outline">Statut : {status}</Badge>}
            {paymentMethod && <Badge variant="outline">Mode : {paymentMethod}</Badge>}
          </div>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to={`/inscriptions/${inscriptionId}?tab=financial`}>
              Voir paiements &amp; relances
            </Link>
          </Button>
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
          <Link to={studentAssistPath(studentId, "dashboard")}>
            <Eye className="mr-2 h-4 w-4" />
            Voir comme le stagiaire
          </Link>
        </Button>
      </div>
    </div>
  );
}
