import { useCallback, useState } from "react";
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

export type ConfirmActionRequest = {
  title: string;
  description: string;
  actionLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  run: () => void | Promise<void>;
};

/**
 * Confirmation légère avant toute mutation admin (Paula : « toujours un petit
 * message de confirmation »). Toast de succès reste à la charge du mutate.
 */
export function useConfirmAction() {
  const [pending, setPending] = useState<ConfirmActionRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = useCallback((request: ConfirmActionRequest) => {
    setPending(request);
  }, []);

  const cancel = useCallback(() => {
    if (!busy) setPending(null);
  }, [busy]);

  const runConfirmed = useCallback(async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await pending.run();
      setPending(null);
    } finally {
      setBusy(false);
    }
  }, [pending]);

  const dialog = (
    <AlertDialog
      open={!!pending}
      onOpenChange={(open) => {
        if (!open && !busy) setPending(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
          <AlertDialogDescription>{pending?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {pending?.cancelLabel || "Annuler"}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            className={
              pending?.destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
            onClick={(e) => {
              e.preventDefault();
              void runConfirmed();
            }}
          >
            {pending?.actionLabel || "Confirmer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, cancel, dialog, busy, isOpen: !!pending };
}
