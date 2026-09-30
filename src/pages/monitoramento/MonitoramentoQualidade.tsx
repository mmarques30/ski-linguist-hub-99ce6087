import { GitBranch } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MonitoringCheckGrid } from "@/components/monitoramento/MonitoringCheckGrid";
import { useMonitoringOverview } from "@/hooks/useMonitoring";
import type { HealthCheck } from "@/lib/monitoring";
import {
  PageHeader,
  PageShell,
  SurfaceCard,
  TableSkeleton,
} from "@/components/ui-kit";

export default function MonitoramentoQualidade() {
  const { data, isLoading } = useMonitoringOverview();

  const checks: HealthCheck[] = data
    ? [
        data.checks.find((c) => c.id === "github")!,
        data.checks.find((c) => c.id === "audit")!,
        data.checks.find((c) => c.id === "email")!,
        {
          id: "merges",
          label: "Merges & PR",
          tone: data.secrets.githubConfigured ? "ok" : "unknown",
          detail: data.secrets.githubConfigured
            ? `${data.github?.openPrs ?? "?"} PR ouvertes sur le dépôt configuré`
            : "Configurer GITHUB_TOKEN + GITHUB_REPO pour lire merges / CI",
        },
      ].filter(Boolean)
    : [];

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Qualité"
          description="Commits, merges, activité système et accès au dépôt"
          icon={GitBranch}
          tone="blue"
          actions={
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com/mmarques30/ski-linguist-hub-99ce6087/pulls"
                target="_blank"
                rel="noopener noreferrer"
              >
                PR GitHub
              </a>
            </Button>
          }
        />

        <Alert>
          <AlertTitle>GitHub Actions & API</AlertTitle>
          <AlertDescription className="text-sm">
            Sans <code className="text-xs">GITHUB_TOKEN</code> (secret Edge), cette page affiche
            l&apos;état « Non branché ». Après configuration (voir{" "}
            <code className="text-xs">docs/MONITORAMENTO_SECRETS.md</code>), l&apos;edge{" "}
            <code className="text-xs">monitoring-status</code> agrège commits et PR ouvertes.
          </AlertDescription>
        </Alert>

        {isLoading || !data ? (
          <SurfaceCard flush>
            <TableSkeleton rows={3} cols={2} />
          </SurfaceCard>
        ) : (
          <>
            <MonitoringCheckGrid checks={checks} />

            <SurfaceCard title="Activité système (proxy qualité)">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Événements audit / 24 h</dt>
                  <dd className="font-semibold tabular">{data.counts.audit24}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Événements audit / 7 j</dt>
                  <dd className="font-semibold tabular">{data.counts.audit7}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">E-mails échoués / 24 h</dt>
                  <dd className="font-semibold tabular">{data.counts.emailFailed}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Commits récents (API)</dt>
                  <dd className="font-semibold tabular">
                    {data.github?.recentCommits ?? "—"}
                  </dd>
                </div>
              </dl>
            </SurfaceCard>
          </>
        )}
      </PageShell>
    </MainLayout>
  );
}
