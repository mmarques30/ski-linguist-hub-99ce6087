import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Eye, UserCheck, UserX, ExternalLink } from "lucide-react";
import { CopyLinkRow } from "@/components/shared/CopyLinkRow";
import { buildStudentPortalPreviewUrl } from "@/lib/client-links";

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

        {!hasPortalAccount && (
          <Alert>
            <AlertTitle>Invitation portail — bientôt disponible</AlertTitle>
            <AlertDescription>
              Le stagiaire n&apos;a pas encore de compte portail. Utilisez la prévisualisation admin pour
              voir l&apos;espace tel qu&apos;il apparaîtra une fois le compte créé (prévu après le 30
              septembre).
            </AlertDescription>
          </Alert>
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
