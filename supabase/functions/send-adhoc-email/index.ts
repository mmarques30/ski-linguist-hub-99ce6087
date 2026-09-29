import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendFliEmail } from "../_shared/fli-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEMPLATE_SLUG = "payment_reminder_manual";

type AdhocEmail = {
  to: string;
  subject: string;
  html: string;
  inscription_id?: string;
  recipient_name?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const body = await req.json().catch(() => ({}));
    const emails: AdhocEmail[] = Array.isArray(body?.emails) ? body.emails : [];
    if (!emails.length) {
      return new Response(JSON.stringify({ success: false, error: "emails[] requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<Record<string, unknown>> = [];
    for (const e of emails) {
      if (!e?.to || !e?.subject || !e?.html) {
        results.push({ to: e?.to ?? null, ok: false, error: "to, subject, html requis" });
        continue;
      }
      const sent = await sendFliEmail({
        resendApiKey,
        to: e.to,
        subject: e.subject,
        html: e.html,
      });

      let emailLogId: string | null = null;
      if (sent.ok) {
        const { data, error } = await supabase
          .from("email_log")
          .insert({
            template_slug: TEMPLATE_SLUG,
            recipient_email: e.to,
            recipient_name: e.recipient_name ?? null,
            status: "sent",
            inscription_id: e.inscription_id ?? null,
            sent_at: new Date().toISOString(),
          })
          .select("id")
          .maybeSingle();
        if (error) console.error("email_log insert:", error.message);
        emailLogId = data?.id ?? null;
      }

      results.push({ to: e.to, ...sent, emailLogId });
    }

    return new Response(
      JSON.stringify({ success: results.every((r) => r.ok), results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
