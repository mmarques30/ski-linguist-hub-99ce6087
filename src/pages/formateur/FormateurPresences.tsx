import { Link } from "react-router";
import { ClipboardPen } from "lucide-react";
import { FormateurPresenceDownloadButton } from "@/components/formateur/FormateurPresenceDownloadButton";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import {
  splitFormateurInscriptions,
  useFormateurInscriptions,
  useFormateurProfile,
} from "@/hooks/useFormateurPortal";
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
import type { FormateurInscriptionRow } from "@/lib/formateur-portal";

function PresenceMissionRow({
  row,
  formateurName,
  basePath,
}: {
  row: FormateurInscriptionRow;
  formateurName: string;
  basePath: string;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-[var(--radius)] border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">
          {row.student_name || "Stagiaire"}
          {row.code ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {row.code}
            </span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground tabular">
          {inscriptionDateRangeLabel(row)}
          {row.language ? ` · ${displayLanguageLabel(row.language)}` : ""}
          {row.course_location ? ` · ${row.course_location}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <StatusPill tone={toneForStatus(row.status)} size="sm">
          {getStatusLabel(row.status || "", "fr")}
        </StatusPill>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`${basePath}/missions/${row.id}`}>Mission</Link>
        </Button>
        <FormateurPresenceDownloadButton
          row={row}
          formateurName={formateurName}
        />
      </div>
    </li>
  );
}

export default function FormateurPresences() {
  const { basePath } = useFormateurView();
  const { data: profile, isLoading: loadingProfile } = useFormateurProfile();
  const { data: inscriptions = [], isLoading } = useFormateurInscriptions(
    profile?.id
  );
  const { current, upcoming, past } = splitFormateurInscriptions(inscriptions);
  const formateurName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
    : "Formateur·rice";

  const sections: { title: string; rows: FormateurInscriptionRow[] }[] = [
    { title: "En cours", rows: current },
    { title: "À venir", rows: upcoming },
    { title: "Passées", rows: past.slice(0, 40) },
  ];

  return (
    <FormateurPageShell>
      <PageShell>
        <PageHeader
          title="Présence"
          description="Télécharge la fiche d'émargement FORMATEUR (PDF) — signature manuscrite à chaque séance, puis renvoi à FLI"
          icon={ClipboardPen}
          tone="blue"
        />

        <p className="text-xs text-muted-foreground">
          L&apos;émargement numérique en ligne arrivera plus tard. Pour
          l&apos;instant : imprime, fais signer, renvoie les feuilles à
          info@fli.fr.
        </p>

        {isLoading || loadingProfile ? (
          <SurfaceCard flush>
            <TableSkeleton rows={4} cols={3} />
          </SurfaceCard>
        ) : inscriptions.length === 0 ? (
          <SurfaceCard flush>
            <TableEmpty title="Aucune mission — pas de fiche à générer." />
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            {sections.map((section) =>
              section.rows.length === 0 ? null : (
                <SurfaceCard
                  key={section.title}
                  title={`${section.title} (${section.rows.length})`}
                  flush
                >
                  <ul className="space-y-2 p-3">
                    {section.rows.map((row) => (
                      <PresenceMissionRow
                        key={row.id}
                        row={row}
                        formateurName={formateurName}
                        basePath={basePath}
                      />
                    ))}
                  </ul>
                </SurfaceCard>
              )
            )}
          </div>
        )}
      </PageShell>
    </FormateurPageShell>
  );
}
