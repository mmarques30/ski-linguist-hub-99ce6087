/**
 * @deprecated Toaster Radix retiré. L’app monte uniquement Sonner
 * (`@/components/ui/sonner`). Les appels `useToast` / `toast({…})` délèguent
 * déjà à Sonner via `@/hooks/use-toast`.
 */
export function Toaster() {
  return null;
}
