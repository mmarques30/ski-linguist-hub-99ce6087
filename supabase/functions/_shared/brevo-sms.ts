/**
 * Envoi SMS transactionnel via Brevo.
 * Clé : BREVO_API_KEY (secrets Edge). Sender alphanumérique max 11 car. : FLI.
 *
 * Doc : POST https://api.brevo.com/v3/transactionalSMS/send
 * Ne pas inclure de code STOP (sinon Brevo bascule en marketing).
 */

export const BREVO_SMS_SENDER = "FLI";
export const BREVO_SMS_API_URL = "https://api.brevo.com/v3/transactionalSMS/send";

export interface SendBrevoSmsInput {
  apiKey: string | undefined;
  recipient: string;
  content: string;
  sender?: string;
  tag?: string;
}

export interface SendBrevoSmsResult {
  ok: boolean;
  skipped: boolean;
  status?: number;
  messageId?: string | number;
  error?: string;
}

/** Même normalisation que `src/lib/staff-sms.ts` (garder aligné). */
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

export async function sendBrevoSms(
  input: SendBrevoSmsInput
): Promise<SendBrevoSmsResult> {
  if (!input.apiKey) {
    return {
      ok: false,
      skipped: true,
      error: "BREVO_API_KEY absente — aucun envoi.",
    };
  }

  const recipient = normalizePhoneForSms(input.recipient);
  if (!recipient) {
    return {
      ok: false,
      skipped: true,
      error: "Numéro de téléphone invalide.",
    };
  }

  const content = input.content.trim();
  if (!content) {
    return {
      ok: false,
      skipped: true,
      error: "Message SMS vide.",
    };
  }

  const sender = (input.sender || BREVO_SMS_SENDER).trim() || BREVO_SMS_SENDER;
  const body: Record<string, unknown> = {
    sender,
    recipient,
    content,
    type: "transactional",
  };
  if (input.tag) body.tag = input.tag;

  const response = await fetch(BREVO_SMS_API_URL, {
    method: "POST",
    headers: {
      "api-key": input.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: { messageId?: string | number; message?: string } = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = {};
  }

  if (!response.ok) {
    return {
      ok: false,
      skipped: false,
      status: response.status,
      error: parsed.message || text || `Brevo HTTP ${response.status}`,
    };
  }

  return {
    ok: true,
    skipped: false,
    status: response.status,
    messageId: parsed.messageId,
  };
}
