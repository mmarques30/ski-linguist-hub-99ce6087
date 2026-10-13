/**
 * Convention + programme pour Christelle Gaidet (FLI-260027) — La Rosière 40 h / 1 500 €.
 * Part moniteur : chèque FIF-PL 900 € ; solde ESF : 600 €.
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
  code: "FLI-260027",
  language: "Portugais",
  start_date: "2026-11-30",
  end_date: "2026-12-11",
  duration_hours: 40,
  course_location: "ESF La Rosière",
  modality: "presentiel",
  price: 1500,
  deposit_amount: null as number | null,
  balance_after_deposit: 900,
  group_size: 8,
  funding_organization: "FIFPL",
  payment_method: "cheque_fifpl_ecole",
  student: {
    civility: null as string | null,
    first_name: "Christelle",
    last_name: "Gaidet",
    street_address: "447 toute des Etaves",
    postal_code: "73700",
    city: "Montvalezan",
    email: "chrisg73@orange.fr",
    phone: "0685923468",
    company: "ESF La Rosière",
  },
};

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

writeFileSync(
  join(outDir, "fli-260027-gaidet-proof.txt"),
  [
    `code=${row.code}`,
    `duration=${row.duration_hours}`,
    `price=${row.price}`,
    `cheque_moniteur=900`,
    `facture_esf=600`,
    `status=independant`,
    `other_fifpl_2026=non`,
    `paymentTerms=${conventionModel.paymentTermsLabel}`,
    `convention=${cName} ${conventionBytes.byteLength}`,
    `programme=${pName} ${programmeBytes.byteLength}`,
  ].join("\n") + "\n",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      paymentTerms: conventionModel.paymentTermsLabel,
      written: [cName, pName, ...staticDocs.map((d) => d.dest)],
    },
    null,
    2,
  ),
);
