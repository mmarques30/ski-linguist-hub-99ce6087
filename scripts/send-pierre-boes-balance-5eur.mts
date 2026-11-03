/**
 * Relance solde 5 € — Pierre Boes (40 € déjà réglés / tarif 45 €).
 * CC Prosneige (Sam + Nathan). Lien Stripe + RIB FLI.
 *
 *   Dry-run : ./node_modules/.bin/tsx scripts/send-pierre-boes-balance-5eur.mts
 *   Envoi   : SEND=1 ./node_modules/.bin/tsx scripts/send-pierre-boes-balance-5eur.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  FLI_BANK_DETAILS,
  buildPaymentLinkWithBankDetailsEmailHtml,
} from "../src/lib/registration-payments.ts";

const OUT = "/opt/cursor/artifacts/mollard-oct-batch3";
const BCC = "info@fli.fr";

const TO = "pierre_boes@yahoo.fr";
const CC = ["sam@prosneige.fr", "nathan@prosneige.fr"];
const SUBJECT = "Solde 5 € — test d'anglais (Pierre Boes)";
const CHECKOUT_URL = "https://buy.stripe.com/7sY8wR1D3eIBeykbLYfYY0a";
const REF = "Test anglais Pierre Boes — solde 5 €";

function emailHtml(): string {
  const paymentBlock = buildPaymentLinkWithBankDetailsEmailHtml({
    checkoutUrl: CHECKOUT_URL,
    amountLabel: "5 €",
    reference: REF,
    onlineIntroHtml:
      "Pour régler les <strong>5&nbsp;€</strong> restants en ligne (carte), utilisez ce lien sécurisé&nbsp;:",
  });
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">nous avons bien reçu votre règlement de <strong>40&nbsp;€</strong> pour le test d'anglais. Le tarif est de <strong>45&nbsp;€</strong>&nbsp;: il reste donc un solde de <strong>5&nbsp;€</strong> à régler.</p>
${paymentBlock}
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

function emailText(): string {
  return `Bonjour,

nous avons bien reçu votre règlement de 40 € pour le test d'anglais. Le tarif est de 45 € : il reste donc un solde de 5 € à régler.

Paiement en ligne (carte) :
${CHECKOUT_URL}

Ou par virement :
Bénéficiaire : ${FLI_BANK_DETAILS.beneficiary}
IBAN : ${FLI_BANK_DETAILS.iban}
BIC : ${FLI_BANK_DETAILS.bic}
Banque : ${FLI_BANK_DETAILS.bank}
Référence à indiquer : ${REF}

Cordialement,
FLI — France Langues International
25 avenue de la Gare
73800 Montmélian
Tél. : 04 79 28 21 09
info@fli.fr`;
}

async function main() {
  const doSend = process.env.SEND === "1";
  await mkdir(join(OUT, "sent"), { recursive: true });
  const apiKey = process.env.RESEND_API_KEY;
  if (doSend && !apiKey) throw new Error("RESEND_API_KEY absente");

  const draft = {
    key: "pierre-boes-balance-5eur",
    to: TO,
    cc: CC,
    bcc: BCC,
    subject: SUBJECT,
    checkout_url: CHECKOUT_URL,
    stripe_payment_link: "plink_1UXiBxQBleN6FLtSKAcSJiEE",
    stripe_price: "price_1UXiBxQBleN6FLtS9JeADAPz",
    amount_eur: 5,
    already_paid_eur: 40,
    reference: REF,
    body_text: emailText(),
    dry_run: !doSend,
  };
  await writeFile(
    join(OUT, "sent", "pierre-boes-balance-5eur-draft.json"),
    JSON.stringify(draft, null, 2)
  );
  await writeFile(join(OUT, "sent", "pierre-boes-balance-5eur-draft.md"), `# Brouillon — ${SUBJECT}

**Aucun envoi sans OK Paula.**

- **To :** \`${TO}\`
- **Cc :** \`${CC.join("`, `")}\`
- **Bcc :** \`${BCC}\`
- **Objet :** ${SUBJECT}
- **Stripe :** \`${draft.stripe_payment_link}\` → ${CHECKOUT_URL}

\`\`\`
${emailText()}
\`\`\`
`);

  if (!doSend) {
    console.log("DRY pierre-boes-balance-5eur →", TO, "cc=", CC.join(","));
    console.log(emailText());
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "FLI-Formation/pierre-boes-balance-5eur",
    },
    body: JSON.stringify({
      from: "FLI — France Langues International <noreply@fli.fr>",
      to: [TO],
      cc: CC,
      bcc: [BCC],
      reply_to: ["info@fli.fr"],
      subject: SUBJECT,
      html: emailHtml(),
      text: emailText(),
    }),
  });
  const text = await response.text();
  await writeFile(join(OUT, "sent", "pierre-boes-balance-5eur-resend.json"), text);
  if (!response.ok) throw new Error(`Resend ${response.status}: ${text}`);
  const resendId = JSON.parse(text)?.id ?? null;
  const sent = {
    ...draft,
    dry_run: false,
    sent_at: new Date().toISOString(),
    resend_id: resendId,
  };
  await writeFile(
    join(OUT, "sent", "pierre-boes-balance-5eur-sent.json"),
    JSON.stringify(sent, null, 2)
  );
  console.log("ENVOYE pierre-boes-balance-5eur", resendId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
