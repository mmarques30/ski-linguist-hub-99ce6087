import { GitBranch, GitCommitHorizontal, GitMerge, Loader2, Github } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoramentoSubnav } from "@/components/monitoramento/MonitoramentoSubnav";
import { SecretsSetupCard } from "@/components/monitoramento/SecretsSetupCard";
import { useMonitoringConfig, useMonitoringOverview } from "@/hooks/useMonitoramento";
import {
  PageHeader,
  PageShell,
  SectionHeading,
  StatTile,
  StatTileGrid,
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
  const config = overview?.config ?? configResp?.data ?? null;

  const commits = overview?.github.commits ?? [];
  const pulls = overview?.github.pulls ?? [];
  const connected = Boolean(overview?.github.connected);
  const merges = pulls.filter((p) => p.merged || p.state === "closed").length;

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

        <StatTileGrid>
          <StatTile
            label="Commits"
            value={connected ? commits.length : "—"}
            icon={GitCommitHorizontal}
            tone={connected ? "teal" : "neutral"}
            hint="Derniers sur la branche principale"
          />
          <StatTile
            label="Pull requests"
            value={connected ? pulls.length : "—"}
            icon={Github}
            tone={connected ? "blue" : "neutral"}
            hint="Ouvertes / récentes"
          />
          <StatTile
            label="Merges / closes"
            value={connected ? merges : "—"}
            icon={GitMerge}
            tone={connected ? "teal" : "neutral"}
            hint="Activité de fusion"
          />
          <StatTile
            label="Dépôt"
            value={config?.githubRepo ?? "non défini"}
            icon={GitBranch}
            tone={config?.githubRepoConfigured ? "teal" : "gold"}
            hint="GITHUB_REPO"
          />
        </StatTileGrid>

        <SecretsSetupCard config={config} isLoading={configLoading} />

        <SectionHeading
          title="Commits récents"
          description={
            connected
              ? "Données live via l'API GitHub (edge monitoring-overview)"
              : "Configurer GITHUB_TOKEN + GITHUB_REPO puis redéployer l'edge"
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
                  </TableRow>
                ))}
              </tbody>
            </TableFrame>
          )}
        </SurfaceCard>

        <SectionHeading title="Pull requests" description="Merges et revue d'activité" />
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
                        tone={
                          p.merged ? "success" : p.state === "open" ? "info" : "neutral"
                        }
                      >
                        {p.merged ? "merged" : p.state}
                      </StatusPill>
                    </TableCell>
                    <TableCell>{p.author}</TableCell>
                    <TableCell>
                      {format(new Date(p.updatedAt), "dd MMM HH:mm", { locale: fr })}
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
