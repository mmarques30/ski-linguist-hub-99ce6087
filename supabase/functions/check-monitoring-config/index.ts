import { adminCorsHeaders, requireAdmin } from "../_shared/admin-auth.ts";

const CATALOG = [
  {
    key: "GITHUB_TOKEN",
    description:
      "Personal Access Token GitHub (repo:read) pour commits, pulls et accès dépôt.",
    where: "both" as const,
  },
  {
    key: "GITHUB_REPO",
    description: "Slug owner/repo (ex. mmarques30/ski-linguist-hub-99ce6087).",
    where: "both" as const,
  },
  {
    key: "SENTRY_DSN",
    description: "DSN Sentry (optionnel) pour agrégation d'erreurs runtime.",
    where: "both" as const,
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    description: "Clé service role — fournie par Lovable Cloud / Supabase.",
    where: "supabase" as const,
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: adminCorsHeaders });
  }

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  const githubToken = Deno.env.get("GITHUB_TOKEN") ?? "";
  const githubRepo =
    Deno.env.get("GITHUB_REPO") ??
    Deno.env.get("GITHUB_REPOSITORY") ??
    "";
  const sentryDsn = Deno.env.get("SENTRY_DSN") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  let databaseReachable = false;
  try {
    const { error } = await auth.adminClient.from("app_settings").select("key").limit(1);
    databaseReachable = !error;
  } catch {
    databaseReachable = false;
  }

  const secrets = CATALOG.map((item) => {
    let configured = false;
    if (item.key === "GITHUB_TOKEN") configured = Boolean(githubToken);
    else if (item.key === "GITHUB_REPO") configured = Boolean(githubRepo);
    else if (item.key === "SENTRY_DSN") configured = Boolean(sentryDsn);
    else if (item.key === "SUPABASE_SERVICE_ROLE_KEY") configured = Boolean(serviceRole);
    return { ...item, configured };
  });

  const configured = Boolean(githubToken) && Boolean(githubRepo) && databaseReachable;

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        success: true,
        githubTokenConfigured: Boolean(githubToken),
        githubRepoConfigured: Boolean(githubRepo),
        githubRepo: githubRepo || null,
        sentryDsnConfigured: Boolean(sentryDsn),
        databaseReachable,
        secrets,
        configured,
        message: configured
          ? "Secrets monitoring opérationnels"
          : "Renseigner GITHUB_TOKEN et GITHUB_REPO (voir docs/MONITORAMENTO_SECRETS.md)",
      },
    }),
    { headers: { ...adminCorsHeaders, "Content-Type": "application/json" } },
  );
});
