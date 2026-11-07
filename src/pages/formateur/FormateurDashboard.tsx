import { Link } from "react-router";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardCheck,
  ClipboardList,
  ClipboardPen,
  BookOpen,
} from "lucide-react";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { FormateurMissionCard } from "@/components/formateur/FormateurMissionCard";
import { FormateurCatalogSessionCard } from "@/components/formateur/FormateurCatalogSessionCard";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import {
  splitFormateurCatalogSessions,
  splitFormateurInscriptions,
  uniqueStagiairesFromInscriptions,
  useFormateurCatalogSessions,
  useFormateurInscriptions,
  useFormateurProfile,
} from "@/hooks/useFormateurPortal";
import { useTestBookingsToEvaluate } from "@/hooks/useTestEvaluations";
import {
  CardGrid,
  PageHeader,
  PageShell,
  StatTile,
  StatTileGrid,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export default function FormateurDashboard() {
  const { basePath } = useFormateurView();
  const { data: profile, isLoading: loadingProfile } = useFormateurProfile();
  const { data: inscriptions = [], isLoading: loadingInscriptions } =
    useFormateurInscriptions(profile?.id);
  const { data: catalog = [], isLoading: loadingCatalog } =
    useFormateurCatalogSessions(profile ?? undefined);
  const { data: bookingsToEvaluate = [], isLoading: loadingEvals } =
    useTestBookingsToEvaluate();

  const { upcoming, current, past } = splitFormateurInscriptions(inscriptions);
  const catalogSplit = splitFormateurCatalogSessions(catalog);
  const stagiaires = uniqueStagiairesFromInscriptions(inscriptions);
  const catalogHighlight = [
    ...catalogSplit.current,
    ...catalogSplit.upcoming,
  ];
  const inscriptionHighlight = [...current, ...upcoming];
  const highlightCatalog = catalogHighlight.slice(0, 3);
  const highlightInscriptions = inscriptionHighlight.slice(
    0,
    Math.max(0, 3 - highlightCatalog.length)
  );
  const hasHighlight =
    highlightCatalog.length > 0 || highlightInscriptions.length > 0;
  const loadingMissions = loadingInscriptions || loadingCatalog;
  const bilansTodo = inscriptions.filter(
    (r) => !r.entry_form_completed_at || !r.exit_form_completed_at
  ).length;

  return (
    <FormateurPageShell>
      <PageShell>
        <PageHeader
          title={
            loadingProfile
              ? "Espace formateur"
              : `Bonjour${profile?.first_name ? `, ${profile.first_name}` : ""}`
          }
          description="Tes missions, stagiaires et bilans — le reste est en lecture seule ou pour les évals orales"
          icon={LayoutDashboard}
          tone="gold"
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link to={`${basePath}/onboarding`}>
                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                Guide FLI
              </Link>
            </Button>
          }
        />

        <StatTileGrid cols={4}>
          <StatTile
            label="En cours"
            value={current.length + catalogSplit.current.length}
            icon={BookOpen}
          />
          <StatTile
            label="À venir"
            value={upcoming.length + catalogSplit.upcoming.length}
            icon={Calendar}
          />
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
                <Link to={`${basePath}/planning`}>Toutes</Link>
              </Button>
            }
          >
            {loadingMissions ? (
              <TableSkeleton rows={3} cols={2} />
            ) : !hasHighlight ? (
              <TableEmpty title="Aucune mission en cours ou à venir." />
            ) : (
              <ul className="space-y-3">
                {highlightCatalog.map((session) => (
                  <FormateurCatalogSessionCard
                    key={`catalog-${session.id}`}
                    session={session}
                  />
                ))}
                {highlightInscriptions.map((row) => (
                  <FormateurMissionCard key={row.id} row={row} />
                ))}
              </ul>
            )}
          </SurfaceCard>

          <SurfaceCard title="À faire" icon={ClipboardList}>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link to={`${basePath}/bilans`}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Bilans entrée / sortie
                  {!loadingInscriptions && bilansTodo > 0
                    ? ` (${bilansTodo})`
                    : ""}
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to={`${basePath}/presences`}>
                  <ClipboardPen className="mr-2 h-4 w-4" />
                  Présence / émargement
                </Link>
              </Button>
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
                  Stagiaires
                </Link>
              </Button>
            </div>
          </SurfaceCard>
        </CardGrid>

        {!loadingInscriptions && past.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {past.length} mission{past.length > 1 ? "s" : ""} passée
            {past.length > 1 ? "s" : ""} — visibles dans Missions.
          </p>
        ) : null}
      </PageShell>
    </FormateurPageShell>
  );
}
