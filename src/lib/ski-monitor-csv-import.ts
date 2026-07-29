export interface ParsedSkiMonitorRow {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  home_station: string | null;
  status: "active" | "unsubscribed";
  notes: string | null;
  source_liste: string | null;
}

export interface SkiMonitorImportPreview {
  totalRows: number;
  uniqueEmails: number;
  duplicatesSkipped: number;
  active: number;
  unsubscribed: number;
  withStation: number;
  invalidEmails: number;
  rows: ParsedSkiMonitorRow[];
}

const STATUS_PRIORITY: Record<string, number> = {
  active: 3,
  unsubscribed: 2,
};

function normalizeEmail(email: string): string | null {
  const cleaned = email.trim().toLowerCase();
  if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return null;
  return cleaned;
}

function mapStatus(raw: string): "active" | "unsubscribed" {
  const s = raw.trim().toLowerCase();
  if (s === "active") return "active";
  return "unsubscribed";
}

function parseName(
  name: string,
  nom?: string,
  prenom?: string
): { first_name: string; last_name: string } {
  const nomClean = (nom || "").trim();
  const prenomClean = (prenom || "").trim();

  if (prenomClean && nomClean) {
    return { first_name: prenomClean, last_name: nomClean };
  }

  let cleaned = (name || "").trim();
  if (!cleaned && nomClean) {
    return { first_name: prenomClean || "—", last_name: nomClean };
  }
  if (!cleaned) {
    return { first_name: "—", last_name: "—" };
  }

  cleaned = cleaned
    .replace(/^(MR|MME|MLLE|M\.|MME\.|MONSIEUR|MADAME)\s+/i, "")
    .trim();

  const attentionMatch = cleaned.match(/attention de\s+(?:m\.|mme\.)?\s*(.+)/i);
  if (attentionMatch) {
    cleaned = attentionMatch[1].trim();
  }

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "—", last_name: "—" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "—" };
  if (parts.length === 2) {
    return { first_name: parts[1], last_name: parts[0] };
  }

  return {
    first_name: parts[parts.length - 1],
    last_name: parts.slice(0, -1).join(" "),
  };
}

function getColumn(row: Record<string, string>, ...candidates: string[]): string {
  for (const key of candidates) {
    if (row[key] !== undefined) return row[key] || "";
  }
  const normalized = Object.entries(row).find(([k]) =>
    candidates.some((c) => k.toLowerCase().replace(/[^a-z]/g, "") === c.toLowerCase().replace(/[^a-z]/g, ""))
  );
  return normalized?.[1] || "";
}

function mergeRows(
  preferred: ParsedSkiMonitorRow,
  other: ParsedSkiMonitorRow
): ParsedSkiMonitorRow {
  return {
    ...preferred,
    phone: preferred.phone || other.phone,
    home_station: preferred.home_station || other.home_station,
    first_name: preferred.first_name !== "—" ? preferred.first_name : other.first_name,
    last_name: preferred.last_name !== "—" ? preferred.last_name : other.last_name,
    notes: [preferred.notes, other.notes].filter(Boolean).join(" | ") || null,
    source_liste: preferred.source_liste || other.source_liste,
  };
}

function rowScore(row: ParsedSkiMonitorRow): number {
  let score = (STATUS_PRIORITY[row.status] || 0) * 10;
  if (row.home_station) score += 2;
  if (row.first_name !== "—" && row.last_name !== "—") score += 2;
  if (row.phone) score += 1;
  return score;
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

export function parseSkiMonitorCsv(text: string): SkiMonitorImportPreview {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim());
  if (lines.length < 2) {
    return {
      totalRows: 0,
      uniqueEmails: 0,
      duplicatesSkipped: 0,
      active: 0,
      unsubscribed: 0,
      withStation: 0,
      invalidEmails: 0,
      rows: [],
    };
  }

  const headers = parseCsvLine(lines[0], ";");
  const rawRows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], ";");
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || "").trim();
    });
    rawRows.push(row);
  }

  const byEmail = new Map<string, ParsedSkiMonitorRow>();
  let invalidEmails = 0;

  for (const row of rawRows) {
    const email = normalizeEmail(getColumn(row, "Email Address", "email", "Email"));
    if (!email) {
      invalidEmails++;
      continue;
    }

    const name = getColumn(row, "Name", "name");
    const nom = getColumn(row, "Nom", "NOM", "nom");
    const prenom = getColumn(row, "Prénom", "Prenom", "Pr\x8enom");
    const { first_name, last_name } = parseName(name, nom, prenom);

    const station =
      getColumn(row, "station", "Station") ||
      getColumn(row, "ESF", "esf") ||
      getColumn(row, "VILLE", "Ville", "ville") ||
      null;

    const phone = getColumn(row, "Téléphone", "Telephone", "T\x8el\x8ephone") || null;
    const liste = getColumn(row, "liste", "Liste") || null;
    const esf = getColumn(row, "ESF", "esf");

    const parsed: ParsedSkiMonitorRow = {
      first_name,
      last_name,
      email,
      phone: phone || null,
      home_station: station || null,
      status: mapStatus(getColumn(row, "Status", "status")),
      source_liste: liste,
      notes: esf && esf !== station ? `ESF: ${esf}` : null,
    };

    const existing = byEmail.get(email);
    if (!existing) {
      byEmail.set(email, parsed);
    } else if (rowScore(parsed) > rowScore(existing)) {
      byEmail.set(email, mergeRows(parsed, existing));
    } else {
      byEmail.set(email, mergeRows(existing, parsed));
    }
  }

  const rows = Array.from(byEmail.values());
  const active = rows.filter((r) => r.status === "active").length;

  return {
    totalRows: rawRows.length,
    uniqueEmails: rows.length,
    duplicatesSkipped: rawRows.length - invalidEmails - rows.length,
    active,
    unsubscribed: rows.length - active,
    withStation: rows.filter((r) => r.home_station).length,
    invalidEmails,
    rows,
  };
}
