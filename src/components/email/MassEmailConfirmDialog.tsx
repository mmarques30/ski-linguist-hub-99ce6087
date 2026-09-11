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

interface MassEmailConfirmDialogProps {
  open: boolean;
  count: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending?: boolean;
  actionLabel?: string;
}

export function MassEmailConfirmDialog({
  open,
  count,
  onOpenChange,
  onConfirm,
  pending = false,
  actionLabel = "invitations",
}: MassEmailConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer l&apos;envoi de masse</AlertDialogTitle>
          <AlertDialogDescription>
            Vous allez envoyer <strong>{count}</strong> {actionLabel}. Cette
            action n&apos;est pas un test : chaque adresse recevra un e-mail réel
            dès que la clé Resend est active.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
          <AlertDialogAction disabled={pending || count < 1} onClick={onConfirm}>
            Envoyer {count} {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
