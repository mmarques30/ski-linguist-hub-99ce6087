import { useMemo } from "react";
import { AlertTriangle, DatabaseZap, ShieldAlert } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoramentoSubnav } from "@/components/monitoramento/MonitoramentoSubnav";
import {
  KpiAnalysisTable,
  MonitoringKpiCard,
  type KpiAnalysisRow,
} from "@/components/monitoramento/MonitoringWidgets";
import {
  useMonitoringDashboardAnalytics,
  useMonitoringSecurityFeed,
} from "@/hooks/useMonitoramento";
import {
  SENSITIVE_TABLES,
  classifyActionTone,
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

export default function MonitoramentoSeguranca() {
  const { data: events = [], isLoading } = useMonitoringSecurityFeed();
  const { data: analytics, isLoading: analyticsLoading } = useMonitoringDashboardAnalytics();

  const deletes = events.filter((e) => e.action.toLowerCase().includes("delete")).length;
  const securityTagged = events.filter((e) => {
    const a = e.action.toLowerCase();
    return a.includes("securite") || a.includes("security") || a.includes("denied");
  }).length;
  const roleChanges = events.filter((e) => {
    const a = e.action.toLowerCase();
    return a.includes("role") || a.includes("permission") || e.table_name.includes("user_");
  }).length;
  const withIp = events.filter((e) => e.ip_address).length;
  const failed = analytics?.failedLike7d ?? 0;
  const suspicious = analytics?.suspicious7d ?? 0;

  const analysisRows: KpiAnalysisRow[] = useMemo(
    () => [
      {
        indicator: "Tentatives / échecs (denied)",
        value: failed,
        analysis:
          failed === 0
            ? "Aucun échec tagué sur 7 j — pas de signal d'intrusion dans audit_log."
            : `${failed} événement(s) fail/denied : investiguer IPs et acteurs.`,
        tone: failed === 0 ? "ok" : failed >= 10 ? "danger" : "warn",
        statusLabel: failed === 0 ? "Stable" : failed >= 10 ? "Critique" : "Attention",
      },
      {
        indicator: "Alertes sécurité taguées",
        value: suspicious || securityTagged,
        analysis:
          (suspicious || securityTagged) === 0
            ? "Pas d'action securite_* récente."
            : "Actions de durcissement ou d'alerte présentes — vérifier le détail ci-dessous.",
        tone: (suspicious || securityTagged) > 0 ? "warn" : "ok",
        statusLabel: (suspicious || securityTagged) > 0 ? "À revoir" : "OK",
      },
      {
        indicator: "Suppressions / purges",
        value: deletes,
        analysis:
          deletes === 0
            ? "Aucune purge journalisée — risque de fuite via delete faible."
            : `${deletes} suppression(s) : contrôler si attendues (import / cleanup).`,
        tone: deletes > 10 ? "warn" : "neutral",
        statusLabel: deletes > 10 ? "Volume élevé" : "Normal",
      },
      {
        indicator: "Changements ACL / rôles",
        value: roleChanges,
        analysis:
          roleChanges === 0
            ? "Pas de modification de privilèges détectée."
            : "Élévation ou changement de permissions — valider l'auteur.",
        tone: roleChanges > 0 ? "info" : "ok",
        statusLabel: roleChanges > 0 ? "Surveiller" : "OK",
      },
      {
        indicator: "Accès bots / IP renseignée",
        value: `${withIp} / ${events.length}`,
        analysis:
          withIp === 0
            ? "IP absente du journal — brancher auth audit / WAF pour détecter les bots."
            : `${withIp} ligne(s) avec IP : corréler avec les alertes.`,
        tone: withIp === 0 ? "warn" : "info",
        statusLabel: withIp === 0 ? "Non mappé" : "Partiel",
      },
      {
        indicator: "Tables sensibles cartographiées",
        value: SENSITIVE_TABLES.length,
        analysis: "Exposition RLS listée en tableau — revue cutover Supabase recommandée.",
        tone: "info",
        statusLabel: "Cartographié",
      },
    ],
    [failed, suspicious, securityTagged, deletes, roleChanges, withIp, events.length],
  );

  const tableExposureRows = SENSITIVE_TABLES.map((table) => ({
    ...table,
    status:
      table.name === "user_roles" || table.name === "app_settings" || table.name === "user_permissions"
        ? ("élevé" as const)
        : table.name === "audit_log" || table.name === "email_log"
          ? ("moyen" as const)
          : ("standard" as const),
  }));

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
            label="Échecs / denied"
            value={failed}
            hint="7 derniers jours"
            points={analytics?.errorSpark ?? [0, 1, 0, 2, 1]}
            sparkColor="hsl(var(--status-critical))"
          />
          <MonitoringKpiCard
            label="Alertes sécurité"
            value={suspicious || securityTagged}
            hint="securite / security / denied"
            points={analytics?.errorSpark ?? [0, 0, 1, 0, 1]}
            sparkColor="hsl(var(--tint-gold-fg))"
            sparkVariant="bars"
          />
          <MonitoringKpiCard
            label="Suppressions"
            value={deletes}
            hint="delete / purge"
            points={analytics?.activitySpark ?? [1, 2, 1]}
            sparkColor="hsl(var(--tint-orange-fg))"
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

        <KpiAnalysisTable
          title="Analyse résumé — Sécurité"
          description="Lecture des principaux KPIs (intrusions, fuites, bots, exposition)"
          rows={analysisRows}
          loading={isLoading || analyticsLoading}
        />

        <SectionHeading
          title="Exposition des tables (analyse)"
          description="Risque et niveau d'exposition RLS — format tableau"
        />
        <SurfaceCard>
          <TableFrame>
            <thead>
              <TableHeadRow>
                <TableHeadCell>Table</TableHeadCell>
                <TableHeadCell>Risque</TableHeadCell>
                <TableHeadCell>Exposition</TableHeadCell>
                <TableHeadCell>Niveau</TableHeadCell>
              </TableHeadRow>
            </thead>
            <tbody>
              {tableExposureRows.map((table) => (
                <TableRow key={table.name}>
                  <TableCell>
                    <code className="text-xs">{table.name}</code>
                  </TableCell>
                  <TableCell>{table.risk}</TableCell>
                  <TableCell className="text-muted-foreground">{table.exposure}</TableCell>
                  <TableCell>
                    <StatusPill
                      tone={
                        table.status === "élevé"
                          ? "danger"
                          : table.status === "moyen"
                            ? "warning"
                            : "neutral"
                      }
                      size="sm"
                    >
                      {table.status}
                    </StatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </TableFrame>
        </SurfaceCard>

        <SurfaceCard
          title="Journal sécurité (7 jours)"
          description="Détail des événements sensibles — analyse ligne à ligne"
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
                  <TableHeadCell>Analyse</TableHeadCell>
                  <TableHeadCell>Sévérité</TableHeadCell>
                </TableHeadRow>
              </thead>
              <tbody>
                {events.slice(0, 50).map((row) => {
                  const tone = classifyActionTone(row.action);
                  const analysis =
                    tone === "danger"
                      ? "Signal critique — vérifier acteur et portée"
                      : tone === "warn"
                        ? "Modification lourde ou purge"
                        : "Événement informatif";
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
                      <TableCell className="max-w-xs text-muted-foreground">{analysis}</TableCell>
                      <TableCell>
                        <StatusPill tone={toneFromHealth(tone)} size="sm">
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
