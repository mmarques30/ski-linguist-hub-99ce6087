import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusPill, toneForStatus } from "@/components/ui-kit";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sun, Sunset, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useApproveSchedule } from "@/hooks/useApproveSchedule";
import {
  isScheduleAssignmentDue,
  SCHEDULE_ASSIGNMENT_DAYS_BEFORE,
  type ScheduleStatus,
} from "@/lib/placement-test-engine";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useConfirmAction } from "@/hooks/useConfirmAction";

interface ScheduleApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inscription: {
    id: string;
    code?: string | null;
    student_name?: string | null;
    language?: string;
    start_date?: string;
    entry_level?: string | null;
    schedule_status?: string | null;
    schedule?: string | null;
  };
}

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  matin: "Matin",
  "apres-midi": "Après-midi",
};

export function ScheduleApprovalDialog({
  open,
  onOpenChange,
  inscription,
}: ScheduleApprovalDialogProps) {
  const approveSchedule = useApproveSchedule();
  const { confirm, dialog: confirmDialog } = useConfirmAction();
  const scheduleStatus = (inscription.schedule_status || inscription.schedule || "pending") as ScheduleStatus;
  const isDue = inscription.start_date
    ? isScheduleAssignmentDue(inscription.start_date)
    : false;
  const isApproved = scheduleStatus === "matin" || scheduleStatus === "apres-midi";

  const persistApprove = async (slot: "matin" | "apres-midi") => {
    try {
      await approveSchedule.mutateAsync({
        inscriptionId: inscription.id,
        scheduleStatus: slot,
      });
      toast.success(`Groupe ${slot === "matin" ? "du matin" : "de l'après-midi"} validé`);
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la validation");
    }
  };

  const handleApprove = (slot: "matin" | "apres-midi") => {
    confirm({
      title:
        slot === "matin"
          ? "Valider le groupe du matin ?"
          : "Valider le groupe de l'après-midi ?",
      description: `L'affectation horaire de ${inscription.student_name || "ce stagiaire"} (${inscription.code || "—"}) sera enregistrée.`,
      actionLabel: "Valider",
      run: () => persistApprove(slot),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Affectation horaire</DialogTitle>
          <DialogDescription>
            Validation du groupe matin/après-midi pour {inscription.student_name} ({inscription.code})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            <StatusPill tone="info">{inscription.language}</StatusPill>
            <StatusPill tone="neutral">Niveau: {inscription.entry_level || "—"}</StatusPill>
            {inscription.start_date && (
              <StatusPill tone="neutral">
                Début: {format(new Date(inscription.start_date), "dd MMM yyyy", { locale: fr })}
              </StatusPill>
            )}
          </div>

          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              L'affectation doit être validée environ {SCHEDULE_ASSIGNMENT_DAYS_BEFORE} jours avant le
              début des cours, après analyse de l'ensemble des inscrits du même créneau.
            </AlertDescription>
          </Alert>

          {!isDue && !isApproved && (
            <p className="text-sm text-muted-foreground">
              Cette inscription n'est pas encore dans la fenêtre d'affectation (J-{SCHEDULE_ASSIGNMENT_DAYS_BEFORE}).
              Vous pouvez tout de même valider manuellement si nécessaire.
            </p>
          )}

          {isApproved && (
            <div className="rounded-[var(--radius)] bg-[hsl(var(--surface-sunken))] p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Groupe validé</p>
              <StatusPill tone={toneForStatus("approved")} className="px-4 py-1 text-sm">
                {STATUS_LABELS[scheduleStatus]}
              </StatusPill>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button
            variant="outline"
            onClick={() => handleApprove("matin")}
            disabled={approveSchedule.isPending}
          >
            {approveSchedule.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sun className="mr-2 h-4 w-4" />
            )}
            Valider — Matin
          </Button>
          <Button
            onClick={() => handleApprove("apres-midi")}
            disabled={approveSchedule.isPending}
          >
            {approveSchedule.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sunset className="mr-2 h-4 w-4" />
            )}
            Valider — Après-midi
          </Button>
        </DialogFooter>
      </DialogContent>
      {confirmDialog}
    </Dialog>
  );
}
