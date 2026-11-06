/**
 * Envoi Resend — facture octobre ESF Saint-Gervais (26-27.14343).
 * Prérequis : artifacts générés par prepare-st-gervais-octobre-invoice.mts
 * et OK explicite Paula.
 *
 *   ./node_modules/.bin/tsx scripts/send-st-gervais-octobre-invoice.mts
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-st-gervais-octobre-invoice.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { FLI_BANK_DETAILS, isValidIban } from "../src/lib/registration-payments.ts";

const OUT = "/opt/cursor/artifacts/st-gervais-octobre-2026";

type Draft = {
  to: string[];
  cc?: string[];
  bcc: string;
  subject: string;
  invoice_number: string;
  amount_ttc: number;
  attachments: string[];
  checkout_url?: string | null;
  iban?: string;
  body_text?: string;
};

async function main() {
  const doSend = process.env.SEND === "1";
  const apiKey = process.env.RESEND_API_KEY;
  await mkdir(join(OUT, "sent"), { recursive: true });

  const draft = JSON.parse(await readFile(join(OUT, "draft.json"), "utf8")) as Draft;
  const html = await readFile(join(OUT, "email.html"), "utf8");

  if (!isValidIban(FLI_BANK_DETAILS.iban) || !FLI_BANK_DETAILS.iban.replace(/\s/g, "").endsWith("189")) {
    throw new Error(`IBAN FLI invalide ou pas …189 : ${FLI_BANK_DETAILS.iban}`);
  }
  if (draft.iban && draft.iban.replace(/\s/g, "") !== FLI_BANK_DETAILS.iban.replace(/\s/g, "")) {
    throw new Error(`IBAN brouillon ≠ FLI_BANK_DETAILS : ${draft.iban}`);
  }
  if (!draft.checkout_url) {
    throw new Error("checkout_url manquant dans le brouillon");
  }

  // PJ validées Paula : facture PDF + tableau DOCX (pas le CSV)
  const attachNames = [
    `Facture-${draft.invoice_number}-ESF-Saint-Gervais-octobre.pdf`,
    "tableau-niveaux-ESF-Saint-Gervais-octobre-2026.docx",
  ];

  const attachments = [];
  for (const filename of attachNames) {
    const bytes = await readFile(join(OUT, filename));
    attachments.push({
      filename,
      content: Buffer.from(bytes).toString("base64"),
    });
    console.log(`PJ ${filename} (${bytes.length} o)`);
  }

  const payload = {
    from: "FLI — France Langues International <noreply@fli.fr>",
    to: draft.to,
    cc: draft.cc?.length ? draft.cc : undefined,
    bcc: [draft.bcc],
    reply_to: ["info@fli.fr"],
    subject: draft.subject,
    html,
    text: draft.body_text,
    attachments,
  };

  if (!doSend) {
    console.log("Dry-run — aucun envoi (relancer avec SEND=1).");
    console.log(JSON.stringify({ to: payload.to, cc: payload.cc, bcc: payload.bcc, subject: payload.subject }, null, 2));
    return;
  }
  if (!apiKey) throw new Error("RESEND_API_KEY absente");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "FLI-Formation/st-gervais-octobre-invoice",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  await writeFile(join(OUT, "sent", "resend-response.json"), text);
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
    do_not_send: false,
    status: "sent",
    sent_at: new Date().toISOString(),
    resend_id: resendId,
    resend_status: response.status,
    attachments_sent: attachNames,
  };
  await writeFile(join(OUT, "sent", "sent.json"), JSON.stringify(sent, null, 2));
  await writeFile(join(OUT, "draft.json"), JSON.stringify(sent, null, 2));
  console.log(`ENVOYE ${resendId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
