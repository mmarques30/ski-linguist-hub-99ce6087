/**
 * Modèle métier du module Monitoring — santé système, sécurité, qualité Git
 * et accès. Les pages consomment ces helpers ; les secrets restent côté Edge.
 */

export type HealthTone = "ok" | "warn" | "danger" | "unknown";

export interface MonitoringSecretStatus {
  key: string;
  configured: boolean;
  description: string;
  where: "lovable" | "supabase" | "github" | "both";
}

export interface MonitoringConfigStatus {
  success: boolean;
  githubTokenConfigured: boolean;
  githubRepoConfigured: boolean;
  githubRepo: string | null;
  sentryDsnConfigured: boolean;
  databaseReachable: boolean;
  secrets: MonitoringSecretStatus[];
  configured: boolean;
  message?: string;
}

export interface GithubCommitSummary {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface GithubPullSummary {
  number: number;
  title: string;
  state: string;
  author: string;
  updatedAt: string;
  url: string;
  merged: boolean;
}

export interface MonitoringOverviewPayload {
  success: boolean;
  config: MonitoringConfigStatus;
  database: {
    reachable: boolean;
    latencyMs: number | null;
    auditLogCount24h: number;
    errorLikeActions24h: number;
    deleteActions24h: number;
  };
  github: {
    connected: boolean;
    commits: GithubCommitSummary[];
    pulls: GithubPullSummary[];
    error: string | null;
  };
  executions: {
    emailFailures24h: number;
    recentActions: Array<{
      id: string;
      action: string;
      table_name: string;
      created_at: string;
      user_id: string | null;
    }>;
  };
}

/** Actions audit_log considérées comme signaux d'erreur / incident. */
export const ERROR_LIKE_ACTIONS = [
  "error",
  "failed",
  "failure",
  "purge",
  "securite",
  "security",
  "denied",
] as const;

/** Tables sensibles à surveiller pour l'exposition / RLS. */
export const SENSITIVE_TABLES = [
  { name: "students", risk: "PII stagiaires", exposure: "RLS staff + portail" },
  { name: "inscriptions", risk: "Dossiers & paiement", exposure: "RLS staff" },
  { name: "invoices", risk: "Données financières", exposure: "RLS finance" },
  { name: "payments", risk: "Paiements / Stripe", exposure: "RLS finance" },
  { name: "profiles", risk: "Comptes internes", exposure: "RLS authentifié" },
  { name: "user_roles", risk: "Élévation de privilèges", exposure: "RLS admin" },
  { name: "user_permissions", risk: "ACL routes", exposure: "RLS admin" },
  { name: "audit_log", risk: "Traçabilité", exposure: "RLS staff lecture" },
  { name: "email_log", risk: "Adresses e-mail", exposure: "RLS staff" },
  { name: "app_settings", risk: "Secrets / config", exposure: "RLS admin" },
] as const;

export function toneFromHealth(score: HealthTone): "success" | "warning" | "danger" | "neutral" {
  if (score === "ok") return "success";
  if (score === "warn") return "warning";
  if (score === "danger") return "danger";
  return "neutral";
}

export function classifyActionTone(action: string): HealthTone {
  const a = action.toLowerCase();
  if (ERROR_LIKE_ACTIONS.some((k) => a.includes(k)) || a.includes("delete")) {
    return a.includes("delete") ? "warn" : "danger";
  }
  if (a.includes("create") || a.includes("insert") || a.includes("import")) return "ok";
  return "unknown";
}

export function isErrorLikeAction(action: string): boolean {
  const a = action.toLowerCase();
  return ERROR_LIKE_ACTIONS.some((k) => a.includes(k));
}

export function computeOverallHealth(input: {
  databaseReachable: boolean;
  errorLikeActions24h: number;
  githubConnected: boolean;
  secretsConfigured: boolean;
}): HealthTone {
  if (!input.databaseReachable) return "danger";
  if (input.errorLikeActions24h >= 20) return "danger";
  if (input.errorLikeActions24h >= 5) return "warn";
  if (!input.secretsConfigured || !input.githubConnected) return "warn";
  return "ok";
}

export function healthLabel(tone: HealthTone): { fr: string; "pt-BR": string; en: string } {
  switch (tone) {
    case "ok":
      return { fr: "Sain", "pt-BR": "Saudável", en: "Healthy" };
    case "warn":
      return { fr: "Attention", "pt-BR": "Atenção", en: "Attention" };
    case "danger":
      return { fr: "Critique", "pt-BR": "Crítico", en: "Critical" };
    default:
      return { fr: "Inconnu", "pt-BR": "Desconhecido", en: "Unknown" };
  }
}

/** Secrets attendus pour brancher le monitoring (Lovable Cloud → Supabase). */
export const MONITORING_SECRET_CATALOG: Omit<MonitoringSecretStatus, "configured">[] = [
  {
    key: "GITHUB_TOKEN",
    description:
      "Personal Access Token GitHub (repo:read) pour commits, pulls et accès dépôt.",
    where: "both",
  },
  {
    key: "GITHUB_REPO",
    description: "Slug owner/repo (ex. mmarques30/ski-linguist-hub-99ce6087).",
    where: "both",
  },
  {
    key: "SENTRY_DSN",
    description: "DSN Sentry (optionnel) pour agrégation d'erreurs runtime front/edge.",
    where: "both",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    description: "Déjà fourni par Lovable Cloud / Supabase — lecture audit & health côté Edge.",
    where: "supabase",
  },
];
