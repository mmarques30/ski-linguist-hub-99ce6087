/**
 * Facture école groupée ESF Les Carroz (Lisa Roch + Pierre Bujard)
 * Lot Mollard oct. 2026 — 26-27.14327 · 75 € HT / 90 € TTC
 *
 *   npx tsx scripts/send-carroz-school-invoice.mts           # PDF only
 *   SEND=1 npx tsx scripts/send-carroz-school-invoice.mts    # envoi Resend
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { buildFliBankDetailsEmailHtml } from "../src/lib/registration-payments.ts";

const OUT_DIR = "/opt/cursor/artifacts/mollard-oct-2026/carroz-invoice";
const INVOICE_NUMBER = "26-27.14327";
const INVOICE_ID = "ea604dcb-40c5-4cef-8a81-979f22376df9";
const INVOICE_DATE = "2026-10-14";
const DUE_DATE = "2026-11-13";
const AMOUNT_HT = 75;
const TVA_RATE = 20;
const AMOUNT_TTC = 90;

const TO = "admin@esf-lescarroz.com";
const CC = ["directeur@esf-lescarroz.com"];
const BCC = "info@fli.fr";
const SUBJECT =
  "Facture 26-27.14327 — Tests d'anglais Lisa Roch et Pierre Bujard — ESF Les Carroz";

const FLI = {
  name: "France Langues International",
  address: "25 avenue de la gare",
  city: "73800 Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
  siret: "484 772 041 00048",
  tvaNumber: "FR 44 484772041",
  iban: "FR76 1820 6004 4339 5412 7300 189",
  bic: "AGRIFRPP882",
  activity: "82 73 01 366 73",
} as const;

const CLIENT = {
  name: "ESF ARACHES LES CARROZ",
  address: "569 ROUTE DE LA TELECABINE, IMMEUBLE ADENORA",
  postalCode: "74300",
  city: "LES CARROZ",
};

const ITEMS = [
  {
    description: "Test d'anglais — Lisa Roch",
    quantity: 1,
    unitPrice: 37.5,
    total: 37.5,
  },
  {
    description: "Test d'anglais — Pierre Bujard",
    quantity: 1,
    unitPrice: 37.5,
    total: 37.5,
  },
];

const YELLOW = rgb(252 / 255, 175 / 255, 23 / 255);
const INK = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.35, 0.35, 0.35);

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

/** PDF facture test (TVA 20 %) aligné sur InvoiceTemplate. */
async function buildTestInvoicePdf(): Promise<Uint8Array> {
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

  const logoBytes = await loadPublic(
    "inscription-documents/fli-invoice-logo.png"
  );
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
  } else {
    draw(FLI.name, left, y - 14, { bold: true, size: 12 });
    y -= 20;
  }

  const headerTop = 841.89 - 52;
  draw("FACTURE - Test de niveau", right - 200, headerTop - 4, {
    bold: true,
    size: 14,
    color: YELLOW,
  });
  draw(`N°: ${INVOICE_NUMBER}`, right - 140, headerTop - 24, {
    bold: true,
    size: 10,
  });
  draw(`Date: ${formatFr(INVOICE_DATE)}`, right - 140, headerTop - 38, {
    size: 9,
    color: MUTED,
  });
  draw(`Échéance: ${formatFr(DUE_DATE)}`, right - 140, headerTop - 50, {
    size: 9,
    color: MUTED,
  });

  for (const line of [
    FLI.name,
    FLI.address,
    FLI.city,
    `Tél: ${FLI.phone}`,
    FLI.email,
  ]) {
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
    y: y - 70,
    width: right - left,
    height: 78,
    color: rgb(0.96, 0.96, 0.96),
  });
  draw("CLIENT", left + 12, y - 14, { size: 8, color: MUTED, bold: true });
  draw(CLIENT.name, left + 12, y - 30, { bold: true, size: 11 });
  draw(CLIENT.address, left + 12, y - 44, { size: 9 });
  draw(`${CLIENT.postalCode} ${CLIENT.city}`, left + 12, y - 56, { size: 9 });
  y -= 96;

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

  for (const item of ITEMS) {
    draw(item.description, left, y, { size: 10 });
    draw(String(item.quantity), left + 290, y, { size: 10 });
    const unit = formatEuro(item.unitPrice);
    draw(unit, left + 330, y, { size: 10 });
    const tot = formatEuro(item.total);
    const totW = fontBold.widthOfTextAtSize(tot, 10);
    draw(tot, right - totW, y, { bold: true, size: 10 });
    y -= 20;
  }
  y -= 16;

  const boxX = right - 220;
  const tvaAmount = (AMOUNT_HT * TVA_RATE) / 100;
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
    const vw = (opts?.bold ? fontBold : font).widthOfTextAtSize(
      value,
      opts?.size ?? 10
    );
    draw(value, right - vw, y, {
      size: opts?.size ?? 10,
      bold: opts?.bold,
      color: opts?.color ?? INK,
    });
    y -= 16;
  };

  row("Total HT", formatEuro(AMOUNT_HT));
  row(`TVA (${TVA_RATE}%)`, formatEuro(tvaAmount));
  page.drawLine({
    start: { x: boxX, y },
    end: { x: right, y },
    thickness: 2,
    color: YELLOW,
  });
  y -= 18;
  row("Total TTC", formatEuro(AMOUNT_TTC), {
    bold: true,
    color: YELLOW,
    size: 12,
  });

  y = Math.min(y - 24, 220);
  page.drawLine({
    start: { x: left, y: y + 12 },
    end: { x: right, y: y + 12 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  draw("COORDONNÉES BANCAIRES", left, y, { size: 8, color: MUTED, bold: true });
  draw(`IBAN: ${FLI.iban}`, left, y - 14, { size: 9 });
  draw(`BIC: ${FLI.bic}`, left, y - 28, { size: 9 });
  draw(`SIRET: ${FLI.siret}`, right - 160, y - 14, { size: 9, color: MUTED });
  draw(`N° TVA: ${FLI.tvaNumber}`, right - 160, y - 28, {
    size: 9,
    color: MUTED,
  });

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

function emailHtml(): string {
  const rib = buildFliBankDetailsEmailHtml(INVOICE_NUMBER);
  const body = `
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">Veuillez trouver ci-joint la facture <strong>${INVOICE_NUMBER}</strong> correspondant aux tests d'anglais de&nbsp;:</p>
<ul style="margin:0 0 16px;padding-left:20px">
  <li>Lisa Roch</li>
  <li>Pierre Bujard</li>
</ul>
<p style="margin:0 0 16px">Montant : <strong>${formatEuro(AMOUNT_TTC)} TTC</strong> (${formatEuro(AMOUNT_HT)} HT + TVA ${TVA_RATE}&nbsp;%).<br/>Échéance : ${formatFr(DUE_DATE)}.</p>
${rib}
<p style="margin:0 0 16px">Merci de bien vouloir procéder au règlement par virement en indiquant la référence de facture.</p>
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
  const apiKey = process.env.RESEND_API_KEY;
  await mkdir(OUT_DIR, { recursive: true });

  const bytes = await buildTestInvoicePdf();
  const filename = `Facture-${INVOICE_NUMBER}.pdf`;
  const pdfPath = join(OUT_DIR, filename);
  await writeFile(pdfPath, bytes);
  console.log(`PDF OK ${pdfPath} (${bytes.length} octets)`);

  const draft = {
    invoice_id: INVOICE_ID,
    invoice_number: INVOICE_NUMBER,
    to: TO,
    cc: CC,
    bcc: BCC,
    subject: SUBJECT,
    amount_ht: AMOUNT_HT,
    amount_ttc: AMOUNT_TTC,
    attachment: filename,
    dry_run: !doSend,
    prepared_at: new Date().toISOString(),
  };
  await writeFile(join(OUT_DIR, "draft.json"), JSON.stringify(draft, null, 2));
  await writeFile(join(OUT_DIR, "email-draft.md"), `# Brouillon facture Carroz

- **À :** \`${TO}\`
- **Cc :** ${CC.map((c) => `\`${c}\``).join(", ")}
- **Bcc :** \`${BCC}\`
- **Objet :** ${SUBJECT}
- **PJ :** ${filename}
- **Montant :** ${AMOUNT_HT} € HT / ${AMOUNT_TTC} € TTC
- **Facture :** ${INVOICE_NUMBER} (id ${INVOICE_ID})
`);

  if (!doSend) {
    console.log("Dry-run : PDF généré, aucun envoi (relancer avec SEND=1).");
    return;
  }
  if (!apiKey) throw new Error("RESEND_API_KEY absente");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "FLI-Formation/mollard-carroz-invoice",
    },
    body: JSON.stringify({
      from: "FLI — France Langues International <noreply@fli.fr>",
      to: [TO],
      cc: CC,
      bcc: [BCC],
      reply_to: ["info@fli.fr"],
      subject: SUBJECT,
      html: emailHtml(),
      attachments: [
        {
          filename,
          content: Buffer.from(bytes).toString("base64"),
        },
      ],
    }),
  });

  const text = await response.text();
  await writeFile(join(OUT_DIR, "resend-response.json"), text);
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
  await writeFile(join(OUT_DIR, "sent.json"), JSON.stringify(sent, null, 2));
  console.log(`ENVOYE ${text}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
