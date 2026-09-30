import { Activity, AlertTriangle, Database, GitCommitHorizontal, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoramentoSubnav } from "@/components/monitoramento/MonitoramentoSubnav";
import { SecretsSetupCard } from "@/components/monitoramento/SecretsSetupCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMonitoringConfig, useMonitoringOverview } from "@/hooks/useMonitoramento";
import {
  computeOverallHealth,
  healthLabel,
  toneFromHealth,
} from "@/lib/monitoramento";
import {
  ActivityFeed,
  PageHeader,
  PageShell,
  SectionHeading,
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
} from "@/components/ui-kit";
import type { FeedItem } from "@/components/ui-kit";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function MonitoramentoDashboard() {
  const { t } = useLanguage();
  const { data: overview, isLoading } = useMonitoringOverview();
  const { data: configResp, isLoading: configLoading } = useMonitoringConfig();

  const config = overview?.config ?? configResp?.data ?? null;
  const health = computeOverallHealth({
    databaseReachable: overview?.database.reachable ?? false,
    errorLikeActions24h: overview?.database.errorLikeActions24h ?? 0,
    githubConnected: overview?.github.connected ?? false,
    secretsConfigured: config?.configured ?? false,
  });
  const label = healthLabel(health);

  const feed: FeedItem[] = (overview?.executions.recentActions ?? []).slice(0, 12).map((row) => ({
    id: row.id,
    title: `${row.action} · ${row.table_name}`,
    description: row.user_id ? `user ${row.user_id.slice(0, 8)}…` : "système",
    timestamp: format(new Date(row.created_at), "dd MMM HH:mm", { locale: fr }),
  }));

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Monitoring"
          description="Santé des commits, base de données, erreurs et qualité d'exécution"
          icon={Activity}
          tone="navy"
          meta={
            isLoading ? (
              <StatusPill tone="neutral">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Chargement…
              </StatusPill>
            ) : (
              <StatusPill tone={toneFromHealth(health)} dot>
                {t(label)}
              </StatusPill>
            )
          }
        />

        <MonitoramentoSubnav />

        <StatTileGrid>
          <StatTile
            label="Base de données"
            value={
              overview?.database.reachable
                ? overview.database.latencyMs != null
                  ? `${overview.database.latencyMs} ms`
                  : "OK"
                : "Hors ligne"
            }
            icon={Database}
            tone={overview?.database.reachable ? "teal" : "rose"}
            hint="Latence lecture app_settings"
          />
          <StatTile
            label="Journal 24 h"
            value={overview?.database.auditLogCount24h ?? "—"}
            icon={Activity}
            tone="blue"
            hint="Événements audit_log"
          />
          <StatTile
            label="Signaux d'erreur"
            value={overview?.database.errorLikeActions24h ?? "—"}
            icon={AlertTriangle}
            tone={(overview?.database.errorLikeActions24h ?? 0) >= 5 ? "gold" : "teal"}
            hint="Actions error / security / failed"
          />
          <StatTile
            label="Commits récents"
            value={
              overview?.github.connected
                ? overview.github.commits.length
                : "—"
            }
            icon={GitCommitHorizontal}
            tone={overview?.github.connected ? "teal" : "neutral"}
            hint={
              overview?.github.connected
                ? "Via GITHUB_TOKEN"
                : "Configurer GITHUB_TOKEN"
            }
          />
        </StatTileGrid>

        <div className="grid gap-6 lg:grid-cols-2">
          <SurfaceCard
            title="Qualité d'exécution"
            description="Dernières actions journalisées et échecs e-mail (24 h)"
          >
            <div className="mb-4 flex flex-wrap gap-2 text-sm">
              <StatusPill tone="warning">
                Suppressions : {overview?.database.deleteActions24h ?? 0}
              </StatusPill>
              <StatusPill tone="danger">
                E-mails en échec : {overview?.executions.emailFailures24h ?? 0}
              </StatusPill>
            </div>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement du journal…</p>
            ) : feed.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
            ) : (
              <ActivityFeed items={feed} />
            )}
          </SurfaceCard>

          <div className="space-y-6">
            <SectionHeading
              title="Connecteurs"
              description="État des secrets Lovable / Supabase / GitHub"
            />
            <SecretsSetupCard config={config} isLoading={configLoading} />
          </div>
        </div>
      </PageShell>
    </MainLayout>
  );
}
