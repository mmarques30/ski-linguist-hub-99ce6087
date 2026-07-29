export interface ParsedFormResponseRow {
  submitted_at: string | null;
  score_correct: number | null;
  score_total: number | null;
  score_display: string | null;
  full_name: string;
  first_name: string;
  last_name: string;
  civility: string | null;
  email: string | null;
  phone: string | null;
  street_address: string | null;
  postal_code: string | null;
  city: string | null;
  profession: string | null;
  funding_type: string | null;
  self_assessed_level: string | null;
  previous_evaluation: string | null;
  english_intro: string | null;
  certification_type: string | null;
  ski_school_name: string | null;
  modality: string | null;
  language: string;
  course_location: string | null;
  expectations: string | null;
  payment_preference: string | null;
  handicap: string | null;
  test_answers: Record<string, string>;
  match_keys: {
    email: string | null;
    name: string;
    phone: string | null;
    location_key: string | null;
    language_key: string;
  };
}

export interface FliFormResponsesImportPreview {
  totalRows: number;
  deduplicatedRows: number;
  skippedDuplicates: number;
  withEmail: number;
  withTestAnswers: number;
  withScore: number;
  byLanguage: Record<string, number>;
  rows: ParsedFormResponseRow[];
}

const META_HEADERS = new Set([
  "Horodateur",
  "Score",
  "Nom",
  "Civilité",
  "Adresse postale",
  "Code postal",
  "Ville",
  "Numéro de portable",
  "Adresse mail",
  "Profession",
  "Modalité de financement de la formation",
  "Connaissez-vous votre niveau d'anglais selon le Baréme Européan? Si oui, merci de nous indiquer:",
  "Est ce que vous utilisez l'anglais dans votre quotidien professionnel?",
  "Merci de vous présenter en Anglais, à l'écrit.",
  "École de ski",
  "Modalité de formation",
  "Langue et stage",
  "Durée de la formation",
  "En quelques mots, quelles sont vos attentes pour la formation? ",
  "Comment aimerez vous régler vos frais d'inscription ?",
  "Quelles sont vos attenttes pour cette formation ?",
  "Quelle certification souhaitez-vous ?",
  "Quelle formule de cours envisagez-vous ?",
  "Êtes-vous en situation de handicap et souhaitez-vous être contacté·e par notre référent handicap pour étudier d'éventuelles adaptations ?",
  "Adresse e-mail",
  "Prénom",
  "Date de naissance",
  "Protection de vos données personnelles",
  "Name",
  "Email",
  "Approver signature 1",
  "150€",
  "Colonne 122",
]);

function parseCsvLine(line: string, delimiter = ","): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
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

function parseCsvRows(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];

  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xfeff) headerLine = headerLine.slice(1);

  const headers = parseCsvLine(headerLine, ",").map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  let buffer = "";
  let inQuotes = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line && !buffer) continue;

    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes;
    }
    buffer = buffer ? `${buffer}\n${line}` : line;

    if (!inQuotes) {
      const values = parseCsvLine(buffer, ",");
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = (values[idx] || "").trim();
      });
      rows.push(row);
      buffer = "";
      inQuotes = false;
    }
  }

  if (buffer) {
    const values = parseCsvLine(buffer, ",");
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || "").trim();
    });
    rows.push(row);
  }

  return rows;
}

function isEmpty(value: string | null | undefined): boolean {
  return !value || value === "-" || value.toUpperCase() === "N/A";
}

function getColumn(row: Record<string, string>, ...candidates: string[]): string {
  for (const key of candidates) {
    if (row[key] !== undefined) return row[key] || "";
  }
  const normalized = Object.entries(row).find(([k]) =>
    candidates.some(
      (c) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === c.toLowerCase().replace(/[^a-z0-9]/g, "")
    )
  );
  return normalized?.[1] || "";
}

function getFirstNonEmpty(row: Record<string, string>, prefix: string): string {
  return (
    Object.entries(row)
      .filter(([k]) => k.toLowerCase().startsWith(prefix.toLowerCase()))
      .map(([, v]) => v)
      .find((v) => !isEmpty(v)) || ""
  );
}

function normalizeEmail(email: string): string | null {
  const cleaned = email.trim().toLowerCase();
  if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return null;
  return cleaned;
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 9) return null;
  return digits.slice(-9);
}

function parseFullName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "—", last_name: "—" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "—" };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

function parseScore(value: string): { correct: number | null; total: number | null; display: string | null } {
  const cleaned = value.trim();
  const match = cleaned.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) return { correct: null, total: null, display: isEmpty(cleaned) ? null : cleaned };
  return {
    correct: Number(match[1]),
    total: Number(match[2]),
    display: `${match[1]} / ${match[2]}`,
  };
}

function parseFrenchTimestamp(value: string): string | null {
  const cleaned = value.trim();
  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, d, m, y, hh, mm, ss] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${hh.padStart(2, "0")}:${mm}:${ss}`;
}

export function mapFormLanguage(value: string): string {
  const map: Record<string, string> = {
    anglais: "Anglais",
    "portugais bresilien": "Portugais",
    "portugais brésilien": "Portugais",
    neerlandais: "Néerlandais",
    néerlandais: "Néerlandais",
    russe: "Russe",
    francais: "Français",
    français: "Français",
    "fle (francais langue etrangere)": "Français",
    "fle (français langue étrangère)": "Français",
  };
  const key = value.trim().toLowerCase();
  return map[key] || value.trim();
}

function detectLanguageFromAnswers(testAnswers: Record<string, string>): string | null {
  const keys = Object.keys(testAnswers).join(" ").toLowerCase();
  if (keys.includes("my brother") || keys.includes("bindings")) return "Anglais";
  if (keys.includes("minha irmã") || keys.includes("calcanhar")) return "Portugais";
  if (keys.includes("mijn broer") || keys.includes("eekhoorn")) return "Néerlandais";
  if (keys.includes("comment t") || keys.includes("collègue")) return "Français";
  if (keys.includes("лыж") || keys.includes("трасса")) return "Russe";
  return null;
}

function extractLocationKey(location: string): string | null {
  if (isEmpty(location)) return null;
  const normalized = location
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stations = [
    "courchevel",
    "samoens",
    "samoens",
    "aime",
    "morzine",
    "chatel",
    "valmorel",
    "menuires",
    "les menuires",
    "la rosiere",
    "oz en oisans",
    "val disere",
    "val d isere",
    "clusaz",
    "grand bornand",
    "les gets",
    "vaujany",
    "pralognan",
    "tignes",
    "val thorens",
    "meribel",
    "chamonix",
    "flaine",
    "avoriaz",
    "serre chevalier",
    "alpe d huez",
    "bourg d oisans",
    "saint gervais",
    "megeve",
    "val cenis",
    "les arcs",
    "la plagne",
    "valmeinier",
    "les carroz",
    "morillon",
    "sixt",
    "sallanches",
    "briancon",
    "gap",
    "montvalezan",
    "la norma",
    "orelle",
    "la toussuire",
    "saint sorlin",
    "saint jean de maurienne",
    "les avanchers",
    "la lechere",
    "les belleville",
    "valfrejus",
    "brides les bains",
    "les deux alpes",
    "auris",
  ];

  const found = stations.find((s) => normalized.includes(s.replace(/ /g, "")) || normalized.includes(s));
  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  const monthMatch = normalized.match(/\b(0?[1-9]|1[0-2])\b/);
  const parts = [found || normalized.split(" ").slice(0, 3).join(" "), yearMatch?.[1], monthMatch?.[1]].filter(Boolean);
  return parts.join("|") || normalized.slice(0, 40);
}

function mapModality(value: string): string | null {
  const v = value.toLowerCase();
  if (v.includes("ligne") || v.includes("zoom") || v.includes("individualis")) return "en_ligne";
  if (v.includes("présentiel") || v.includes("presentiel") || v.includes("stage")) return "presentiel";
  return null;
}

function extractTestAnswers(row: Record<string, string>): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (META_HEADERS.has(key)) continue;
    if (key.startsWith("Certification")) continue;
    if (key.startsWith("Langue souhaitée")) continue;
    if (key.startsWith("Lieu et date de formation")) continue;
    if (key.startsWith("Si vous avez déjà été évalué")) continue;
    if (!isEmpty(value)) answers[key] = value;
  }
  return answers;
}

function rowQuality(row: ParsedFormResponseRow): number {
  let score = 0;
  if (row.email) score += 100;
  if (row.score_correct !== null) score += 50;
  score += Object.keys(row.test_answers).length;
  if (row.course_location) score += 10;
  if (row.submitted_at) score += 5;
  return score;
}

function dedupeKey(row: ParsedFormResponseRow): string {
  const person = row.match_keys.email || `${row.match_keys.name}|${row.match_keys.phone || ""}`;
  return `${person}|${row.match_keys.language_key}|${row.match_keys.location_key || "any"}`;
}

function rowToParsed(row: Record<string, string>): ParsedFormResponseRow | null {
  const fullName = getColumn(row, "Nom").trim();
  if (!fullName) return null;

  const email =
    normalizeEmail(getColumn(row, "Adresse mail")) ||
    normalizeEmail(getColumn(row, "Adresse e-mail")) ||
    normalizeEmail(getColumn(row, "Email"));

  const explicitLanguage = getFirstNonEmpty(row, "Langue souhaitée");
  const testAnswers = extractTestAnswers(row);
  const detectedLanguage = detectLanguageFromAnswers(testAnswers);
  const language = mapFormLanguage(explicitLanguage || detectedLanguage || "Anglais");

  const courseLocation = getFirstNonEmpty(row, "Lieu et date de formation") || null;
  const score = parseScore(getColumn(row, "Score"));
  const { first_name, last_name } = parseFullName(fullName);

  const expectations = [
    getColumn(row, "En quelques mots, quelles sont vos attentes pour la formation? "),
    getColumn(row, "Quelles sont vos attenttes pour cette formation ?"),
  ]
    .filter((v) => !isEmpty(v))
    .join("\n");

  return {
    submitted_at: parseFrenchTimestamp(getColumn(row, "Horodateur")),
    score_correct: score.correct,
    score_total: score.total,
    score_display: score.display,
    full_name: fullName,
    first_name,
    last_name,
    civility: isEmpty(getColumn(row, "Civilité")) ? null : getColumn(row, "Civilité"),
    email,
    phone: isEmpty(getColumn(row, "Numéro de portable")) ? null : getColumn(row, "Numéro de portable"),
    street_address: isEmpty(getColumn(row, "Adresse postale")) ? null : getColumn(row, "Adresse postale"),
    postal_code: isEmpty(getColumn(row, "Code postal")) ? null : getColumn(row, "Code postal"),
    city: isEmpty(getColumn(row, "Ville")) ? null : getColumn(row, "Ville"),
    profession: isEmpty(getColumn(row, "Profession")) ? null : getColumn(row, "Profession"),
    funding_type: isEmpty(getColumn(row, "Modalité de financement de la formation"))
      ? null
      : getColumn(row, "Modalité de financement de la formation"),
    self_assessed_level: isEmpty(
      getColumn(row, "Connaissez-vous votre niveau d'anglais selon le Baréme Européan? Si oui, merci de nous indiquer:")
    )
      ? null
      : getColumn(row, "Connaissez-vous votre niveau d'anglais selon le Baréme Européan? Si oui, merci de nous indiquer:"),
    previous_evaluation: getFirstNonEmpty(row, "Si vous avez déjà été évalué") || null,
    english_intro: isEmpty(getColumn(row, "Merci de vous présenter en Anglais, à l'écrit."))
      ? null
      : getColumn(row, "Merci de vous présenter en Anglais, à l'écrit."),
    certification_type: getFirstNonEmpty(row, "Certification") || getColumn(row, "Quelle certification souhaitez-vous ?") || null,
    ski_school_name: isEmpty(getColumn(row, "École de ski")) ? null : getColumn(row, "École de ski"),
    modality: mapModality(getColumn(row, "Modalité de formation") || getColumn(row, "Quelle formule de cours envisagez-vous ?")),
    language,
    course_location: courseLocation,
    expectations: expectations || null,
    payment_preference: isEmpty(getColumn(row, "Comment aimerez vous régler vos frais d'inscription ?"))
      ? null
      : getColumn(row, "Comment aimerez vous régler vos frais d'inscription ?"),
    handicap: isEmpty(
      getColumn(
        row,
        "Êtes-vous en situation de handicap et souhaitez-vous être contacté·e par notre référent handicap pour étudier d'éventuelles adaptations ?"
      )
    )
      ? null
      : getColumn(
          row,
          "Êtes-vous en situation de handicap et souhaitez-vous être contacté·e par notre référent handicap pour étudier d'éventuelles adaptations ?"
        ),
    test_answers: testAnswers,
    match_keys: {
      email,
      name: normalizeName(fullName),
      phone: normalizePhone(getColumn(row, "Numéro de portable")),
      location_key: extractLocationKey(courseLocation || ""),
      language_key: language.toLowerCase(),
    },
  };
}

export function deduplicateFormResponses(rows: ParsedFormResponseRow[]): ParsedFormResponseRow[] {
  const bestByKey = new Map<string, ParsedFormResponseRow>();

  for (const row of rows) {
    const key = dedupeKey(row);
    const existing = bestByKey.get(key);
    if (!existing) {
      bestByKey.set(key, row);
      continue;
    }

    const currentQuality = rowQuality(row);
    const existingQuality = rowQuality(existing);
    if (currentQuality > existingQuality) {
      bestByKey.set(key, row);
      continue;
    }
    if (currentQuality === existingQuality) {
      const currentDate = row.submitted_at || "";
      const existingDate = existing.submitted_at || "";
      if (currentDate > existingDate) bestByKey.set(key, row);
    }
  }

  return Array.from(bestByKey.values());
}

export function parseFliFormResponsesCsv(text: string): FliFormResponsesImportPreview {
  const rawRows = parseCsvRows(text);
  const parsedRows = rawRows.map(rowToParsed).filter((r): r is ParsedFormResponseRow => r !== null);
  const deduped = deduplicateFormResponses(parsedRows);
  const byLanguage: Record<string, number> = {};

  for (const row of deduped) {
    byLanguage[row.language] = (byLanguage[row.language] || 0) + 1;
  }

  return {
    totalRows: rawRows.length,
    deduplicatedRows: deduped.length,
    skippedDuplicates: parsedRows.length - deduped.length,
    withEmail: deduped.filter((r) => r.email).length,
    withTestAnswers: deduped.filter((r) => Object.keys(r.test_answers).length > 0).length,
    withScore: deduped.filter((r) => r.score_correct !== null).length,
    byLanguage,
    rows: deduped,
  };
}

export function normalizeLanguageForMatch(language: string): string {
  const key = language.toLowerCase();
  if (key.includes("portug")) return "portugais";
  if (key.includes("angl")) return "anglais";
  if (key.includes("neer") || key.includes("néer")) return "neerlandais";
  if (key.includes("russ")) return "russe";
  if (key.includes("fran")) return "francais";
  return key;
}

export function scoreInscriptionMatch(
  row: ParsedFormResponseRow,
  inscription: {
    language: string;
    course_location: string | null;
    start_date: string;
    end_date: string;
    modality: string | null;
  }
): number {
  let score = 0;
  const rowLang = normalizeLanguageForMatch(row.language);
  const inscLang = normalizeLanguageForMatch(inscription.language);
  if (rowLang === inscLang) score += 40;
  else if (rowLang.includes(inscLang) || inscLang.includes(rowLang)) score += 20;

  if (row.course_location && inscription.course_location) {
    const rowLoc = extractLocationKey(row.course_location) || "";
    const inscLoc = extractLocationKey(inscription.course_location) || "";
    if (rowLoc && inscLoc && (rowLoc.includes(inscLoc.split("|")[0]) || inscLoc.includes(rowLoc.split("|")[0]))) {
      score += 35;
    }
  }

  if (row.submitted_at && inscription.start_date) {
    const submittedYear = row.submitted_at.slice(0, 4);
    const startYear = inscription.start_date.slice(0, 4);
    if (submittedYear === startYear || Number(startYear) - Number(submittedYear) <= 1) score += 15;
  }

  if (row.modality && inscription.modality && row.modality === inscription.modality) score += 10;

  return score;
}
