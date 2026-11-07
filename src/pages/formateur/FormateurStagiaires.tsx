import { Link } from "react-router";
import { ChevronRight, Mail, Phone, Users } from "lucide-react";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import {
  uniqueStagiairesFromInscriptions,
  useFormateurInscriptions,
  useFormateurProfile,
} from "@/hooks/useFormateurPortal";
import { formatFormateurLevelDisplay } from "@/lib/formateur-formation-forms";
import { inscriptionDateRangeLabel } from "@/lib/registration-dates";
import { getStatusLabel } from "@/lib/inscription-status";
import { displayLanguageLabel } from "@/lib/taught-languages";
import {
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
  toneForStatus,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export default function FormateurStagiaires() {
  const { basePath } = useFormateurView();
  const { data: profile } = useFormateurProfile();
  const { data: inscriptions = [], isLoading } = useFormateurInscriptions(
    profile?.id
  );
  const stagiaires = uniqueStagiairesFromInscriptions(inscriptions);

  return (
    <FormateurPageShell>
      <PageShell>
        <PageHeader
          title="Stagiaires"
          description="Ouvre une fiche pour le contact, les attentes, le test et les niveaux"
          icon={Users}
          tone="blue"
        />

        {isLoading ? (
          <SurfaceCard flush>
            <TableSkeleton rows={5} cols={3} />
          </SurfaceCard>
        ) : stagiaires.length === 0 ? (
          <SurfaceCard flush>
            <TableEmpty title="Aucun stagiaire rattaché pour le moment." />
          </SurfaceCard>
        ) : (
          <ul className="space-y-3">
            {stagiaires.map((s) => (
              <li key={s.studentId}>
                <SurfaceCard>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <Link
                        to={`${basePath}/stagiaires/${s.studentId}`}
                        className="text-sm font-semibold text-foreground hover:underline"
                      >
                        {s.name}
                      </Link>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {s.email ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {s.email}
                          </span>
                        ) : null}
                        {s.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {s.phone}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <StatusPill tone="neutral" size="sm">
                        {s.inscriptions.length} mission
                        {s.inscriptions.length > 1 ? "s" : ""}
                      </StatusPill>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`${basePath}/stagiaires/${s.studentId}`}>
                          Voir la fiche
                          <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-2 border-t border-border pt-3">
                    {s.inscriptions.map((row) => (
                      <li key={row.id}>
                        <Link
                          to={`${basePath}/missions/${row.id}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] px-1 py-1.5 text-xs transition-colors hover:bg-[hsl(var(--surface-sunken))]"
                        >
                          <span className="text-muted-foreground">
                            {row.code ? `${row.code} · ` : ""}
                            {inscriptionDateRangeLabel(row)}
                            {row.language
                              ? ` · ${displayLanguageLabel(row.language)}`
                              : ""}
                            {row.niveau_general_entree ||
                            row.niveau_general_sortie ? (
                              <span className="ml-1 text-foreground">
                                ·{" "}
                                {formatFormateurLevelDisplay(
                                  row.niveau_general_entree
                                )}{" "}
                                →{" "}
                                {formatFormateurLevelDisplay(
                                  row.niveau_general_sortie
                                )}
                              </span>
                            ) : null}
                          </span>
                          <StatusPill
                            tone={toneForStatus(row.status)}
                            size="sm"
                          >
                            {getStatusLabel(row.status || "", "fr")}
                          </StatusPill>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </SurfaceCard>
              </li>
            ))}
          </ul>
        )}
      </PageShell>
    </FormateurPageShell>
  );
}
