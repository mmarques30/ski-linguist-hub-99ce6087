/**
 * Demande CFP La Rosière — backfill / renvoi.
 *
 * POST JSON :
 *   { "inscriptionIds": ["uuid", …], "force"?: true }
 *
 * Sans liste : inscriptions en_attente du lieu La Rosière, moniteur de ski,
 * données CFP incomplètes, pas encore envoyé (sauf force).
 *
 * JWT requis (comme send-inscription-documents) — vault / service_role OK.
 * Pas de requireStaff : dispatch SQL + cron possibles.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyEmailTemplate, sendFliEmail } from "../_shared/fli-email.ts";
import { isMissingStudentEmail } from "../_shared/email-guards.ts";
import {
  isLaRosiereSession,
  observationsLookLikeSkiInstructor,
  parseFifplCfpFromFundingDetails,
  renderRosiereCfpRequestEmail,
  ROSIERE_CFP_EMAIL_SLUG,
  shouldSendRosiereCfpRequest,
} from "../_shared/rosiere-cfp-request.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json().catch(() => ({}))) as {
      inscriptionIds?: unknown;
      force?: boolean;
    };
    const force = payload.force === true;
    const requestedIds = Array.isArray(payload.inscriptionIds)
      ? payload.inscriptionIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY absente." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let query = supabase
      .from("inscriptions")
      .select(
        "id, code, course_location, observations, funding_details, status, students ( first_name, last_name, email )"
      )
      .neq("status", "annulee");

    if (requestedIds.length) {
      query = query.in("id", requestedIds);
    } else {
      query = query
        .eq("status", "en_attente")
        .or("course_location.ilike.%rosière%,course_location.ilike.%rosiere%");
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    const { data: cfpTemplate } = await supabase
      .from("email_templates")
      .select("subject_fr, body_fr")
      .eq("slug", ROSIERE_CFP_EMAIL_SLUG)
      .eq("is_active", true)
      .maybeSingle();

    const results: Array<{
      inscriptionId: string;
      code: string | null;
      action: string;
      to?: string;
    }> = [];

    for (const row of rows ?? []) {
      const student = Array.isArray(row.students) ? row.students[0] : row.students;
      const email = typeof student?.email === "string" ? student.email.trim() : "";
      const studentName = `${student?.first_name ?? ""} ${student?.last_name ?? ""}`.trim();
      const locationLabel = typeof row.course_location === "string" ? row.course_location : null;
      const cfp = parseFifplCfpFromFundingDetails(row.funding_details as string | null);
      const looksInstructor = observationsLookLikeSkiInstructor(
        typeof row.observations === "string" ? row.observations : null
      );

      if (
        !isLaRosiereSession({ locationLabel }) ||
        !looksInstructor ||
        !shouldSendRosiereCfpRequest({
          profession: looksInstructor ? "ski_instructor" : "other",
          locationLabel,
          ...cfp,
        })
      ) {
        results.push({
          inscriptionId: row.id,
          code: row.code,
          action: "IGNORE - hors cible ou CFP déjà complet",
        });
        continue;
      }

      if (isMissingStudentEmail(email)) {
        results.push({
          inscriptionId: row.id,
          code: row.code,
          action: "IGNORE - email manquant",
        });
        continue;
      }

      if (!force) {
        const { data: prior } = await supabase
          .from("email_log")
          .select("id")
          .eq("template_slug", ROSIERE_CFP_EMAIL_SLUG)
          .eq("inscription_id", row.id)
          .eq("status", "sent")
          .maybeSingle();
        if (prior) {
          results.push({
            inscriptionId: row.id,
            code: row.code,
            action: "IGNORE - déjà envoyé",
          });
          continue;
        }
      }

      const cfpVars = {
        student_name: studentName || "Madame, Monsieur",
        inscription_code: row.code || "",
      };
      let subject: string;
      let html: string;
      if (cfpTemplate?.subject_fr && cfpTemplate?.body_fr) {
        subject = applyEmailTemplate(cfpTemplate.subject_fr, cfpVars);
        html = applyEmailTemplate(cfpTemplate.body_fr, cfpVars);
      } else {
        const rendered = renderRosiereCfpRequestEmail({
          studentName: cfpVars.student_name,
          inscriptionCode: cfpVars.inscription_code,
        });
        subject = rendered.subject;
        html = rendered.html;
      }

      const send = await sendFliEmail({ resendApiKey, to: email, subject, html });
      await supabase.from("email_log").insert({
        template_slug: ROSIERE_CFP_EMAIL_SLUG,
        recipient_email: email,
        recipient_name: studentName || null,
        status: send.ok ? "sent" : send.skipped ? "skipped" : "failed",
        error_message: send.error ?? null,
        inscription_id: row.id,
        variables_used: cfpVars,
      });

      results.push({
        inscriptionId: row.id,
        code: row.code,
        to: email,
        action: send.ok ? "ENVOYE" : send.skipped ? "IGNORE - skipped" : "ECHEC",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.filter((r) => r.action === "ENVOYE").length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur interne",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
