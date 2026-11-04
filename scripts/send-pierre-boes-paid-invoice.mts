/**
 * Facture acquittée Pierre Boes — test anglais 45 € TTC.
 * N° 26-27.14342 · paiement virement (40 € + solde 5 €).
 * Paula 04/11/2026 : « Envoyer la facture acquittée ».
 *
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-pierre-boes-paid-invoice.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const OUT = "/opt/cursor/artifacts/mollard-oct-batch3";
const BCC = "info@fli.fr";
const TO = "pierre_boes@yahoo.fr";
const CC = ["sam@prosneige.fr", "nathan@prosneige.fr"];
const INVOICE_NUMBER = "26-27.14342";
const INVOICE_DATE = "2026-10-29";
const PAYMENT_DATE = "2026-11-04";
const SUBJECT = `Facture acquittée n° ${INVOICE_NUMBER} — Pierre Boes`;

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

function formatEuro(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

function formatFr(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

async function loadPublic(rel: string): Promise<Uint8Array | null> {
  try {
    return await readFile(join(process.cwd(), "public", rel));
  } catch {
    return null;
  }
}

async function buildPaidInvoicePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const page = doc.addPage([595.28, 841.89]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const left = 48;
  const right = 547;
  let y = 790;

  const draw = (
    text: string,
    x: number,
    yy: number,
    o?: { bold?: boolean; size?: number; color?: typeof INK }
  ) => {
    page.drawText(text, {
      x,
      y: yy,
      size: o?.size ?? 10,
      font: o?.bold ? fontBold : font,
      color: o?.color ?? INK,
    });
  };

  const headerBytes = await loadPublic("evaluation-pdf/fli-entete-prosneige.png");
  if (headerBytes?.byteLength) {
    try {
      const img = await doc.embedPng(headerBytes);
      const w = 220;
      const h = (img.height / img.width) * w;
      page.drawImage(img, { x: left, y: y - h, width: w, height: h });
      y -= h + 16;
    } catch {
      draw(FLI.name, left, y, { bold: true, size: 14 });
      y -= 28;
    }
  } else {
    draw(FLI.name, left, y, { bold: true, size: 14 });
    y -= 28;
  }

  draw(FLI.address, left, y, { size: 9, color: MUTED });
  y -= 12;
  draw(FLI.city, left, y, { size: 9, color: MUTED });
  y -= 12;
  draw(`Tél. ${FLI.phone} · ${FLI.email}`, left, y, { size: 9, color: MUTED });
  y -= 28;

  draw("FACTURE", left, y, { bold: true, size: 18, color: YELLOW });
  y -= 22;
  draw(`N° ${INVOICE_NUMBER}`, left, y, { bold: true, size: 12 });
  draw(`Date : ${formatFr(INVOICE_DATE)}`, right - 140, y, { size: 10 });
  y -= 28;

  page.drawRectangle({
    x: left,
    y: y - 50,
    width: right - left,
    height: 58,
    color: rgb(0.96, 0.96, 0.96),
  });
  draw("CLIENT", left + 12, y - 14, { size: 8, color: MUTED, bold: true });
  draw("Pierre Boes", left + 12, y - 30, { bold: true, size: 11 });
  y -= 76;

  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 2, color: YELLOW });
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
  const amountHt = 37.5;
  const tvaRate = 20;
  const tvaAmount = 7.5;
  const amountTtc = 45;
  draw("Test d'anglais", left, y, { size: 10 });
  draw("1", left + 290, y, { size: 10 });
  draw(formatEuro(amountHt), left + 330, y, { size: 10 });
  const tot = formatEuro(amountHt);
  draw(tot, right - fontBold.widthOfTextAtSize(tot, 10), y, { bold: true, size: 10 });
  y -= 36;

  const boxX = right - 220;
  const row = (
    label: string,
    value: string,
    o?: { bold?: boolean; color?: typeof INK; size?: number }
  ) => {
    draw(label, boxX, y, {
      size: o?.size ?? 10,
      bold: o?.bold,
      color: o?.color ?? MUTED,
    });
    const vw = (o?.bold ? fontBold : font).widthOfTextAtSize(value, o?.size ?? 10);
    draw(value, right - vw, y, {
      size: o?.size ?? 10,
      bold: o?.bold,
      color: o?.color ?? INK,
    });
    y -= 16;
  };
  row("Total HT", formatEuro(amountHt));
  row(`TVA (${tvaRate}%)`, formatEuro(tvaAmount));
  page.drawLine({ start: { x: boxX, y }, end: { x: right, y }, thickness: 2, color: YELLOW });
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
  draw("Moyen : Virement bancaire", left, y - 40, { size: 9 });
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

function emailHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint la facture acquittée n°&nbsp;<strong>${INVOICE_NUMBER}</strong> correspondant à votre test d'anglais (45&nbsp;€&nbsp;TTC).</p>
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

async function main() {
  const doSend = process.env.SEND === "1";
  await mkdir(join(OUT, "invoices"), { recursive: true });
  await mkdir(join(OUT, "sent"), { recursive: true });
  const apiKey = process.env.RESEND_API_KEY;
  if (doSend && !apiKey) throw new Error("RESEND_API_KEY absente");

  const bytes = await buildPaidInvoicePdf();
  const filename = `Facture-${INVOICE_NUMBER}-pierre-boes-acquittee.pdf`;
  await writeFile(join(OUT, "invoices", filename), bytes);
  console.log("PDF", filename, bytes.length);

  const draft = {
    key: "pierre-boes-paid-invoice",
    to: TO,
    cc: CC,
    bcc: BCC,
    subject: SUBJECT,
    invoice_number: INVOICE_NUMBER,
    invoice: filename,
    payment_date: PAYMENT_DATE,
    payment_method: "virement",
    dry_run: !doSend,
  };
  await writeFile(
    join(OUT, "sent", "pierre-boes-paid-invoice-draft.json"),
    JSON.stringify(draft, null, 2)
  );

  if (!doSend) {
    console.log(`DRY → ${TO} cc=${CC.join(",")}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "FLI-Formation/pierre-boes-paid-invoice",
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
  await writeFile(join(OUT, "sent", "pierre-boes-paid-invoice-resend.json"), text);
  if (!response.ok) throw new Error(`Resend ${response.status}: ${text}`);
  const resendId = JSON.parse(text)?.id ?? null;
  const sent = {
    ...draft,
    dry_run: false,
    sent_at: new Date().toISOString(),
    resend_id: resendId,
  };
  await writeFile(
    join(OUT, "sent", "pierre-boes-paid-invoice-sent.json"),
    JSON.stringify(sent, null, 2)
  );
  console.log("ENVOYE", resendId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
