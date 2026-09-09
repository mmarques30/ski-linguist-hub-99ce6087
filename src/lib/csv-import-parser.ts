/**
 * Parseur CSV standard FLI pour /admin/import.
 * Règles : délimiteur `;`, utf-8-sig (BOM), décimales à virgule,
 * espaces insécables (\u00a0) comme séparateurs de milliers.
 */

export type CsvRow = Record<string, string>;

export interface ParseCsvResult {
  headers: string[];
  rows: CsvRow[];
  encodingNotes: string[];
}

/** Retire BOM UTF-8 si présent. */
export function stripUtf8Bom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
  if (text.startsWith("\uFEFF")) return text.slice(1);
  return text;
}

/**
 * Convertit une valeur numérique française en number.
 * Ex. "1 234,56" / "1\u00a0234,56" → 1234.56
 */
export function parseFrenchNumber(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s || s === "-" || s.toUpperCase() === "N/A") return null;

  // Espaces classiques + NBSP + narrow NBSP
  s = s.replace(/[\s\u00a0\u202f]/g, "");
  // Si virgule et point : on considère le dernier séparateur comme décimal
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    s = s.replace(",", ".");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseCsvLine(line: string, delimiter = ";"): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
        continue;
      }
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

/**
 * Parse un CSV texte (déjà décodé en string JS).
 * Délimiteur par défaut `;`. Gère les champs multilignes entre guillemets.
 */
export function parseCsvText(text: string, delimiter = ";"): ParseCsvResult {
  const encodingNotes: string[] = [];
  const cleaned = stripUtf8Bom(text.replace(/\r\n/g, "\n").replace(/\r/g, "\n"));
  if (text !== cleaned && text.charCodeAt(0) === 0xfeff) {
    encodingNotes.push("BOM UTF-8 retiré (utf-8-sig)");
  }

  const lines = cleaned.split("\n");
  if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) {
    return { headers: [], rows: [], encodingNotes };
  }

  // Reconstituer les lignes logiques (guillemets ouverts)
  const logicalLines: string[] = [];
  let buffer = "";
  let inQuotes = false;
  for (const line of lines) {
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes;
    }
    buffer = buffer ? `${buffer}\n${line}` : line;
    if (!inQuotes) {
      if (buffer.trim()) logicalLines.push(buffer);
      buffer = "";
    }
  }
  if (buffer.trim()) logicalLines.push(buffer);

  if (logicalLines.length === 0) {
    return { headers: [], rows: [], encodingNotes };
  }

  const headers = parseCsvLine(logicalLines[0], delimiter).map((h) => h.trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < logicalLines.length; i++) {
    const values = parseCsvLine(logicalLines[i], delimiter);
    // Ignorer lignes totalement vides
    if (values.every((v) => !v.trim())) continue;
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").trim();
    });
    rows.push(row);
  }

  // Avertissement si le fichier semble être en virgule seule
  if (headers.length <= 1 && cleaned.includes(",") && !cleaned.includes(";")) {
    encodingNotes.push(
      "Une seule colonne détectée avec délimiteur ';'. Le fichier semble utiliser des virgules — vérifiez le format (attendu : point-virgule)."
    );
  }

  return { headers, rows, encodingNotes };
}

/** Décode un File en texte en forçant UTF-8 (BOM géré ensuite). */
export async function readCsvFileAsText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return new TextDecoder("utf-8").decode(buffer);
}

export function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["\uFEFF" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Échappe une cellule CSV (séparateur `;`). */
export function csvEscape(value: string): string {
  const needsQuotes = /[;"\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function buildRejectionCsv(
  rejections: Array<{ lineNumber: number; reason: string; raw?: CsvRow }>
): string {
  const header = ["ligne", "motif", "donnees_brutes"];
  const lines = [header.join(";")];
  for (const r of rejections) {
    const raw = r.raw ? JSON.stringify(r.raw) : "";
    lines.push(
      [String(r.lineNumber), csvEscape(r.reason), csvEscape(raw)].join(";")
    );
  }
  return lines.join("\n");
}
