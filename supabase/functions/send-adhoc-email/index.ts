import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendFliEmail } from "../_shared/fli-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AdhocAttachment = { filename: string; content: string };
type AdhocEmail = {
  to: string;
  subject: string;
  html: string;
  inscription_id?: string;
  recipient_name?: string;
  template_slug?: string;
  attachments?: AdhocAttachment[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ success: false, error: "RESEND_API_KEY absente" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = await req.json();
    const emails: AdhocEmail[] = Array.isArray(body?.emails) ? body.emails : [];
    if (!emails.length) {
      return new Response(JSON.stringify({ success: false, error: "emails[] requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const results: Array<Record<string, unknown>> = [];
    for (const email of emails) {
      const to = String(email.to || "").trim().toLowerCase();
      const subject = String(email.subject || "").trim();
      const html = String(email.html || "");
      if (!to || !subject || !html) {
        results.push({ to, ok: false, error: "to/subject/html requis" });
        continue;
      }
      const attachments = Array.isArray(email.attachments)
        ? email.attachments
            .filter((a) => a?.filename && a?.content)
            .map((a) => ({ filename: String(a.filename), content: String(a.content) }))
        : undefined;
      const sent = await sendFliEmail({ resendApiKey, to, subject, html, attachments });
      if (!sent.ok) {
        results.push({ to, ok: false, skipped: sent.skipped, error: sent.error, status: sent.status });
        continue;
      }
      const { data: logRow, error: logError } = await supabase
        .from("email_log")
        .insert({
          template_slug: email.template_slug || "adhoc_manual",
          recipient_email: to,
          recipient_name: email.recipient_name || null,
          inscription_id: email.inscription_id || null,
          status: "sent",
          sent_at: new Date().toISOString(),
          variables_used: {
            subject,
            attachments: (attachments || []).map((a) => a.filename),
          },
        })
        .select("id")
        .single();
      results.push({
        to,
        ok: true,
        email_log_id: logRow?.id ?? null,
        log_error: logError?.message ?? null,
        attachments: (attachments || []).map((a) => a.filename),
      });
    }
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
