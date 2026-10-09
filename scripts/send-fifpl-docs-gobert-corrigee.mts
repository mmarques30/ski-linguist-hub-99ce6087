/**
 * Convention + programme corrigés pour Maud Gobert (FLI-260039) — La Rosière 40 h / 1 500 €.
 * Part moniteur : chèque FIF-PL 300 € ; prise en charge ESF : 1 200 €.
 *
 *   npx tsx scripts/send-fifpl-docs-gobert-corrigee.mts          # dry-run
 *   SEND=1 npx tsx scripts/send-fifpl-docs-gobert-corrigee.mts   # envoi Resend
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildConventionPdfModel,
  buildProgrammePdfModel,
  conventionFilename,
  programmeFilename,
} from "../src/lib/inscription-documents-pdf.ts";
import { renderInscriptionDocumentPdf } from "../src/lib/inscription-documents-pdf-render.ts";
import { INSCRIPTION_DOCUMENT_ASSET_FILES } from "../src/lib/inscription-documents-assets.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = "/opt/cursor/artifacts";
const doSend = process.env.SEND === "1";
const apiKey = process.env.RESEND_API_KEY;

const TO = "gobert-maud@orange.fr";
const BCC = "info@fli.fr";
const SUBJECT =
  "Votre dossier de formation Portugais (FIF-PL) corrigé — FLI-260039";

const letterheadPng = new Uint8Array(
  readFileSync(
    join(root, "public/inscription-documents", INSCRIPTION_DOCUMENT_ASSET_FILES.letterhead),
  ),
);
const organismSignaturePng = new Uint8Array(
  readFileSync(
    join(
      root,
      "public/inscription-documents",
      INSCRIPTION_DOCUMENT_ASSET_FILES.organismSignature,
    ),
  ),
);

const row = {
  code: "FLI-260039",
  language: "Portugais",
  start_date: "2026-11-30",
  end_date: "2026-12-11",
  duration_hours: 40,
  course_location: "ESF La Rosière",
  modality: "presentiel",
  price: 1500,
  deposit_amount: null as number | null,
  balance_after_deposit: 300,
  group_size: 8,
  funding_organization: "FIFPL",
  payment_method: "cheque_fifpl_ecole",
  student: {
    civility: null as string | null,
    first_name: "MAUD",
    last_name: "GOBERT",
    street_address: "19, rue de la météo",
    postal_code: "73700",
    city: "Bourg-Saint-Maurice",
    email: "gobert-maud@orange.fr",
    phone: "+33661238259",
    company: "ESF La Rosière",
  },
};

function emailHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8"><tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour MAUD GOBERT,</p>
<p style="margin:0 0 16px">Suite à une erreur sur les montants de votre convention, vous trouverez en pièces jointes votre <strong>dossier FIF-PL corrigé</strong> pour la formation Portugais (inscription FLI-260039)&nbsp;:</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="margin:0 0 6px">Convention de formation — à nous retourner signée</li>
<li style="margin:0 0 6px">Programme de la formation</li>
<li style="margin:0 0 6px">Critères de prise en charge FIF-PL</li>
<li style="margin:0 0 6px">Tutoriel pour la demande de prise en charge FIF-PL</li>
</ul>
<p style="margin:0 0 16px"><strong>Montants corrigés</strong> (coût pédagogique total 1&nbsp;500&nbsp;€)&nbsp;:</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="margin:0 0 6px">Votre part FIF-PL&nbsp;: <strong>300&nbsp;€</strong> — chèque FIF-PL à l'ordre de France Langues International, à envoyer à&nbsp;: France Langues International — 25 avenue de la Gare, 73800 Montmélian (encaissé après la formation)</li>
<li style="margin:0 0 6px">Prise en charge ESF&nbsp;: <strong>1&nbsp;200&nbsp;€</strong> — facturé à l'ESF (convention école)</li>
</ul>
<p style="margin:0 0 16px">Merci d'ignorer la version précédente de la convention. Pensez à faire votre demande de prise en charge avant le début de la formation. Sans elle, le FIF-PL ne rembourse pas.</p>
<p style="margin:0 0 16px">Pour nous retourner la convention signée, répondez à ce message avec le document en pièce jointe&nbsp;: il arrive directement à info@fli.fr.</p>
<p style="margin:24px 0 0">Cordialement,<br/>L'équipe FLI</p>
</td></tr></table></td></tr></table>`;
}

mkdirSync(outDir, { recursive: true });

const conventionModel = buildConventionPdfModel({
  inscription: row,
  student: row.student,
  identity: null,
});
const programmeModel = buildProgrammePdfModel({
  inscription: row,
  student: row.student,
  identity: null,
});

const conventionBytes = await renderInscriptionDocumentPdf(conventionModel, {
  organismSignaturePng,
  letterheadPng,
});
const programmeBytes = await renderInscriptionDocumentPdf(programmeModel, {
  letterheadPng,
});

const cName = conventionFilename(row.code);
const pName = programmeFilename(row.code);
writeFileSync(join(outDir, cName), conventionBytes);
writeFileSync(join(outDir, pName), programmeBytes);

const staticDocs = [
  {
    src: "public/registration-documents/criteres-prise-en-charge-2026.pdf",
    dest: "Criteres de prise en charge Moniteurs de ski 2026.pdf",
  },
  {
    src: "public/registration-documents/tutoriel-fif-pl-fli.pdf",
    dest: "Tutoriel FIF-PL FLI.pdf",
  },
];
for (const doc of staticDocs) {
  copyFileSync(join(root, doc.src), join(outDir, doc.dest));
}

const proof = [
  `code=${row.code}`,
  `duration=${row.duration_hours}`,
  `price=${row.price}`,
  `cheque_moniteur=300`,
  `facture_esf=1200`,
  `paymentTerms=${conventionModel.paymentTermsLabel}`,
  `convention=${cName} ${conventionBytes.byteLength}`,
  `programme=${pName} ${programmeBytes.byteLength}`,
  `subject=${SUBJECT}`,
  `to=${TO}`,
  `bcc=${BCC}`,
  `dry_run=${!doSend}`,
].join("\n") + "\n";
writeFileSync(join(outDir, "fli-260039-gobert-proof.txt"), proof);
writeFileSync(join(outDir, "fli-260039-gobert-email-draft.html"), emailHtml());

const attachments = [
  { filename: cName, content: Buffer.from(conventionBytes).toString("base64") },
  { filename: pName, content: Buffer.from(programmeBytes).toString("base64") },
  {
    filename: staticDocs[0].dest,
    content: readFileSync(join(outDir, staticDocs[0].dest)).toString("base64"),
  },
  {
    filename: staticDocs[1].dest,
    content: readFileSync(join(outDir, staticDocs[1].dest)).toString("base64"),
  },
];

console.log(
  JSON.stringify(
    {
      ok: true,
      paymentTerms: conventionModel.paymentTermsLabel,
      subject: SUBJECT,
      to: TO,
      bcc: BCC,
      dry_run: !doSend,
      written: [cName, pName, ...staticDocs.map((d) => d.dest)],
    },
    null,
    2,
  ),
);

if (!doSend) {
  console.log("Dry-run : PDF générés, aucun envoi (relancer avec SEND=1).");
  process.exit(0);
}

if (!apiKey) {
  throw new Error("RESEND_API_KEY absente");
}

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: "FLI — France Langues International <noreply@fli.fr>",
    to: [TO],
    bcc: [BCC],
    reply_to: ["info@fli.fr"],
    subject: SUBJECT,
    html: emailHtml(),
    attachments,
  }),
});

const text = await response.text();
writeFileSync(join(outDir, "fli-260039-gobert-resend-response.json"), text);
if (!response.ok) {
  throw new Error(`Resend ${response.status}: ${text}`);
}
console.log(`ENVOYE ${text}`);
