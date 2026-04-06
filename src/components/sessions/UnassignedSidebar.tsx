import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus } from "lucide-react";
import { useUnassignedInscriptions, useEnrollStudent } from "@/hooks/useSessions";
import { toast } from "sonner";

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
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Inscriptions non affectées</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
        {inscriptions && inscriptions.length > 0 ? (
          inscriptions.map((i) => (
            <div
              key={i.id}
              className="flex items-center justify-between p-2 rounded border bg-muted/30 text-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{i.student_name}</p>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] px-1">{i.language}</Badge>
                  {i.code && <span className="text-muted-foreground">{i.code}</span>}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                disabled={!selectedSessionId || enrollMutation.isPending}
                onClick={() => handleAssign(i.id, i.student_id)}
                title={selectedSessionId ? "Affecter à la session sélectionnée" : "Sélectionnez une session d'abord"}
              >
                <UserPlus className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            {isLoading ? "Chargement..." : "Toutes les inscriptions sont affectées"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
