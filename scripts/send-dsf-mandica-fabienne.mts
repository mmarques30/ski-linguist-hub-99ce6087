/**
 * Envoi DSF Steven Mandica → Fabienne Rozier (validé Paula 2026-10-14).
 * PJ : résultat PDF + Word, tableau niveaux, facture à régler, contrat.
 * BCC info@fli.fr. SEND=1 pour envoyer.
 *
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-dsf-mandica-fabienne.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "/opt/cursor/artifacts/mollard-oct-2026/dsf-mandica";
const BCC = "info@fli.fr";
const TO = "f.rozier@domaines-skiables.fr";
const SUBJECT =
  "Résultat test anglais Steven Mandica (TPH Salève) + facture 26-27.14335";
const INVOICE_ID = "b07fffc8-dc3d-4e57-8ead-3ba9ac5a069b";
const INVOICE_NUMBER = "26-27.14335";

const ATTACHMENTS = [
  "evaluation-Steven-Mandica-anglais-DSF.pdf",
  "evaluation-Steven-Mandica-anglais-DSF.docx",
  "tableau-niveaux-DSF-Saleve-08-10-2026.docx",
  "Facture-26-27.14335-DSF-Mandica.pdf",
  "Contrat-26-338-TPH-Saleve.pdf",
] as const;

const BODY_TEXT = `Bonjour Fabienne,

voici le résultat du test d'anglais de Steven Mandica (Téléphérique du Salève), passé le 08/10/2026 — niveau B2+ (opérationnel).

C'est le premier résultat que je t'envoie depuis notre nouveau système de gestion. Les e-mails partent aussi de façon automatique : comme on est en phase de test, il peut y avoir quelques coquilles. N'hésite pas à revenir vers moi s'il y a des modifications à apporter.

Je joins :
- le résultat en PDF (mise en page modèle DSF) ;
- le même document en Word modifiable ;
- le tableau des niveaux de la session ;
- la facture n° 26-27.14335 (42 € HT / 50,40 € TTC) à régler — échéance 30/11/2026 ;
- pour mémoire, le contrat de prestation n° 26 338.

Coordonnées bancaires FLI sur la facture (réf. à indiquer : 26-27.14335 / Contrat 26 338).

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
      bytes: bytes.length,
    });
  }

  const draft = {
    to: TO,
    cc: [],
    bcc: BCC,
    subject: SUBJECT,
    invoice_id: INVOICE_ID,
    invoice_number: INVOICE_NUMBER,
    attachments: attachments.map((a) => ({
      filename: a.filename,
      bytes: a.bytes,
    })),
    body_text: BODY_TEXT,
    dry_run: !doSend,
    prepared_at: new Date().toISOString(),
  };
  await writeFile(join(OUT, "send-fabienne-draft.json"), JSON.stringify(draft, null, 2));

  if (!doSend) {
    console.log("DRY_RUN — aucun envoi. Relancer avec SEND=1");
    console.log(JSON.stringify(draft.attachments, null, 2));
    return;
  }
  if (!apiKey) throw new Error("RESEND_API_KEY absente");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "FLI-Formation/dsf-mandica-fabienne",
    },
    body: JSON.stringify({
      from: "FLI — France Langues International <noreply@fli.fr>",
      to: [TO],
      bcc: [BCC],
      reply_to: ["info@fli.fr"],
      subject: SUBJECT,
      text: BODY_TEXT,
      html: textToHtml(BODY_TEXT),
      attachments: attachments.map(({ filename, content }) => ({
        filename,
        content,
      })),
    }),
  });

  const text = await response.text();
  await writeFile(join(OUT, "send-fabienne-resend.json"), text);
  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${text}`);
  }

  let resendId: string | null = null;
  try {
    resendId = JSON.parse(text)?.id ?? null;
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
  await writeFile(join(OUT, "send-fabienne-sent.json"), JSON.stringify(sent, null, 2));

  const draftMeta = JSON.parse(await readFile(join(OUT, "email-draft-fabienne.json"), "utf8"));
  draftMeta.send = true;
  draftMeta.awaiting_paula_validation = false;
  draftMeta.sent_at = sent.sent_at;
  draftMeta.resend_id = resendId;
  draftMeta.invoice_status = "sent";
  await writeFile(join(OUT, "email-draft-fabienne.json"), JSON.stringify(draftMeta, null, 2));

  const packMeta = JSON.parse(await readFile(join(OUT, "pack-meta.json"), "utf8"));
  packMeta.send = true;
  packMeta.invoice_status = "sent";
  packMeta.resend_id = resendId;
  packMeta.sent_at = sent.sent_at;
  await writeFile(join(OUT, "pack-meta.json"), JSON.stringify(packMeta, null, 2));

  console.log(`ENVOYE Fabienne ${resendId}`);
  console.log(`INVOICE_UPDATE_NEEDED ${INVOICE_ID} → sent`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
