import { Button } from "@/components/ui/button";
import { X, User, MapPin, Clock, Users, Edit, Ban } from "lucide-react";
import { useSessionEnrollments, useUpdateSession, useRemoveEnrollment, type Session } from "@/hooks/useSessions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
import { LANGUAGE_DOT_CLASS, SESSION_STATUS_TONE, toneForLanguage } from "@/components/sessions/session-tints";
import { cn } from "@/lib/utils";

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

const attendanceTones: Record<string, "neutral" | "success" | "danger" | "warning"> = {
  inscrit: "neutral",
  present: "success",
  absent: "danger",
  excuse: "warning",
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

  const langDot = LANGUAGE_DOT_CLASS[toneForLanguage(session.language)];

  return (
    <SurfaceCard
      className="xl:sticky xl:top-6"
      title={
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn("h-3 w-3 shrink-0 rounded-pill", langDot)} aria-hidden />
          <span className="truncate">{session.title}</span>
        </span>
      }
      actions={
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Fermer le panneau">
          <X className="h-4 w-4" />
        </Button>
      }
      footer={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5 mr-1" /> Modifier
          </Button>
          {session.status !== "annulee" && (
            <Button size="sm" variant="destructive" className="flex-1" onClick={handleCancel}>
              <Ban className="h-3.5 w-3.5 mr-1" /> Annuler
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-sm">
        <StatusPill tone={SESSION_STATUS_TONE[session.status] ?? "neutral"}>
          {statusLabels[session.status] || session.status}
        </StatusPill>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 truncate tabular">
              {format(new Date(session.start_datetime), "dd/MM HH:mm", { locale: fr })} — {format(new Date(session.end_datetime), "HH:mm")}
            </span>
          </div>
          {session.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 truncate">{session.location}{session.room ? ` — ${session.room}` : ""}</span>
            </div>
          )}
          {(session.instructor_first_name || session.instructor_last_name) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 truncate">{session.instructor_first_name} {session.instructor_last_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span className="tabular">{session.current_students}/{session.max_students} inscrits</span>
          </div>
        </dl>

        {session.notes && <p className="italic text-muted-foreground">{session.notes}</p>}

        {/* Enrolled students */}
        <div>
          <h4 className="mb-2 font-medium">Stagiaires inscrits</h4>
          {enrollments && enrollments.length > 0 ? (
            <ul className="space-y-1.5">
              {enrollments.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-2 rounded-[var(--radius)] bg-[hsl(var(--surface-sunken))] px-2 py-1.5"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate text-xs font-medium">{e.student_first_name} {e.student_last_name}</span>
                    <StatusPill tone={attendanceTones[e.attendance_status] ?? "neutral"} size="sm">
                      {attendanceLabels[e.attendance_status] || e.attendance_status}
                    </StatusPill>
                  </div>
                  <Button
                    variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive"
                    onClick={() => handleRemoveStudent(e.id)}
                    aria-label="Retirer le stagiaire de la session"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Aucun stagiaire inscrit</p>
          )}
        </div>
      </div>
    </SurfaceCard>
  );
}
