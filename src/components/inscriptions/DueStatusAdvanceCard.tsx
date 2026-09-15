import { toast } from "sonner";
import { Loader2, PlayCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAdvanceDueStatuses, useDueStatusAdvances } from "@/hooks/useInscriptions";

/**
 * Rattrapage des statuts échus : une inscription confirmée dont la date de
 * début est atteinte devrait être « En cours ». Le job pg_cron qui fait ce
 * passage la nuit est créé inactif, donc l'écran propose de le lancer.
 */
export function DueStatusAdvanceCard() {
  const { data, isLoading } = useDueStatusAdvances();
  const advance = useAdvanceDueStatuses();

  if (isLoading || !data || data.nombre === 0) return null;

  const pluriel = data.nombre > 1;
  const codes = data.inscriptions
    .map((i) => i.code)
    .filter(Boolean)
    .slice(0, 6)
    .join(", ");

  return (
    <Alert>
      <PlayCircle className="h-4 w-4" />
      <AlertTitle>
        {data.nombre} inscription{pluriel ? "s" : ""} confirmée{pluriel ? "s" : ""} {pluriel ? "ont" : "a"}{" "}
        déjà commencé
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Leur date de début est passée mais leur statut est resté « Confirmée ».
          {codes && <> {codes}{data.inscriptions.length > 6 ? "…" : ""}</>}
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={advance.isPending}
          onClick={async () => {
            try {
              const rapport = await advance.mutateAsync();
              toast.success(
                `${rapport.nombre} inscription(s) passée(s) en « En cours »`
              );
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Avancement des statuts impossible"
              );
            }
          }}
        >
          {advance.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PlayCircle className="mr-2 h-4 w-4" />
          )}
          Passer en cours
        </Button>
      </AlertDescription>
    </Alert>
  );
}
