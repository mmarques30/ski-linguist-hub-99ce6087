/**
 * One-shot manuel — résultat test + facture Tommy Gonzalez (Paula, 25/09/2026).
 * Utilise RESEND_API_KEY (secret Edge). Corps + PJ fournis dans le POST.
 * Undeploy immédiatement après l'envoi.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_TO = new Set(["gonzatommy@gmail.com"]);
const ALLOWED_CC = new Set(["direction@esf-peiseyvallandry.com"]);

const FLI_FROM = "FLI — France Langues International <noreply@fli.fr>";
const FLI_REPLY_TO = "info@fli.fr";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "RESEND_API_KEY absente — aucun envoi.",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    const to = String(body?.to || "").trim().toLowerCase();
    const ccRaw = Array.isArray(body?.cc) ? body.cc : [];
    const cc = ccRaw
      .map((x: unknown) => String(x || "").trim().toLowerCase())
      .filter(Boolean);
    const subject = String(body?.subject || "");
    const html = String(body?.html || "");
    const attachments = Array.isArray(body?.attachments)
      ? body.attachments.map(
        (a: { filename: string; content: string }) => ({
          filename: String(a.filename || ""),
          content: String(a.content || ""),
        }),
      )
      : [];

    if (!ALLOWED_TO.has(to)) {
      return new Response(
        JSON.stringify({ success: false, error: "destinataire non autorisé" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (cc.some((addr: string) => !ALLOWED_CC.has(addr))) {
      return new Response(
        JSON.stringify({ success: false, error: "cc non autorisé" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (!subject || !html || attachments.length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "subject, html et 2 PJ requis",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const payload: Record<string, unknown> = {
      from: FLI_FROM,
      to: [to],
      reply_to: [FLI_REPLY_TO],
      subject,
      html,
      attachments,
    };
    if (cc.length) payload.cc = cc;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          status: response.status,
          error: text,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let resendId: string | null = null;
    try {
      resendId = JSON.parse(text)?.id ?? null;
    } catch {
      resendId = null;
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent: true,
        to,
        cc,
        subject,
        resendId,
        attachmentNames: attachments.map((a: { filename: string }) => a.filename),
        attachmentBytes: attachments.map((a: { content: string }) =>
          Math.floor((a.content.length * 3) / 4)
        ),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
