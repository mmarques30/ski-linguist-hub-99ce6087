/**
 * Iban Escala — test espagnol 17/11 18h :
 *  1) lien paiement 45 € + RIB au candidat
 *  2) brief à Erika (évaluatrice)
 *
 *   Dry-run : ./node_modules/.bin/tsx scripts/send-escala-espagnol-payment-erika.mts
 *   Envoi   : SEND=1 ./node_modules/.bin/tsx scripts/send-escala-espagnol-payment-erika.mts
 *
 * Validation Paula 17/11/2026 (« envoyer un mail avec le lien… et un mail à Erika »).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  FLI_BANK_DETAILS,
  buildPaymentLinkWithBankDetailsEmailHtml,
} from "../src/lib/registration-payments.ts";

const OUT = "/opt/cursor/artifacts/iban-escala-espagnol-17nov";
const BCC = "info@fli.fr";
const CHECKOUT_URL = "https://buy.stripe.com/3cI7sNdlL9oh1Ly3fsfYY08"; // bit.ly/FLIPay45
const MEET = "https://meet.google.com/nhf-hacg-pki";
const REF = "Test espagnol Iban Escala — 17/11/2026";

type Mail = {
  key: string;
  to: string;
  cc: string[];
  subject: string;
  html: string;
  text: string;
};

function shell(inner: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
${inner}
<p style="margin:0 0 4px">Cordialement,</p>
<p style="margin:0">
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>
</td></tr>
</table>
</td></tr>
</table>`;
}

function paymentMail(): Mail {
  const paymentBlock = buildPaymentLinkWithBankDetailsEmailHtml({
    checkoutUrl: CHECKOUT_URL,
    amountLabel: "45 €",
    reference: REF,
    onlineIntroHtml:
      "Pour régler les <strong>45&nbsp;€</strong> en ligne (carte), utilisez ce lien sécurisé&nbsp;:",
  });
  const html = shell(`
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">votre test d'espagnol avec Erika est prévu aujourd'hui <strong>mardi 17 novembre à 18h</strong> (durée ~30&nbsp;min).</p>
<p style="margin:0 0 16px">Lien Google Meet&nbsp;: <a href="${MEET}">${MEET}</a></p>
<p style="margin:0 0 16px">Le tarif du test est de <strong>45&nbsp;€ TTC</strong>. Merci de procéder au règlement avant le test (ou dès que possible)&nbsp;:</p>
${paymentBlock}
<p style="margin:0 0 16px">Merci de vous munir de votre carte syndicale (52532).</p>
`);
  const text = `Bonjour,

votre test d'espagnol avec Erika est prévu aujourd'hui mardi 17 novembre à 18h (durée ~30 min).

Lien Google Meet : ${MEET}

Le tarif du test est de 45 € TTC. Merci de procéder au règlement avant le test (ou dès que possible) :

Paiement en ligne (carte) :
${CHECKOUT_URL}

Ou par virement :
Bénéficiaire : ${FLI_BANK_DETAILS.beneficiary}
IBAN : ${FLI_BANK_DETAILS.iban}
BIC : ${FLI_BANK_DETAILS.bic}
Banque : ${FLI_BANK_DETAILS.bank}
Référence à indiquer : ${REF}

Merci de vous munir de votre carte syndicale (52532).

Cordialement,
FLI — France Langues International
25 avenue de la Gare
73800 Montmélian
Tél. : 04 79 28 21 09
info@fli.fr`;
  return {
    key: "iban-escala-payment",
    to: "iban.escala@orange.fr",
    cc: [],
    subject: "Paiement 45 € + lien Meet — test d'espagnol (17/11 à 18h)",
    html,
    text,
  };
}

function erikaMail(): Mail {
  const html = shell(`
<p style="margin:0 0 16px">Bonjour Erika,</p>
<p style="margin:0 0 16px">petit rappel pour le test d'espagnol de cet après-midi.</p>
<p style="margin:0 0 8px"><strong>Candidat :</strong> Iban Escala</p>
<p style="margin:0 0 8px"><strong>École :</strong> ESF Aime La Plagne</p>
<p style="margin:0 0 8px"><strong>Carte syndicale :</strong> 52532</p>
<p style="margin:0 0 8px"><strong>E-mail :</strong> iban.escala@orange.fr</p>
<p style="margin:0 0 8px"><strong>Tél. :</strong> 06 65 95 49 46</p>
<p style="margin:0 0 8px"><strong>Quand :</strong> mardi 17 novembre à 18h (30 min)</p>
<p style="margin:0 0 16px"><strong>Meet :</strong> <a href="${MEET}">${MEET}</a></p>
<p style="margin:0 0 16px">L'invitation Agenda est déjà partie (toi + candidat + tests@fli.fr). Le candidat reçoit aussi le lien de paiement 45&nbsp;€.</p>
<p style="margin:0 0 16px">Merci !</p>
`);
  const text = `Bonjour Erika,

petit rappel pour le test d'espagnol de cet après-midi.

Candidat : Iban Escala
École : ESF Aime La Plagne
Carte syndicale : 52532
E-mail : iban.escala@orange.fr
Tél. : 06 65 95 49 46
Quand : mardi 17 novembre à 18h (30 min)
Meet : ${MEET}

L'invitation Agenda est déjà partie (toi + candidat + tests@fli.fr). Le candidat reçoit aussi le lien de paiement 45 €.

Merci !

Cordialement,
FLI — France Langues International
25 avenue de la Gare
73800 Montmélian
Tél. : 04 79 28 21 09
info@fli.fr`;
  return {
    key: "erika-escala-brief",
    to: "erikamabelcadena@gmail.com",
    cc: ["tests@fli.fr"],
    subject: "Test espagnol Iban Escala — aujourd'hui 18h",
    html,
    text,
  };
}

async function main() {
  const doSend = process.env.SEND === "1";
  await mkdir(join(OUT, "sent"), { recursive: true });
  const apiKey = process.env.RESEND_API_KEY;
  if (doSend && !apiKey) throw new Error("RESEND_API_KEY absente");

  const mails = [paymentMail(), erikaMail()];
  const results: Array<Record<string, unknown>> = [];

  for (const mail of mails) {
    const draft = {
      key: mail.key,
      to: mail.to,
      cc: mail.cc,
      bcc: BCC,
      subject: mail.subject,
      dry_run: !doSend,
    };
    await writeFile(
      join(OUT, "sent", `${mail.key}-draft.json`),
      JSON.stringify({ ...draft, body_text: mail.text }, null, 2)
    );
    await writeFile(join(OUT, "sent", `${mail.key}-draft.md`), mail.text);

    if (!doSend) {
      console.log(`DRY ${mail.key} → ${mail.to} cc=${mail.cc.join(",") || "—"}`);
      results.push(draft);
      continue;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "FLI-Formation/escala-espagnol-payment-erika",
      },
      body: JSON.stringify({
        from: "FLI — France Langues International <noreply@fli.fr>",
        to: [mail.to],
        ...(mail.cc.length ? { cc: mail.cc } : {}),
        bcc: [BCC],
        reply_to: ["info@fli.fr"],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    });
    const text = await response.text();
    await writeFile(join(OUT, "sent", `${mail.key}-resend.json`), text);
    if (!response.ok) {
      throw new Error(`${mail.key} Resend ${response.status}: ${text}`);
    }
    const resendId = JSON.parse(text)?.id ?? null;
    const sent = {
      ...draft,
      dry_run: false,
      sent_at: new Date().toISOString(),
      resend_id: resendId,
    };
    await writeFile(
      join(OUT, "sent", `${mail.key}-sent.json`),
      JSON.stringify(sent, null, 2)
    );
    results.push(sent);
    console.log(`ENVOYE ${mail.key} ${resendId}`);
  }

  await writeFile(
    join(OUT, "sent", "summary.json"),
    JSON.stringify({ count: results.length, dry_run: !doSend, results }, null, 2)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
