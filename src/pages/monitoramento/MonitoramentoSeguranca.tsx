import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ShieldAlert } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MonitoringCheckGrid } from "@/components/monitoramento/MonitoringCheckGrid";
import { useMonitoringSecuritySignals } from "@/hooks/useMonitoring";
import {
  PageHeader,
  PageShell,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
} from "@/components/ui-kit";

export default function MonitoramentoSeguranca() {
  const { data, isLoading } = useMonitoringSecuritySignals();

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Sécurité"
          description="Tentatives d'intrusion, fuites, bots, expositions et sécurité des tables"
          icon={ShieldAlert}
          tone="gold"
        />

        <Alert>
          <AlertTitle>Périmètre</AlertTitle>
          <AlertDescription className="text-sm">
            Signaux issus de la base FLI (placeholders, suppressions, scan RLS via Edge). Les
            journaux Auth / rate-limit bots nécessitent les secrets listés dans{" "}
            <code className="text-xs">docs/MONITORAMENTO_SECRETS.md</code> (migration Lovable Cloud
            → Supabase).
          </AlertDescription>
        </Alert>

        {isLoading || !data ? (
          <SurfaceCard flush>
            <TableSkeleton rows={4} cols={2} />
          </SurfaceCard>
        ) : (
          <>
            <MonitoringCheckGrid checks={data.checks} />

            <SurfaceCard title="Suppressions récentes (7 j)" flush>
              {data.recentDeletes.length === 0 ? (
                <TableEmpty title="Aucune suppression journalisée sur la période." />
              ) : (
                <ul className="divide-y divide-border">
                  {data.recentDeletes.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm"
                    >
                      <span>
                        <span className="font-medium">{row.table_name || "—"}</span>
                        <span className="text-muted-foreground"> · {row.action}</span>
                      </span>
                      <span className="tabular text-xs text-muted-foreground">
                        {row.created_at
                          ? format(new Date(row.created_at), "dd MMM yyyy HH:mm", {
                              locale: fr,
                            })
                          : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SurfaceCard>

            <SurfaceCard title="Contrôles manuels recommandés">
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Bucket Storage <code>documents</code> privé + policies formateur/stagiaire.</li>
                <li>Pas de service-role dans le front (uniquement Edge / Lovable secrets).</li>
                <li>Revue des policies <code>TO public</code> / <code>USING (true)</code>.</li>
                <li>Surveillance des magic links et invitations en masse (confirmedCount).</li>
              </ul>
            </SurfaceCard>
          </>
        )}
      </PageShell>
    </MainLayout>
  );
}
