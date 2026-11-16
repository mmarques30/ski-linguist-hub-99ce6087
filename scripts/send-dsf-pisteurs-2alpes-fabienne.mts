/**
 * Envoi DSF pisteurs 2 Alpes → Fabienne Rozier.
 * PJ : facture + rapport niveaux / appréciation Michèle.
 * BCC info@fli.fr. SEND=1 pour envoyer (après OK Paula).
 *
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-dsf-pisteurs-2alpes-fabienne.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "/opt/cursor/artifacts/dsf-pisteurs-2alpes-nov2026";
const BCC = "info@fli.fr";
const TO = "f.rozier@domaines-skiables.fr";
const SUBJECT =
  "Formation anglais pisteurs Les 2 Alpes (11-13 nov.) — facture 26-27.14344 + rapport niveaux";
const INVOICE_ID = "abe0b619-ac20-473b-8c86-1f431bccc0f3";
const INVOICE_NUMBER = "26-27.14344";

const ATTACHMENTS = [
  "Facture-26-27.14344-DSF-Pisteurs-2Alpes.pdf",
  "Rapport-niveaux-appreciation-DSF-Pisteurs-2Alpes-nov2026.docx",
  "Contrat-26-290-PS1-2ALPES.pdf",
] as const;

const BODY_TEXT = `Bonjour Fabienne,

la formation d'anglais appliqué spécifique pisteurs secouristes aux 2 Alpes (11–13 novembre 2026) est terminée — 12 stagiaires, groupe PS1-2ALPES, animée par Michèle Looten (contrat de prestation n° 26 290).

Je joins :
- la facture n° ${INVOICE_NUMBER} (1 980 € HT / 2 376,00 € TTC) à régler — échéance 16/12/2026 ;
- le rapport de fin de formation : niveaux d'entrée et de sortie, progression, et appréciation de Michèle ;
- pour mémoire, le contrat de prestation n° 26 290.

Coordonnées bancaires FLI sur la facture (réf. à indiquer : ${INVOICE_NUMBER} / Contrat 26 290).

À bientôt,
Paula
FLI — France Langues International
25 avenue de la Gare — 73800 Montmélian
Tél. : 04 79 28 21 09
info@fli.fr`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtml(text: string): string {
  const paragraphs = text.split(/\n\n+/).map((block) => {
    const lines = block.split("\n").map(escapeHtml);
    if (lines.every((l) => l.startsWith("- "))) {
      return `<ul>${lines
        .map((l) => `<li>${l.slice(2)}</li>`)
        .join("")}</ul>`;
    }
    return `<p>${lines.join("<br/>")}</p>`;
  });
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222">${paragraphs.join("")}</div>`;
}

async function main() {
  const doSend = process.env.SEND === "1";
  const apiKey = process.env.RESEND_API_KEY;
  await mkdir(OUT, { recursive: true });

  const attachments = [];
  for (const filename of ATTACHMENTS) {
    const bytes = await readFile(join(OUT, filename));
    attachments.push({
      filename,
      content: Buffer.from(bytes).toString("base64"),
    });
  }

  const draft = {
    to: TO,
    bcc: BCC,
    subject: SUBJECT,
    bodyText: BODY_TEXT,
    attachments: ATTACHMENTS,
    invoiceId: INVOICE_ID,
    invoiceNumber: INVOICE_NUMBER,
  };
  await writeFile(
    join(OUT, "email-draft-fabienne.json"),
    JSON.stringify(draft, null, 2)
  );
  await writeFile(join(OUT, "email-draft-fabienne.txt"), BODY_TEXT);

  if (!doSend) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          message: "Brouillon prêt — aucun envoi. Relancer avec SEND=1 après OK Paula.",
          to: TO,
          bcc: BCC,
          subject: SUBJECT,
          attachments: ATTACHMENTS,
          out: OUT,
        },
        null,
        2
      )
    );
    return;
  }

  if (!apiKey) {
    throw new Error("RESEND_API_KEY manquant");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FLI — France Langues International <noreply@fli.fr>",
      reply_to: "info@fli.fr",
      to: [TO],
      bcc: [BCC],
      subject: SUBJECT,
      text: BODY_TEXT,
      html: textToHtml(BODY_TEXT),
      attachments,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${JSON.stringify(json)}`);
  }

  await writeFile(
    join(OUT, "email-sent.json"),
    JSON.stringify({ ...draft, resend: json, sentAt: new Date().toISOString() }, null, 2)
  );
  console.log(JSON.stringify({ sent: true, resend: json }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
