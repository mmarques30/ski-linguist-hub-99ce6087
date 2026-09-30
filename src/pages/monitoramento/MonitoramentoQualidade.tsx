import { useMemo } from "react";
import { GitBranch, GitCommitHorizontal, GitMerge, Github, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoramentoSubnav } from "@/components/monitoramento/MonitoramentoSubnav";
import { SecretsSetupCard } from "@/components/monitoramento/SecretsSetupCard";
import {
  KpiAnalysisTable,
  MonitoringKpiCard,
  type KpiAnalysisRow,
} from "@/components/monitoramento/MonitoringWidgets";
import {
  useMonitoringConfig,
  useMonitoringDashboardAnalytics,
  useMonitoringOverview,
} from "@/hooks/useMonitoramento";
import { MONITORING_SECRET_CATALOG } from "@/lib/monitoramento";
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

export default function MonitoramentoQualidade() {
  const { data: overview, isLoading } = useMonitoringOverview();
  const { data: configResp, isLoading: configLoading } = useMonitoringConfig();
  const { data: analytics } = useMonitoringDashboardAnalytics();
  const config = overview?.config ?? configResp?.data ?? null;

  const commits = overview?.github.commits ?? [];
  const pulls = overview?.github.pulls ?? [];
  const connected = Boolean(overview?.github.connected);
  const openPrs = pulls.filter((p) => p.state === "open").length;
  const merges = pulls.filter((p) => p.merged).length;
  const closed = pulls.filter((p) => p.state === "closed" && !p.merged).length;
  const weekEvents = analytics?.days.reduce((sum, d) => sum + d.count, 0) ?? 0;
  const authors = new Set(commits.map((c) => c.author)).size;

  const analysisRows: KpiAnalysisRow[] = useMemo(
    () => [
      {
        indicator: "Connexion dépôt GitHub",
        value: connected ? "Oui" : "Non",
        analysis: connected
          ? `Dépôt ${config?.githubRepo ?? "—"} joignable via GITHUB_TOKEN.`
          : "Secrets manquants — commits/PRs indisponibles (voir tableau secrets).",
        tone: connected ? "ok" : "warn",
        statusLabel: connected ? "Connecté" : "À brancher",
      },
      {
        indicator: "Commits récents",
        value: connected ? commits.length : "—",
        analysis: connected
          ? `${authors} auteur(s) distinct(s) sur les derniers commits.`
          : "Impossible d'analyser sans token GitHub.",
        tone: connected ? (commits.length > 0 ? "ok" : "neutral") : "warn",
        statusLabel: connected ? (commits.length > 0 ? "Actif" : "Vide") : "N/A",
      },
      {
        indicator: "Pull requests ouvertes",
        value: connected ? openPrs : "—",
        analysis: connected
          ? openPrs === 0
            ? "Aucune PR ouverte — file de revue vide."
            : `${openPrs} PR(s) en attente de merge / revue.`
          : "Brancher GitHub pour suivre les merges.",
        tone: connected ? (openPrs > 5 ? "warn" : "ok") : "neutral",
        statusLabel: connected ? (openPrs > 5 ? "File longue" : "OK") : "N/A",
      },
      {
        indicator: "Merges récents",
        value: connected ? merges : "—",
        analysis: connected
          ? `${merges} merge(s), ${closed} close(s) sans merge.`
          : "Pas de données de fusion.",
        tone: connected ? "info" : "neutral",
        statusLabel: connected ? "Mesuré" : "N/A",
      },
      {
        indicator: "Activité système (7 j)",
        value: weekEvents,
        analysis: "Volume audit_log sur 7 jours — proxy d'activité applicative.",
        tone: weekEvents > 0 ? "ok" : "neutral",
        statusLabel: weekEvents > 0 ? "Actif" : "Calme",
      },
      {
        indicator: "Secrets monitoring",
        value: config?.configured ? "Complets" : "Incomplets",
        analysis: config?.configured
          ? "GITHUB_TOKEN + GITHUB_REPO opérationnels."
          : "Compléter Lovable / Supabase Secrets puis redéployer les edges.",
        tone: config?.configured ? "ok" : "warn",
        statusLabel: config?.configured ? "OK" : "Action requise",
      },
    ],
    [
      connected,
      config?.githubRepo,
      config?.configured,
      commits.length,
      authors,
      openPrs,
      merges,
      closed,
      weekEvents,
    ],
  );

  const secretRows = MONITORING_SECRET_CATALOG.map((secret) => {
    const configured =
      secret.key === "GITHUB_TOKEN"
        ? Boolean(config?.githubTokenConfigured)
        : secret.key === "GITHUB_REPO"
          ? Boolean(config?.githubRepoConfigured)
          : secret.key === "SENTRY_DSN"
            ? Boolean(config?.sentryDsnConfigured)
            : Boolean(config?.databaseReachable);
    return {
      key: secret.key,
      description: secret.description,
      where: secret.where,
      configured,
    };
  });

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Qualité système"
          description="Commits, merges, activité dépôt et santé des livraisons"
          icon={GitBranch}
          tone="navy"
          meta={
            connected ? (
              <StatusPill tone="success" dot>
                GitHub connecté
              </StatusPill>
            ) : (
              <StatusPill tone="warning" dot>
                GitHub à brancher
              </StatusPill>
            )
          }
        />

        <MonitoramentoSubnav />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MonitoringKpiCard
            label="Commits"
            value={connected ? commits.length : "—"}
            hint="Branche principale"
            points={[2, 3, 5, 4, 6, 5, 7]}
            sparkColor="hsl(var(--tint-teal-fg))"
            status={<GitCommitHorizontal className="h-4 w-4 text-muted-foreground" />}
          />
          <MonitoringKpiCard
            label="PRs ouvertes"
            value={connected ? openPrs : "—"}
            hint="En attente de revue"
            points={[1, 2, 2, 3, 2]}
            sparkColor="hsl(var(--tint-blue-fg))"
            sparkVariant="bars"
            status={<Github className="h-4 w-4 text-muted-foreground" />}
          />
          <MonitoringKpiCard
            label="Merges"
            value={connected ? merges : "—"}
            hint="Fusions récentes"
            points={[1, 1, 2, 1, 3]}
            sparkColor="hsl(var(--tint-navy-fg))"
            status={<GitMerge className="h-4 w-4 text-muted-foreground" />}
          />
          <MonitoringKpiCard
            label="Activité 7 j"
            value={weekEvents}
            hint="Événements audit_log"
            points={analytics?.days.map((d) => d.count) ?? [1, 2, 1]}
            sparkColor="hsl(var(--tint-orange-fg))"
          />
        </div>

        <KpiAnalysisTable
          title="Analyse résumé — Qualité"
          description="Lecture des KPIs commits, merges, activité dépôt et secrets"
          rows={analysisRows}
          loading={isLoading || configLoading}
        />

        <SectionHeading
          title="Secrets & connecteurs (tableau)"
          description="État de chaque clé requise pour le monitoring qualité"
        />
        <SurfaceCard>
          <TableFrame>
            <thead>
              <TableHeadRow>
                <TableHeadCell>Secret</TableHeadCell>
                <TableHeadCell>Rôle</TableHeadCell>
                <TableHeadCell>Où</TableHeadCell>
                <TableHeadCell>Statut</TableHeadCell>
              </TableHeadRow>
            </thead>
            <tbody>
              {secretRows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell>
                    <code className="text-xs">{row.key}</code>
                  </TableCell>
                  <TableCell className="max-w-md text-muted-foreground">
                    {row.description}
                  </TableCell>
                  <TableCell className="capitalize">{row.where}</TableCell>
                  <TableCell>
                    <StatusPill tone={row.configured ? "success" : "warning"} size="sm">
                      {row.configured ? "Présent" : "Manquant"}
                    </StatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </TableFrame>
        </SurfaceCard>

        <SecretsSetupCard config={config} isLoading={configLoading} />

        <SectionHeading
          title="Commits — analyse détaillée"
          description={
            connected
              ? "Historique live via l'API GitHub"
              : "Configurer GITHUB_TOKEN + GITHUB_REPO (docs/MONITORAMENTO_SECRETS.md)"
          }
        />
        <SurfaceCard>
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : !connected ? (
            <TableEmpty
              title="Pas encore de flux Git"
              description={
                overview?.github.error ??
                "Ajoutez les secrets (voir docs/MONITORAMENTO_SECRETS.md)"
              }
              icon={Loader2}
            />
          ) : commits.length === 0 ? (
            <TableEmpty title="Aucun commit" description="Le dépôt ne renvoie pas d'historique" />
          ) : (
            <TableFrame>
              <thead>
                <TableHeadRow>
                  <TableHeadCell>SHA</TableHeadCell>
                  <TableHeadCell>Message</TableHeadCell>
                  <TableHeadCell>Auteur</TableHeadCell>
                  <TableHeadCell>Date</TableHeadCell>
                  <TableHeadCell>Analyse</TableHeadCell>
                </TableHeadRow>
              </thead>
              <tbody>
                {commits.map((c) => (
                  <TableRow key={c.sha}>
                    <TableCell>
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {c.sha.slice(0, 7)}
                      </a>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{c.message}</TableCell>
                    <TableCell>{c.author}</TableCell>
                    <TableCell>
                      {format(new Date(c.date), "dd MMM HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {/fix|bug/i.test(c.message)
                        ? "Correctif"
                        : /feat|feature/i.test(c.message)
                          ? "Fonctionnalité"
                          : /docs|chore|refactor/i.test(c.message)
                            ? "Maintenance"
                            : "Commit"}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </TableFrame>
          )}
        </SurfaceCard>

        <SectionHeading title="Pull requests — analyse" description="Merges et revue d'activité" />
        <SurfaceCard>
          {!connected || pulls.length === 0 ? (
            <TableEmpty
              title="Aucune PR chargée"
              description={connected ? "Pas de PR récente" : "GitHub non connecté"}
            />
          ) : (
            <TableFrame>
              <thead>
                <TableHeadRow>
                  <TableHeadCell>#</TableHeadCell>
                  <TableHeadCell>Titre</TableHeadCell>
                  <TableHeadCell>État</TableHeadCell>
                  <TableHeadCell>Auteur</TableHeadCell>
                  <TableHeadCell>MAJ</TableHeadCell>
                  <TableHeadCell>Analyse</TableHeadCell>
                </TableHeadRow>
              </thead>
              <tbody>
                {pulls.map((p) => (
                  <TableRow key={p.number}>
                    <TableCell>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        #{p.number}
                      </a>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{p.title}</TableCell>
                    <TableCell>
                      <StatusPill
                        tone={p.merged ? "success" : p.state === "open" ? "info" : "neutral"}
                        size="sm"
                      >
                        {p.merged ? "merged" : p.state}
                      </StatusPill>
                    </TableCell>
                    <TableCell>{p.author}</TableCell>
                    <TableCell>
                      {format(new Date(p.updatedAt), "dd MMM HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.merged
                        ? "Fusionnée — livrée"
                        : p.state === "open"
                          ? "En revue / à merger"
                          : "Fermée sans merge"}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </TableFrame>
          )}
        </SurfaceCard>
      </PageShell>
    </MainLayout>
  );
}
