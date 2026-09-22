import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Users } from "lucide-react";
import { useUnassignedInscriptions, useEnrollStudent } from "@/hooks/useSessions";
import { toast } from "sonner";
import { StatusPill, SurfaceCard, TableEmpty } from "@/components/ui-kit";
import { Link } from "react-router-dom";

interface Props {
  selectedSessionId: string | undefined;
}

export function UnassignedSidebar({ selectedSessionId }: Props) {
  const { data: inscriptions, isLoading } = useUnassignedInscriptions();
  const enrollMutation = useEnrollStudent();

  const handleAssign = async (inscriptionId: string, studentId: string) => {
    if (!selectedSessionId) {
      toast.error("Sélectionnez d'abord une session dans le calendrier");
      return;
    }
    try {
      await enrollMutation.mutateAsync({
        session_id: selectedSessionId,
        student_id: studentId,
        inscription_id: inscriptionId,
      });
      toast.success("Stagiaire affecté à la session");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <SurfaceCard
      title="Inscriptions non affectées"
      icon={Users}
      className="h-fit"
      flush
      bodyClassName="max-h-[400px] overflow-y-auto scrollbar-thin"
    >
      {isLoading ? (
        <div className="space-y-2 px-4 pb-4">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-12 w-full rounded-[var(--radius)]" />
          ))}
        </div>
      ) : inscriptions && inscriptions.length > 0 ? (
        <ul className="space-y-2 px-4 pb-4">
          {inscriptions.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] p-2 text-xs"
            >
              <div className="min-w-0 flex-1 space-y-1">
                {/* Le nom mène à la fiche inscription — l'id est déjà dans la donnée. */}
                <Link
                  to={`/inscriptions/${i.id}`}
                  className="block truncate font-medium text-foreground hover:underline"
                >
                  {i.student_name}
                </Link>
                <div className="flex items-center gap-1.5">
                  <StatusPill tone="neutral" size="sm">{i.language}</StatusPill>
                  {i.code && <span className="truncate text-muted-foreground">{i.code}</span>}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                disabled={!selectedSessionId || enrollMutation.isPending}
                onClick={() => handleAssign(i.id, i.student_id)}
                title={selectedSessionId ? "Affecter à la session sélectionnée" : "Sélectionnez une session d'abord"}
                aria-label={selectedSessionId ? "Affecter à la session sélectionnée" : "Sélectionnez une session d'abord"}
              >
                <UserPlus className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <TableEmpty
          icon={Users}
          title="Toutes les inscriptions sont affectées"
          description="Aucune inscription en attente d'affectation à une session."
        />
      )}
    </SurfaceCard>
  );
}
