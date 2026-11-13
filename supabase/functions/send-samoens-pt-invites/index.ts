/**
 * Campagne ponctuelle Paula 2026-11-13 :
 * Samoëns PT (S21) — 21 mails (hors Nicole), sans BCC info@fli.fr.
 *
 * POST { "confirm": "samoens-pt-2026-11-13-paula" }
 */
import { FLI_FROM, FLI_REPLY_TO } from "../_shared/fli-email.ts";
import { isFliPlaceholderEmail } from "../_shared/email-guards.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CONFIRM = "samoens-pt-2026-11-13-paula";
const SUBJECT =
  "Stage portugais ESF Samoëns — 14–18 décembre 2026 — inscription et test de niveau";
const LINK = "https://www.fli.fr/register?session=S21";

type Invitee = { first: string; last: string; email: string };

/** 21 personnes — Nicole Bottollier exclue (mail à part). */
const RECIPIENTS: Invitee[] = [
  { first: "MICHAEL", last: "BOUVIER", email: "mikbouv@live.fr" },
  { first: "CHRISTINE", last: "CARLES", email: "christinecarles0303@gmail.com" },
  { first: "TANGUY", last: "CHAUSSADE", email: "tanguy.chaussade18@gmail.com" },
  { first: "EMILIE", last: "CRUZ", email: "cruz.emilie.ce@gmail.com" },
  { first: "CAMILLE", last: "DAVERGNE", email: "camilledavergne@icloud.com" },
  { first: "MARION", last: "DAVERGNE", email: "mariondavergne@icloud.com" },
  { first: "ZOE", last: "DEBOIS", email: "zoedebois@gmail.com" },
  { first: "ANNE", last: "DELAHAYE", email: "delahayeanne.2l@gmail.com" },
  { first: "ANOUCK", last: "DUCHOSAL", email: "anouckduchosal@live.com" },
  { first: "ETIENNE", last: "DUCHOSAL", email: "etienne.duchosal@gmail.com" },
  { first: "BENJAMIN", last: "FOURCADE", email: "benfourcade64@hotmail.fr" },
  { first: "Lucie", last: "LEROY", email: "lucileklufts@yahoo.fr" },
  { first: "PASCALE", last: "NARDELLI", email: "elacsap1@hotmail.fr" },
  { first: "HUGO", last: "ORSAT", email: "hugo.orsat7409@gmail.com" },
  { first: "DAVID", last: "PARRAT", email: "david.parrat@gmail.com" },
  { first: "MARION", last: "PEREZ", email: "marionperez.ffs@gmail.com" },
  { first: "OLIVIER", last: "PICONE", email: "olivier.picone@gmail.com" },
  { first: "GREGORY", last: "RICHARD", email: "gregory.richard4@hotmail.fr" },
  { first: "ADRIEN", last: "RIMBAULT", email: "adrien.rimbault@gmail.com" },
  { first: "KATIE", last: "TERRASSON", email: "katterrasson@gmail.com" },
  { first: "XAVIER", last: "VASSAL", email: "xavier.vassal@wanadoo.fr" },
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function titleCaseFirst(first: string): string {
  const t = first.trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function buildBodyText(first: string): string {
  const prenom = titleCaseFirst(first);
  return `Bonjour ${prenom},

Vous êtes inscrit·e sur la liste transmise par l'ESF Samoëns pour le stage de portugais brésilien du 14 au 18 décembre 2026.

Fonctionnement du stage
- L'ESF prend en charge la totalité du stage pour vous.
- Il y aura 3 groupes (horaires provisoires) :
  - 1 groupe débutants — 3 h le matin : 8h00 à 11h00
  - 1 groupe perfectionnement — 2 h : 11h15 à 13h15
  - 1 groupe faux débutants — 3 h l'après-midi : 14h30 à 17h30

Pour constituer ces groupes, nous avons besoin que chaque stagiaire :
1. remplisse le formulaire avec ses coordonnées ;
2. réalise le test de positionnement (et indique ses attentes).

Aucune étape de paiement n'apparaît dans ce formulaire.

Lien d'inscription (réservé à votre adresse e-mail) :
${LINK}

Dès que nous aurons assez de réponses pour une vue claire des niveaux, vous recevrez les informations sur les groupes et horaires.

Pour toute question : info@fli.fr

Cordialement,
France Langues International`;
}

function plainTextToEmailHtml(bodyText: string): string {
  const paragraphs = bodyText
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const bodyHtml = paragraphs
    .map((block) => {
      let withBreaks = escapeHtml(block).replace(/\n/g, "<br/>");
      withBreaks = withBreaks.replace(
        escapeHtml(LINK),
        `<a href="${LINK}" style="color:#111">${escapeHtml(LINK)}</a>`,
      );
      return `<p style="margin:0 0 16px">${withBreaks}</p>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
${bodyHtml}
</td></tr>
</table>
</td></tr>
</table>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== CONFIRM) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Confirmation invalide — aucun envoi.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY absente" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const dryRun = body?.dryRun === true;
    const onlyRaw = Array.isArray(body?.onlyEmails) ? body.onlyEmails : null;
    const onlyEmails = onlyRaw
      ? new Set(
          onlyRaw
            .filter((v: unknown): v is string => typeof v === "string")
            .map((v: string) => v.trim().toLowerCase())
            .filter(Boolean),
        )
      : null;
    const recipients = onlyEmails
      ? RECIPIENTS.filter((p) => onlyEmails.has(p.email.toLowerCase()))
      : RECIPIENTS;
    const results: Array<Record<string, unknown>> = [];

    for (let i = 0; i < recipients.length; i++) {
      const person = recipients[i];
      if (isFliPlaceholderEmail(person.email)) {
        results.push({
          email: person.email,
          name: `${person.first} ${person.last}`,
          ok: false,
          error: "placeholder exclu",
        });
        continue;
      }

      const html = plainTextToEmailHtml(buildBodyText(person.first));
      if (dryRun) {
        results.push({
          email: person.email,
          name: `${person.first} ${person.last}`,
          ok: true,
          dryRun: true,
        });
        continue;
      }

      // Appel Resend direct : pas de BCC (demande Paula), id Resend pour journal chat.
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FLI_FROM,
          to: [person.email],
          reply_to: [FLI_REPLY_TO],
          subject: SUBJECT,
          html,
        }),
      });

      const text = await response.text();
      let parsed: { id?: string } = {};
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = {};
      }

      results.push({
        email: person.email,
        name: `${person.first} ${person.last}`,
        ok: response.ok,
        resendId: parsed.id ?? null,
        status: response.status,
        error: response.ok ? null : text.slice(0, 500),
      });

      // Resend : max ~10 req/s — pause entre chaque envoi.
      if (i < recipients.length - 1) {
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    const sent = results.filter((r) => r.ok).length;
    return new Response(
      JSON.stringify({
        success: sent === recipients.length,
        sent,
        total: recipients.length,
        skipNotifyBcc: true,
        nicoleExcluded: true,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
