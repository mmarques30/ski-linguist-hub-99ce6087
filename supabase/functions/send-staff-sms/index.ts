/**
 * Envoi manuel d'un SMS depuis le back-office (fiche / liste stagiaires).
 * Staff uniquement. Utilise Brevo (sender FLI).
 *
 * Body JSON :
 *   {
 *     "to": "+336…",
 *     "content": "…",
 *     "templateSlug"?: "staff_sms_mail_check" | "staff_sms_payment" | "staff_sms_manual",
 *     "recipientName"?: "Prénom Nom",
 *     "studentId"?: "uuid",
 *     "inscriptionId"?: "uuid"
 *   }
 */
import { adminCorsHeaders, requireStaff } from "../_shared/admin-auth.ts";
import {
  BREVO_SMS_SENDER,
  normalizePhoneForSms,
  sendBrevoSms,
} from "../_shared/brevo-sms.ts";

const MAX_CONTENT = 600;
const ALLOWED_SLUGS = new Set([
  "staff_sms_mail_check",
  "staff_sms_payment",
  "staff_sms_manual",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: adminCorsHeaders });
  }

  try {
    const authResult = await requireStaff(req);
    if (authResult instanceof Response) return authResult;
    const { adminClient, userId } = authResult;

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "BREVO_API_KEY absente. Posez la clé dans les secrets Edge, puis réessayez.",
        }),
        {
          status: 409,
          headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const toRaw = typeof body?.to === "string" ? body.to.trim() : "";
    const content = typeof body?.content === "string" ? body.content : "";
    const recipientName =
      typeof body?.recipientName === "string" ? body.recipientName.trim() : null;
    const studentId = typeof body?.studentId === "string" ? body.studentId : null;
    const inscriptionId =
      typeof body?.inscriptionId === "string" ? body.inscriptionId : null;
    const templateSlugRaw =
      typeof body?.templateSlug === "string" ? body.templateSlug.trim() : "";
    const templateSlug = ALLOWED_SLUGS.has(templateSlugRaw)
      ? templateSlugRaw
      : "staff_sms_manual";

    const to = normalizePhoneForSms(toRaw);
    if (!to) {
      return new Response(
        JSON.stringify({ success: false, error: "Numéro de téléphone invalide" }),
        {
          status: 400,
          headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const trimmed = content.trim();
    if (!trimmed) {
      return new Response(
        JSON.stringify({ success: false, error: "Message obligatoire" }),
        {
          status: 400,
          headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    if (trimmed.length > MAX_CONTENT) {
      return new Response(
        JSON.stringify({ success: false, error: "Message trop long" }),
        {
          status: 400,
          headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const send = await sendBrevoSms({
      apiKey: brevoApiKey,
      recipient: to,
      content: trimmed,
      sender: BREVO_SMS_SENDER,
      tag: templateSlug,
    });

    await adminClient.from("email_log").insert({
      template_slug: templateSlug,
      recipient_email: to,
      recipient_name: recipientName,
      status: send.ok ? "sent" : "failed",
      error_message: send.error ?? null,
      inscription_id: inscriptionId,
      sent_at: send.ok ? new Date().toISOString() : null,
      variables_used: {
        channel: "brevo_sms",
        sender: BREVO_SMS_SENDER,
        student_id: studentId,
        sent_by: userId,
        message_id: send.messageId ?? null,
        content_preview: trimmed.slice(0, 500),
        content_length: trimmed.length,
      },
    });

    if (!send.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: send.error || "Échec d'envoi Brevo SMS",
          skipped: send.skipped ?? false,
        }),
        {
          status: send.skipped ? 409 : 502,
          headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          to,
          sender: BREVO_SMS_SENDER,
          messageId: send.messageId ?? null,
          templateSlug,
        },
      }),
      { headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur interne",
      }),
      {
        status: 500,
        headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
