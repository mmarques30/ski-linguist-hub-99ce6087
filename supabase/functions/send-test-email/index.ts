import { adminCorsHeaders, requireAdmin } from "../_shared/admin-auth.ts";
import {
  applyEmailTemplate,
  FLI_TEST_RECIPIENT,
  sendFliEmail,
} from "../_shared/fli-email.ts";

/**
 * Envoi de test de TOUS les modèles actifs vers info@fli.fr.
 * Sans RESEND_API_KEY : refuse proprement, n'appelle pas Resend.
 * Variables fictives ZZTEST — couvrent le set documenté (consignes 17/09/2026).
 */
const TEST_VARIABLES: Record<string, string> = {
  student_name: "ZZTEST Camille Martin",
  client_name: "ESF ZZTEST Les Arcs",
  trainer_first_name: "Alex",
  instructor_name: "Alex Dupont",
  instructor_phone: "06 12 34 56 78",
  language: "Anglais",
  inscription_code: "ZZTEST-0001",
  dates_label: "du 14 au 25 septembre 2026",
  start_date: "14 septembre 2026",
  end_date: "25 septembre 2026",
  course_location: "Les Arcs",
  location_details: "Salle A — chalet FLI",
  modality_label: "Présentiel",
  slope_label: "Piste verte",
  schedule_label: "Groupe matin, 9 h à 12 h",
  total_hours: "30",
  student_count: "8",
  invoice_number: "26-27.99999",
  amount: "1 250,00 €",
  due_date: "1er octobre 2026",
  days_overdue: "7",
  survey_link: "https://ski-linguist-hub.lovable.app/enquete/zztest-token",
  magic_link: "https://ski-linguist-hub.lovable.app/auth?mode=student",
  link_expiry_label: "24 heures",
  dashboard_url: "https://ski-linguist-hub.lovable.app/inscriptions",
  groups_html:
    "<ul><li>Anglais — Les Arcs — 3 inscription(s) sans formateur·rice</li></ul>",
  groups_text: "Anglais — Les Arcs — 3 inscription(s) sans formateur·rice",
  total_count: "3",
  days_before: "10",
  return_deadline: "10 octobre 2026",
  payment_label: "Virement",
  suivi_url: "https://ski-linguist-hub.lovable.app/suivi/zztest-token-demo",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: adminCorsHeaders });
  }

  try {
    const authResult = await requireAdmin(req);
    if (authResult instanceof Response) return authResult;
    const { adminClient } = authResult;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          ready: true,
          sent: false,
          error:
            "RESEND_API_KEY absente. Posez la clé dans les secrets de la fonction, puis relancez. Aucun email n'est parti.",
        }),
        { status: 409, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: templates, error: tplError } = await adminClient
      .from("email_templates")
      .select("slug, subject_fr, body_fr")
      .eq("is_active", true)
      .order("slug");
    if (tplError) throw tplError;

    if (!templates?.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Aucun modèle actif dans email_templates.",
        }),
        { status: 500, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{
      slug: string;
      ok: boolean;
      error?: string;
      status?: number;
      skipped?: boolean;
    }> = [];

    for (const tpl of templates) {
      try {
        const subject = applyEmailTemplate(tpl.subject_fr ?? "", TEST_VARIABLES);
        const html = applyEmailTemplate(tpl.body_fr ?? "", TEST_VARIABLES);
        const send = await sendFliEmail({
          resendApiKey,
          to: FLI_TEST_RECIPIENT,
          subject: `[TEST] ${subject}`,
          html,
        });
        results.push({
          slug: tpl.slug,
          ok: send.ok,
          error: send.error,
          status: send.status,
          skipped: send.skipped,
        });
        await adminClient.from("email_log").insert({
          template_slug: tpl.slug,
          recipient_email: FLI_TEST_RECIPIENT,
          recipient_name: "TEST FLI",
          status: send.ok ? "sent" : "failed",
          error_message: send.error ?? null,
          variables_used: { test: true, bulk_test: true, ...TEST_VARIABLES },
        });
      } catch (renderError) {
        const message =
          renderError instanceof Error ? renderError.message : String(renderError);
        results.push({ slug: tpl.slug, ok: false, error: message });
        await adminClient.from("email_log").insert({
          template_slug: tpl.slug,
          recipient_email: FLI_TEST_RECIPIENT,
          recipient_name: "TEST FLI",
          status: "failed",
          error_message: message,
          variables_used: { test: true, bulk_test: true },
        });
      }
    }

    const okCount = results.filter((r) => r.ok).length;
    const allOk = okCount === results.length;
    return new Response(
      JSON.stringify({
        success: allOk,
        sent: allOk,
        recipient: FLI_TEST_RECIPIENT,
        total: results.length,
        ok: okCount,
        failed: results.length - okCount,
        results,
      }),
      {
        status: allOk ? 200 : 502,
        headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur interne",
      }),
      { status: 500, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
    );
  }
});
