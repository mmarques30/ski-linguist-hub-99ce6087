/**
 * Génère convention + programme PDF pour Didier (FLI-260021) et Michael (FLI-260022).
 * Usage : npx tsx scripts/generate-fifpl-docs-angelloz-colonna.mts
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
const mediaDir =
  "/cursor/stores/bc-1cf2a5ab-578b-4128-bafa-64d1c93e977b/media/inscriptions-angelloz-colonna";

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

type Row = {
  code: string;
  language: string;
  start_date: string;
  end_date: string;
  duration_hours: number;
  course_location: string;
  modality: string;
  price: number;
  deposit_amount: number;
  balance_after_deposit: number;
  group_size: number | null;
  funding_organization: string;
  payment_method: string | null;
  student: {
    civility: string | null;
    first_name: string | null;
    last_name: string | null;
    street_address: string | null;
    postal_code: string | null;
    city: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
  };
};

const rows: Row[] = [
  {
    code: "FLI-260021",
    language: "Italien",
    start_date: "2026-10-12",
    end_date: "2026-12-20",
    duration_hours: 18,
    course_location: "Google Meet",
    modality: "en_ligne",
    price: 900,
    deposit_amount: 150,
    balance_after_deposit: 750,
    group_size: null,
    funding_organization: "FIFPL",
    payment_method: null,
    student: {
      civility: "Monsieur",
      first_name: "Didier",
      last_name: "Angelloz Nicoud",
      street_address: "3 impasse l arc en ciel",
      postal_code: "74330",
      city: "la balme e sillingy",
      email: "angellozdid@sfr.fr",
      phone: "621866613",
      company: null,
    },
  },
  {
    code: "FLI-260022",
    language: "Russe",
    start_date: "2026-10-12",
    end_date: "2027-03-31",
    duration_hours: 12,
    course_location: "Google Meet",
    modality: "en_ligne",
    price: 600,
    deposit_amount: 150,
    balance_after_deposit: 450,
    group_size: null,
    funding_organization: "FIFPL",
    payment_method: null,
    student: {
      civility: "Monsieur",
      first_name: "Michael",
      last_name: "colonna cesari",
      street_address: "195 chemin de beaumont",
      postal_code: "31600",
      city: "eaunes",
      email: "colonna.michael@hotmail.fr",
      phone: "06 16 01 48 55",
      company: null,
    },
  },
];

mkdirSync(outDir, { recursive: true });
mkdirSync(mediaDir, { recursive: true });

const written: string[] = [];

for (const row of rows) {
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
  for (const [name, bytes] of [
    [cName, conventionBytes],
    [pName, programmeBytes],
  ] as const) {
    const artifactPath = join(outDir, name);
    const mediaPath = join(mediaDir, name);
    writeFileSync(artifactPath, bytes);
    copyFileSync(artifactPath, mediaPath);
    written.push(`${name} ${bytes.byteLength}`);
    console.log("wrote", artifactPath, bytes.byteLength);
  }
}

console.log(JSON.stringify({ ok: true, written }, null, 2));
