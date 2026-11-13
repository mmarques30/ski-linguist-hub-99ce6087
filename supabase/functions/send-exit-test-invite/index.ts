/**
 * Invitation au test de fin de formation (obligatoire avant le pack).
 *
 * POST JSON `{ "inscriptionId": "uuid" }`
 * Staff ou service_role. Crée le placement_test de sortie s'il manque,
 * envoie `exit_test_invite` (modèle actif requis), pose exit_test_invited_at.
 */

import {
  adminCorsHeaders,
  requireServiceRoleOrStaff,
} from "../_shared/admin-auth.ts";
import {
  loadEmailTemplate,
  renderEmailTemplate,
} from "../_shared/email-model-templates.ts";
import { sendFliEmail } from "../_shared/fli-email.ts";
import { isFliPlaceholderEmail } from "../_shared/email-guards.ts";

const corsHeaders = adminCorsHeaders;
const APP_URL = Deno.env.get("APP_URL") || "https://plateforme.fli.fr";

function formatFr(iso: string | null | undefined): string {
  if (!iso) return "";
  const raw = String(iso).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  return raw;
}

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
    const payload = (await req.json().catch(() => ({}))) as {
      inscriptionId?: string;
    };
    const inscriptionId = (payload.inscriptionId || "").trim();
    if (!inscriptionId) {
      return json(400, { success: false, error: "inscriptionId requis" });
    }

    const { adminClient } = auth;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const { data: row, error: rowErr } = await adminClient
      .from("inscriptions")
      .select(
        "id, student_id, language, end_date, code, exit_test_id, exit_test_invited_at, status"
      )
      .eq("id", inscriptionId)
      .maybeSingle();
    if (rowErr) throw rowErr;
    if (!row) {
      return json(404, { success: false, error: "Inscription introuvable" });
    }

    const { data: student } = await adminClient
      .from("students")
      .select("email, first_name, last_name")
      .eq("id", row.student_id)
      .maybeSingle();

    const email = (student?.email || "").trim();
    if (!email || isFliPlaceholderEmail(email)) {
      return json(400, {
        success: false,
        error: `E-mail stagiaire invalide : ${email || "(vide)"}`,
      });
    }
    const studentName =
      [student?.first_name, student?.last_name].filter(Boolean).join(" ").trim() ||
      "Stagiaire";

    let testId = row.exit_test_id as string | null;
    let inviteToken: string | null = null;

    if (testId) {
      const { data: existing, error: existingErr } = await adminClient
        .from("placement_tests")
        .select("id, invite_token, completed_at")
        .eq("id", testId)
        .maybeSingle();
      if (existingErr) throw existingErr;
      if (existing?.completed_at) {
        return json(400, {
          success: false,
          error: "Le test de fin est déjà complété — pas de nouvel envoi.",
          already_completed: true,
        });
      }
      inviteToken = existing?.invite_token ?? null;
      if (!inviteToken && existing?.id) {
        const { data: refreshed, error: refreshErr } = await adminClient
          .from("placement_tests")
          .update({ invite_token: crypto.randomUUID() })
          .eq("id", existing.id)
          .select("invite_token")
          .single();
        if (refreshErr) throw refreshErr;
        inviteToken = refreshed.invite_token;
      }
    } else {
      const { data: created, error: createErr } = await adminClient
        .from("placement_tests")
        .insert({
          student_id: row.student_id,
          inscription_id: inscriptionId,
          language: row.language || "Anglais",
          status: "pending",
        })
        .select("id, invite_token")
        .single();
      if (createErr) throw createErr;
      testId = created.id;
      inviteToken = created.invite_token;
      const { error: linkErr } = await adminClient
        .from("inscriptions")
        .update({ exit_test_id: testId })
        .eq("id", inscriptionId);
      if (linkErr) throw linkErr;
    }

    if (!inviteToken) {
      return json(500, {
        success: false,
        error: "Impossible d'obtenir le jeton du test de fin.",
      });
    }

    const template = await loadEmailTemplate(adminClient, "exit_test_invite");
    if (!template) {
      return json(400, {
        success: false,
        error:
          "Modèle exit_test_invite inactif ou absent — valider sur /admin/emails.",
      });
    }

    const exitTestLink = `${APP_URL.replace(/\/$/, "")}/exit-test/${inviteToken}`;
    const variables = {
      student_name: studentName,
      language: row.language || "formation",
      end_date: formatFr(row.end_date),
      exit_test_link: exitTestLink,
    };
    const rendered = renderEmailTemplate(template, variables);

    const send = await sendFliEmail({
      resendApiKey,
      to: email,
      subject: rendered.subject,
      html: rendered.html,
    });

    await adminClient.from("email_log").insert({
      template_slug: "exit_test_invite",
      recipient_email: email,
      recipient_name: studentName,
      status: send.ok ? "sent" : send.skipped ? "skipped" : "failed",
      error_message: send.ok ? null : (send.error || "").slice(0, 500),
      inscription_id: inscriptionId,
      variables_used: variables,
    });

    if (!send.ok) {
      return json(send.skipped ? 400 : 502, {
        success: false,
        error: send.error || "Échec Resend",
        skipped: send.skipped,
        exit_test_link: exitTestLink,
      });
    }

    await adminClient
      .from("inscriptions")
      .update({
        exit_test_invited_at: new Date().toISOString(),
      })
      .eq("id", inscriptionId);

    return json(200, {
      success: true,
      sent: true,
      to: email,
      subject: rendered.subject,
      exit_test_id: testId,
      exit_test_link: exitTestLink,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("send-exit-test-invite:", message);
    return json(500, { success: false, error: message });
  }
});
