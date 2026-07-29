import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SkiMonitor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  partner_id: string | null;
}

interface CourseIntake {
  id: string;
  start_date: string;
  end_date: string;
  language: string;
  location: string;
  max_places: number | null;
  open_to_other_schools: boolean;
  hosting_partner_id: string;
  outreach_sent_at: string | null;
  status: string;
  partner: { name: string } | null;
}

function applyTemplate(template: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template
  );
}

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
    console.error("Resend error:", to, text);
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
    const intakeId = url.searchParams.get("intake_id");

    if (!intakeId) {
      return new Response(
        JSON.stringify({ success: false, error: "intake_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const { data: intakeRow, error: intakeError } = await supabase
      .from("course_intakes")
      .select(`
        id, start_date, end_date, language, location, max_places,
        open_to_other_schools, hosting_partner_id, outreach_sent_at, status,
        partner:hosting_partner_id(name)
      `)
      .eq("id", intakeId)
      .single();

    if (intakeError || !intakeRow) {
      throw new Error(intakeError?.message || "Intake not found");
    }

    const intake = intakeRow as unknown as CourseIntake;

    if (!["confirme", "ouvert"].includes(intake.status)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Le statut doit être « confirmé » ou « ouvert » avant l'envoi",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let monitorsQuery = supabase
      .from("ski_monitors")
      .select("id, first_name, last_name, email, partner_id")
      .eq("status", "active");

    if (!intake.open_to_other_schools) {
      monitorsQuery = monitorsQuery.eq("partner_id", intake.hosting_partner_id);
    }

    const { data: monitors, error: monitorsError } = await monitorsQuery;
    if (monitorsError) throw monitorsError;

    const recipients = (monitors || []) as SkiMonitor[];

    const hostSchool = intake.partner?.name || "École partenaire";
    const openScopeMessage = intake.open_to_other_schools
      ? "Cette session est ouverte à tous les moniteurs de ski, quelle que soit leur école d'origine — vous pouvez choisir cette station même si vous travaillez ailleurs."
      : `Cette session est réservée aux moniteurs de ${hostSchool}.`;

    const placesInfo = intake.max_places
      ? `${intake.max_places} places disponibles`
      : "Places limitées — inscrivez-vous rapidement";

    const { data: template } = await supabase
      .from("email_templates")
      .select("subject_fr, body_fr")
      .eq("slug", "intake_monitor_outreach")
      .maybeSingle();

    const baseVariables = {
      language: intake.language,
      location: intake.location,
      start_date: formatDateFr(intake.start_date),
      end_date: formatDateFr(intake.end_date),
      host_school: hostSchool,
      places_info: placesInfo,
      open_scope_message: openScopeMessage,
      registration_url: `${appBaseUrl}/register`,
    };

    const results = {
      dryRun,
      intakeId,
      openToOtherSchools: intake.open_to_other_schools,
      recipientCount: recipients.length,
      sent: 0,
      failed: 0,
      recipients: recipients.map((m) => ({
        name: `${m.first_name} ${m.last_name}`,
        email: m.email,
      })),
    };

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          results,
          summary: intake.open_to_other_schools
            ? "Aucun moniteur actif dans la base"
            : "Aucun moniteur actif pour l'école hôte — vérifiez la base moniteurs",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!dryRun && resendApiKey) {
      for (const monitor of recipients) {
        const variables = {
          ...baseVariables,
          monitor_name: monitor.first_name,
        };

        const subject = template
          ? applyTemplate(template.subject_fr, variables)
          : `Formation ${intake.language} — ${intake.location}`;

        const html = template
          ? applyTemplate(template.body_fr, variables)
          : `<p>Bonjour ${monitor.first_name}, une formation ${intake.language} est ouverte à ${intake.location}.</p>`;

        const ok = await sendEmail(resendApiKey, monitor.email, subject, html);

        await supabase.from("intake_outreach_log").insert({
          intake_id: intake.id,
          ski_monitor_id: monitor.id,
          recipient_email: monitor.email,
          recipient_name: `${monitor.first_name} ${monitor.last_name}`,
          status: ok ? "envoye" : "echec",
          error_message: ok ? null : "Resend API error",
        });

        await supabase.from("email_log").insert({
          template_slug: "intake_monitor_outreach",
          recipient_email: monitor.email,
          recipient_name: `${monitor.first_name} ${monitor.last_name}`,
          status: ok ? "envoye" : "echec",
          variables_used: variables,
        });

        if (ok) results.sent++;
        else results.failed++;
      }

      if (results.sent > 0) {
        await supabase
          .from("course_intakes")
          .update({
            outreach_sent_at: new Date().toISOString(),
            status: intake.status === "confirme" ? "ouvert" : intake.status,
          })
          .eq("id", intake.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: dryRun
          ? `[DRY-RUN] Enverrait ${recipients.length} email(s) — ${intake.open_to_other_schools ? "tous les moniteurs" : "école hôte uniquement"}`
          : `${results.sent} email(s) envoyé(s), ${results.failed} échec(s)`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("process-intake-outreach error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
