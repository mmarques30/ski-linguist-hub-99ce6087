/**
 * Génère programme + devis (+ convention) pour Sébastien Mahieu (FAFCEA),
 * puis envoie le brouillon à info@fli.fr pour validation Paula.
 *
 * Usage :
 *   npx tsx scripts/generate-mahieu-fafcea-dossier.mts
 *   npx tsx scripts/generate-mahieu-fafcea-dossier.mts --send
 *
 * Sans --send : écrit seulement les PDF dans /opt/cursor/artifacts/mahieu-fafcea/
 * Avec --send : envoie à info@fli.fr (jamais au client).
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildFafceaConventionPdfModel,
  buildFafceaProgrammePdfModel,
  fafceaTotalEur,
  mahieuFafceaDossierInput,
} from "../src/lib/fafcea-individual-dossier.ts";
import { renderInscriptionDocumentPdf } from "../src/lib/inscription-documents-pdf-render.ts";
import {
  devisFormationFilename,
  renderDevisFormationPdf,
} from "../src/lib/devis-formation-pdf.ts";
import { INSCRIPTION_DOCUMENT_ASSET_FILES } from "../src/lib/inscription-documents-assets.ts";

const OUT_DIR = "/opt/cursor/artifacts/mahieu-fafcea";
const VALIDATION_TO = "info@fli.fr";
const CLIENT_EMAIL = "seb.mahieu74@gmail.com";

const IDENTITY = {
  legal_name: "France Langues International",
  address_line: "25 avenue de la Gare",
  postal_code: "73800",
  city: "Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
  siret: "484 772 041 00048",
  activity_number: "82 73 01 366 73",
  activity_authority: "préfet de région Auvergne-Rhône-Alpes",
  representative: "Paula Rangel-Halbwachs",
  website: "https://fli.fr",
  logo_url: "",
};

function loadPng(name: string): Uint8Array | null {
  try {
    return new Uint8Array(
      readFileSync(join(process.cwd(), "public", "inscription-documents", name))
    );
  } catch {
    return null;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function clientEmailBody(): string {
  return `Bonjour Sébastien,

Merci pour votre demande. Comme vous avez déjà des bases en russe, je vous propose un parcours individuel de 20 heures en visio, construit autour de vos besoins concrets : l'accueil et le transport de clients russophones en taxi, et les échanges avec eux pendant les cours de ski.

Le parcours comprend :
- un test de positionnement au départ, pour partir de votre niveau réel ;
- des objectifs et un programme adaptés à vos deux activités ;
- des séances individuelles en ligne, à des horaires définis ensemble ;
- une évaluation à la fin du parcours.

Tarif : 60 € de l'heure, soit 1 200 € pour les 20 heures.

Vous trouverez ci-joint le programme et le devis pour constituer votre dossier auprès du FAFCEA. FLI est certifié Qualiopi, ce qui est obligatoire pour obtenir un financement.

Le montant de la prise en charge dépend de la façon dont le FAFCEA classera la formation. Selon les informations dont je dispose, une formation en langue peut être prise en charge comme formation « transverse » (environ 25 € de l'heure) ou, dans certains cas, comme « parcours individualisé », avec un taux nettement plus élevé. Dans le second cas, le parcours pourrait être couvert en totalité. Je ne peux pas vous le garantir, c'est le FAFCEA qui décide.

Je vous propose donc d'envoyer le dossier et de leur poser directement ces questions :
1. Cette formation en russe peut-elle être financée en parcours individualisé ?
2. Quel montant de prise en charge pouvez-vous attendre pour 20 heures ?
3. Les cours en visio sont-ils acceptés, et quels justificatifs de présence demandent-ils ?

Attention au calendrier : le dossier doit être reçu complet par le FAFCEA avant la première séance (et au plus tôt trois mois avant). Il faudra aussi y joindre votre attestation de contribution à la formation professionnelle (CFP) délivrée par l'URSSAF.

Si la prise en charge ne couvre pas tout, on regardera ensemble ce qu'on peut trouver comme arrangement. Vous pourrez décider en connaissant le montant exact.

Pouvez-vous me dire à partir de quand vous aimeriez commencer et quels créneaux vous conviennent le mieux ? Je prépare la suite en fonction.

Bien cordialement,

Paula
France Langues International`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainTextToHtml(bodyText: string): string {
  return bodyText
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const withBreaks = escapeHtml(block.trim()).replace(/\n/g, "<br/>");
      return `<p style="margin:0 0 16px">${withBreaks}</p>`;
    })
    .join("");
}

async function main() {
  const shouldSend = process.argv.includes("--send");
  mkdirSync(OUT_DIR, { recursive: true });

  const generatedAt = new Date();
  const input = mahieuFafceaDossierInput(IDENTITY, generatedAt);
  const total = fafceaTotalEur(input);
  const letterhead = loadPng(INSCRIPTION_DOCUMENT_ASSET_FILES.letterhead);
  const signature = loadPng(INSCRIPTION_DOCUMENT_ASSET_FILES.organismSignature);

  const programmeModel = buildFafceaProgrammePdfModel(input);
  const conventionModel = buildFafceaConventionPdfModel(input);

  const [programmeBytes, conventionBytes, devisBytes] = await Promise.all([
    renderInscriptionDocumentPdf(programmeModel, {
      letterheadPng: letterhead,
    }),
    renderInscriptionDocumentPdf(conventionModel, {
      letterheadPng: letterhead,
      organismSignaturePng: signature,
    }),
    renderDevisFormationPdf({
      devisNumber: input.dossierCode,
      devisDate: generatedAt,
      validityDays: 90,
      clientName: "Sébastien Mahieu",
      clientAddressLines: [
        "623 Rue De L'Aiguille Du Fruit",
        "73120 Courchevel",
      ],
      clientEmail: input.student.email,
      clientPhone: input.student.phone || undefined,
      title: "Formation individualisée en russe — 20 h en ligne",
      descriptionLines: [
        "Parcours individuel en visioconférence, ciblé sur l'accueil d'une clientèle russophone dans deux activités : chauffeur de taxi et moniteur de ski.",
        "Inclut test de positionnement, séances individuelles, évaluation de fin de parcours.",
        "Organisme certifié Qualiopi.",
      ],
      durationHours: input.durationHours,
      hourlyRateEur: input.hourlyRateEur,
      totalEur: total,
      fundingNote:
        "Demande de prise en charge auprès du FAFCEA. Selon le classement (formation transverse ~25 €/h, ou parcours individualisé à taux plus élevé), la prise en charge peut être partielle ou totale. Le reste à charge éventuel sera réglé par le stagiaire avant le début de la formation.",
      letterheadPng: letterhead,
    }),
  ]);

  const programmePath = join(OUT_DIR, "Programme-formation-FLI-FAFCEA-2026-MAHIEU.pdf");
  const devisPath = join(OUT_DIR, devisFormationFilename(input.dossierCode));
  const conventionPath = join(
    OUT_DIR,
    "Convention-formation-FLI-FAFCEA-2026-MAHIEU.pdf"
  );

  writeFileSync(programmePath, programmeBytes);
  writeFileSync(devisPath, devisBytes);
  writeFileSync(conventionPath, conventionBytes);

  const clientSubject =
    "Votre formation en russe – parcours de 20 h en ligne et dossier FAFCEA";
  const clientBody = clientEmailBody();

  const notePath = join(OUT_DIR, "BROUILLON-validation.md");
  writeFileSync(
    notePath,
    `# Brouillon validation — Sébastien Mahieu (FAFCEA)

## Destinataire final (après OK Paula)
- À : ${CLIENT_EMAIL}
- Objet : ${clientSubject}

## Adaptations documents
- **Programme** : objectifs et contenu taxi + moniteur de ski / clientèle russophone ; 20 h en ligne ; évaluation entrée/sortie.
- **Devis** : 20 × 60 € = 1 200 € ; mention FAFCEA / Qualiopi.
- **Convention** (jointe pour votre relecture, pas dans le mail client prévu) :
  - Article II : objectif ciblé métiers + clientèle russophone ;
  - Article VI : financement FAFCEA, pas d'acompte 150 €, reste à charge selon décision du fonds.

## Fichiers
- ${programmePath}
- ${devisPath}
- ${conventionPath}

## Corps du mail client

\`\`\`
${clientBody}
\`\`\`
`
  );

  console.log("PDF écrits :");
  console.log(" -", programmePath, programmeBytes.byteLength, "o");
  console.log(" -", devisPath, devisBytes.byteLength, "o");
  console.log(" -", conventionPath, conventionBytes.byteLength, "o");
  console.log(" -", notePath);

  if (!shouldSend) {
    console.log("Mode dry-run : pas d'envoi. Relancer avec --send pour info@fli.fr.");
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY absente — aucun envoi.");
  }

  const validationSubject = `[VALIDATION — ne pas transférer] ${clientSubject}`;
  const validationHtml = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
<p style="margin:0 0 16px;padding:12px 14px;background:#fff8e6;border:1px solid #f0d78c"><strong>Brouillon pour validation Paula</strong><br/>
Destinataire final prévu : <code>${CLIENT_EMAIL}</code><br/>
Aucun envoi au client tant que vous n'avez pas donné votre OK.<br/>
PJ jointes : programme + devis (comme prévu dans le mail client) + convention adaptée pour relecture.</p>
<p style="margin:0 0 8px;color:#555;font-size:13px">——— Début du mail client ———</p>
${plainTextToHtml(clientBody)}
<p style="margin:24px 0 0;color:#555;font-size:13px">——— Fin du mail client ———</p>
<p style="margin:16px 0 0;font-size:13px;color:#555"><strong>Note convention</strong> : Article II ciblé taxi + moniteur / clientèle russophone ; Article VI FAFCEA sans acompte 150 €. Confirmez si on joint aussi la convention au client, ou seulement programme + devis.</p>
</td></tr>
</table>
</td></tr>
</table>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FLI — France Langues International <noreply@fli.fr>",
      to: [VALIDATION_TO],
      reply_to: [VALIDATION_TO],
      subject: validationSubject,
      html: validationHtml,
      attachments: [
        {
          filename: "Programme-formation-FLI-FAFCEA-2026-MAHIEU.pdf",
          content: bytesToBase64(programmeBytes),
        },
        {
          filename: devisFormationFilename(input.dossierCode),
          content: bytesToBase64(devisBytes),
        },
        {
          filename: "Convention-formation-FLI-FAFCEA-2026-MAHIEU.pdf",
          content: bytesToBase64(conventionBytes),
        },
      ],
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${text}`);
  }
  console.log("Envoyé à", VALIDATION_TO, text);
  writeFileSync(join(OUT_DIR, "resend-validation-response.json"), text);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
