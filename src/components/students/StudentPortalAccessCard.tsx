import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Eye, UserCheck, UserX, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CopyLinkRow } from "@/components/shared/CopyLinkRow";
import { studentAssistPath } from "@/lib/client-links";
import { useInviteStudentPortal } from "@/hooks/useInviteStudentPortal";
import { isFliPlaceholderEmail } from "@/lib/email-guards";
import {
  useStudentPortalEnabled,
  useStudentPortalInviteLog,
} from "@/hooks/useStudentPortalSettings";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";

interface StudentPortalAccessCardProps {
  studentId: string;
  studentName: string;
  email?: string | null;
  authUserId?: string | null;
  inscriptionId?: string | null;
}

export function StudentPortalAccessCard({
  studentId,
  studentName,
  email,
  authUserId,
  inscriptionId,
}: StudentPortalAccessCardProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const assistPath = studentAssistPath(studentId, "dashboard");
  const assistUrl = `${origin}${assistPath}`;
  const hasPortalAccount = Boolean(authUserId);
  const invitePortal = useInviteStudentPortal();
  const { data: portalEnabled = false, isLoading: settingLoading } = useStudentPortalEnabled();
  const { data: lastInvite } = useStudentPortalInviteLog(studentId);

  const canSendInvite =
    portalEnabled && Boolean(email) && !isFliPlaceholderEmail(email);

  const handleInvite = async () => {
    if (!email) {
      toast.error("Email manquant pour ce stagiaire");
      return;
    }
    if (!portalEnabled) {
      toast.error("Le portail stagiaire est désactivé (Paramètres)");
      return;
    }
    if (isFliPlaceholderEmail(email)) {
      toast.error("Les adresses placeholder d'import sont exclues de tout envoi");
      return;
    }

    try {
      const result = await invitePortal.mutateAsync({
        studentIds: [studentId],
        sendEmail: true,
        confirmedCount: 1,
        inscriptionId: inscriptionId ?? undefined,
      });
      if (result.succeeded) {
        toast.success("Invitation portail envoyée par email");
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
      title="Espace stagiaire"
      description={`Accès au portail /student/* pour ${studentName}`}
      actions={
        <Button asChild variant="default" size="sm">
          <Link to={assistPath}>
            <Eye className="mr-2 h-4 w-4" />
            Voir comme le stagiaire
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={hasPortalAccount ? "success" : "neutral"} dot>
            {hasPortalAccount ? "Compte lié" : "Compte non créé"}
          </StatusPill>
          {email && (
            <StatusPill tone="neutral" icon={Mail}>
              {email}
            </StatusPill>
          )}
          {!settingLoading && (
            <StatusPill tone={portalEnabled ? "info" : "neutral"}>
              {portalEnabled ? "Invitations ouvertes" : "Invitations fermées"}
            </StatusPill>
          )}
        </div>

        {lastInvite && (
          <p className="text-sm text-muted-foreground">
            Invité le{" "}
            {format(new Date(lastInvite.sent_at), "dd MMM yyyy à HH:mm", { locale: fr })}
            {" · "}
            statut {lastInvite.status}
          </p>
        )}

        {!hasPortalAccount && canSendInvite && (
          <Alert>
            <AlertTitle>Inviter au portail</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                Un email avec lien de connexion sécurisé sera envoyé à {email}. Le stagiaire accède
                ensuite à son espace personnel.
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
        )}

        {!portalEnabled && !settingLoading && (
          <Alert>
            <AlertTitle>Portail hors saison</AlertTitle>
            <AlertDescription>
              Activez les invitations dans Paramètres → Portail stagiaire.
            </AlertDescription>
          </Alert>
        )}

        {hasPortalAccount && canSendInvite && (
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
        )}

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
