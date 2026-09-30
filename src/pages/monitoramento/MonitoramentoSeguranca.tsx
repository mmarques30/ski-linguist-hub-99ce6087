import { AlertTriangle, Bot, DatabaseZap, EyeOff, ShieldAlert } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoramentoSubnav } from "@/components/monitoramento/MonitoramentoSubnav";
import {
  ErrorHeatmap,
  MonitoringKpiCard,
  SecurityMetricRow,
} from "@/components/monitoramento/MonitoringWidgets";
import {
  useMonitoringDashboardAnalytics,
  useMonitoringSecurityFeed,
} from "@/hooks/useMonitoramento";
import {
  SENSITIVE_TABLES,
  classifyActionTone,
  errorHeatmapMatrix,
  toneFromHealth,
} from "@/lib/monitoramento";
import {
  PageHeader,
  PageShell,
  SectionHeading,
  StatusPill,
  SurfaceCard,
  TableCell,
  TableEmpty,
  TableFrame,
  TableHeadCell,
  TableHeadRow,
  TableRow,
  TableSkeleton,
} from "@/components/ui-kit";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo } from "react";

export default function MonitoramentoSeguranca() {
  const { data: events = [], isLoading } = useMonitoringSecurityFeed();
  const { data: analytics } = useMonitoringDashboardAnalytics();

  const deletes = events.filter((e) => e.action.toLowerCase().includes("delete")).length;
  const securityTagged = events.filter((e) => {
    const a = e.action.toLowerCase();
    return a.includes("securite") || a.includes("security") || a.includes("denied");
  }).length;
  const roleChanges = events.filter((e) => {
    const a = e.action.toLowerCase();
    return a.includes("role") || a.includes("permission") || e.table_name.includes("user_");
  }).length;

  const heatmap = useMemo(
    () => analytics?.heatmap ?? errorHeatmapMatrix(events, 7),
    [analytics?.heatmap, events],
  );
  const dayLabels = analytics?.heatmapDayLabels ?? ["j-6", "j-5", "j-4", "j-3", "j-2", "j-1", "auj."];

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Sécurité"
          description="Tentatives d'intrusion, fuites, bots, expositions et durcissement des tables"
          icon={ShieldAlert}
          tone="navy"
          meta={
            <StatusPill tone={securityTagged > 0 ? "warning" : "success"} dot>
              {securityTagged} alerte{securityTagged > 1 ? "s" : ""} (7 j)
            </StatusPill>
          }
        />

        <MonitoramentoSubnav />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MonitoringKpiCard
            label="Signaux sécurité"
            value={securityTagged}
            hint="securite / denied / security"
            points={analytics?.errorSpark ?? [0, 1, 0, 2, 1]}
            sparkColor="hsl(var(--status-critical))"
          />
          <MonitoringKpiCard
            label="Suppressions"
            value={deletes}
            hint="Potentiel purge / fuite"
            points={analytics?.activitySpark ?? [1, 2, 1]}
            sparkColor="hsl(var(--tint-gold-fg))"
            sparkVariant="bars"
          />
          <MonitoringKpiCard
            label="ACL / rôles"
            value={roleChanges}
            hint="user_roles & permissions"
            points={[1, 1, 2, 1, 3]}
            sparkColor="hsl(var(--tint-blue-fg))"
          />
          <MonitoringKpiCard
            label="Tables sensibles"
            value={SENSITIVE_TABLES.length}
            hint="Cartographie d'exposition"
            points={[8, 8, 9, 10, 10]}
            sparkColor="hsl(var(--tint-navy-fg))"
            status={<DatabaseZap className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SurfaceCard
            title="Sécurité & conformité"
            description="Indicateurs type SmartHR — failed / suspicious / blocked"
          >
            <SecurityMetricRow
              label="Échecs / denied"
              value={analytics?.failedLike7d ?? 0}
              points={analytics?.errorSpark ?? [0, 1, 0]}
              tone="danger"
            />
            <SecurityMetricRow
              label="Alertes taguées sécurité"
              value={analytics?.suspicious7d ?? 0}
              points={analytics?.errorSpark ?? [0, 0, 1]}
              tone="warning"
            />
            <SecurityMetricRow
              label="Suppressions / purges"
              value={analytics?.deleteLike7d ?? 0}
              points={analytics?.activitySpark ?? [1, 2, 1]}
              tone="info"
            />
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Bot className="h-3.5 w-3.5" />
              Bots / IPs bloquées : brancher auth audit / WAF pour peupler ces compteurs.
            </div>
          </SurfaceCard>

          <SurfaceCard
            title="Heatmap incidents"
            description="Densité des erreurs / sécurité sur 7 jours"
          >
            <ErrorHeatmap matrix={heatmap} dayLabels={dayLabels} />
          </SurfaceCard>
        </div>

        <SectionHeading
          title="Exposition des tables"
          description="Risques non mappés = tables sans revue RLS récente — à valider au cutover Supabase"
        />
        <div className="grid gap-3 md:grid-cols-2">
          {SENSITIVE_TABLES.map((table) => (
            <SurfaceCard key={table.name} title={table.name} icon={EyeOff}>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Risque :</span> {table.risk}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Exposition :</span>{" "}
                {table.exposure}
              </p>
            </SurfaceCard>
          ))}
        </div>

        <SurfaceCard
          title="Journal sécurité (7 jours)"
          description="Filtre sur actions sensibles"
        >
          {isLoading ? (
            <TableSkeleton rows={6} />
          ) : events.length === 0 ? (
            <TableEmpty
              title="Aucun signal sécurité"
              description="Pas d'événement critique dans audit_log sur 7 jours"
              icon={AlertTriangle}
            />
          ) : (
            <TableFrame>
              <thead>
                <TableHeadRow>
                  <TableHeadCell>Quand</TableHeadCell>
                  <TableHeadCell>Action</TableHeadCell>
                  <TableHeadCell>Table</TableHeadCell>
                  <TableHeadCell>IP</TableHeadCell>
                  <TableHeadCell>Sévérité</TableHeadCell>
                </TableHeadRow>
              </thead>
              <tbody>
                {events.slice(0, 40).map((row) => {
                  const tone = classifyActionTone(row.action);
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        {format(new Date(row.created_at), "dd MMM HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{row.action}</code>
                      </TableCell>
                      <TableCell>{row.table_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.ip_address ?? "n/a"}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={toneFromHealth(tone)}>
                          {tone === "danger"
                            ? "Critique"
                            : tone === "warn"
                              ? "Attention"
                              : "Info"}
                        </StatusPill>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </TableFrame>
          )}
        </SurfaceCard>
      </PageShell>
    </MainLayout>
  );
}
