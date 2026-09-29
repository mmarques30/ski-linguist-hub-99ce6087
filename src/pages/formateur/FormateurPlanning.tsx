import { Calendar, Clock, MapPin, User } from "lucide-react";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import {
  splitFormateurInscriptions,
  useFormateurInscriptions,
  useFormateurProfile,
  useFormateurSessions,
  type FormateurInscriptionRow,
} from "@/hooks/useFormateurPortal";
import { inscriptionDateRangeLabel } from "@/lib/registration-dates";
import { getStatusLabel } from "@/lib/inscription-status";
import { displayLanguageLabel } from "@/lib/taught-languages";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
  toneForStatus,
} from "@/components/ui-kit";

function MissionCard({ row }: { row: FormateurInscriptionRow }) {
  return (
    <li className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">
          {row.student_name || "Stagiaire"}
          {row.code ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">{row.code}</span>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 tabular">
            <Clock className="h-3 w-3 shrink-0" />
            {inscriptionDateRangeLabel(row)}
          </span>
          {row.course_location ? (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {row.course_location}
            </span>
          ) : null}
          {row.schedule ? (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              {row.schedule}
            </span>
          ) : null}
          {row.ski_school_name ? (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3 shrink-0" />
              {row.ski_school_name}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-1 self-start">
        {row.language ? (
          <StatusPill tone="neutral" size="sm">
            {displayLanguageLabel(row.language)}
          </StatusPill>
        ) : null}
        <StatusPill tone={toneForStatus(row.status)} size="sm">
          {getStatusLabel(row.status || '', 'fr')}
        </StatusPill>
      </div>
    </li>
  );
}

export default function FormateurPlanning() {
  const { data: profile } = useFormateurProfile();
  const { data: inscriptions = [], isLoading } = useFormateurInscriptions(profile?.id);
  const { data: sessions = [], isLoading: loadingSessions } = useFormateurSessions(
    profile?.id
  );
  const { upcoming, current, past } = splitFormateurInscriptions(inscriptions);

  return (
    <FormateurPageShell>
      <PageShell>
        <PageHeader
          title="Planning"
          description="Missions rattachées à votre compte (dates d’inscription)"
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
              title={`En cours (${current.length})`}
              flush={current.length === 0}
            >
              {current.length === 0 ? (
                <TableEmpty title="Aucune mission en cours." />
              ) : (
                <ul className="space-y-2 p-3">
                  {current.map((row) => (
                    <MissionCard key={row.id} row={row} />
                  ))}
                </ul>
              )}
            </SurfaceCard>

            <SurfaceCard
              icon={Calendar}
              title={`À venir (${upcoming.length})`}
              flush={upcoming.length === 0}
            >
              {upcoming.length === 0 ? (
                <TableEmpty title="Aucune mission à venir." />
              ) : (
                <ul className="space-y-2 p-3">
                  {upcoming.map((row) => (
                    <MissionCard key={row.id} row={row} />
                  ))}
                </ul>
              )}
            </SurfaceCard>

            <SurfaceCard
              icon={Calendar}
              title={`Passées (${past.length})`}
              flush={past.length === 0}
            >
              {past.length === 0 ? (
                <TableEmpty title="Aucune mission passée." />
              ) : (
                <ul className="space-y-2 p-3">
                  {past.slice(0, 40).map((row) => (
                    <MissionCard key={row.id} row={row} />
                  ))}
                </ul>
              )}
            </SurfaceCard>

            {!loadingSessions && sessions.length > 0 ? (
              <SurfaceCard
                icon={Clock}
                title={`Sessions planifiées (${sessions.length})`}
                description="Lignes instructor_sessions (si renseignées)"
              >
                <ul className="space-y-2 p-3 text-sm">
                  {(sessions as Array<Record<string, unknown>>).map((session) => {
                    const inscriptionRaw = session.inscriptions;
                    const inscription = Array.isArray(inscriptionRaw)
                      ? inscriptionRaw[0]
                      : inscriptionRaw;
                    const studentRaw =
                      inscription && typeof inscription === "object"
                        ? (inscription as { students?: unknown }).students
                        : null;
                    const student = Array.isArray(studentRaw) ? studentRaw[0] : studentRaw;
                    const studentObj =
                      student && typeof student === "object"
                        ? (student as { first_name?: string; last_name?: string })
                        : null;
                    const label = studentObj
                      ? `${studentObj.first_name ?? ""} ${studentObj.last_name ?? ""}`.trim()
                      : (inscription as { code?: string } | null)?.code || "Session";
                    const sessionDate = String(session.session_date ?? "");
                    return (
                      <li
                        key={String(session.id)}
                        className="flex flex-wrap justify-between gap-2 rounded-[var(--radius)] border border-border p-3"
                      >
                        <div>
                          <p className="font-medium">{label || "Session"}</p>
                          <p className="text-xs text-muted-foreground tabular">
                            {sessionDate
                              ? format(new Date(sessionDate), "EEEE d MMMM yyyy", {
                                  locale: fr,
                                })
                              : "—"}
                            {session.start_time ? ` · ${String(session.start_time)}` : ""}
                            {session.end_time ? `–${String(session.end_time)}` : ""}
                          </p>
                        </div>
                        {session.location ? (
                          <span className="text-xs text-muted-foreground">
                            {String(session.location)}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </SurfaceCard>
            ) : null}
          </div>
        )}
      </PageShell>
    </FormateurPageShell>
  );
}
