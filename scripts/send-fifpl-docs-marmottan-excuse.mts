/**
 * Dossier FIF-PL corrigé + excuses pour Barbara Marmottan (FLI-260041).
 * Acompte 150 € déjà réglé par Stripe ; solde 750 € par chèque à FLI Montmélian.
 *
 *   ./node_modules/.bin/tsx scripts/send-fifpl-docs-marmottan-excuse.mts
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-fifpl-docs-marmottan-excuse.mts
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

const TO = "barbaramarmottan@gmail.com";
const BCC = "info@fli.fr";
const SUBJECT =
  "Vos documents de formation Portugais (FIF-PL) — FLI-260041 — avec nos excuses";

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
  code: "FLI-260041",
  language: "Portugais",
  start_date: "2026-11-23",
  end_date: "2026-11-27",
  duration_hours: 24,
  course_location: "ESF Val d'Isère",
  modality: "presentiel",
  price: 900,
  deposit_amount: 150,
  balance_after_deposit: 750,
  group_size: 1,
  funding_organization: "FIFPL",
  payment_method: "stripe_deposit_cheque",
  student: {
    civility: null as string | null,
    first_name: "Barbara",
    last_name: "Marmottan",
    street_address: "144 route des Moulins",
    postal_code: "73640",
    city: "Sainte-Foy",
    email: "barbaramarmottan@gmail.com",
    phone: "+33670568664",
    company: "ESF Val d'Isère",
  },
};

function emailHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8"><tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour Barbara Marmottan,</p>
<p style="margin:0 0 16px"><strong>Nous vous prions de nous excuser</strong> : les documents envoyés précédemment ne précisaient pas correctement les modalités de règlement après votre acompte.</p>
<p style="margin:0 0 16px">Vous trouverez en pièces jointes votre <strong>dossier FIF-PL corrigé</strong> pour la formation Portugais à Val d'Isère (inscription FLI-260041)&nbsp;:</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="margin:0 0 6px">Convention de formation — à nous retourner signée</li>
<li style="margin:0 0 6px">Programme de la formation</li>
<li style="margin:0 0 6px">Critères de prise en charge FIF-PL</li>
<li style="margin:0 0 6px">Tutoriel pour la demande de prise en charge FIF-PL</li>
</ul>
<p style="margin:0 0 16px"><strong>Règlement</strong> (coût pédagogique total 900&nbsp;€)&nbsp;:</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="margin:0 0 6px">Acompte / frais de dossier&nbsp;: <strong>150&nbsp;€ déjà réglés</strong> par paiement sécurisé en ligne (Stripe) — merci, nous avons bien reçu ce paiement.</li>
<li style="margin:0 0 6px">Solde&nbsp;: <strong>750&nbsp;€ par chèque</strong> à l'ordre de France Langues International, à <strong>envoyer à FLI</strong> — France Langues International, 25 avenue de la Gare, 73800 Montmélian — <strong>avant le début de la formation</strong>.</li>
</ul>
<p style="margin:0 0 16px">Merci d'ignorer la version précédente des documents. Pour nous retourner la convention signée, répondez à ce message avec le fichier en pièce jointe&nbsp;: il arrive directement à info@fli.fr.</p>
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
  `price=${row.price}`,
  `deposit=150 stripe recu`,
  `solde_cheque=750 a envoyer a FLI Montmelian`,
  `paymentTerms=${conventionModel.paymentTermsLabel}`,
  `subject=${SUBJECT}`,
  `to=${TO}`,
  `bcc=${BCC}`,
  `dry_run=${!doSend}`,
].join("\n") + "\n";
writeFileSync(join(outDir, "fli-260041-marmottan-proof.txt"), proof);
writeFileSync(join(outDir, "fli-260041-marmottan-email-draft.html"), emailHtml());

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
writeFileSync(join(outDir, "fli-260041-marmottan-resend-response.json"), text);
if (!response.ok) {
  throw new Error(`Resend ${response.status}: ${text}`);
}
console.log(`ENVOYE ${text}`);
