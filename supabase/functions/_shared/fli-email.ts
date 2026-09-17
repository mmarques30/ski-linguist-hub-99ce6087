/**
 * Expéditeur unique des emails transactionnels FLI (point 8-minimal).
 *
 * Affichage : « FLI — France Langues International »
 * Adresse d'envoi : noreply@fli.fr (domaine à vérifier chez Resend)
 * Réponse : info@fli.fr
 *
 * RESEND_API_KEY n'est pas dans le dépôt. Sans elle, aucun appel réseau
 * n'est tenté : sendFliEmail renvoie { ok: false, skipped: true }.
 */

export const FLI_FROM = "FLI — France Langues International <noreply@fli.fr>";
export const FLI_REPLY_TO = "info@fli.fr";
export const FLI_TEST_RECIPIENT = "info@fli.fr";

export const FLI_FOOTER_HTML = `<p style="margin-top:24px">Cordialement,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>`;

export interface SendFliEmailResult {
  ok: boolean;
  skipped: boolean;
  status?: number;
  error?: string;
}

export interface SendFliEmailInput {
  resendApiKey: string | undefined;
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string }>;
}

/**
 * Substitue {{variable}} (doubles accolades, Option A).
 * Si une variable reste non remplacée, lève une erreur : l'appelant doit
 * journaliser `failed` et ne pas appeler Resend (consignes 17/09/2026).
 */
export function applyEmailTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value ?? "");
  }
  const leftover = rendered.match(/\{\{[a-zA-Z0-9_]+\}\}/g);
  if (leftover?.length) {
    const unique = [...new Set(leftover)];
    throw new Error(`Variables manquantes dans le modèle : ${unique.join(", ")}`);
  }
  return rendered;
}

import {
  FLI_PLACEHOLDER_EMAIL_DOMAIN,
  isFliPlaceholderEmail,
} from "./email-guards.ts";

export async function sendFliEmail(
  input: SendFliEmailInput
): Promise<SendFliEmailResult> {
  if (isFliPlaceholderEmail(input.to)) {
    return {
      ok: false,
      skipped: true,
      error: `Adresse @${FLI_PLACEHOLDER_EMAIL_DOMAIN} exclue de tout envoi.`,
    };
  }

  if (!input.resendApiKey) {
    return {
      ok: false,
      skipped: true,
      error: "RESEND_API_KEY absente — aucun envoi.",
    };
  }

  const body: Record<string, unknown> = {
    from: FLI_FROM,
    to: [input.to],
    reply_to: [FLI_REPLY_TO],
    subject: input.subject,
    html: input.html,
  };
  if (input.attachments?.length) {
    body.attachments = input.attachments;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, skipped: false, status: response.status, error: text };
  }

  return { ok: true, skipped: false, status: response.status };
}
