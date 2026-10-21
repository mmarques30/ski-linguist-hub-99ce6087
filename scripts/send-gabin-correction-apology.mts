/**
 * Correction : excuses à Andy Hulot (mauvais destinataire) + renvoi résultat Gabin à l'école.
 *
 *   ./node_modules/.bin/tsx scripts/send-gabin-correction-apology.mts
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-gabin-correction-apology.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "/opt/cursor/artifacts/mollard-oct-batch2/gabin-correction";
const PDF = "/opt/cursor/artifacts/mollard-oct-batch2/pdfs/evaluation-Gabin-Lombardot-anglais-gabin-lombardot.pdf";
const BCC = "info@fli.fr";
const WRONG_TO = "hulotandy@yahoo.com";
const SCHOOL = "administration@esf-saintgervais.com";

function wrapHtml(inner: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
${inner}
</td></tr>
</table>
</td></tr>
</table>`;
}

const apologyHtml = wrapHtml(`
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">nous vous prions de nous excuser : le message précédent contenant un résultat de test de langue vous a été adressé par erreur. Il ne vous était pas destiné.</p>
<p style="margin:0 0 16px">Merci de bien vouloir supprimer ce message et la pièce jointe. Nous avons corrigé notre envoi.</p>
<p style="margin:0 0 16px">Encore toutes nos excuses pour la gêne occasionnée.</p>
<p style="margin:0 0 4px">Cordialement,</p>
<p style="margin:0">
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>`);

const schoolHtml = wrapHtml(`
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat du test d'anglais de <strong>Gabin Lombardot</strong> (B1+).</p>
<p style="margin:0 0 16px">Nous n'avons pas (encore) la bonne adresse e-mail du candidat ; merci de lui transmettre ce document. Un premier envoi est parti par erreur vers une autre adresse — nous avons présenté nos excuses au destinataire concerné.</p>
<p style="margin:0 0 4px">Cordialement,</p>
<p style="margin:0">
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>`);

async function sendResend(opts: {
  apiKey: string;
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string }>;
  tag: string;
}): Promise<{ id: string | null; status: number; body: string }> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "FLI-Formation/gabin-correction-apology",
    },
    body: JSON.stringify({
      from: "FLI — France Langues International <noreply@fli.fr>",
      to: opts.to,
      cc: opts.cc ?? [],
      bcc: [BCC],
      reply_to: ["info@fli.fr"],
      subject: opts.subject,
      html: opts.html,
      attachments: opts.attachments ?? [],
    }),
  });
  const text = await response.text();
  await writeFile(join(OUT, `${opts.tag}-resend.json`), text);
  if (!response.ok) throw new Error(`${opts.tag} Resend ${response.status}: ${text}`);
  let id: string | null = null;
  try {
    id = JSON.parse(text)?.id ?? null;
  } catch {
    /* ignore */
  }
  return { id, status: response.status, body: text };
}

async function main() {
  const doSend = process.env.SEND === "1";
  await mkdir(OUT, { recursive: true });

  const apology = {
    to: WRONG_TO,
    subject: "Nos excuses — message envoyé par erreur",
    html: apologyHtml,
    note: "Sans PJ (ne pas renvoyer le PDF Gabin)",
  };
  const school = {
    to: SCHOOL,
    subject: "Résultat test de langue — Gabin Lombardot (ESF Saint-Gervais) — renvoi",
    pdf: "evaluation-Gabin-Lombardot-anglais-gabin-lombardot.pdf",
  };

  await writeFile(join(OUT, "drafts.json"), JSON.stringify({ apology, school, bcc: BCC }, null, 2));
  console.log("DRAFT apology →", apology.to, apology.subject);
  console.log("DRAFT school  →", school.to, school.subject, "+ PDF");

  if (!doSend) {
    console.log("Dry-run — SEND=1 pour envoyer.");
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY absente");

  const a = await sendResend({
    apiKey,
    to: [WRONG_TO],
    subject: apology.subject,
    html: apologyHtml,
    tag: "apology-hulot",
  });
  console.log("ENVOYE apology", a.id);

  const pdfBytes = await readFile(PDF);
  const s = await sendResend({
    apiKey,
    to: [SCHOOL],
    subject: school.subject,
    html: schoolHtml,
    attachments: [
      {
        filename: school.pdf,
        content: Buffer.from(pdfBytes).toString("base64"),
      },
    ],
    tag: "renvoi-gabin-ecole",
  });
  console.log("ENVOYE school", s.id);

  const summary = {
    apology_resend_id: a.id,
    school_resend_id: s.id,
    wrong_to: WRONG_TO,
    school_to: SCHOOL,
    sent_at: new Date().toISOString(),
  };
  await writeFile(join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
