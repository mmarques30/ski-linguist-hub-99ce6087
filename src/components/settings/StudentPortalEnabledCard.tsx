import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useSetStudentPortalEnabled,
  useStudentPortalEnabled,
} from "@/hooks/useStudentPortalSettings";

/**
 * Active / coupe les invitations magic-link au portail stagiaire
 * (`app_settings.student_portal_enabled`).
 */
export function StudentPortalEnabledCard() {
  const { data: enabled = false, isLoading } = useStudentPortalEnabled();
  const setEnabled = useSetStudentPortalEnabled();

  const handleChange = async (next: boolean) => {
    try {
      await setEnabled.mutateAsync(next);
      toast.success(
        next
          ? "Portail stagiaire activé — les invitations sont autorisées"
          : "Portail stagiaire désactivé"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enregistrement impossible");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Portail stagiaire</CardTitle>
        <CardDescription>
          Autorise l&apos;envoi d&apos;invitations (lien magique) depuis les fiches
          stagiaire. Désactivé hors saison.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="student-portal-enabled" className="cursor-pointer">
              Invitations portail activées
            </Label>
            <Switch
              id="student-portal-enabled"
              checked={enabled}
              disabled={setEnabled.isPending}
              onCheckedChange={handleChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
