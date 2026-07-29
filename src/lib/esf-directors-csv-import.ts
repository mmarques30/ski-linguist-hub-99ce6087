import { extractStation } from "@/lib/ski-school-partner-match";

export interface ParsedEsfDirectorRow {
  esf_code: string;
  school_name: string;
  civility: string | null;
  director_last_name: string;
  director_first_name: string;
  director_name: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  school_email: string | null;
  director_email: string | null;
  school_phone: string | null;
  director_phone: string | null;
  siret: string | null;
  cards_total: number | null;
  cards_active: number | null;
  region: string | null;
  station: string | null;
}

export interface EsfDirectorsImportPreview {
  totalRows: number;
  validRows: number;
  skippedRows: number;
  withDirectorEmail: number;
  withDirectorPhone: number;
  rows: ParsedEsfDirectorRow[];
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEmail(email: string): string | null {
  const cleaned = email
    .trim()
    .toLowerCase()
    .replace(/\u00a0/g, "")
    .replace(/[\u200b-\u200d\ufeff]/g, "");
  if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return null;
  return cleaned;
}

function normalizePhone(phone: string): string | null {
  const cleaned = phone.trim().replace(/\s+/g, " ");
  return cleaned || null;
}

function parseCsvLine(line: string, delimiter = ";"): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result;
}

function getColumn(row: Record<string, string>, ...candidates: string[]): string {
  for (const key of candidates) {
    if (row[key] !== undefined) return row[key] || "";
  }
  const normalized = Object.entries(row).find(([k]) =>
    candidates.some(
      (c) => k.toLowerCase().replace(/[^a-z]/g, "") === c.toLowerCase().replace(/[^a-z]/g, "")
    )
  );
  return normalized?.[1] || "";
}

function isSeparatorRow(row: Record<string, string>): boolean {
  const school = getColumn(row, "Ecole", "École");
  return !school || school.startsWith("---") || school === "-----";
}

function buildDirectorName(civ: string, lastName: string, firstName: string): string {
  const parts = [civ, firstName, lastName].map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "—";
  return parts.join(" ");
}

function buildAddress(parts: string[], postalCode: string, city: string): string | null {
  const lines = parts.map((p) => p.trim()).filter(Boolean);
  if (postalCode.trim()) lines.push(postalCode.trim());
  if (city.trim()) lines.push(city.trim());
  return lines.length > 0 ? lines.join(", ") : null;
}

function parseIntOrNull(value: string): number | null {
  const n = parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export function parseEsfDirectorsCsv(text: string): EsfDirectorsImportPreview {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim());
  if (lines.length < 2) {
    return {
      totalRows: 0,
      validRows: 0,
      skippedRows: 0,
      withDirectorEmail: 0,
      withDirectorPhone: 0,
      rows: [],
    };
  }

  const headers = parseCsvLine(lines[0], ";");
  const rows: ParsedEsfDirectorRow[] = [];
  let skippedRows = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], ";");
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h.trim()] = (values[idx] || "").trim();
    });

    if (isSeparatorRow(raw)) {
      skippedRows++;
      continue;
    }

    const schoolName = getColumn(raw, "Ecole", "École");
    const esfCode = getColumn(raw, "ESF");
    if (!schoolName || !esfCode) {
      skippedRows++;
      continue;
    }

    const civ = getColumn(raw, "Civ.");
    const lastName = getColumn(raw, "Nom");
    const firstName = getColumn(raw, "Prénom", "Prenom", "Pr\x8enom", "Prðn");
    const directorEmail =
      normalizeEmail(getColumn(raw, "Courriel Dir.", "Courriel Dir")) ||
      normalizeEmail(getColumn(raw, "Courriel ESF"));
    const directorPhone =
      normalizePhone(getColumn(raw, "Portable directeur")) ||
      normalizePhone(getColumn(raw, "Tél. E", "Tel. E", "T\x8el. E"));

    rows.push({
      esf_code: esfCode,
      school_name: schoolName,
      civility: civ || null,
      director_last_name: lastName,
      director_first_name: firstName,
      director_name: buildDirectorName(civ, lastName, firstName),
      address: buildAddress(
        [
          getColumn(raw, "Adresse1"),
          getColumn(raw, "Adresse2"),
          getColumn(raw, "Adresse3"),
        ],
        getColumn(raw, "Code postal"),
        getColumn(raw, "Ville")
      ),
      postal_code: getColumn(raw, "Code postal") || null,
      city: getColumn(raw, "Ville") || null,
      school_email: normalizeEmail(getColumn(raw, "Courriel ESF")),
      director_email: directorEmail,
      school_phone: normalizePhone(getColumn(raw, "Tél. E", "Tel. E")),
      director_phone: directorPhone,
      siret: getColumn(raw, "Siret ESF") || null,
      cards_total: parseIntOrNull(getColumn(raw, "Cartes")),
      cards_active: parseIntOrNull(getColumn(raw, "Cartes actifs")),
      region: getColumn(raw, "Région", "Region", "R\x8egi", "Rðgi") || null,
      station: extractStation(schoolName) || (getColumn(raw, "Ville") ? normalizeText(getColumn(raw, "Ville")) : null),
    });
  }

  return {
    totalRows: lines.length - 1,
    validRows: rows.length,
    skippedRows,
    withDirectorEmail: rows.filter((r) => r.director_email).length,
    withDirectorPhone: rows.filter((r) => r.director_phone).length,
    rows,
  };
}

export function buildPartnerNotes(row: ParsedEsfDirectorRow): string {
  const parts = [`Import BD ESF (code ${row.esf_code})`];
  if (row.region) parts.push(`Région: ${row.region}`);
  if (row.siret) parts.push(`SIRET: ${row.siret}`);
  if (row.cards_total != null) parts.push(`Cartes: ${row.cards_active ?? "?"}/${row.cards_total}`);
  if (row.school_email && row.school_email !== row.director_email) {
    parts.push(`Courriel école: ${row.school_email}`);
  }
  return parts.join(" | ");
}

export function scoreEsfPartnerNameMatch(csvName: string, partnerName: string): number {
  const a = normalizeText(csvName);
  const b = normalizeText(partnerName);
  if (!a || !b) return 0;
  if (a === b) return 100;

  const strip = (s: string) =>
    s
      .replace(/^esf\s+/, "")
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/\s+-\s+.+$/, "")
      .trim();

  const aCore = strip(a);
  const bCore = strip(b);
  if (aCore === bCore) return 95;
  if (aCore.includes(bCore) || bCore.includes(aCore)) return 85;

  const aTokens = new Set(aCore.split(" ").filter((t) => t.length > 2));
  const bTokens = new Set(bCore.split(" ").filter((t) => t.length > 2));
  const overlap = [...aTokens].filter((t) => bTokens.has(t)).length;
  if (overlap >= 2) return 60 + overlap * 10;
  if (overlap === 1 && aTokens.size <= 2) return 55;
  return 0;
}
