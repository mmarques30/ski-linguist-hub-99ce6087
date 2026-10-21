import { Link } from "react-router";
import {
  ArrowRight,
  ClipboardList,
  FileInput,
  FileOutput,
  Calendar,
} from "lucide-react";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import {
  splitFormateurInscriptions,
  useFormateurInscriptions,
  useFormateurProfile,
} from "@/hooks/useFormateurPortal";
import { formatFormateurLevelDisplay } from "@/lib/formateur-formation-forms";
import { inscriptionDateRangeLabel } from "@/lib/registration-dates";
import { displayLanguageLabel } from "@/lib/taught-languages";
import {
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export default function FormateurBilans() {
  const { basePath, isAssistMode } = useFormateurView();
  const { data: profile, isLoading: loadingProfile } = useFormateurProfile();
  const { data: inscriptions = [], isLoading } = useFormateurInscriptions(
    profile?.id
  );
  const { current, upcoming, past } = splitFormateurInscriptions(inscriptions);
  const rows = [...current, ...upcoming, ...past];

  return (
    <FormateurPageShell>
      <PageShell>
        <PageHeader
          title="Bilans entrée / sortie"
          description={
            isAssistMode
              ? "Niveaux d'entrée et de sortie (aperçu Assister)"
              : "Saisie des niveaux d'entrée et de sortie pour chaque stagiaire"
          }
          icon={ClipboardList}
          tone="gold"
        />

        {isLoading || loadingProfile ? (
          <SurfaceCard flush>
            <TableSkeleton rows={4} cols={4} />
          </SurfaceCard>
        ) : rows.length === 0 ? (
          <SurfaceCard flush>
            <TableEmpty title="Aucune mission rattachée pour le moment." />
          </SurfaceCard>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => {
              const entryDone = Boolean(row.entry_form_completed_at);
              const exitDone = Boolean(row.exit_form_completed_at);
              const entreeGen = formatFormateurLevelDisplay(
                row.niveau_general_entree
              );
              const entreeTech = formatFormateurLevelDisplay(
                row.niveau_technique_entree
              );
              const sortieGen = formatFormateurLevelDisplay(
                row.niveau_general_sortie
              );
              const sortieTech = formatFormateurLevelDisplay(
                row.niveau_technique_sortie
              );
              return (
                <li key={row.id}>
                  <SurfaceCard>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-semibold">
                            {row.student_name || "Stagiaire"}
                            {row.code ? (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                {row.code}
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted-foreground tabular">
                            {inscriptionDateRangeLabel(row)}
                            {row.language
                              ? ` · ${displayLanguageLabel(row.language)}`
                              : ""}
                            {row.course_location
                              ? ` · ${row.course_location}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`${basePath}/missions/${row.id}`}>
                              <Calendar className="mr-1.5 h-3.5 w-3.5" />
                              Mission
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`${basePath}/bilans/${row.id}/entree`}>
                              <FileInput className="mr-1.5 h-3.5 w-3.5" />
                              Entrée
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`${basePath}/bilans/${row.id}/sortie`}>
                              <FileOutput className="mr-1.5 h-3.5 w-3.5" />
                              Sortie
                            </Link>
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-2 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">
                              Entrée
                            </span>
                            <StatusPill
                              tone={entryDone ? "success" : "warning"}
                              size="sm"
                            >
                              {entryDone ? "OK" : "À faire"}
                            </StatusPill>
                          </div>
                          <p className="text-sm">
                            <span className="font-medium tabular">
                              {entreeGen}
                            </span>
                            {entreeTech !== "—" ? (
                              <span className="text-muted-foreground">
                                {" "}
                                · tech. {entreeTech}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
                        <div className="space-y-1 sm:text-right">
                          <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                            <span className="text-xs font-medium text-muted-foreground">
                              Sortie
                            </span>
                            <StatusPill
                              tone={exitDone ? "success" : "warning"}
                              size="sm"
                            >
                              {exitDone ? "OK" : "À faire"}
                            </StatusPill>
                          </div>
                          <p className="text-sm">
                            <span className="font-medium tabular">
                              {sortieGen}
                            </span>
                            {sortieTech !== "—" ? (
                              <span className="text-muted-foreground">
                                {" "}
                                · tech. {sortieTech}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    </div>
                  </SurfaceCard>
                </li>
              );
            })}
          </ul>
        )}
      </PageShell>
    </FormateurPageShell>
  );
}
