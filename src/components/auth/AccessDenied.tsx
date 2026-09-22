import { ShieldOff } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";

/** Page affichée quand canView refuse l'accès (Vague C). */
export function AccessDenied({ routeLabel }: { routeLabel?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <EmptyState
        icon={ShieldOff}
        title="Accès non autorisé"
        description={`${
          routeLabel
            ? `Vous n'avez pas la permission de consulter « ${routeLabel} ».`
            : "Vous n'avez pas la permission de consulter cette page."
        } Demandez un accès à un administrateur FLI.`}
        className="w-full max-w-md bg-card"
      >
        <Button asChild variant="outline" className="mt-5">
          <Link to="/">Retour au tableau de bord</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
