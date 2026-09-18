import { adminCorsHeaders, requireAdmin } from "../_shared/admin-auth.ts";
import {
  applyEmailTemplate,
  FLI_TEST_RECIPIENT,
  sendFliEmail,
} from "../_shared/fli-email.ts";
import { isFliPlaceholderEmail } from "../_shared/email-guards.ts";

/**
 * Envoi de test des modèles actifs.
 * Body optionnel :
 *   { "slugs": ["…"], "recipients": ["a@b.c", …], "to": "…" }
 * Sans recipients/to → info@fli.fr. Sans slugs → tous les actifs.
 * Sans RESEND_API_KEY : refuse proprement, n'appelle pas Resend.
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
  suivi_url: "https://ski-linguist-hub.lovable.app/suivi/zztest-token-demo",
  payment_label: "Virement",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    let requestedSlugs: string[] | null = null;
    let recipients: string[] = [FLI_TEST_RECIPIENT];
    try {
      const raw = await req.text();
      if (raw.trim()) {
        const body = JSON.parse(raw);
        if (Array.isArray(body?.slugs)) {
          const list = body.slugs.filter(
            (s: unknown) => typeof s === "string" && s.trim().length > 0
          ) as string[];
          if (list.length) requestedSlugs = list;
        }
        const rawRecipients = Array.isArray(body?.recipients)
          ? body.recipients
          : typeof body?.to === "string"
            ? [body.to]
            : null;
        if (rawRecipients) {
          const cleaned = rawRecipients
            .filter((s: unknown) => typeof s === "string")
            .map((s: string) => s.trim().toLowerCase())
            .filter((s: string) => EMAIL_RE.test(s) && !isFliPlaceholderEmail(s));
          if (!cleaned.length) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Aucun destinataire valide dans recipients / to.",
              }),
              { status: 400, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
            );
          }
          recipients = [...new Set(cleaned)];
        }
      }
    } catch {
      // body vide / invalide → défauts
    }

    let query = adminClient
      .from("email_templates")
      .select("slug, subject_fr, body_fr")
      .eq("is_active", true)
      .order("slug");
    if (requestedSlugs?.length) {
      query = query.in("slug", requestedSlugs);
    }
    const { data: templates, error: tplError } = await query;
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
      to: string;
      ok: boolean;
      error?: string;
      status?: number;
      skipped?: boolean;
    }> = [];

    for (const to of recipients) {
      for (const tpl of templates) {
        try {
          const subject = applyEmailTemplate(tpl.subject_fr ?? "", TEST_VARIABLES);
          const html = applyEmailTemplate(tpl.body_fr ?? "", TEST_VARIABLES);
          const send = await sendFliEmail({
            resendApiKey,
            to,
            subject: `[TEST] ${subject}`,
            html,
          });
          results.push({
            slug: tpl.slug,
            to,
            ok: send.ok,
            error: send.error,
            status: send.status,
            skipped: send.skipped,
          });
          await adminClient.from("email_log").insert({
            template_slug: tpl.slug,
            recipient_email: to,
            recipient_name: "TEST FLI",
            status: send.ok ? "sent" : "failed",
            error_message: send.error ?? null,
            variables_used: { test: true, bulk_test: true, ...TEST_VARIABLES },
          });
        } catch (renderError) {
          const message =
            renderError instanceof Error ? renderError.message : String(renderError);
          results.push({ slug: tpl.slug, to, ok: false, error: message });
          await adminClient.from("email_log").insert({
            template_slug: tpl.slug,
            recipient_email: to,
            recipient_name: "TEST FLI",
            status: "failed",
            error_message: message,
            variables_used: { test: true, bulk_test: true },
          });
        }
      }
    }

    const okCount = results.filter((r) => r.ok).length;
    const allOk = okCount === results.length;
    return new Response(
      JSON.stringify({
        success: allOk,
        sent: allOk,
        recipients,
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
