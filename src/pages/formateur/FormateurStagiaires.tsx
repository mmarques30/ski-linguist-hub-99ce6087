import { Mail, Phone, Users } from "lucide-react";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import {
  uniqueStagiairesFromInscriptions,
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

export default function FormateurStagiaires() {
  const { data: profile } = useFormateurProfile();
  const { data: inscriptions = [], isLoading } = useFormateurInscriptions(profile?.id);
  const stagiaires = uniqueStagiairesFromInscriptions(inscriptions);

  return (
    <FormateurPageShell>
      <PageShell>
        <PageHeader
          title="Stagiaires"
          description="Personnes rattachées à vos missions"
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
                      <p className="text-sm font-semibold">{s.name}</p>
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
                    <StatusPill tone="neutral" size="sm" className="shrink-0">
                      {s.inscriptions.length} mission
                      {s.inscriptions.length > 1 ? "s" : ""}
                    </StatusPill>
                  </div>
                  <ul className="mt-3 space-y-2 border-t border-border pt-3">
                    {s.inscriptions.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <span className="text-muted-foreground">
                          {row.code ? `${row.code} · ` : ""}
                          {inscriptionDateRangeLabel(row)}
                          {row.language
                            ? ` · ${displayLanguageLabel(row.language)}`
                            : ""}
                        </span>
                        <StatusPill tone={toneForStatus(row.status)} size="sm">
                          {getStatusLabel(row.status || '', 'fr')}
                        </StatusPill>
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
