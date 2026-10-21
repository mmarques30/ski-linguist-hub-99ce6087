/**
 * Petit mail d'explication — IBAN facture corrigé (retour DSF).
 * Destinataires : factures impayées envoyées avec …144.
 *
 *   ./node_modules/.bin/tsx scripts/send-rib-correction-notice.mts
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-rib-correction-notice.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  buildFliBankDetailsEmailHtml,
  FLI_BANK_DETAILS,
} from "../src/lib/registration-payments.ts";

const OUT = "/opt/cursor/artifacts/rib-correction-2026-10-20";
const BCC = "info@fli.fr";
const FROM = "FLI — France Langues International <noreply@fli.fr>";

type Target = {
  key: string;
  to: string[];
  cc?: string[];
  subject: string;
  invoiceNumber: string;
  pdfPath: string;
  pdfFilename: string;
  greeting: string;
};

const TARGETS: Target[] = [
  {
    key: "dsf-mandica",
    to: ["f.rozier@domaines-skiables.fr"],
    subject: "Correction IBAN — facture 26-27.14335",
    invoiceNumber: "26-27.14335",
    pdfPath:
      "/opt/cursor/artifacts/mollard-oct-2026/dsf-mandica/Facture-26-27.14335-DSF-Mandica.pdf",
    pdfFilename: "Facture-26-27.14335-DSF-Mandica.pdf",
    greeting: "Bonjour Fabienne,",
  },
  {
    key: "carroz",
    to: ["admin@esf-lescarroz.com"],
    cc: ["directeur@esf-lescarroz.com"],
    subject: "Correction IBAN — facture 26-27.14327",
    invoiceNumber: "26-27.14327",
    pdfPath:
      "/opt/cursor/artifacts/mollard-oct-2026/carroz-invoice/Facture-26-27.14327.pdf",
    pdfFilename: "Facture-26-27.14327.pdf",
    greeting: "Bonjour,",
  },
];

function bodyText(t: Target): string {
  return `${t.greeting}

petite correction concernant la facture n° ${t.invoiceNumber} : l'IBAN indiqué comportait une erreur (clé RIB).

Merci d'utiliser désormais :
Bénéficiaire : ${FLI_BANK_DETAILS.beneficiary}
IBAN : ${FLI_BANK_DETAILS.iban}
BIC : ${FLI_BANK_DETAILS.bic}
Banque : ${FLI_BANK_DETAILS.bank}
Référence à indiquer : ${t.invoiceNumber}

Je joins la facture corrigée.

Cordialement,
Paula
FLI — France Langues International
25 avenue de la Gare — 73800 Montmélian
Tél. : 04 79 28 21 09
info@fli.fr`;
}

function bodyHtml(t: Target): string {
  const rib = buildFliBankDetailsEmailHtml(t.invoiceNumber);
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#222">
<p style="margin:0 0 14px">${t.greeting}</p>
<p style="margin:0 0 14px">petite correction concernant la facture n° <strong>${t.invoiceNumber}</strong> : l'IBAN indiqué comportait une erreur (clé RIB).</p>
<p style="margin:0 0 14px">Merci d'utiliser désormais&nbsp;:</p>
${rib}
<p style="margin:0 0 14px">Je joins la facture corrigée.</p>
<p style="margin:0 0 4px">Cordialement,</p>
<p style="margin:0">
  Paula<br/>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare — 73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>
</div>`;
}

async function sendOne(t: Target, apiKey: string, doSend: boolean) {
  const pdfBytes = await readFile(t.pdfPath);
  const text = bodyText(t);
  const html = bodyHtml(t);
  const draft = {
    key: t.key,
    to: t.to,
    cc: t.cc ?? [],
    bcc: [BCC],
    subject: t.subject,
    invoice_number: t.invoiceNumber,
    iban: FLI_BANK_DETAILS.iban,
    attachment: t.pdfFilename,
    attachment_bytes: pdfBytes.byteLength,
    body_text: text,
    dry_run: !doSend,
    prepared_at: new Date().toISOString(),
  };
  await writeFile(join(OUT, `${t.key}-draft.json`), JSON.stringify(draft, null, 2));
  await writeFile(join(OUT, `${t.key}-body.txt`), text);
  await writeFile(join(OUT, `${t.key}-body.html`), html);

  if (!doSend) {
    console.log(`DRY_RUN ${t.key} → ${t.to.join(", ")}`);
    return draft;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "FLI-Formation/rib-correction-notice",
    },
    body: JSON.stringify({
      from: FROM,
      to: t.to,
      cc: t.cc?.length ? t.cc : undefined,
      bcc: [BCC],
      reply_to: ["info@fli.fr"],
      subject: t.subject,
      text,
      html,
      attachments: [
        {
          filename: t.pdfFilename,
          content: Buffer.from(pdfBytes).toString("base64"),
        },
      ],
    }),
  });
  const raw = await response.text();
  await writeFile(join(OUT, `${t.key}-resend.json`), raw);
  if (!response.ok) {
    throw new Error(`${t.key} Resend ${response.status}: ${raw}`);
  }
  let resendId: string | null = null;
  try {
    resendId = JSON.parse(raw)?.id ?? null;
  } catch {
    /* ignore */
  }
  const sent = {
    ...draft,
    dry_run: false,
    sent_at: new Date().toISOString(),
    resend_id: resendId,
    resend_status: response.status,
  };
  await writeFile(join(OUT, `${t.key}-sent.json`), JSON.stringify(sent, null, 2));
  console.log(`ENVOYE ${t.key} ${resendId} → ${t.to.join(", ")}`);
  return sent;
}

async function main() {
  const doSend = process.env.SEND === "1";
  const apiKey = process.env.RESEND_API_KEY;
  await mkdir(OUT, { recursive: true });

  if (doSend && !apiKey) throw new Error("RESEND_API_KEY absente");

  const results = [];
  for (const t of TARGETS) {
    results.push(await sendOne(t, apiKey || "", doSend));
  }
  await writeFile(join(OUT, "summary.json"), JSON.stringify(results, null, 2));
  if (!doSend) console.log("Dry-run OK — relancer avec SEND=1.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
