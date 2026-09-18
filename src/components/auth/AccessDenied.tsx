import { ShieldOff } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

/** Page affichée quand canView refuse l'accès (Vague C). */
export function AccessDenied({ routeLabel }: { routeLabel?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <ShieldOff className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold">Accès non autorisé</h1>
        <p className="text-sm text-muted-foreground">
          {routeLabel
            ? `Vous n'avez pas la permission de consulter « ${routeLabel} ».`
            : "Vous n'avez pas la permission de consulter cette page."}{" "}
          Demandez un accès à un administrateur FLI.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Retour au tableau de bord</Link>
        </Button>
      </div>
    </div>
  );
}
