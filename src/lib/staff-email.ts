/**
 * Composition d'e-mails manuels staff → stagiaire (fiche / liste).
 * L'envoi réel passe par l'edge `send-staff-email` (Resend).
 */

export const STAFF_MANUAL_EMAIL_SLUG = "staff_manual";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Convertit un texte saisi en HTML simple (paragraphes + liens http). */
export function plainTextToEmailHtml(bodyText: string, footerHtml = ""): string {
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

  return `${bodyHtml}${footerHtml}`;
}

export function canSendStaffEmail(params: {
  subject: string;
  bodyText: string;
}): boolean {
  return params.subject.trim().length > 0 && params.bodyText.trim().length > 0;
}
