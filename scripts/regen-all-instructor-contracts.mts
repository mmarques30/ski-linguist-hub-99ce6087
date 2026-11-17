/**
 * Régénère tous les contrats formateur CTR-2026-* (modèle ponctuel complet).
 * Lit la liste JSON fournie (export ops) et écrit les PDF + met à jour Storage si --upload.
 *
 * Usage:
 *   npx tsx scripts/regen-all-instructor-contracts.mts /path/to/contracts.json
 *   npx tsx scripts/regen-all-instructor-contracts.mts /path/to/contracts.json --upload
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  FORMATEUR_CONTRACT_LETTERHEAD_ASSET,
  FORMATEUR_CONTRACT_SIGNATURE_ASSET,
  FORMATEUR_CONTRACT_SIGNATURE_FALLBACK,
  buildInstructorContractPdf,
  buildPrestataireAddressLines,
  instructorContractFilename,
} from "../src/lib/instructor-contract-pdf.ts";

type Row = {
  contract_number: string;
  instructor_id: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  hourly_rate: number;
  location: string;
  student_or_company: string;
  civilite?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  siret?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  tax_status?: string | null;
  volume_note?: string | null;
  modality?: "online_individual" | "station_group";
  issued_at_label?: string | null;
};

const OUT = "/opt/cursor/artifacts/instructor-contracts-full-model";
mkdirSync(OUT, { recursive: true });

function loadSignature(): Uint8Array {
  try {
    return new Uint8Array(
      readFileSync(join(process.cwd(), "public", FORMATEUR_CONTRACT_SIGNATURE_ASSET)),
    );
  } catch {
    return new Uint8Array(
      readFileSync(
        join(process.cwd(), "public", FORMATEUR_CONTRACT_SIGNATURE_FALLBACK),
      ),
    );
  }
}

function loadLetterhead(): Uint8Array {
  return new Uint8Array(
    readFileSync(join(process.cwd(), "public", FORMATEUR_CONTRACT_LETTERHEAD_ASSET)),
  );
}

function taxLabel(tax?: string | null): string | null {
  if (!tax) return null;
  if (tax === "auto_entrepreneur") return "auto-entrepreneur";
  return tax.replace(/_/g, " ");
}

function issuedTodayFr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error("Usage: regen-all-instructor-contracts.mts <contracts.json> [--upload]");
    process.exit(1);
  }
  const rows = JSON.parse(readFileSync(jsonPath, "utf8")) as Row[];
  const sig = loadSignature();
  const letterhead = loadLetterhead();
  const issued = issuedTodayFr();
  const meta = [];

  for (const row of rows) {
    const civilite = (row.civilite || "").trim() || "Madame/Monsieur";
    const fullName = `${(row.first_name || "").trim()} ${(row.last_name || "").trim()}`.trim();
    const prestataireCiviliteName = `${civilite} ${fullName}`.trim();
    const isStation =
      row.modality === "station_group" ||
      /stage|esf|val d|rosi[eè]re|samo/i.test(
        `${row.student_or_company} ${row.location}`,
      );
    const formationNature = isStation
      ? row.student_or_company
      : `Formation en ligne ${row.student_or_company}`;
    const pdf = await buildInstructorContractPdf({
      contractNumber: row.contract_number,
      prestataireCiviliteName,
      prestataireAddressLines: buildPrestataireAddressLines({
        address: row.address,
        postalCode: row.postal_code,
        city: row.city,
        siret: row.siret,
        email: row.email,
        phone: row.phone,
        statutLabel: taxLabel(row.tax_status),
      }),
      formationNature,
      volumeNote: row.volume_note,
      durationHours: Number(row.total_hours),
      hourlyRate: Number(row.hourly_rate),
      startDate: row.start_date,
      endDate: row.end_date,
      locationLabel: row.location,
      modality: isStation ? "station_group" : "online_individual",
      organismSignaturePng: sig,
      letterheadPng: letterhead,
      issuedAtLabel: row.issued_at_label || issued,
      prestataireSignName: fullName,
    });
    const filename = instructorContractFilename(
      row.contract_number,
      row.last_name || "formateur",
    );
    const path = join(OUT, filename);
    writeFileSync(path, pdf);
    meta.push({
      contract_number: row.contract_number,
      instructor_id: row.instructor_id,
      filename,
      path,
      bytes: pdf.byteLength,
    });
    console.log(filename, pdf.byteLength);
  }

  writeFileSync(join(OUT, "meta.json"), JSON.stringify(meta, null, 2));
  console.log(JSON.stringify({ out: OUT, count: meta.length }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
