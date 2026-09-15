import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileEdit,
  Loader2,
  Play,
  Receipt,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useUpdateInscriptionStatus } from "@/hooks/useInscriptions";
import {
  cancellationBlockedReason,
  describeRefusedTransition,
  getNextStatuses,
  getStatusLabel,
  getStatusStyle,
  type InscriptionStatus,
} from "@/lib/inscription-status";
import { todayKey } from "@/lib/schedule-validation";

const STATUS_ICON: Record<InscriptionStatus, typeof Clock> = {
  brouillon: FileEdit,
  en_attente: Clock,
  confirmee: CheckCircle,
  en_cours: Play,
  terminee: CheckCircle2,
  facturee: Receipt,
  annulee: XCircle,
};

interface InscriptionStatusMenuProps {
  inscriptionId: string;
  status: string;
  startDate: string | null;
  /** Fiche en lecture seule : on n'affiche que la pastille. */
  readOnly?: boolean;
}

/**
 * Pastille de statut cliquable sur la fiche inscription. Ne propose que les
 * transitions que la base accepte, pour ne plus renvoyer d'erreur SQL brute à
 * l'écran, et explique en français ce qui est fermé.
 */
export function InscriptionStatusMenu({
  inscriptionId,
  status,
  startDate,
  readOnly = false,
}: InscriptionStatusMenuProps) {
  const updateStatus = useUpdateInscriptionStatus();
  const [pendingCancel, setPendingCancel] = useState(false);

  const nextStatuses = getNextStatuses(status);
  const cancelBlocked = cancellationBlockedReason(status, startDate, todayKey());
  const available = nextStatuses.filter(
    (cible) => !(cible === "annulee" && cancelBlocked)
  );

  const badge = (
    <Badge className={getStatusStyle(status)}>{getStatusLabel(status, "fr")}</Badge>
  );

  const apply = async (cible: InscriptionStatus) => {
    try {
      await updateStatus.mutateAsync({ id: inscriptionId, status: cible });
      toast.success(`Statut : ${getStatusLabel(cible, "fr")}`);
    } catch (error) {
      const brut = error instanceof Error ? error.message : "";
      // La base renvoie déjà une phrase française depuis le point 10 ; on
      // garde une reformulation locale pour les bases pas encore migrées.
      const message = /statut|transition/i.test(brut)
        ? brut
        : describeRefusedTransition(status, cible);
      toast.error(message);
    }
  };

  if (readOnly || available.length === 0) {
    return (
      <div className="flex items-center gap-2">
        {badge}
        {!readOnly && (
          <span className="text-xs text-muted-foreground">
            {nextStatuses.length === 0
              ? "statut final"
              : cancelBlocked
                ? "formation commencée : annulation fermée"
                : null}
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto gap-1 p-0 hover:bg-transparent"
            disabled={updateStatus.isPending}
          >
            <Badge className={cn(getStatusStyle(status), "cursor-pointer hover:opacity-80")}>
              {getStatusLabel(status, "fr")}
            </Badge>
            {updateStatus.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Depuis « {getStatusLabel(status, "fr")} »
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {available.map((cible) => {
            const Icon = STATUS_ICON[cible];
            return (
              <DropdownMenuItem
                key={cible}
                onClick={() => {
                  if (cible === "annulee") {
                    setPendingCancel(true);
                    return;
                  }
                  void apply(cible);
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                {getStatusLabel(cible, "fr")}
              </DropdownMenuItem>
            );
          })}
          {cancelBlocked && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="max-w-[16rem] whitespace-normal text-xs font-normal text-muted-foreground">
                {cancelBlocked}
              </DropdownMenuLabel>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={pendingCancel} onOpenChange={setPendingCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette inscription ?</AlertDialogTitle>
            <AlertDialogDescription>
              « Annulée » est un statut final : l&apos;inscription ne pourra plus changer
              d&apos;état ensuite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revenir</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setPendingCancel(false);
                void apply("annulee");
              }}
            >
              Annuler l&apos;inscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
