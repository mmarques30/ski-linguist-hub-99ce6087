import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardCheck,
  MapPin,
  BookOpen,
} from "lucide-react";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import {
  splitFormateurInscriptions,
  uniqueStagiairesFromInscriptions,
  useFormateurInscriptions,
  useFormateurProfile,
} from "@/hooks/useFormateurPortal";
import { useTestBookingsToEvaluate } from "@/hooks/useTestEvaluations";
import { inscriptionDateRangeLabel } from "@/lib/registration-dates";
import { getStatusLabel } from "@/lib/inscription-status";
import { displayLanguageLabel } from "@/lib/taught-languages";
import {
  CardGrid,
  DefinitionList,
  PageHeader,
  PageShell,
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
  toneForStatus,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export default function FormateurDashboard() {
  const { basePath } = useFormateurView();
  const { data: profile, isLoading: loadingProfile } = useFormateurProfile();
  const { data: inscriptions = [], isLoading: loadingInscriptions } =
    useFormateurInscriptions(profile?.id);
  const { data: bookingsToEvaluate = [], isLoading: loadingEvals } =
    useTestBookingsToEvaluate();

  const { upcoming, current, past } = splitFormateurInscriptions(inscriptions);
  const stagiaires = uniqueStagiairesFromInscriptions(inscriptions);
  const highlight = [...current, ...upcoming].slice(0, 3);

  return (
    <FormateurPageShell>
      <PageShell>
        <PageHeader
          title={
            loadingProfile
              ? "Espace formateur"
              : `Bonjour${profile?.first_name ? `, ${profile.first_name}` : ""}`
          }
          description="Vos missions, stagiaires et évaluations orales"
          icon={LayoutDashboard}
          tone="gold"
        />

        <StatTileGrid cols={4}>
          <StatTile label="En cours" value={current.length} icon={BookOpen} />
          <StatTile label="À venir" value={upcoming.length} icon={Calendar} />
          <StatTile label="Stagiaires" value={stagiaires.length} icon={Users} />
          <StatTile
            label="Évals à saisir"
            value={loadingEvals ? "…" : bookingsToEvaluate.length}
            icon={ClipboardCheck}
          />
        </StatTileGrid>

        <CardGrid cols={2}>
          <SurfaceCard
            title="Prochaines missions"
            icon={Calendar}
            actions={
              <Button variant="ghost" size="sm" asChild>
                <Link to={`${basePath}/planning`}>Voir le planning</Link>
              </Button>
            }
          >
            {loadingInscriptions ? (
              <TableSkeleton rows={3} cols={2} />
            ) : highlight.length === 0 ? (
              <TableEmpty title="Aucune mission en cours ou à venir." />
            ) : (
              <ul className="space-y-3">
                {highlight.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-[var(--radius)] border border-border p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium">
                          {row.student_name || "Stagiaire"}
                          {row.code ? (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {row.code}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground tabular">
                          {inscriptionDateRangeLabel(row)}
                        </p>
                        {row.course_location ? (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {row.course_location}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {row.language ? (
                          <StatusPill tone="neutral" size="sm">
                            {displayLanguageLabel(row.language)}
                          </StatusPill>
                        ) : null}
                        <StatusPill tone={toneForStatus(row.status)} size="sm">
                          {getStatusLabel(row.status || '', 'fr')}
                        </StatusPill>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SurfaceCard>

          <SurfaceCard title="Raccourcis" icon={ClipboardCheck}>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link to={`${basePath}/evaluations`}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Évaluations orales
                  {!loadingEvals && bookingsToEvaluate.length > 0
                    ? ` (${bookingsToEvaluate.length})`
                    : ""}
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to={`${basePath}/stagiaires`}>
                  <Users className="mr-2 h-4 w-4" />
                  Mes stagiaires ({stagiaires.length})
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to={`${basePath}/planning`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Planning des missions
                </Link>
              </Button>
            </div>

            {profile ? (
              <DefinitionList
                className="mt-4"
                columns={1}
                items={[
                  {
                    label: "Langues",
                    value:
                      (profile.languages || [])
                        .map((l) => displayLanguageLabel(l))
                        .join(", ") || "—",
                  },
                  {
                    label: "Contact",
                    value: profile.email || profile.phone || "—",
                  },
                ]}
              />
            ) : null}
          </SurfaceCard>
        </CardGrid>

        {!loadingInscriptions && past.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {past.length} mission{past.length > 1 ? "s" : ""} passée
            {past.length > 1 ? "s" : ""} — visibles dans Planning.
          </p>
        ) : null}
      </PageShell>
    </FormateurPageShell>
  );
}
