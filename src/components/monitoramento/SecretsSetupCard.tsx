import { ExternalLink, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
import { MONITORING_SECRET_CATALOG, type MonitoringConfigStatus } from "@/lib/monitoramento";
import { Link } from "react-router";

const SUPABASE_SECRETS_URL =
  "https://supabase.com/dashboard/project/nghkrmvakjomzmfwdhbo/settings/functions";
const GITHUB_TOKENS_URL = "https://github.com/settings/tokens?type=beta";
const DOCS_PATH = "/monitoramento"; // le guide est dans docs/ ; lien relatif UI vers l'onglet secrets

interface SecretsSetupCardProps {
  config?: MonitoringConfigStatus | null;
  isLoading?: boolean;
}

export function SecretsSetupCard({ config, isLoading }: SecretsSetupCardProps) {
  const byKey = new Map((config?.secrets ?? []).map((s) => [s.key, s.configured]));

  return (
    <SurfaceCard
      title="Secrets monitoring"
      icon={KeyRound}
      description="Branchez GitHub (et Sentry optionnel) via Lovable Cloud Secrets ou Supabase Edge Secrets. Guide : docs/MONITORAMENTO_SECRETS.md"
      actions={
        isLoading ? (
          <StatusPill tone="neutral">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Vérification…
          </StatusPill>
        ) : config?.configured ? (
          <StatusPill tone="success" dot>
            Opérationnel
          </StatusPill>
        ) : (
          <StatusPill tone="warning" dot>
            À configurer
          </StatusPill>
        )
      }
    >
      <ul className="space-y-3 text-sm">
        {MONITORING_SECRET_CATALOG.map((secret) => {
          const configured =
            byKey.get(secret.key) ??
            (secret.key === "GITHUB_TOKEN"
              ? Boolean(config?.githubTokenConfigured)
              : secret.key === "GITHUB_REPO"
                ? Boolean(config?.githubRepoConfigured)
                : secret.key === "SENTRY_DSN"
                  ? Boolean(config?.sentryDsnConfigured)
                  : secret.key === "SUPABASE_SERVICE_ROLE_KEY"
                    ? Boolean(config?.databaseReachable)
                    : false);

          return (
            <li
              key={secret.key}
              className="flex flex-col gap-1 rounded-lg border border-border/60 bg-[hsl(var(--surface-sunken))]/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">
                  <code className="text-xs">{secret.key}</code>
                </p>
                <p className="text-muted-foreground">{secret.description}</p>
              </div>
              <StatusPill tone={configured ? "success" : "warning"}>
                {configured ? "Présent" : "Manquant"}
              </StatusPill>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={SUPABASE_SECRETS_URL} target="_blank" rel="noreferrer">
            Supabase Secrets
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={GITHUB_TOKENS_URL} target="_blank" rel="noreferrer">
            Créer un PAT GitHub
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </a>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to={DOCS_PATH}>Voir le tableau de bord</Link>
        </Button>
      </div>

      {config?.message && (
        <p className="mt-3 text-xs text-muted-foreground">{config.message}</p>
      )}
    </SurfaceCard>
  );
}
