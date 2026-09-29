import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Eye, UserCheck, UserX, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CopyLinkRow } from "@/components/shared/CopyLinkRow";
import { formateurAssistPath } from "@/lib/client-links";
import { isFliPlaceholderEmail } from "@/lib/email-guards";
import {
  useFormateurPortalInviteLog,
  useInviteFormateurPortal,
} from "@/hooks/useInviteFormateurPortal";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";

interface FormateurPortalAccessCardProps {
  instructorId: string;
  instructorName: string;
  email?: string | null;
  authUserId?: string | null;
}

export function FormateurPortalAccessCard({
  instructorId,
  instructorName,
  email,
  authUserId,
}: FormateurPortalAccessCardProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const assistPath = formateurAssistPath(instructorId, "tableau-de-bord");
  const assistUrl = `${origin}${assistPath}`;
  const hasPortalAccount = Boolean(authUserId);
  const invitePortal = useInviteFormateurPortal();
  const { data: lastInvite } = useFormateurPortalInviteLog(instructorId);

  const canSendInvite = Boolean(email) && !isFliPlaceholderEmail(email);

  const handleInvite = async () => {
    if (!email) {
      toast.error("Email manquant pour ce formateur");
      return;
    }
    if (isFliPlaceholderEmail(email)) {
      toast.error("Les adresses placeholder d'import sont exclues de tout envoi");
      return;
    }

    try {
      const result = await invitePortal.mutateAsync({
        instructorIds: [instructorId],
        sendEmail: true,
        confirmedCount: 1,
      });
      if (result.succeeded) {
        toast.success(
          hasPortalAccount
            ? "Lien de connexion renvoyé par email"
            : "Invitation portail envoyée par email"
        );
      } else {
        toast.error(result.results[0]?.error || "Échec de l'invitation");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'invitation");
    }
  };

  return (
    <SurfaceCard
      icon={hasPortalAccount ? UserCheck : UserX}
      title="Espace formateur"
      description={`Accès au portail /formateur/* pour ${instructorName}`}
      actions={
        <Button asChild variant="default" size="sm">
          <Link to={assistPath}>
            <Eye className="mr-2 h-4 w-4" />
            Voir comme le formateur
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={hasPortalAccount ? "success" : "neutral"} dot>
            {hasPortalAccount ? "Compte lié" : "Compte non créé"}
          </StatusPill>
          {email ? (
            <StatusPill tone="neutral" icon={Mail}>
              {email}
            </StatusPill>
          ) : null}
        </div>

        {lastInvite ? (
          <p className="text-sm text-muted-foreground">
            Invité le{" "}
            {format(new Date(lastInvite.sent_at), "dd MMM yyyy à HH:mm", { locale: fr })}
            {" · "}
            statut {lastInvite.status}
          </p>
        ) : null}

        {!hasPortalAccount && canSendInvite ? (
          <Alert>
            <AlertTitle>Inviter au portail</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                Un email avec lien de connexion sécurisé sera envoyé à {email}. La personne accède
                ensuite à son espace formateur (missions, stagiaires, évaluations).
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={invitePortal.isPending}
                onClick={handleInvite}
              >
                {invitePortal.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Envoyer l&apos;invitation
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {!email ? (
          <Alert>
            <AlertTitle>Email manquant</AlertTitle>
            <AlertDescription>
              Renseignez un email sur la fiche avant d&apos;inviter.
            </AlertDescription>
          </Alert>
        ) : null}

        {hasPortalAccount && canSendInvite ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={invitePortal.isPending}
            onClick={handleInvite}
          >
            {invitePortal.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Renvoyer le lien de connexion
          </Button>
        ) : null}

        <CopyLinkRow
          label="Mode Assister (staff)"
          description="Vrais écrans du portail sous bandeau ambre"
          url={assistUrl}
          badge="Admin"
          badgeVariant="outline"
        />
      </div>
    </SurfaceCard>
  );
}
