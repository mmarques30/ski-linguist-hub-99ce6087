/**
 * Agrège l'état monitoring pour le BO (admin only).
 * Secrets optionnels : GITHUB_TOKEN, GITHUB_REPO (owner/name).
 */
import { adminCorsHeaders, requireAdmin } from "../_shared/admin-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: adminCorsHeaders });
  }

  try {
    const auth = await requireAdmin(req);
    if (auth instanceof Response) return auth;
    const { adminClient } = auth;

    const body = await req.json().catch(() => ({}));
    const include: string[] = Array.isArray(body?.include) ? body.include : ["github", "rls"];

    const githubToken = Deno.env.get("GITHUB_TOKEN") || "";
    const githubRepo =
      Deno.env.get("GITHUB_REPO") || "mmarques30/ski-linguist-hub-99ce6087";
    const serviceRole = Boolean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

    let github: Record<string, unknown> | null = null;
    if (include.includes("github") && githubToken) {
      try {
        const headers = {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "fli-monitoring-status",
        };
        const [commitsRes, prsRes, repoRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${githubRepo}/commits?per_page=1`, {
            headers,
          }),
          fetch(
            `https://api.github.com/repos/${githubRepo}/pulls?state=open&per_page=100`,
            { headers }
          ),
          fetch(`https://api.github.com/repos/${githubRepo}`, { headers }),
        ]);

        if (!commitsRes.ok) {
          github = { error: `GitHub commits HTTP ${commitsRes.status}` };
        } else {
          const link = commitsRes.headers.get("link") || "";
          // approximate: count recent commits via a second call
          const recentRes = await fetch(
            `https://api.github.com/repos/${githubRepo}/commits?per_page=30`,
            { headers }
          );
          const recent = recentRes.ok ? await recentRes.json() : [];
          const prs = prsRes.ok ? await prsRes.json() : [];
          const repo = repoRes.ok ? await repoRes.json() : {};
          github = {
            recentCommits: Array.isArray(recent) ? recent.length : 0,
            openPrs: Array.isArray(prs) ? prs.length : 0,
            defaultBranch: repo.default_branch || "main",
            linkHint: link ? "paginated" : "ok",
          };
        }
      } catch (e) {
        github = {
          error: e instanceof Error ? e.message : "GitHub unreachable",
        };
      }
    }

    let rls: Record<string, unknown> | null = null;
    if (include.includes("rls")) {
      const { data: policies, error: polErr } = await adminClient.rpc(
        "monitoring_rls_summary" as never
      );
      if (polErr) {
        // Fallback SQL via information_schema is not available through PostgREST;
        // report guidance instead of failing the whole endpoint.
        rls = {
          error:
            "RPC monitoring_rls_summary absente — appliquer la migration monitoring ou ignorer ce signal",
          policyCount: null,
          tablesWithoutRls: [],
        };
      } else {
        rls = policies as Record<string, unknown>;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        githubConfigured: Boolean(githubToken),
        supabaseServiceConfigured: serviceRole,
        github,
        rls,
        repo: githubRepo,
      }),
      { headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("monitoring-status error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur interne",
      }),
      {
        status: 500,
        headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
