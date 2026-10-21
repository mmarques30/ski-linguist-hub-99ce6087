import type { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

/**
 * API unique de notification — délègue à Sonner.
 *
 * Nouveau code : préférer `import { toast } from "sonner"`.
 * Cet export garde la forme historique `toast({ title, description, variant })`
 * pour les écrans pas encore migrés, sans second Toaster Radix.
 */

export type ToastInput = {
  title?: ReactNode;
  description?: ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
};

function showToast({ title, description, variant, duration }: ToastInput) {
  const options = {
    description: title != null ? description : undefined,
    duration,
  };
  const message = title ?? description ?? "";

  const id =
    variant === "destructive"
      ? sonnerToast.error(message, options)
      : sonnerToast.success(message, options);

  return {
    id: String(id),
    dismiss: () => sonnerToast.dismiss(id),
    update: (next: ToastInput) => {
      sonnerToast.dismiss(id);
      return showToast(next);
    },
  };
}

/** @deprecated Préférer `import { toast } from "sonner"`. */
export const toast = showToast;

/** @deprecated Préférer `import { toast } from "sonner"`. */
export function useToast() {
  return {
    toasts: [] as const,
    toast: showToast,
    dismiss: (toastId?: string | number) =>
      toastId === undefined ? sonnerToast.dismiss() : sonnerToast.dismiss(toastId),
  };
}
