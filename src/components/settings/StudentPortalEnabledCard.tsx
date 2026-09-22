import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
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
    <SurfaceCard
      title="Portail stagiaire"
      icon={GraduationCap}
      description="Autorise l'envoi d'invitations (lien magique) depuis les fiches stagiaire. Désactivé hors saison."
      actions={
        isLoading ? undefined : (
          <StatusPill tone={enabled ? "success" : "neutral"} dot>
            {enabled ? "Activé" : "Désactivé"}
          </StatusPill>
        )
      }
    >
      {isLoading ? (
        <Skeleton className="h-10 w-full rounded-[var(--radius)]" />
      ) : (
        <div className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] px-3 py-2.5">
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
    </SurfaceCard>
  );
}
