import { StudentLayout } from "@/components/layout/StudentLayout";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { useStudentProfile, useStudentSessions } from "@/hooks/useStudentPortal";
import { format, isAfter, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import {
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
} from "@/components/ui-kit";

export default function StudentPlanning() {
  const { data: student } = useStudentProfile();
  const { data: sessions, isLoading } = useStudentSessions(student?.id);

  const now = new Date();
  const upcoming = (sessions || []).filter((s: any) =>
    isAfter(new Date(s.start_datetime), now)
  );
  const past = (sessions || []).filter((s: any) =>
    isBefore(new Date(s.end_datetime), now)
  );

  const SessionCard = ({ session }: { session: any }) => (
    <li className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">{session.title}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            {format(new Date(session.start_datetime), "EEEE d MMMM — HH:mm", {
              locale: fr,
            })}{" "}
            à {format(new Date(session.end_datetime), "HH:mm")}
          </span>
          {session.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {session.location}
              {session.room ? ` — ${session.room}` : ""}
            </span>
          )}
          {session.instructors && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3 shrink-0" />
              {session.instructors.first_name} {session.instructors.last_name}
            </span>
          )}
        </div>
      </div>
      <StatusPill tone="neutral" size="sm" className="shrink-0 self-start">
        {session.language}
      </StatusPill>
    </li>
  );

  return (
    <StudentLayout>
      <PageShell>
        <PageHeader
          title="Mon planning"
          description="Consultez vos sessions de formation à venir"
          icon={Calendar}
          tone="blue"
        />

        {isLoading ? (
          <SurfaceCard flush>
            <TableSkeleton rows={4} cols={3} />
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            <SurfaceCard
              icon={Calendar}
              title={`Sessions à venir (${upcoming.length})`}
              flush={upcoming.length === 0}
            >
              {upcoming.length > 0 ? (
                <ul className="space-y-2">
                  {upcoming.map((s: any) => (
                    <SessionCard key={s.id} session={s} />
                  ))}
                </ul>
              ) : (
                <TableEmpty icon={Calendar} title="Aucune session programmée." />
              )}
            </SurfaceCard>

            {past.length > 0 && (
              <SurfaceCard title={`Sessions passées (${past.length})`}>
                <ul className="space-y-2">
                  {past.map((s: any) => (
                    <SessionCard key={s.id} session={s} />
                  ))}
                </ul>
              </SurfaceCard>
            )}
          </div>
        )}
      </PageShell>
    </StudentLayout>
  );
}
