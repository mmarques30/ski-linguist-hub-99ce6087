/**
 * Résultat Mattia Saletta — ESF Val d'Isère — portugais brésilien — 08/10/2026 (Paula).
 * TO candidat · CC contact + direction · BCC info@fli.fr · PJ résultat + facture acquittée.
 * Stripe vérifié : ch_3UPknPQBleN6FLtS0O7A1NCO / pi_3UPknPQBleN6FLtS0fa45E8i — 45 € — 12/10/2026.
 *
 *   ./node_modules/.bin/tsx scripts/send-saletta-valdisere-result.mts
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-saletta-valdisere-result.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  buildEvaluationPdfModel,
  type CecrlScaleRow,
  type EvaluationPdfInput,
  type FliIdentity,
} from "../src/lib/evaluation-pdf.ts";
import {
  EVALUATION_PDF_ASSET_FILES,
  type EvaluationPdfAssets,
} from "../src/lib/evaluation-pdf-assets.ts";
import { renderEvaluationPdf } from "../src/lib/evaluation-pdf-render.ts";

const OUT = "/opt/cursor/artifacts/mollard-oct-2026/saletta-valdisere";
const BCC = "info@fli.fr";
const SCHOOL_CC = ["contact@esfvaldisere.com", "direction@esfvaldisere.com"];
const CANDIDATE_EMAIL = "matti.salez@gmail.com";
const PDF_NAME = "evaluation-Mattia-Saletta-portugais-valdisere.pdf";
const INV_NAME = "Facture-26-27.14336-Saletta-acquittee.pdf";
const INVOICE_NUMBER = "26-27.14336";
const INVOICE_SEQ = 14336;
const STRIPE_CHARGE = "ch_3UPknPQBleN6FLtS0O7A1NCO";
const STRIPE_PI = "pi_3UPknPQBleN6FLtS0fa45E8i";
const PAYMENT_DATE = "2026-10-12";
const INVOICE_DATE = "2026-10-08";

const YELLOW = rgb(252 / 255, 175 / 255, 23 / 255);
const INK = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.35, 0.35, 0.35);
const GREEN = rgb(0.1, 0.45, 0.2);

const FLI = {
  name: "France Langues International",
  address: "25 avenue de la gare",
  city: "73800 Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
  siret: "484 772 041 00048",
  tvaNumber: "FR 44 484772041",
  activity: "82 73 01 366 73",
} as const;

const IDENTITY: FliIdentity = {
  legal_name: "France Langues International",
  address_line: "25 avenue de la Gare",
  postal_code: "73800",
  city: "Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
};

const SCALE: CecrlScaleRow[] = [
  { score: 0, cecrl_label: "A1", base_label: "A1", niveau: 0, description: "Faux débutant / Quelques notions / Eveil" },
  { score: 0.5, cecrl_label: "A1+", base_label: "A1", niveau: 0, description: "Faux débutant / Quelques notions / Eveil" },
  { score: 1, cecrl_label: "A2", base_label: "A2", niveau: 1, description: "Élémentaire / Pré-intermédiaire / Survie" },
  { score: 1.5, cecrl_label: "A2+", base_label: "A2", niveau: 1, description: "Élémentaire / Pré-intermédiaire / Survie" },
  { score: 2, cecrl_label: "B1", base_label: "B1", niveau: 2, description: "Intermédiaire / Autonomie" },
  { score: 2.5, cecrl_label: "B1+", base_label: "B1", niveau: 2, description: "Intermédiaire / Autonomie" },
  { score: 3, cecrl_label: "B2", base_label: "B2", niveau: 3, description: "Post intermédiaire / Opérationnel" },
  { score: 3.5, cecrl_label: "B2+", base_label: "B2", niveau: 3, description: "Post intermédiaire / Opérationnel" },
  { score: 4, cecrl_label: "C1", base_label: "C1", niveau: 4, description: "Perfectionnement / Fluidité / Aisance" },
  { score: 4.5, cecrl_label: "C1+", base_label: "C1", niveau: 4, description: "Perfectionnement / Fluidité / Aisance" },
  { score: 5, cecrl_label: "C2", base_label: "C2", niveau: 5, description: "Maîtrise" },
];

const BLOCS = {
  introduction:
    "Grâce à vos connaissances de diverses langues latines et votre intérêt pour le portugais brésilien, vous arrivez très bien à communiquer. Vous êtes capable d'aborder différents sujets, de vous faire comprendre quand il vous manque du vocabulaire. Bravo !",
  comprehension:
    "Le seul point à améliorer, c'est vraiment les structures de la langue, la grammaire, la conjugaison des verbes dans les différents temps et les accords masculin / féminin. Parfois vous mélangez un peu d'espagnol, un peu d'italien, un peu de français, et vous arrivez à vous faire comprendre.",
  technique:
    "Quelques exemples pendant votre test : pour les enfants, on dit crianças, meninos/meninas pour les enfants en général et filho/filha pour nos enfants. Alba, c'est votre « filha » et pas « niña ». Il faudrait réviser les verbes et leurs conjugaisons : « je sais » se dit « eu sei » et pas « eu sabo ». Révisez bien le vocabulaire du ski aussi : même si on vous comprend, les mots précis peuvent vous aider.",
  conclusion:
    "Continuez à discuter avec les Brésiliens et essayez de regarder des émissions / podcasts. Je vous conseille une chaîne YouTube (humoristique) qui s'appelle Porta dos Fundos : essayez de regarder une vidéo par jour, ça va vous aider à progresser.",
};

function formatFr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function formatEuro(amount: number): string {
  const fixed = amount.toFixed(2).replace(".", ",");
  const [intPart, dec] = fixed.split(",");
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
  return `${withSpaces},${dec}\u00a0€`;
}

async function loadPublic(path: string): Promise<Uint8Array | null> {
  try {
    return new Uint8Array(await readFile(join(process.cwd(), "public", path)));
  } catch {
    return null;
  }
}

async function embedFonts(doc: PDFDocument): Promise<{
  font: PDFFont;
  fontBold: PDFFont;
}> {
  doc.registerFontkit(fontkit);
  const regular = await loadPublic("fonts/Inter-Regular.ttf");
  const bold = await loadPublic("fonts/Inter-SemiBold.ttf");
  if (regular?.byteLength && bold?.byteLength) {
    return {
      font: await doc.embedFont(regular, { subset: true }),
      fontBold: await doc.embedFont(bold, { subset: true }),
    };
  }
  return {
    font: await doc.embedFont(StandardFonts.Helvetica),
    fontBold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
}

async function buildPaidTestInvoicePdf(): Promise<Uint8Array> {
  const amountHt = 37.5;
  const tvaRate = 20;
  const amountTtc = 45;
  const tvaAmount = (amountHt * tvaRate) / 100;

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const { font, fontBold } = await embedFonts(doc);
  const left = 48;
  const right = 595.28 - 48;
  let y = 841.89 - 48;

  const draw = (
    text: string,
    x: number,
    baseline: number,
    opts?: { bold?: boolean; size?: number; color?: typeof INK }
  ) => {
    page.drawText(text, {
      x,
      y: baseline,
      size: opts?.size ?? 10,
      font: opts?.bold ? fontBold : font,
      color: opts?.color ?? INK,
    });
  };

  const logoBytes = await loadPublic("inscription-documents/fli-invoice-logo.png");
  if (logoBytes?.byteLength) {
    try {
      const logo = await doc.embedPng(logoBytes);
      const w = 140;
      const h = (logo.height / logo.width) * w;
      page.drawImage(logo, { x: left, y: y - h, width: w, height: h });
      y -= h + 8;
    } catch {
      draw(FLI.name, left, y - 14, { bold: true, size: 12 });
      y -= 20;
    }
  }

  const headerTop = 841.89 - 52;
  draw("FACTURE - Test de niveau", right - 200, headerTop - 4, {
    bold: true,
    size: 14,
    color: YELLOW,
  });
  draw(`N°: ${INVOICE_NUMBER}`, right - 140, headerTop - 24, { bold: true, size: 10 });
  draw(`Date: ${formatFr(INVOICE_DATE)}`, right - 140, headerTop - 38, {
    size: 9,
    color: MUTED,
  });

  for (const line of [FLI.name, FLI.address, FLI.city, `Tél: ${FLI.phone}`, FLI.email]) {
    draw(line, left, y, {
      size: 9,
      color: line === FLI.name ? INK : MUTED,
      bold: line === FLI.name,
    });
    y -= 12;
  }
  y -= 10;
  page.drawRectangle({
    x: left,
    y: y - 2,
    width: right - left,
    height: 2.5,
    color: YELLOW,
  });
  y -= 24;

  page.drawRectangle({
    x: left,
    y: y - 50,
    width: right - left,
    height: 58,
    color: rgb(0.96, 0.96, 0.96),
  });
  draw("CLIENT", left + 12, y - 14, { size: 8, color: MUTED, bold: true });
  draw("Mattia Saletta", left + 12, y - 30, { bold: true, size: 11 });
  y -= 76;

  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 2,
    color: YELLOW,
  });
  y -= 16;
  draw("Description", left, y, { bold: true, size: 9, color: MUTED });
  draw("Qté", left + 280, y, { bold: true, size: 9, color: MUTED });
  draw("Prix unit.", left + 330, y, { bold: true, size: 9, color: MUTED });
  draw("Montant", right - 60, y, { bold: true, size: 9, color: MUTED });
  y -= 8;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 18;
  draw("Test de portugais brésilien", left, y, { size: 10 });
  draw("1", left + 290, y, { size: 10 });
  draw(formatEuro(amountHt), left + 330, y, { size: 10 });
  const tot = formatEuro(amountHt);
  draw(tot, right - fontBold.widthOfTextAtSize(tot, 10), y, { bold: true, size: 10 });
  y -= 36;

  const boxX = right - 220;
  const row = (
    label: string,
    value: string,
    opts?: { bold?: boolean; color?: typeof INK; size?: number }
  ) => {
    draw(label, boxX, y, {
      size: opts?.size ?? 10,
      bold: opts?.bold,
      color: opts?.color ?? MUTED,
    });
    const vw = (opts?.bold ? fontBold : font).widthOfTextAtSize(value, opts?.size ?? 10);
    draw(value, right - vw, y, {
      size: opts?.size ?? 10,
      bold: opts?.bold,
      color: opts?.color ?? INK,
    });
    y -= 16;
  };
  row("Total HT", formatEuro(amountHt));
  row(`TVA (${tvaRate}%)`, formatEuro(tvaAmount));
  page.drawLine({
    start: { x: boxX, y },
    end: { x: right, y },
    thickness: 2,
    color: YELLOW,
  });
  y -= 18;
  row("Total TTC", formatEuro(amountTtc), { bold: true, color: YELLOW, size: 12 });
  row("Net à payer", formatEuro(0), { bold: true, color: GREEN, size: 12 });

  const stampBytes = await loadPublic("inscription-documents/facture-acquittee-stamp.png");
  if (stampBytes?.byteLength) {
    try {
      const stamp = await doc.embedPng(stampBytes);
      const w = 120;
      const h = (stamp.height / stamp.width) * w;
      page.drawImage(stamp, {
        x: 595.28 / 2 - w / 2,
        y: 280,
        width: w,
        height: h,
        opacity: 0.35,
      });
    } catch {
      /* optional */
    }
  }

  y = Math.min(y - 24, 220);
  page.drawLine({
    start: { x: left, y: y + 12 },
    end: { x: right, y: y + 12 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  draw("RÈGLEMENT", left, y, { size: 8, color: MUTED, bold: true });
  draw("Facture acquittée", left, y - 14, { bold: true, size: 11, color: GREEN });
  draw(`Date : ${formatFr(PAYMENT_DATE)}`, left, y - 28, { size: 9 });
  draw("Moyen : Carte bancaire en ligne (Stripe)", left, y - 40, { size: 9 });
  draw(`SIRET: ${FLI.siret}`, right - 160, y - 14, { size: 9, color: MUTED });
  draw(`N° TVA: ${FLI.tvaNumber}`, right - 160, y - 28, { size: 9, color: MUTED });

  const footer = [
    "France Langues International - organisme de formation",
    "SARL au capital de 5000 euros — 25 avenue de la gare, 73800 Montmélian",
    `Siret : ${FLI.siret} - RCS Chambéry - NAF : 8559A — Organisme n° ${FLI.activity}`,
    "Version 5 du 10 janvier 2026",
  ];
  let fy = 70;
  for (const line of footer) {
    const w = font.widthOfTextAtSize(line, 7);
    draw(line, (595.28 - w) / 2, fy, { size: 7, color: MUTED });
    fy -= 10;
  }
  return doc.save();
}

async function loadAssets(): Promise<EvaluationPdfAssets> {
  const dir = join(process.cwd(), "public/evaluation-pdf");
  const read = async (file: string) => readFile(join(dir, file));
  const partners: Uint8Array[] = [];
  for (const file of EVALUATION_PDF_ASSET_FILES.partners) {
    partners.push(await read(file));
  }
  return {
    esfLogo: await read(EVALUATION_PDF_ASSET_FILES.esfLogo),
    fliHeader: await read(EVALUATION_PDF_ASSET_FILES.fliHeader),
    fliCachet: await read(EVALUATION_PDF_ASSET_FILES.fliCachet),
    fliCompact: await read(EVALUATION_PDF_ASSET_FILES.fliCompact),
    dsfLetterhead: await read(EVALUATION_PDF_ASSET_FILES.dsfLetterhead),
    partnerLogos: partners,
    fonts: {
      regular: await read(EVALUATION_PDF_ASSET_FILES.fonts.regular),
      bold: await read(EVALUATION_PDF_ASSET_FILES.fonts.bold),
      italic: await read(EVALUATION_PDF_ASSET_FILES.fonts.italic),
    },
  };
}

function emailHtml(): string {
  const body = `
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat de votre test de portugais brésilien (B2).</p>
<p style="margin:0 0 16px">Une copie est adressée à votre école de ski (ESF Val d'Isère).</p>
<p style="margin:0 0 16px">La facture acquittée n°&nbsp;${INVOICE_NUMBER} est jointe.</p>
<p style="margin:0 0 4px">Cordialement,</p>
<p style="margin:0">
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
${body}
</td></tr>
</table>
</td></tr>
</table>`;
}

async function main() {
  const doSend = process.env.SEND === "1";
  await mkdir(OUT, { recursive: true });

  const input: EvaluationPdfInput = {
    sponsorType: "esf",
    evaluatedAt: new Date("2026-10-08T10:00:00+02:00"),
    candidateName: "Mattia Saletta",
    candidateProfession: "moniteur",
    skiDiscipline: "alpin",
    trainingCycle: null,
    carteSyndicale: null,
    language: "portugais",
    previousTest: false,
    skiSchoolName: "ESF VAL D ISERE",
    companyName: "ESF VAL D ISERE",
    instructorName: "Paula Rangel-Halbwachs",
    scores: {
      comprehension: 3,
      expression: 3,
      structure: 2,
      technique: 3,
      conversation: 3,
      general: 3,
    },
    cecrlGeneral: "B2",
    blocs: BLOCS,
    noteMethodologique: null,
    priceTtc: 45,
    identity: IDENTITY,
    cecrlScale: SCALE,
    verifiedAt: new Date("2026-10-14T14:00:00+02:00"),
  };

  const assets = await loadAssets();
  const model = buildEvaluationPdfModel(input);
  const evalBytes = await renderEvaluationPdf(model, assets);
  await writeFile(join(OUT, PDF_NAME), evalBytes);

  const invBytes = await buildPaidTestInvoicePdf();
  await writeFile(join(OUT, INV_NAME), invBytes);

  const subject = "Résultat de votre test de langue — Mattia Saletta";
  const draft = {
    send: false,
    to: CANDIDATE_EMAIL,
    cc: SCHOOL_CC,
    bcc: BCC,
    subject,
    cecrl: "B2",
    invoice_number: INVOICE_NUMBER,
    stripe_charge: STRIPE_CHARGE,
    stripe_pi: STRIPE_PI,
    payment_date: PAYMENT_DATE,
    attachments: [PDF_NAME, INV_NAME],
    prepared_at: new Date().toISOString(),
  };
  await writeFile(join(OUT, "email-draft.json"), JSON.stringify(draft, null, 2));
  console.log(`PDF ${PDF_NAME} (${evalBytes.length} o)`);
  console.log(`INV ${INV_NAME} (${invBytes.length} o)`);
  console.log(`STRIPE ${STRIPE_CHARGE} 45€ paid ${PAYMENT_DATE}`);

  if (!doSend) {
    console.log("DRY_RUN — relancer avec SEND=1 après insert facture DB");
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY absente");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "FLI-Formation/saletta-valdisere-result",
    },
    body: JSON.stringify({
      from: "FLI — France Langues International <noreply@fli.fr>",
      to: [CANDIDATE_EMAIL],
      cc: SCHOOL_CC,
      bcc: [BCC],
      reply_to: ["info@fli.fr"],
      subject,
      html: emailHtml(),
      attachments: [
        { filename: PDF_NAME, content: Buffer.from(evalBytes).toString("base64") },
        { filename: INV_NAME, content: Buffer.from(invBytes).toString("base64") },
      ],
    }),
  });
  const text = await response.text();
  await writeFile(join(OUT, "resend.json"), text);
  if (!response.ok) throw new Error(`Resend ${response.status}: ${text}`);
  let resendId: string | null = null;
  try {
    resendId = JSON.parse(text)?.id ?? null;
  } catch {
    /* ignore */
  }
  const sent = {
    ...draft,
    send: true,
    resend_id: resendId,
    sent_at: new Date().toISOString(),
  };
  await writeFile(join(OUT, "email-draft.json"), JSON.stringify(sent, null, 2));
  console.log(`ENVOYE ${resendId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
