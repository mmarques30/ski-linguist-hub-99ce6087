import { Calendar, Clock } from "lucide-react";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { FormateurMissionCard } from "@/components/formateur/FormateurMissionCard";
import { FormateurCatalogSessionCard } from "@/components/formateur/FormateurCatalogSessionCard";
import {
  splitFormateurCatalogSessions,
  splitFormateurInscriptions,
  useFormateurCatalogSessions,
  useFormateurInscriptions,
  useFormateurProfile,
  useFormateurSessions,
} from "@/hooks/useFormateurPortal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  PageHeader,
  PageShell,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
} from "@/components/ui-kit";

export default function FormateurPlanning() {
  const { data: profile } = useFormateurProfile();
  const { data: inscriptions = [], isLoading } = useFormateurInscriptions(
    profile?.id
  );
  const { data: catalog = [], isLoading: loadingCatalog } =
    useFormateurCatalogSessions(profile ?? undefined);
  const { data: sessions = [], isLoading: loadingSessions } =
    useFormateurSessions(profile?.id);
  const { upcoming, current, past } = splitFormateurInscriptions(inscriptions);
  const catalogSplit = splitFormateurCatalogSessions(catalog);

  const upcomingCount = upcoming.length + catalogSplit.upcoming.length;
  const currentCount = current.length + catalogSplit.current.length;
  const pastCount = past.length + catalogSplit.past.length;
  const loading = isLoading || loadingCatalog;

  return (
    <FormateurPageShell>
      <PageShell>
        <PageHeader
          title="Missions"
          description="Sessions affectées (même sans inscrits) et stagiaires — ouvre une mission pour le détail"
          icon={Calendar}
          tone="blue"
        />

        {loading ? (
          <SurfaceCard flush>
            <TableSkeleton rows={4} cols={3} />
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            <SurfaceCard
              icon={Calendar}
              title={`En cours (${currentCount})`}
              flush={currentCount === 0}
            >
              {currentCount === 0 ? (
                <TableEmpty title="Aucune mission en cours." />
              ) : (
                <ul className="space-y-2 p-3">
                  {catalogSplit.current.map((session) => (
                    <FormateurCatalogSessionCard
                      key={`catalog-${session.id}`}
                      session={session}
                    />
                  ))}
                  {current.map((row) => (
                    <FormateurMissionCard key={row.id} row={row} />
                  ))}
                </ul>
              )}
            </SurfaceCard>

            <SurfaceCard
              icon={Calendar}
              title={`À venir (${upcomingCount})`}
              flush={upcomingCount === 0}
            >
              {upcomingCount === 0 ? (
                <TableEmpty title="Aucune mission à venir." />
              ) : (
                <ul className="space-y-2 p-3">
                  {catalogSplit.upcoming.map((session) => (
                    <FormateurCatalogSessionCard
                      key={`catalog-${session.id}`}
                      session={session}
                    />
                  ))}
                  {upcoming.map((row) => (
                    <FormateurMissionCard key={row.id} row={row} />
                  ))}
                </ul>
              )}
            </SurfaceCard>

            <SurfaceCard
              icon={Calendar}
              title={`Passées (${pastCount})`}
              flush={pastCount === 0}
            >
              {pastCount === 0 ? (
                <TableEmpty title="Aucune mission passée." />
              ) : (
                <ul className="space-y-2 p-3">
                  {catalogSplit.past.slice(0, 40).map((session) => (
                    <FormateurCatalogSessionCard
                      key={`catalog-${session.id}`}
                      session={session}
                    />
                  ))}
                  {past.slice(0, 40).map((row) => (
                    <FormateurMissionCard key={row.id} row={row} />
                  ))}
                </ul>
              )}
            </SurfaceCard>

            {!loadingSessions && sessions.length > 0 ? (
              <SurfaceCard
                icon={Clock}
                title={`Créneaux planifiés (${sessions.length})`}
                description="Séances déjà posées dans le planning FLI"
              >
                <ul className="space-y-2 p-3 text-sm">
                  {(sessions as Array<Record<string, unknown>>).map(
                    (session) => {
                      const inscriptionRaw = session.inscriptions;
                      const inscription = Array.isArray(inscriptionRaw)
                        ? inscriptionRaw[0]
                        : inscriptionRaw;
                      const studentRaw =
                        inscription && typeof inscription === "object"
                          ? (inscription as { students?: unknown }).students
                          : null;
                      const student = Array.isArray(studentRaw)
                        ? studentRaw[0]
                        : studentRaw;
                      const studentObj =
                        student && typeof student === "object"
                          ? (student as {
                              first_name?: string;
                              last_name?: string;
                            })
                          : null;
                      const label = studentObj
                        ? `${studentObj.first_name ?? ""} ${studentObj.last_name ?? ""}`.trim()
                        : (inscription as { code?: string } | null)?.code ||
                          "Séance";
                      const sessionDate = String(session.session_date ?? "");
                      return (
                        <li
                          key={String(session.id)}
                          className="flex flex-wrap justify-between gap-2 rounded-[var(--radius)] border border-border p-3"
                        >
                          <div>
                            <p className="font-medium">{label || "Séance"}</p>
                            <p className="text-xs text-muted-foreground tabular">
                              {sessionDate
                                ? format(
                                    new Date(sessionDate),
                                    "EEEE d MMMM yyyy",
                                    { locale: fr }
                                  )
                                : "—"}
                              {session.start_time
                                ? ` · ${String(session.start_time)}`
                                : ""}
                              {session.end_time
                                ? `–${String(session.end_time)}`
                                : ""}
                            </p>
                          </div>
                          {session.location ? (
                            <span className="text-xs text-muted-foreground">
                              {String(session.location)}
                            </span>
                          ) : null}
                        </li>
                      );
                    }
                  )}
                </ul>
              </SurfaceCard>
            ) : null}
          </div>
        )}
      </PageShell>
    </FormateurPageShell>
  );
}
