export interface ParsedFliInscriptionRow {
  modality: string | null;
  course_type: string | null;
  max_participants: string | null;
  status: string;
  company: string | null;
  first_name: string;
  last_name: string;
  civility: string | null;
  street_address: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
  email: string;
  language: string;
  instructor_name: string | null;
  instructor_email: string | null;
  instructor_phone: string | null;
  course_location: string | null;
  course_address: string | null;
  certification_type: string | null;
  start_date: string;
  end_date: string;
  duration_hours: number | null;
  duration_days: number | null;
  hours_per_day: number | null;
  pedagogical_cost: number | null;
  price: number | null;
  rhythm: string | null;
  entry_test_score: string | null;
  entry_level: string | null;
  group_name: string | null;
  schedule: string | null;
  final_general_level: string | null;
  final_specific_level: string | null;
  certification_date: string | null;
  certification_result: string | null;
  expectations: string | null;
  observations: string | null;
  code: string | null;
  status_final: string | null;
  qualiopi: string | null;
  ski_school_name: string | null;
  ski_school_director: string | null;
  ski_school_director_phone: string | null;
  instructor_accommodation_dates: string | null;
  instructor_accommodation_address: string | null;
  instructor_accommodation_notes: string | null;
}

export interface FliInscriptionsImportPreview {
  totalRows: number;
  importableInscriptions: number;
  skippedRows: number;
  uniqueStudents: number;
  uniqueMonitorContacts: number;
  withSkiSchool: number;
  byStatus: Record<string, number>;
  rows: ParsedFliInscriptionRow[];
  monitorContacts: Array<{
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    home_station: string | null;
    company: string | null;
    ski_school_name: string | null;
  }>;
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

function parseCsvLine(line: string, delimiter = ";"): string[] {
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

  const headers = parseCsvLine(lines[0], ";").map((h) => h.trim());
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
      const values = parseCsvLine(buffer, ";");
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
    const values = parseCsvLine(buffer, ";");
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || "").trim();
    });
    rows.push(row);
  }

  return rows;
}

function isEmpty(value: string): boolean {
  return !value || value === "-" || value.toUpperCase() === "N/A";
}

function parseFrenchDate(value: string): string | null {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const m = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const month = m[2].padStart(2, "0");
  let year = m[3];
  if (year.length === 2) year = `20${year}`;
  return `${year}-${month}-${day}`;
}

function parseNumber(value: string): number | null {
  if (isEmpty(value)) return null;
  const normalized = value.replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function normalizeEmail(email: string): string | null {
  const cleaned = email.trim().toLowerCase();
  if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return null;
  return cleaned;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function parseFullName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "—", last_name: "—" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "—" };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

function mapModality(value: string): string | null {
  const v = value.toLowerCase();
  if (v.includes("ligne")) return "en_ligne";
  if (v.includes("sentiel")) return "presentiel";
  return null;
}

function mapLanguage(value: string): string {
  const map: Record<string, string> = {
    "portugais bresilien": "Portugais",
    "portugais brésilien": "Portugais",
    "fle (francais langue etrangere)": "Français",
    "fle (français langue étrangère)": "Français",
  };
  const key = value.trim().toLowerCase();
  return map[key] || value.trim();
}

export function mapFliInscriptionStatus(status: string, statusFinal: string, endDate: string | null): string {
  const raw = `${status} ${statusFinal}`.toLowerCase();
  if (raw.includes("annul")) return "annulee";
  if (raw.includes("factur")) return "facturee";
  if (raw.includes("formation") || raw.includes("cours")) return "en_cours";
  if (raw.includes("docs")) return "confirmee";
  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime()) && end < new Date()) return "terminee";
  }
  return "confirmee";
}

function rowToParsed(row: Record<string, string>): ParsedFliInscriptionRow | null {
  const fullName = getColumn(row, "Nom et Prénom", "Nom et Prenom");
  const emailRaw = getColumn(row, "Email");
  const code = getColumn(row, "Code") || null;
  const startDate = parseFrenchDate(getColumn(row, "Date début", "Date debut"));
  const endDate = parseFrenchDate(getColumn(row, "Date fin"));

  if (!fullName && !emailRaw) return null;
  if (!startDate || !endDate) return null;

  let email = normalizeEmail(emailRaw);
  if (!email) {
    const seed = code || `${fullName}-${startDate}`;
    email = `import.${slugify(seed) || "unknown"}@fli.import`;
  }

  const { first_name, last_name } = parseFullName(fullName || email.split("@")[0]);

  const status = getColumn(row, "Status");
  const statusFinal = getColumn(row, "Status final");

  return {
    modality: mapModality(getColumn(row, "Modalité", "Modalite")),
    course_type: getColumn(row, "Type") || null,
    max_participants: getColumn(row, "Effectif") || null,
    status: mapFliInscriptionStatus(status, statusFinal, endDate),
    company: isEmpty(getColumn(row, "Entreprise")) ? null : getColumn(row, "Entreprise"),
    first_name,
    last_name,
    civility: isEmpty(getColumn(row, "Civilité", "Civilite")) ? null : getColumn(row, "Civilité", "Civilite"),
    street_address: isEmpty(getColumn(row, "Rue ou localité", "Rue ou localite")) ? null : getColumn(row, "Rue ou localité", "Rue ou localite"),
    postal_code: isEmpty(getColumn(row, "CP")) ? null : getColumn(row, "CP"),
    city: isEmpty(getColumn(row, "Ville")) ? null : getColumn(row, "Ville"),
    phone: isEmpty(getColumn(row, "Tél", "Tel")) ? null : getColumn(row, "Tél", "Tel"),
    email,
    language: mapLanguage(getColumn(row, "Langue") || "Anglais"),
    instructor_name: isEmpty(getColumn(row, "Formateur")) ? null : getColumn(row, "Formateur"),
    instructor_email: normalizeEmail(getColumn(row, "e-mail Prof", "email Prof")),
    instructor_phone: isEmpty(getColumn(row, "Tél Prof", "Tel Prof")) ? null : getColumn(row, "Tél Prof", "Tel Prof"),
    course_location: isEmpty(getColumn(row, "Lieu du stage")) ? null : getColumn(row, "Lieu du stage"),
    course_address: isEmpty(getColumn(row, "Adresse du stage")) ? null : getColumn(row, "Adresse du stage"),
    certification_type: isEmpty(getColumn(row, "Certification")) ? null : getColumn(row, "Certification"),
    start_date: startDate,
    end_date: endDate,
    duration_hours: parseNumber(getColumn(row, "Durée (en heures)", "Duree (en heures)")),
    duration_days: parseNumber(getColumn(row, "Durée (en jours)", "Duree (en jours)")),
    hours_per_day: parseNumber(getColumn(row, "Heures par jour")),
    pedagogical_cost: parseNumber(getColumn(row, "Coût pédagogique", "Cout pedagogique")),
    price: parseNumber(getColumn(row, "Coût pédagogique", "Cout pedagogique")),
    rhythm: isEmpty(getColumn(row, "Rythme")) ? null : getColumn(row, "Rythme"),
    entry_test_score: isEmpty(getColumn(row, "Résultat test - entrée", "Resultat test - entree")) ? null : getColumn(row, "Résultat test - entrée", "Resultat test - entree"),
    entry_level: isEmpty(getColumn(row, "Niveau entrée", "Niveau entree")) ? null : getColumn(row, "Niveau entrée", "Niveau entree"),
    group_name: isEmpty(getColumn(row, "Groupe")) ? null : getColumn(row, "Groupe"),
    schedule: isEmpty(getColumn(row, "Horaires")) ? null : getColumn(row, "Horaires"),
    final_general_level: isEmpty(getColumn(row, "Niv général en fin de stage", "Niv general en fin de stage")) ? null : getColumn(row, "Niv général en fin de stage", "Niv general en fin de stage"),
    final_specific_level: isEmpty(getColumn(row, "Niv spécifique", "Niv specifique")) ? null : getColumn(row, "Niv spécifique", "Niv specifique"),
    certification_date: parseFrenchDate(getColumn(row, "Date de la certification")),
    certification_result: isEmpty(getColumn(row, "Résultat Certif Barème Européen", "Resultat Certif Bareme Europeen")) ? null : getColumn(row, "Résultat Certif Barème Européen", "Resultat Certif Bareme Europeen"),
    expectations: isEmpty(getColumn(row, "Attentes")) ? null : getColumn(row, "Attentes"),
    observations: [
      getColumn(row, "Observation"),
      getColumn(row, "Obervations sur la salle"),
      getColumn(row, "Observations sur le logement"),
    ].filter((v) => !isEmpty(v)).join("\n") || null,
    code: code ? code.slice(0, 250) : null,
    status_final: isEmpty(statusFinal) ? null : statusFinal,
    qualiopi: isEmpty(getColumn(row, "QUALIOPI")) ? null : getColumn(row, "QUALIOPI"),
    ski_school_name: isEmpty(getColumn(row, "École de SKI", "Ecole de SKI")) ? null : getColumn(row, "École de SKI", "Ecole de SKI"),
    ski_school_director: isEmpty(getColumn(row, "Directeur de l'école de ski", "Directeur de l'ecole de ski")) ? null : getColumn(row, "Directeur de l'école de ski", "Directeur de l'ecole de ski"),
    ski_school_director_phone: isEmpty(getColumn(row, "N° de Portable du Directeur", "N de Portable du Directeur")) ? null : getColumn(row, "N° de Portable du Directeur", "N de Portable du Directeur"),
    instructor_accommodation_dates: isEmpty(getColumn(row, "Dates du logement")) ? null : getColumn(row, "Dates du logement"),
    instructor_accommodation_address: isEmpty(getColumn(row, "Adresse du logement")) ? null : getColumn(row, "Adresse du logement"),
    instructor_accommodation_notes: isEmpty(getColumn(row, "Observations sur le logement")) ? null : getColumn(row, "Observations sur le logement"),
  };
}

export function parseFliInscriptionsCsv(text: string): FliInscriptionsImportPreview {
  const rawRows = parseCsvRows(text);
  const parsedRows: ParsedFliInscriptionRow[] = [];
  const monitorByEmail = new Map<string, FliInscriptionsImportPreview["monitorContacts"][0]>();
  const byStatus: Record<string, number> = {};

  for (const row of rawRows) {
    const email = normalizeEmail(getColumn(row, "Email"));
    const fullName = getColumn(row, "Nom et Prénom", "Nom et Prenom");
    if (email && fullName) {
      const { first_name, last_name } = parseFullName(fullName);
      const existing = monitorByEmail.get(email);
      const contact = {
        first_name,
        last_name,
        email,
        phone: isEmpty(getColumn(row, "Tél", "Tel")) ? null : getColumn(row, "Tél", "Tel"),
        home_station: isEmpty(getColumn(row, "Ville")) ? null : getColumn(row, "Ville"),
        company: isEmpty(getColumn(row, "Entreprise")) ? null : getColumn(row, "Entreprise"),
        ski_school_name: isEmpty(getColumn(row, "École de SKI", "Ecole de SKI")) ? null : getColumn(row, "École de SKI", "Ecole de SKI"),
      };
      if (!existing || (contact.phone && !existing.phone)) {
        monitorByEmail.set(email, contact);
      }
    }

    const parsed = rowToParsed(row);
    if (!parsed) continue;
    parsedRows.push(parsed);
    byStatus[parsed.status] = (byStatus[parsed.status] || 0) + 1;
  }

  const studentEmails = new Set(parsedRows.map((r) => r.email));

  return {
    totalRows: rawRows.length,
    importableInscriptions: parsedRows.length,
    skippedRows: rawRows.length - parsedRows.length,
    uniqueStudents: studentEmails.size,
    uniqueMonitorContacts: monitorByEmail.size,
    withSkiSchool: parsedRows.filter((r) => r.ski_school_name).length,
    byStatus,
    rows: parsedRows,
    monitorContacts: Array.from(monitorByEmail.values()),
  };
}
