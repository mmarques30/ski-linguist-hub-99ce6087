import { Link } from "react-router";
import { ClipboardList, FileInput, FileOutput } from "lucide-react";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import {
  splitFormateurInscriptions,
  useFormateurInscriptions,
  useFormateurProfile,
} from "@/hooks/useFormateurPortal";
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

function FormStatus({
  done,
  labelOk,
  labelMissing,
}: {
  done: boolean;
  labelOk: string;
  labelMissing: string;
}) {
  return (
    <StatusPill tone={done ? "success" : "warning"} size="sm">
      {done ? labelOk : labelMissing}
    </StatusPill>
  );
}

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
              ? "Formulaires de début et de fin de formation (aperçu Assister)"
              : "Remplace les Google Forms — à remplir pour chaque mission"
          }
          icon={ClipboardList}
          tone="gold"
        />

        {isLoading || loadingProfile ? (
          <SurfaceCard flush>
            <TableSkeleton rows={4} cols={3} />
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
              return (
                <li key={row.id}>
                  <SurfaceCard>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                          {row.course_location ? ` · ${row.course_location}` : ""}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <FormStatus
                            done={entryDone}
                            labelOk="Entrée OK"
                            labelMissing="Entrée à faire"
                          />
                          <FormStatus
                            done={exitDone}
                            labelOk="Sortie OK"
                            labelMissing="Sortie à faire"
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`${basePath}/bilans/${row.id}/entree`}>
                            <FileInput className="mr-1.5 h-3.5 w-3.5" />
                            {entryDone ? "Revoir entrée" : "Entrée"}
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`${basePath}/bilans/${row.id}/sortie`}>
                            <FileOutput className="mr-1.5 h-3.5 w-3.5" />
                            {exitDone ? "Revoir sortie" : "Sortie"}
                          </Link>
                        </Button>
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
