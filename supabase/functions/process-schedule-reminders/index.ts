import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "info@fli.fr";
const DAYS_BEFORE_START = 10;

interface PendingInscription {
  id: string;
  code: string | null;
  language: string;
  start_date: string;
  entry_level: string | null;
  schedule_status: string;
  student: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

function applyTemplate(template: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template
  );
}

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildGroupsHtml(
  inscriptions: PendingInscription[],
  appBaseUrl: string
): string {
  const byLanguage = new Map<string, PendingInscription[]>();

  for (const insc of inscriptions) {
    const list = byLanguage.get(insc.language) || [];
    list.push(insc);
    byLanguage.set(insc.language, list);
  }

  let html = "";

  for (const [language, group] of byLanguage.entries()) {
    html += `<h3>${language} (${group.length} stagiaire${group.length > 1 ? "s" : ""})</h3>`;
    html += `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;margin-bottom:16px">`;
    html += `<tr style="background:#f4f4f5"><th>Code</th><th>Stagiaire</th><th>Niveau</th><th>Action</th></tr>`;

    for (const insc of group) {
      const name = insc.student
        ? `${insc.student.first_name} ${insc.student.last_name}`
        : "—";
      const link = `${appBaseUrl}/inscriptions/${insc.id}`;
      html += `<tr>
        <td>${insc.code || "—"}</td>
        <td>${name}</td>
        <td>${insc.entry_level || "—"}</td>
        <td><a href="${link}">Valider l'horaire</a></td>
      </tr>`;
    }

    html += `</table>`;
  }

  html += `<p><em>Analysez l'ensemble des inscrits par langue avant de valider matin ou après-midi pour chaque stagiaire.</em></p>`;
  return html;
}

async function sendEmail(
  resendApiKey: string,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FLI Formation <noreply@fli.fr>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Resend error:", text);
  }

  return response.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry_run") === "true";

    console.log(`Starting schedule reminder processing (dry_run: ${dryRun})`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const appBaseUrl = Deno.env.get("APP_BASE_URL") || "https://id-preview--34e71e1a-49f7-433e-bb36-fc4d26e86f8e.lovable.app";

    if (!dryRun && !resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "RESEND_API_KEY not configured. Use ?dry_run=true to test.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + DAYS_BEFORE_START);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    const { data: inscriptions, error } = await supabase
      .from("inscriptions")
      .select(`
        id,
        code,
        language,
        start_date,
        entry_level,
        schedule_status,
        students!inscriptions_student_id_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .eq("start_date", targetDateStr)
      .eq("schedule_status", "pending")
      .is("schedule_reminder_sent_at", null)
      .not("status", "eq", "annulee");

    if (error) throw error;

    const pending: PendingInscription[] = (inscriptions || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      code: row.code as string | null,
      language: row.language as string,
      start_date: row.start_date as string,
      entry_level: row.entry_level as string | null,
      schedule_status: row.schedule_status as string,
      student: row.students as PendingInscription["student"],
    }));

    const results = {
      dryRun,
      targetDate: targetDateStr,
      totalPending: pending.length,
      emailSent: false,
      inscriptionsUpdated: 0,
      details: pending.map((i) => ({
        code: i.code,
        language: i.language,
        student: i.student ? `${i.student.first_name} ${i.student.last_name}` : "—",
        level: i.entry_level,
      })),
    };

    if (pending.length === 0) {
      console.log(`No pending schedule validations for ${targetDateStr}`);
      return new Response(
        JSON.stringify({ success: true, results, summary: "No inscriptions to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const groupsHtml = buildGroupsHtml(pending, appBaseUrl);
    const formattedDate = formatDateFr(targetDateStr);

    const { data: template } = await supabase
      .from("email_templates")
      .select("subject_fr, body_fr")
      .eq("slug", "schedule_validation_reminder")
      .maybeSingle();

    const variables = {
      start_date: formattedDate,
      total_count: String(pending.length),
      groups_html: groupsHtml,
      dashboard_url: `${appBaseUrl}/inscriptions`,
    };

    const subject = template
      ? applyTemplate(template.subject_fr, variables)
      : `[FLI] Validation horaires J-10 — ${pending.length} inscription(s) — ${formattedDate}`;

    const html = template
      ? applyTemplate(template.body_fr, variables)
      : `<h2>Bonjour Paula,</h2><p>${pending.length} inscription(s) débutent le ${formattedDate}.</p>${groupsHtml}`;

    if (!dryRun && resendApiKey) {
      const emailSent = await sendEmail(resendApiKey, ADMIN_EMAIL, subject, html);
      results.emailSent = emailSent;

      if (emailSent) {
        const ids = pending.map((i) => i.id);
        const now = new Date().toISOString();

        await supabase
          .from("inscriptions")
          .update({ schedule_reminder_sent_at: now })
          .in("id", ids);

        results.inscriptionsUpdated = ids.length;

        await supabase.from("email_log").insert({
          template_slug: "schedule_validation_reminder",
          recipient_email: ADMIN_EMAIL,
          recipient_name: "Paula",
          status: "sent",
          variables_used: variables,
        });

        const { data: adminUsers } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        for (const admin of adminUsers || []) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            type: "schedule_validation",
            title: `⏰ J-10 — ${pending.length} horaire(s) à valider`,
            message: `Formations du ${formattedDate} : ${pending.length} inscription(s) en attente de validation matin/après-midi.`,
            link: "/inscriptions",
          });
        }
      }
    } else {
      results.emailSent = false;
      console.log(`[DRY-RUN] Would email ${ADMIN_EMAIL} for ${pending.length} inscriptions`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: dryRun
          ? `[DRY-RUN] Would alert ${ADMIN_EMAIL} about ${pending.length} inscription(s) for ${targetDateStr}`
          : `Alert sent to ${ADMIN_EMAIL} for ${pending.length} inscription(s)`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("process-schedule-reminders error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
