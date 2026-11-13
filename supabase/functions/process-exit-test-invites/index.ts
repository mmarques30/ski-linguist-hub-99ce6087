/**
 * Cron / essai admin : invitations automatiques au test de fin.
 *
 * - Collectives : end_date = aujourd'hui (Europe/Paris)
 * - Individuelles : bilan de sortie rempli OU statut Terminée
 *   (file de rattrapage ; l'envoi immédiat passe aussi par le trigger SQL)
 *
 * `?dry_run=true` via email_crons_dispatch_query tant que email_crons_live=false.
 */

import {
  adminCorsHeaders,
  requireServiceRoleOrStaff,
} from "../_shared/admin-auth.ts";
import {
  exitTestFormationKind,
  inviteExitTestForInscription,
  parisTodayYmd,
} from "../_shared/exit-test-invite.ts";

const corsHeaders = adminCorsHeaders;

const SKIP_STATUSES = new Set([
  "annulee",
  "annulée",
  "cancelled",
  "canceled",
  "brouillon",
  "en_attente",
]);

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireServiceRoleOrStaff(req);
  if (auth instanceof Response) return auth;

  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry_run") === "true";
    const today = parisTodayYmd();
    const supabase = auth.adminClient;

    const { data: rows, error } = await supabase
      .from("inscriptions")
      .select(
        "id, status, course_type, modality, end_date, exit_test_id, exit_test_invited_at, exit_form_completed_at"
      )
      .is("exit_test_invited_at", null)
      .not("status", "in", '("annulee","brouillon","en_attente")');

    if (error) throw error;

    const results = {
      dryRun,
      todayParis: today,
      candidates: 0,
      sent: 0,
      skipped: 0,
      errors: [] as string[],
      byKind: { collective: 0, individuelle: 0 },
    };

    for (const row of rows || []) {
      const status = (row.status || "").toLowerCase();
      if (SKIP_STATUSES.has(status)) {
        results.skipped++;
        continue;
      }

      const kind = exitTestFormationKind({
        course_type: row.course_type,
        modality: row.modality,
      });

      let eligible = false;
      if (kind === "collective") {
        const end = (row.end_date || "").slice(0, 10);
        eligible = end === today;
      } else {
        eligible =
          Boolean(row.exit_form_completed_at) || status === "terminee";
      }

      if (!eligible) continue;
      results.candidates++;
      results.byKind[kind]++;

      try {
        const invite = await inviteExitTestForInscription(supabase, row.id, {
          dryRun,
        });
        if (invite.sent || invite.dryRun) {
          results.sent++;
        } else if (invite.skipped || invite.already_invited) {
          results.skipped++;
        } else if (!invite.success) {
          results.errors.push(`${row.id}: ${invite.error || "échec"}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.errors.push(`${row.id}: ${message}`);
      }
    }

    return json(200, { success: true, ...results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("process-exit-test-invites:", message);
    return json(500, { success: false, error: message });
  }
});
