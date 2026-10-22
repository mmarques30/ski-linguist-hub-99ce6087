/**
 * Envoi manuel du questionnaire de satisfaction (modèle day0).
 *
 * POST JSON `{ "inscriptionId": "uuid" }`
 * Auth : staff ou formateur·rice (périmètre instructor_id).
 * Crée le jeton s'il manque, refuse si déjà rempli, autorise le renvoi.
 * BCC info@fli.fr via sendFliEmail.
 */

import {
  adminCorsHeaders,
  requireStaffOrFormateur,
} from "../_shared/admin-auth.ts";
import {
  loadEmailTemplate,
  renderEmailTemplate,
} from "../_shared/email-model-templates.ts";
import { sendFliEmail } from "../_shared/fli-email.ts";
import { isFliPlaceholderEmail } from "../_shared/email-guards.ts";

const corsHeaders = adminCorsHeaders;
const APP_URL =
  Deno.env.get("SURVEY_BASE_URL") ||
  Deno.env.get("APP_URL") ||
  "https://plateforme.fli.fr";
const TEMPLATE_SLUG = "satisfaction_survey_day0";

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function displayLanguage(raw: string | null | undefined): string {
  const v = (raw || "").trim().toLowerCase();
  const map: Record<string, string> = {
    english: "anglais",
    anglais: "anglais",
    spanish: "espagnol",
    espagnol: "espagnol",
    portuguese: "portugais",
    portugais: "portugais",
    "brazilian portuguese": "portugais brésilien",
    dutch: "néerlandais",
    neerlandais: "néerlandais",
    russian: "russe",
    russe: "russe",
    french: "français",
    francais: "français",
  };
  return map[v] || raw?.trim() || "formation";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireStaffOrFormateur(req);
  if (auth instanceof Response) return auth;

  try {
    const payload = (await req.json().catch(() => ({}))) as {
      inscriptionId?: string;
    };
    const inscriptionId = (payload.inscriptionId || "").trim();
    if (!inscriptionId) {
      return json(400, { success: false, error: "inscriptionId requis" });
    }

    const { adminClient, userId, authMode } = auth;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const { data: inscription, error: inscErr } = await adminClient
      .from("inscriptions")
      .select(
        "id, code, language, end_date, student_id, instructor_id, status"
      )
      .eq("id", inscriptionId)
      .maybeSingle();
    if (inscErr) throw inscErr;
    if (!inscription) {
      return json(404, { success: false, error: "Inscription introuvable" });
    }

    if (authMode === "formateur") {
      const { data: instructor } = await adminClient
        .from("instructors")
        .select("id")
        .eq("auth_user_id", userId)
        .maybeSingle();
      if (
        !instructor?.id ||
        inscription.instructor_id !== instructor.id
      ) {
        return json(403, {
          success: false,
          error: "Inscription hors de ton périmètre",
        });
      }
    }

    if (!inscription.student_id) {
      return json(400, {
        success: false,
        error: "Aucun stagiaire rattaché à cette mission",
      });
    }

    const { data: student, error: stuErr } = await adminClient
      .from("students")
      .select("id, email, first_name, last_name")
      .eq("id", inscription.student_id)
      .maybeSingle();
    if (stuErr) throw stuErr;

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

    let surveyToken: string | null = null;
    let surveyId: string | null = null;
    let alreadyCompleted = false;
    let day0SentAt: string | null = null;

    const { data: existing, error: survErr } = await adminClient
      .from("satisfaction_surveys")
      .select("id, token, completed_at, day0_sent_at")
      .eq("inscription_id", inscriptionId)
      .maybeSingle();
    if (survErr) throw survErr;

    if (existing) {
      surveyId = existing.id;
      surveyToken = existing.token;
      alreadyCompleted = Boolean(existing.completed_at);
      day0SentAt = existing.day0_sent_at ?? null;
    } else {
      const { data: created, error: createErr } = await adminClient
        .from("satisfaction_surveys")
        .insert({
          inscription_id: inscriptionId,
          student_id: inscription.student_id,
        })
        .select("id, token")
        .single();
      if (createErr) throw createErr;
      surveyId = created.id;
      surveyToken = created.token;
    }

    if (alreadyCompleted) {
      return json(409, {
        success: false,
        error: "Le questionnaire est déjà rempli pour cette mission",
        surveyId,
      });
    }

    if (!surveyToken || !surveyId) {
      return json(500, {
        success: false,
        error: "Impossible de créer le jeton du questionnaire",
      });
    }

    const template = await loadEmailTemplate(adminClient, TEMPLATE_SLUG);
    if (!template) {
      return json(400, {
        success: false,
        error: `Modèle ${TEMPLATE_SLUG} inactif ou absent — valider sur /admin/emails.`,
      });
    }

    const variables = {
      student_name: studentName,
      language: displayLanguage(inscription.language),
      survey_link: `${APP_URL.replace(/\/$/, "")}/survey/${surveyToken}`,
    };
    const rendered = renderEmailTemplate(template, variables);

    const outcome = await sendFliEmail({
      resendApiKey,
      to: email,
      subject: rendered.subject,
      html: rendered.html,
    });

    await adminClient.from("email_log").insert({
      template_slug: TEMPLATE_SLUG,
      recipient_email: email,
      recipient_name: studentName,
      inscription_id: inscriptionId,
      status: outcome.ok ? "sent" : outcome.skipped ? "skipped" : "failed",
      error_message: outcome.error ?? null,
      variables_used: {
        ...variables,
        sent_by: authMode,
        sent_by_user_id: userId,
        resent: Boolean(day0SentAt),
      },
    });

    if (!outcome.ok) {
      return json(502, {
        success: false,
        error: outcome.error || "Envoi refusé par le garde-fou e-mail",
        skipped: Boolean(outcome.skipped),
      });
    }

    const sentAt = new Date().toISOString();
    await adminClient
      .from("satisfaction_surveys")
      .update({ day0_sent_at: sentAt })
      .eq("id", surveyId);

    return json(200, {
      success: true,
      surveyId,
      surveyToken,
      recipientEmail: email,
      recipientName: studentName,
      resent: Boolean(day0SentAt),
      day0SentAt: sentAt,
    });
  } catch (error) {
    console.error("send-satisfaction-survey error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return json(500, { success: false, error: message });
  }
});
