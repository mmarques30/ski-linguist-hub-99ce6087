import { Link } from "react-router-dom";
import { Activity, Eye, GitBranch, ShieldAlert } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MonitoringCheckGrid } from "@/components/monitoramento/MonitoringCheckGrid";
import { useMonitoringOverview } from "@/hooks/useMonitoring";
import { summarizeHealth, toneForHealth } from "@/lib/monitoring";
import {
  PageHeader,
  PageShell,
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
  TableSkeleton,
} from "@/components/ui-kit";

const SUBMENUS = [
  {
    href: "/monitoramento/seguranca",
    title: "Sécurité",
    description: "Invasions, fuites, bots, RLS, expositions",
    icon: ShieldAlert,
  },
  {
    href: "/monitoramento/qualidade",
    title: "Qualité",
    description: "Commits, merges, activité dépôt & système",
    icon: GitBranch,
  },
  {
    href: "/monitoramento/acessos",
    title: "Accès",
    description: "Visualisations, entrées, logs, modifications",
    icon: Eye,
  },
] as const;

export default function MonitoramentoDashboard() {
  const { data, isLoading } = useMonitoringOverview();
  const overall = data ? summarizeHealth(data.checks) : "unknown";

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Monitoramento"
          description="Santé du système — commits, base, erreurs et qualité d'exécution"
          icon={Activity}
          tone="gold"
          meta={
            <StatusPill tone={toneForHealth(overall)} dot>
              {overall === "ok"
                ? "Système nominal"
                : overall === "warn"
                  ? "Points d'attention"
                  : overall === "danger"
                    ? "Incidents"
                    : "Contrôles partiels"}
            </StatusPill>
          }
          actions={
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com/mmarques30/ski-linguist-hub-99ce6087"
                target="_blank"
                rel="noopener noreferrer"
              >
                Dépôt GitHub
              </a>
            </Button>
          }
        />

        {isLoading || !data ? (
          <SurfaceCard flush>
            <TableSkeleton rows={4} cols={3} />
          </SurfaceCard>
        ) : (
          <>
            <StatTileGrid cols={4}>
              <StatTile
                label="Audit 24 h"
                value={data.counts.audit24}
                hint={`${data.counts.audit7} sur 7 jours`}
                icon={Activity}
                tone="gold"
              />
              <StatTile
                label="E-mails envoyés"
                value={data.counts.emailSent}
                hint={`${data.counts.emailFailed} échecs / 24 h`}
                icon={Activity}
                tone="blue"
              />
              <StatTile
                label="Inscriptions"
                value={data.counts.inscriptions}
                hint={`${data.counts.students} stagiaires`}
                icon={Activity}
                tone="teal"
              />
              <StatTile
                label="Formateurs"
                value={data.counts.instructors}
                hint="Fiches instructors"
                icon={Activity}
                tone="neutral"
              />
            </StatTileGrid>

            <MonitoringCheckGrid checks={data.checks} />

            {data.secrets.notes.length > 0 ? (
              <Alert>
                <AlertTitle>Secrets / connexions</AlertTitle>
                <AlertDescription className="space-y-1 text-sm">
                  {data.secrets.notes.map((n) => (
                    <p key={n}>{n}</p>
                  ))}
                  <p>
                    Instructions :{" "}
                    <code className="text-xs">docs/MONITORAMENTO_SECRETS.md</code>
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}

            <SurfaceCard title="Sous-menus" description="Trois postes de contrôle">
              <div className="grid gap-3 sm:grid-cols-3">
                {SUBMENUS.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="rounded-[var(--radius)] border border-border p-4 transition-colors hover:bg-[hsl(var(--surface-sunken))]"
                  >
                    <item.icon className="mb-2 h-5 w-5 text-primary" />
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </Link>
                ))}
              </div>
            </SurfaceCard>
          </>
        )}
      </PageShell>
    </MainLayout>
  );
}
