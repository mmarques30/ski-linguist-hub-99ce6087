/**
 * Régénère convention + programme PDF pour Florence Guillemot (FLI-260047).
 * 14/10/2026 : passage 18 h / 900 € → 12 h / 600 €, adresse Messanges,
 * début 16/11/2026, fin + 4 mois (16/03/2027).
 *
 * Usage : ./node_modules/.bin/tsx scripts/generate-fifpl-docs-florence-guillemot.mts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
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
const outDir = "/opt/cursor/artifacts/florence-guillemot";

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
  code: "FLI-260047",
  language: "Russe",
  start_date: "2026-11-16",
  end_date: "2027-03-16",
  duration_hours: 12,
  course_location: "Google Meet",
  modality: "en_ligne",
  price: 600,
  deposit_amount: 150,
  balance_after_deposit: 450,
  group_size: 1,
  funding_organization: "FIFPL",
  payment_method: null as string | null,
  dates_to_confirm: true,
  schedule: "Le planning sera établi directement avec le formateur.",
  student: {
    civility: "Madame",
    first_name: "Florence",
    last_name: "Guillemot",
    street_address: "340 chemin du moulin",
    postal_code: "40660",
    city: "Messanges",
    email: "floxguillemot@gmail.com",
    phone: "06 89 77 62 31",
    company: null as string | null,
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
for (const [name, bytes] of [
  [cName, conventionBytes],
  [pName, programmeBytes],
] as const) {
  writeFileSync(join(outDir, name), bytes);
  console.log("wrote", join(outDir, name), bytes.length);
}

writeFileSync(
  join(outDir, "FLI-260047-meta.json"),
  JSON.stringify(
    {
      code: row.code,
      duration_hours: row.duration_hours,
      price: row.price,
      start_date: row.start_date,
      end_date: row.end_date,
      dates_to_confirm: row.dates_to_confirm,
      address: `${row.student.street_address}, ${row.student.postal_code} ${row.student.city}`,
      files: [cName, pName],
    },
    null,
    2,
  ),
);
console.log("done");
