import { adminCorsHeaders, requireAdmin } from "../_shared/admin-auth.ts";

const ERROR_LIKE = ["error", "failed", "failure", "purge", "securite", "security", "denied"];

function isErrorLike(action: string): boolean {
  const a = action.toLowerCase();
  return ERROR_LIKE.some((k) => a.includes(k));
}

async function fetchGithub(
  token: string,
  repo: string,
): Promise<{
  commits: Array<{
    sha: string;
    message: string;
    author: string;
    date: string;
    url: string;
  }>;
  pulls: Array<{
    number: number;
    title: string;
    state: string;
    author: string;
    updatedAt: string;
    url: string;
    merged: boolean;
  }>;
  error: string | null;
}> {
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "fli-monitoring",
  };

  try {
    const [commitsRes, pullsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repo}/commits?per_page=15`, { headers }),
      fetch(`https://api.github.com/repos/${repo}/pulls?state=all&per_page=15`, { headers }),
    ]);

    if (!commitsRes.ok) {
      const body = await commitsRes.text();
      return {
        commits: [],
        pulls: [],
        error: `GitHub commits HTTP ${commitsRes.status}: ${body.slice(0, 180)}`,
      };
    }

    const commitsJson = await commitsRes.json();
    const pullsJson = pullsRes.ok ? await pullsRes.json() : [];

    const commits = (Array.isArray(commitsJson) ? commitsJson : []).map((c: {
      sha?: string;
      html_url?: string;
      commit?: { message?: string; author?: { name?: string; date?: string } };
      author?: { login?: string };
    }) => ({
      sha: c.sha ?? "",
      message: (c.commit?.message ?? "").split("\n")[0],
      author: c.commit?.author?.name ?? c.author?.login ?? "unknown",
      date: c.commit?.author?.date ?? new Date().toISOString(),
      url: c.html_url ?? `https://github.com/${repo}`,
    }));

    const pulls = (Array.isArray(pullsJson) ? pullsJson : []).map((p: {
      number?: number;
      title?: string;
      state?: string;
      html_url?: string;
      updated_at?: string;
      merged_at?: string | null;
      user?: { login?: string };
    }) => ({
      number: p.number ?? 0,
      title: p.title ?? "",
      state: p.state ?? "unknown",
      author: p.user?.login ?? "unknown",
      updatedAt: p.updated_at ?? new Date().toISOString(),
      url: p.html_url ?? `https://github.com/${repo}`,
      merged: Boolean(p.merged_at),
    }));

    return { commits, pulls, error: null };
  } catch (error) {
    return {
      commits: [],
      pulls: [],
      error: error instanceof Error ? error.message : "GitHub unreachable",
    };
  }
}

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
    "mmarques30/ski-linguist-hub-99ce6087";
  const sentryDsn = Deno.env.get("SENTRY_DSN") ?? "";

  const started = performance.now();
  let databaseReachable = false;
  try {
    const { error } = await auth.adminClient.from("app_settings").select("key").limit(1);
    databaseReachable = !error;
  } catch {
    databaseReachable = false;
  }
  const latencyMs = Math.round(performance.now() - started);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: auditRows } = await auth.adminClient
    .from("audit_log")
    .select("id, action, table_name, created_at, user_id")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = auditRows ?? [];
  const errorLikeActions24h = rows.filter((r: { action: string }) => isErrorLike(r.action)).length;
  const deleteActions24h = rows.filter((r: { action: string }) =>
    r.action.toLowerCase().includes("delete")
  ).length;

  const { count: emailFailures24h } = await auth.adminClient
    .from("email_log")
    .select("id", { count: "exact", head: true })
    .gte("sent_at", since)
    .neq("status", "sent");

  const githubConnected = Boolean(githubToken);
  const github = githubConnected
    ? await fetchGithub(githubToken, githubRepo)
    : {
      commits: [],
      pulls: [],
      error: "GITHUB_TOKEN manquant — voir docs/MONITORAMENTO_SECRETS.md",
    };

  const configured = githubConnected && Boolean(githubRepo) && databaseReachable;

  return new Response(
    JSON.stringify({
      success: true,
      config: {
        success: true,
        githubTokenConfigured: githubConnected,
        githubRepoConfigured: Boolean(githubRepo),
        githubRepo: githubRepo || null,
        sentryDsnConfigured: Boolean(sentryDsn),
        databaseReachable,
        secrets: [],
        configured,
        message: configured
          ? undefined
          : "Secrets incomplets — docs/MONITORAMENTO_SECRETS.md",
      },
      database: {
        reachable: databaseReachable,
        latencyMs,
        auditLogCount24h: rows.length,
        errorLikeActions24h,
        deleteActions24h,
      },
      github: {
        connected: githubConnected && !github.error,
        commits: github.commits,
        pulls: github.pulls,
        error: github.error,
      },
      executions: {
        emailFailures24h: emailFailures24h ?? 0,
        recentActions: rows.slice(0, 25),
      },
    }),
    { headers: { ...adminCorsHeaders, "Content-Type": "application/json" } },
  );
});
