import { Link } from "react-router";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardCheck,
  ClipboardList,
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
import { displayLanguageLabel } from "@/lib/taught-languages";
import {
  CardGrid,
  DefinitionList,
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

  return (
    <FormateurPageShell>
      <PageShell>
        <PageHeader
          title={
            loadingProfile
              ? "Espace formateur"
              : `Bonjour${profile?.first_name ? `, ${profile.first_name}` : ""}`
          }
          description="Tes missions en un coup d'œil, puis stagiaires, bilans et évaluations"
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
                <Link to={`${basePath}/planning`}>Toutes les missions</Link>
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

          <SurfaceCard title="Raccourcis" icon={ClipboardCheck}>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link to={`${basePath}/onboarding`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Guide FLI — bienvenue & fonctionnement
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to={`${basePath}/bilans`}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Bilans entrée / sortie
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to={`${basePath}/evaluations`}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Évaluations orales SNMSF
                  {!loadingEvals && bookingsToEvaluate.length > 0
                    ? ` (${bookingsToEvaluate.length})`
                    : ""}
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to={`${basePath}/stagiaires`}>
                  <Users className="mr-2 h-4 w-4" />
                  Stagiaires ({stagiaires.length})
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to={`${basePath}/planning`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Toutes les missions
                </Link>
              </Button>
            </div>

            {profile ? (
              <DefinitionList
                className="mt-4"
                columns={1}
                items={[
                  {
                    label: "Tes langues",
                    value:
                      (profile.languages || [])
                        .map((l) => displayLanguageLabel(l))
                        .join(", ") || "—",
                  },
                  {
                    label: "Ton contact",
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
            {past.length > 1 ? "s" : ""} — visibles dans Missions.
          </p>
        ) : null}
      </PageShell>
    </FormateurPageShell>
  );
}
