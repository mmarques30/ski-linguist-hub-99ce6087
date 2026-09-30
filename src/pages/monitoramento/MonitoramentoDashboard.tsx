import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Database,
  GitBranch,
  GitCommitHorizontal,
  KeyRound,
  Loader2,
  RefreshCw,
  Server,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoramentoSubnav } from "@/components/monitoramento/MonitoramentoSubnav";
import { SecretsSetupCard } from "@/components/monitoramento/SecretsSetupCard";
import {
  EnvToggle,
  ErrorHeatmap,
  HeaderStatBadge,
  LoadLegend,
  ModuleStatusCard,
  MonitoringKpiCard,
  PeakHoursList,
  QuickActionTile,
  RolesStackBar,
  SecurityMetricRow,
} from "@/components/monitoramento/MonitoringWidgets";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useMonitoringConfig,
  useMonitoringDashboardAnalytics,
  useMonitoringOverview,
} from "@/hooks/useMonitoramento";
import {
  computeOverallHealth,
  healthLabel,
  toneFromHealth,
} from "@/lib/monitoramento";
import {
  PageHeader,
  PageShell,
  SectionHeading,
  StatusPill,
  SurfaceCard,
  TrendChart,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export default function MonitoramentoDashboard() {
  const { t } = useLanguage();
  const [env, setEnv] = useState<"production" | "staging" | "development">("production");
  const { data: overview, isLoading, refetch, isFetching } = useMonitoringOverview();
  const { data: analytics, isLoading: analyticsLoading } = useMonitoringDashboardAnalytics();
  const { data: configResp, isLoading: configLoading } = useMonitoringConfig();

  const config = overview?.config ?? configResp?.data ?? null;
  const health = computeOverallHealth({
    databaseReachable: overview?.database.reachable ?? false,
    errorLikeActions24h: overview?.database.errorLikeActions24h ?? 0,
    githubConnected: overview?.github.connected ?? false,
    secretsConfigured: config?.configured ?? false,
  });
  const label = healthLabel(health);

  const uptimeDisplay = useMemo(() => {
    if (!overview?.database.reachable) return "—";
    const errors = overview.database.errorLikeActions24h;
    const total = Math.max(overview.database.auditLogCount24h, 1);
    const rate = Math.max(0, 100 - (errors / total) * 100);
    return `${rate.toFixed(1)}%`;
  }, [overview]);

  const loginSeries = useMemo(
    () =>
      (analytics?.hours ?? []).map((h) => ({
        hour: h.label,
        logins: h.count,
      })),
    [analytics?.hours],
  );

  const usageSeries = useMemo(
    () =>
      (analytics?.days ?? []).map((d) => ({
        day: d.label,
        usage: d.count,
      })),
    [analytics?.days],
  );

  const modules = [
    {
      name: "Base Postgres",
      uptimeLabel: overview?.database.reachable
        ? `${overview.database.latencyMs ?? "—"} ms`
        : "DOWN",
      ok: Boolean(overview?.database.reachable),
      detail: "app_settings ping",
    },
    {
      name: "Audit log",
      uptimeLabel: `${overview?.database.auditLogCount24h ?? 0} evt`,
      ok: (overview?.database.errorLikeActions24h ?? 0) < 20,
      detail: "24 h",
    },
    {
      name: "E-mails",
      uptimeLabel:
        (overview?.executions.emailFailures24h ?? 0) === 0
          ? "OK"
          : `${overview?.executions.emailFailures24h} échecs`,
      ok: (overview?.executions.emailFailures24h ?? 0) === 0,
      detail: "email_log",
    },
    {
      name: "GitHub",
      uptimeLabel: overview?.github.connected ? "Connecté" : "Offline",
      ok: Boolean(overview?.github.connected),
      detail: "GITHUB_TOKEN",
    },
    {
      name: "Edge monitoring",
      uptimeLabel: config?.configured ? "Opérationnel" : "À brancher",
      ok: Boolean(config?.configured),
      detail: "secrets",
    },
    {
      name: "Commits",
      uptimeLabel: overview?.github.connected
        ? String(overview.github.commits.length)
        : "—",
      ok: Boolean(overview?.github.connected),
      detail: "branche principale",
    },
  ];

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Monitoring"
          description="Santé système · sécurité · qualité Git · accès"
          icon={Activity}
          tone="navy"
          meta={
            <div className="flex flex-wrap items-center gap-2">
              {isLoading || analyticsLoading ? (
                <StatusPill tone="neutral">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Chargement…
                </StatusPill>
              ) : (
                <StatusPill tone={toneFromHealth(health)} dot>
                  {t(label)}
                </StatusPill>
              )}
              <HeaderStatBadge
                label="Acteurs actifs"
                value={analytics?.activeActors24h ?? "—"}
                tone="success"
              />
              <HeaderStatBadge
                label="Alertes sécu"
                value={analytics?.securityAlerts7d ?? 0}
                tone={(analytics?.securityAlerts7d ?? 0) > 0 ? "danger" : "success"}
              />
            </div>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <EnvToggle value={env} onChange={setEnv} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>
          }
        />

        <MonitoramentoSubnav />

        {/* Rangée KPI — modèle SmartHR */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MonitoringKpiCard
            label="Disponibilité estimée"
            value={uptimeDisplay}
            hint="1 − (erreurs / événements) · 24 h"
            points={analytics?.activitySpark?.length ? analytics.activitySpark : [1, 1]}
            sparkColor="hsl(var(--tint-teal-fg))"
            status={
              <StatusPill tone={overview?.database.reachable ? "success" : "danger"} size="sm">
                {overview?.database.reachable ? "Live" : "Down"}
              </StatusPill>
            }
          />
          <MonitoringKpiCard
            label="API / Base"
            value={
              overview?.database.reachable
                ? overview.database.latencyMs != null
                  ? `${overview.database.latencyMs} ms`
                  : "Healthy"
                : "Unhealthy"
            }
            hint="Latence lecture app_settings"
            points={analytics?.activitySpark ?? [2, 3, 2, 4, 3]}
            sparkVariant="bars"
            sparkColor="hsl(var(--tint-blue-fg))"
            status={
              <StatusPill tone={overview?.database.reachable ? "success" : "danger"} size="sm">
                {overview?.database.reachable ? "Healthy" : "Error"}
              </StatusPill>
            }
          />
          <MonitoringKpiCard
            label="Exécutions 24 h"
            value={overview?.database.auditLogCount24h ?? "—"}
            hint={`${overview?.executions.emailFailures24h ?? 0} e-mails en échec`}
            points={analytics?.activitySpark ?? [1, 2, 1]}
            sparkColor="hsl(var(--chart-1))"
          />
          <MonitoringKpiCard
            label="Signaux d'erreur"
            value={overview?.database.errorLikeActions24h ?? "—"}
            hint="error / security / failed"
            points={
              analytics?.errorSpark?.some((n) => n > 0)
                ? analytics.errorSpark
                : [0, 0, 1, 0, 0]
            }
            sparkColor="hsl(var(--tint-orange-fg))"
            status={
              <Database className="h-4 w-4 text-muted-foreground" aria-hidden />
            }
          />
        </div>

        {/* Modules + actions rapides */}
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3">
            <SectionHeading
              title="État des modules"
              description="Services critiques FLI (DB, journal, e-mail, Git)"
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {modules.map((m) => (
                <ModuleStatusCard key={m.name} {...m} />
              ))}
            </div>
          </div>
          <SurfaceCard title="Actions rapides" description="Raccourcis monitoring">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <QuickActionTile
                to="/monitoramento/seguranca"
                icon={ShieldAlert}
                label="Sécurité"
              />
              <QuickActionTile
                to="/monitoramento/qualidade"
                icon={GitBranch}
                label="Qualité Git"
              />
              <QuickActionTile
                to="/monitoramento/acessos"
                icon={KeyRound}
                label="Accès"
              />
              <QuickActionTile to="/qualite/historique" icon={Activity} label="Audit log" />
              <QuickActionTile to="/admin/testing" icon={Wrench} label="QA checklist" />
              <QuickActionTile to="/settings?tab=integrations" icon={Server} label="Intégrations" />
            </div>
          </SurfaceCard>
        </div>

        {/* Accès & rôles — bloc central du modèle */}
        <SurfaceCard
          title="Accès utilisateurs & activité"
          description="Pics horaires, volume d'actions et répartition des rôles"
          actions={<LoadLegend />}
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Heures de pointe (aujourd'hui)</p>
              <PeakHoursList hours={analytics?.hours ?? []} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Analyse d'activité (aujourd'hui)
                </p>
                <TrendChart
                  data={loginSeries}
                  series={[{ key: "logins", label: "Actions journalisées" }]}
                  xKey="hour"
                  variant="area"
                  height={220}
                  emptyMessage="Aucune activité aujourd'hui"
                  ariaLabel="Activité par heure"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Répartition des rôles</p>
                <RolesStackBar roles={analytics?.roles ?? []} />
              </div>
            </div>
          </div>
        </SurfaceCard>

        {/* Tendance + sécurité + heatmap */}
        <div className="grid gap-4 lg:grid-cols-2">
          <SurfaceCard
            title="Tendance d'usage (7 j)"
            description="Volume d'événements audit_log par jour"
            actions={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/monitoramento/acessos">Voir les accès</Link>
              </Button>
            }
          >
            <TrendChart
              data={usageSeries}
              series={[{ key: "usage", label: "Événements", color: "hsl(var(--tint-orange-fg))" }]}
              xKey="day"
              variant="line"
              height={220}
              emptyMessage="Pas encore d'historique"
              ariaLabel="Tendance usage 7 jours"
            />
          </SurfaceCard>

          <SurfaceCard
            title="Sécurité & conformité"
            description="Proxy audit_log (failed / suspicious / delete) — 7 jours"
            actions={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/monitoramento/seguranca">Détails</Link>
              </Button>
            }
          >
            <SecurityMetricRow
              label="Échecs / denied"
              value={analytics?.failedLike7d ?? 0}
              points={analytics?.errorSpark ?? [0, 1, 0]}
              tone="danger"
            />
            <SecurityMetricRow
              label="Alertes sécurité taguées"
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
          </SurfaceCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <SurfaceCard
            title="Erreurs d'intégration (24 h × 7 j)"
            description="Heatmap des actions error/security — plus foncé = plus d'incidents"
          >
            <ErrorHeatmap
              matrix={analytics?.heatmap ?? []}
              dayLabels={analytics?.heatmapDayLabels ?? []}
            />
          </SurfaceCard>

          <div className="space-y-4">
            <MonitoringKpiCard
              label="Commits GitHub"
              value={
                overview?.github.connected
                  ? overview.github.commits.length
                  : "À configurer"
              }
              hint={config?.githubRepo ?? "GITHUB_REPO manquant"}
              points={[2, 3, 5, 4, 6, 5, 7]}
              sparkColor="hsl(var(--tint-navy-fg))"
              status={<GitCommitHorizontal className="h-4 w-4 text-muted-foreground" />}
            />
            <SecretsSetupCard config={config} isLoading={configLoading} />
          </div>
        </div>

        {env !== "production" && (
          <SurfaceCard title="Environnement simulé">
            <p className="text-sm text-muted-foreground">
              Le sélecteur <strong>{env}</strong> est un filtre UI (comme sur le modèle SmartHR).
              Les métriques affichées restent celles de l'instance Supabase connectée via{" "}
              <code className="text-xs">VITE_SUPABASE_URL</code>. Branchez des projets Staging /
              Dev séparés pour isoler les données.
            </p>
          </SurfaceCard>
        )}
      </PageShell>
    </MainLayout>
  );
}
