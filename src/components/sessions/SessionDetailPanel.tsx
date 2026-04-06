import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, User, MapPin, Clock, Users, Edit, Ban } from "lucide-react";
import { useSessionEnrollments, useUpdateSession, useRemoveEnrollment, type Session } from "@/hooks/useSessions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { LANG_COLORS } from "@/lib/session-utils";

interface Props {
  session: Session;
  onClose: () => void;
  onEdit: () => void;
}

const statusLabels: Record<string, string> = {
  planifiee: "Planifiée",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

const attendanceLabels: Record<string, string> = {
  inscrit: "Inscrit",
  present: "Présent",
  absent: "Absent",
  excuse: "Excusé",
};

export function SessionDetailPanel({ session, onClose, onEdit }: Props) {
  const { data: enrollments } = useSessionEnrollments(session.id);
  const updateMutation = useUpdateSession();
  const removeMutation = useRemoveEnrollment();

  const handleCancel = async () => {
    try {
      await updateMutation.mutateAsync({ id: session.id, status: "annulee" });
      toast.success("Session annulée");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRemoveStudent = async (enrollmentId: string) => {
    try {
      await removeMutation.mutateAsync({ id: enrollmentId, sessionId: session.id });
      toast.success("Stagiaire retiré");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const langColor = LANG_COLORS[session.language] || "bg-muted";

  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${langColor}`} />
            <CardTitle className="text-base">{session.title}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Badge variant="outline" className="w-fit">{statusLabels[session.status] || session.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{format(new Date(session.start_datetime), "dd/MM HH:mm", { locale: fr })} — {format(new Date(session.end_datetime), "HH:mm")}</span>
          </div>
          {session.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{session.location}{session.room ? ` — ${session.room}` : ""}</span>
            </div>
          )}
          {(session.instructor_first_name || session.instructor_last_name) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{session.instructor_first_name} {session.instructor_last_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{session.current_students}/{session.max_students} inscrits</span>
          </div>
        </div>

        {session.notes && <p className="text-muted-foreground italic">{session.notes}</p>}

        {/* Enrolled students */}
        <div>
          <h4 className="font-medium mb-2">Stagiaires inscrits</h4>
          {enrollments && enrollments.length > 0 ? (
            <div className="space-y-1.5">
              {enrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/50">
                  <div>
                    <span className="font-medium text-xs">{e.student_first_name} {e.student_last_name}</span>
                    <Badge variant="outline" className="ml-2 text-[10px] px-1.5">
                      {attendanceLabels[e.attendance_status] || e.attendance_status}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                    onClick={() => handleRemoveStudent(e.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">Aucun stagiaire inscrit</p>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5 mr-1" /> Modifier
          </Button>
          {session.status !== "annulee" && (
            <Button size="sm" variant="destructive" className="flex-1" onClick={handleCancel}>
              <Ban className="h-3.5 w-3.5 mr-1" /> Annuler
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
