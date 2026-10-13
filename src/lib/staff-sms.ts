/**
 * Composition SMS manuels staff → stagiaire (fiche / liste).
 * L'envoi réel passe par l'edge `send-staff-sms` (Brevo).
 */

export const BREVO_SMS_SENDER = "FLI";
export const STAFF_SMS_EDGE = "send-staff-sms";

export const STAFF_SMS_SLUGS = {
  mailCheck: "staff_sms_mail_check",
  payment: "staff_sms_payment",
  custom: "staff_sms_manual",
} as const;

export type StaffSmsTemplateId = keyof typeof STAFF_SMS_SLUGS;

/** Lien acompte 150 € (même Payment Link que les relances e-mail). */
export const FLI_DEPOSIT_PAYMENT_LINK =
  "https://buy.stripe.com/5kAdTe76x17Q34c145";

const MAX_SMS_CONTENT = 600;

/**
 * Normalise un téléphone FR / E.164 pour Brevo.
 * Retourne null si le numéro n'est pas utilisable.
 */
export function normalizePhoneForSms(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.trim().replace(/[\s.()-]/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) {
    digits = `+${digits.slice(2)}`;
  }

  if (digits.startsWith("+")) {
    const rest = digits.slice(1).replace(/\D/g, "");
    if (rest.length < 8 || rest.length > 15) return null;
    return `+${rest}`;
  }

  const only = digits.replace(/\D/g, "");
  if (only.length === 10 && only.startsWith("0")) {
    return `+33${only.slice(1)}`;
  }
  if (only.length === 9 && !only.startsWith("0")) {
    // Mobile FR sans le 0 initial (ex. 612345678)
    return `+33${only}`;
  }
  if (only.length >= 8 && only.length <= 15) {
    return `+${only}`;
  }
  return null;
}

export function canSendStaffSms(params: {
  to: string | null | undefined;
  content: string;
}): boolean {
  const phone = normalizePhoneForSms(params.to ?? "");
  const text = params.content.trim();
  return Boolean(phone) && text.length > 0 && text.length <= MAX_SMS_CONTENT;
}

export function smsCharCount(content: string): number {
  return content.trim().length;
}

export type StaffSmsTemplateContext = {
  firstName: string;
  paymentLink?: string;
};

export function buildStaffSmsTemplate(
  templateId: StaffSmsTemplateId,
  ctx: StaffSmsTemplateContext
): { content: string; slug: string; label: string } {
  const prenom = (ctx.firstName || "").trim() || "bonjour";
  const link = (ctx.paymentLink || FLI_DEPOSIT_PAYMENT_LINK).trim();

  if (templateId === "mailCheck") {
    return {
      slug: STAFF_SMS_SLUGS.mailCheck,
      label: "Mail reçu / spam",
      content: `Bonjour ${prenom}, avez-vous bien reçu notre e-mail FLI ? Merci de vérifier aussi vos spams. Aide : 04 79 28 21 09 — FLI`,
    };
  }
  if (templateId === "payment") {
    return {
      slug: STAFF_SMS_SLUGS.payment,
      label: "Acompte 150 €",
      content: `Bonjour ${prenom}, votre acompte de 150€ FLI est en attente. Paiement sécurisé : ${link} — FLI 04 79 28 21 09`,
    };
  }
  return {
    slug: STAFF_SMS_SLUGS.custom,
    label: "Message libre",
    content: `Bonjour ${prenom}, `,
  };
}

export const STAFF_SMS_TEMPLATE_OPTIONS: Array<{
  id: StaffSmsTemplateId;
  label: string;
}> = [
  { id: "mailCheck", label: "Mail reçu / spam" },
  { id: "payment", label: "Acompte 150 €" },
  { id: "custom", label: "Message libre" },
];

export { MAX_SMS_CONTENT };
