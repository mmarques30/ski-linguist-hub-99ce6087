/**
 * Envoi manuel d'un e-mail depuis le back-office (fiche stagiaire).
 * Staff uniquement. Utilise Resend (noreply@fli.fr, Reply-To info@fli.fr).
 *
 * Body JSON :
 *   {
 *     "to": "stagiaire@…",
 *     "subject": "…",
 *     "bodyText": "texte brut (sauts de ligne OK)",
 *     "recipientName"?: "Prénom Nom",
 *     "studentId"?: "uuid",
 *     "inscriptionId"?: "uuid",
 *     "cc"?: ["formateur@…"],
 *     "attachments"?: [{ "filename": "…pdf", "content": "<base64>" }],
 *     "templateSlug"?: "staff_manual" | "formateur_mise_en_relation"
 *   }
 */
import { adminCorsHeaders, requireStaff } from "../_shared/admin-auth.ts";
import {
  buildFliFooterHtml,
  loadOrganizationIdentity,
  sendFliEmail,
} from "../_shared/fli-email.ts";
import { isFliPlaceholderEmail } from "../_shared/email-guards.ts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_TEMPLATE_SLUG = "staff_manual";
const ALLOWED_TEMPLATE_SLUGS = new Set([
  "staff_manual",
  "formateur_mise_en_relation",
]);
const MAX_ATTACHMENT_BYTES = 4_500_000;
const MAX_ATTACHMENTS = 6;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Convertit un texte saisi en HTML simple (paragraphes + liens http). */
function plainTextToEmailHtml(bodyText: string, footerHtml: string): string {
  const trimmed = bodyText.replace(/\r\n/g, "\n").trim();
  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const bodyHtml = paragraphs
    .map((block) => {
      const withBreaks = escapeHtml(block).replace(/\n/g, "<br/>");
      const withLinks = withBreaks.replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" style="color:#111">$1</a>'
      );
      return `<p style="margin:0 0 16px">${withLinks}</p>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
${bodyHtml}
${footerHtml}
</td></tr>
</table>
</td></tr>
</table>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: adminCorsHeaders });
  }

  try {
    const authResult = await requireStaff(req);
    if (authResult instanceof Response) return authResult;
    const { adminClient, userId } = authResult;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "RESEND_API_KEY absente. Posez la clé dans les secrets Edge, puis réessayez.",
        }),
        { status: 409, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const to = typeof body?.to === "string" ? body.to.trim() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const bodyText = typeof body?.bodyText === "string" ? body.bodyText : "";
    const recipientName =
      typeof body?.recipientName === "string" ? body.recipientName.trim() : null;
    const studentId = typeof body?.studentId === "string" ? body.studentId : null;
    const inscriptionId =
      typeof body?.inscriptionId === "string" ? body.inscriptionId : null;
    const templateSlugRaw =
      typeof body?.templateSlug === "string" ? body.templateSlug.trim() : DEFAULT_TEMPLATE_SLUG;
    const templateSlug = ALLOWED_TEMPLATE_SLUGS.has(templateSlugRaw)
      ? templateSlugRaw
      : DEFAULT_TEMPLATE_SLUG;

    const ccRaw = Array.isArray(body?.cc) ? body.cc : [];
    const cc = ccRaw
      .filter((v: unknown): v is string => typeof v === "string")
      .map((v: string) => v.trim())
      .filter((v: string) => EMAIL_RE.test(v) && !isFliPlaceholderEmail(v));

    type AttachmentIn = { filename?: unknown; content?: unknown };
    const attachmentsIn: AttachmentIn[] = Array.isArray(body?.attachments)
      ? body.attachments
      : [];
    if (attachmentsIn.length > MAX_ATTACHMENTS) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Trop de pièces jointes (max ${MAX_ATTACHMENTS})`,
        }),
        { status: 400, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
      );
    }
    const attachments: Array<{ filename: string; content: string }> = [];
    for (const att of attachmentsIn) {
      const filename = typeof att?.filename === "string" ? att.filename.trim() : "";
      const content = typeof att?.content === "string" ? att.content.replace(/\s+/g, "") : "";
      if (!filename || !/^[A-Za-z0-9._ -]+\.pdf$/i.test(filename)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Nom de pièce jointe PDF invalide",
          }),
          { status: 400, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!content || !/^[A-Za-z0-9+/=]+$/.test(content)) {
        return new Response(
          JSON.stringify({ success: false, error: "Contenu PJ base64 invalide" }),
          { status: 400, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Approximation taille décodée
      const approxBytes = Math.floor((content.length * 3) / 4);
      if (approxBytes > MAX_ATTACHMENT_BYTES) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Pièce jointe trop volumineuse : ${filename}`,
          }),
          { status: 400, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
        );
      }
      attachments.push({ filename, content });
    }

    if (!to || !EMAIL_RE.test(to) || isFliPlaceholderEmail(to)) {
      return new Response(
        JSON.stringify({ success: false, error: "Destinataire e-mail invalide" }),
        { status: 400, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!subject) {
      return new Response(
        JSON.stringify({ success: false, error: "Sujet obligatoire" }),
        { status: 400, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!bodyText.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Message obligatoire" }),
        { status: 400, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (subject.length > 200 || bodyText.length > 20000) {
      return new Response(
        JSON.stringify({ success: false, error: "Sujet ou message trop long" }),
        { status: 400, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
      );
    }

    const identity = await loadOrganizationIdentity(adminClient);
    const footerHtml = buildFliFooterHtml(identity);
    const html = plainTextToEmailHtml(bodyText, footerHtml);

    const send = await sendFliEmail({
      resendApiKey,
      to,
      subject,
      html,
      cc: cc.length ? cc : undefined,
      attachments: attachments.length ? attachments : undefined,
    });

    await adminClient.from("email_log").insert({
      template_slug: templateSlug,
      recipient_email: to,
      recipient_name: recipientName,
      status: send.ok ? "sent" : "failed",
      error_message: send.error ?? null,
      inscription_id: inscriptionId,
      variables_used: {
        staff_manual: templateSlug === DEFAULT_TEMPLATE_SLUG,
        formateur_mise_en_relation: templateSlug === "formateur_mise_en_relation",
        student_id: studentId,
        sent_by: userId,
        subject,
        body_preview: bodyText.slice(0, 500),
        cc,
        attachments: attachments.map((a) => a.filename),
      },
    });

    if (!send.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: send.error || "Échec d'envoi Resend",
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
          subject,
          cc,
          attachments: attachments.map((a) => a.filename),
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
      { status: 500, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
    );
  }
});
