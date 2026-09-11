import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Eye, UserCheck, UserX, ExternalLink, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CopyLinkRow } from "@/components/shared/CopyLinkRow";
import { buildStudentPortalPreviewUrl } from "@/lib/client-links";
import { useInviteStudentPortal } from "@/hooks/useInviteStudentPortal";
import { isFliPlaceholderEmail, STUDENT_PORTAL_IN_SEASON_SCOPE } from "@/lib/email-guards";

interface StudentPortalAccessCardProps {
  studentId: string;
  studentName: string;
  email?: string | null;
  authUserId?: string | null;
}

export function StudentPortalAccessCard({
  studentId,
  studentName,
  email,
  authUserId,
}: StudentPortalAccessCardProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const previewUrl = buildStudentPortalPreviewUrl(origin, studentId);
  const hasPortalAccount = Boolean(authUserId);
  const invitePortal = useInviteStudentPortal();

  const canSendInvite =
    STUDENT_PORTAL_IN_SEASON_SCOPE && Boolean(email) && !isFliPlaceholderEmail(email);

  const handleInvite = async () => {
    if (!email) {
      toast.error("Email manquant pour ce stagiaire");
      return;
    }
    if (!STUDENT_PORTAL_IN_SEASON_SCOPE) {
      toast.error("Le portail stagiaire est hors périmètre cette saison");
      return;
    }
    if (isFliPlaceholderEmail(email)) {
      toast.error("Les adresses @fli.placeholder sont exclues de tout envoi");
      return;
    }

    try {
      const result = await invitePortal.mutateAsync({
        studentIds: [studentId],
        sendEmail: true,
        confirmedCount: 1,
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {hasPortalAccount ? (
            <UserCheck className="h-4 w-4 text-emerald-600" />
          ) : (
            <UserX className="h-4 w-4 text-muted-foreground" />
          )}
          Espace stagiaire
        </CardTitle>
        <CardDescription>
          Accès au portail /student/* pour {studentName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={hasPortalAccount ? "default" : "outline"}>
            {hasPortalAccount ? "Compte lié" : "Compte non créé"}
          </Badge>
          {email && <Badge variant="secondary">{email}</Badge>}
        </div>

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
          label="Prévisualisation admin"
          description="Voir le portail stagiaire en lecture seule"
          url={previewUrl}
          badge="Admin"
          badgeVariant="outline"
        />

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="default" size="sm">
            <Link to={`/students/${studentId}/portal-preview`}>
              <Eye className="mr-2 h-4 w-4" />
              Voir comme le stagiaire
            </Link>
          </Button>
          {hasPortalAccount && (
            <Button asChild variant="outline" size="sm">
              <a href="/student/dashboard" target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Portail (compte lié)
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
