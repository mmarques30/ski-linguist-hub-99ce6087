/**
 * Invitation au test de fin de formation (obligatoire avant le pack).
 *
 * POST JSON `{ "inscriptionId": "uuid" }`
 * Staff, service_role, ou cron (x-cron-dispatch-token).
 * Crée le placement_test de sortie s'il manque, envoie `exit_test_invite`,
 * pose exit_test_invited_at.
 *
 * `?dry_run=true` : rend le modèle sans envoi Resend.
 */

import {
  adminCorsHeaders,
  requireServiceRoleOrStaff,
} from "../_shared/admin-auth.ts";
import { inviteExitTestForInscription } from "../_shared/exit-test-invite.ts";

const corsHeaders = adminCorsHeaders;

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
    const payload = (await req.json().catch(() => ({}))) as {
      inscriptionId?: string;
    };
    const inscriptionId = (payload.inscriptionId || "").trim();
    if (!inscriptionId) {
      return json(400, { success: false, error: "inscriptionId requis" });
    }

    const result = await inviteExitTestForInscription(
      auth.adminClient,
      inscriptionId,
      { dryRun }
    );

    if (result.already_completed) {
      return json(400, result);
    }
    if (!result.success) {
      const status = result.skipped ? 400 : result.error?.includes("introuvable")
        ? 404
        : result.error?.includes("Modèle")
          ? 400
          : 502;
      return json(status, result);
    }

    return json(200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("send-exit-test-invite:", message);
    return json(500, { success: false, error: message });
  }
});
