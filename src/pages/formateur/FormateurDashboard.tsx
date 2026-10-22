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
import { useFormateurView } from "@/contexts/FormateurViewContext";
import {
  splitFormateurInscriptions,
  uniqueStagiairesFromInscriptions,
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
  const { data: bookingsToEvaluate = [], isLoading: loadingEvals } =
    useTestBookingsToEvaluate();

  const { upcoming, current, past } = splitFormateurInscriptions(inscriptions);
  const stagiaires = uniqueStagiairesFromInscriptions(inscriptions);
  const highlight = [...current, ...upcoming].slice(0, 3);
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
                <Link to={`${basePath}/planning`}>Toutes</Link>
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
                  Fiches de présence
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
