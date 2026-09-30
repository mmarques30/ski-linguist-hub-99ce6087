/** Helpers partagés du module Monitoramento. */

export type HealthTone = "ok" | "warn" | "danger" | "unknown";

export interface HealthCheck {
  id: string;
  label: string;
  tone: HealthTone;
  detail: string;
  href?: string;
}

export function toneForHealth(tone: HealthTone): "success" | "warning" | "danger" | "neutral" {
  if (tone === "ok") return "success";
  if (tone === "warn") return "warning";
  if (tone === "danger") return "danger";
  return "neutral";
}

/** Secrets côté front : seuls les drapeaux publics (présence) sont exposés. */
export interface MonitoringSecretsStatus {
  githubConfigured: boolean;
  supabaseServiceConfigured: boolean;
  lovableCloud: boolean;
  notes: string[];
}

/**
 * Détecte ce que le front peut savoir sans exposer de secrets.
 * Les vrais secrets vivent dans Lovable Cloud / Supabase Edge (voir docs/MONITORAMENTO_SECRETS.md).
 */
export function detectPublicMonitoringFlags(
  edgePayload?: Partial<{
    githubConfigured: boolean;
    supabaseServiceConfigured: boolean;
  }> | null
): MonitoringSecretsStatus {
  const githubConfigured = Boolean(edgePayload?.githubConfigured);
  const supabaseServiceConfigured = Boolean(edgePayload?.supabaseServiceConfigured);
  const notes: string[] = [];
  if (!githubConfigured) {
    notes.push(
      "GITHUB_TOKEN absent — commits / PR / merges non interrogés (voir docs/MONITORAMENTO_SECRETS.md)."
    );
  }
  if (!supabaseServiceConfigured) {
    notes.push(
      "SUPABASE_SERVICE_ROLE_KEY réservé aux Edge Functions — le dashboard lit via RLS admin."
    );
  }
  return {
    githubConfigured,
    supabaseServiceConfigured,
    lovableCloud: true,
    notes,
  };
}

export function summarizeHealth(checks: HealthCheck[]): HealthTone {
  if (checks.some((c) => c.tone === "danger")) return "danger";
  if (checks.some((c) => c.tone === "warn")) return "warn";
  if (checks.every((c) => c.tone === "ok")) return "ok";
  return "unknown";
}

/** Seuils qualité d'exécution e-mail (échecs récents). */
export function emailHealthTone(failed24h: number, sent24h: number): HealthTone {
  if (failed24h === 0) return "ok";
  if (sent24h === 0 && failed24h > 0) return "danger";
  const ratio = failed24h / Math.max(1, sent24h + failed24h);
  if (ratio >= 0.25) return "danger";
  if (ratio >= 0.05) return "warn";
  return "ok";
}
