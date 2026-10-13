import type { ReactNode } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { FormateurLayout } from "@/components/layout/FormateurLayout";
import { FormateurAssistBanner } from "@/components/formateur/FormateurAssistBanner";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";

/**
 * Portail formateur / Assister → FormateurLayout.
 * Staff sur /formateur/evaluations (saisie orales) → MainLayout + bandeau Assister si besoin.
 */
export function FormateurPageShell({ children }: { children: ReactNode }) {
  const { isFormateur } = useUserPermissions();
  const { isAssistMode } = useFormateurView();

  if (isFormateur || isAssistMode) {
    return <FormateurLayout>{children}</FormateurLayout>;
  }

  return (
    <MainLayout>
      <FormateurAssistBanner />
      {children}
    </MainLayout>
  );
}
