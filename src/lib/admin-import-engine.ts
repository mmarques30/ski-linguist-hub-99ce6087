/**
 * Moteur d'import admin (/admin/import) — validation, dry-run, mapping.
 * Aucune écriture DB ici : uniquement préparation des enregistrements.
 */

import {
  type CsvRow,
  parseFrenchNumber,
} from "@/lib/csv-import-parser";

export type ImportTableType =
  | "instructors"
  | "ski_schools"
  | "students"
  | "inscriptions"
  | "invoices";

export interface ImportRejection {
  lineNumber: number; // 1-based data line (header = line 1 → first data = 2)
  reason: string;
  raw: CsvRow;
}

export interface PreparedImport {
  table: ImportTableType;
  accepted: Record<string, unknown>[];
  rejections: ImportRejection[];
  acceptedCount: number;
  rejectedCount: number;
  totalRows: number;
}

export const IMPORT_TABLE_LABELS: Record<ImportTableType, string> = {
  instructors: "instructors (formateur·rices)",
  ski_schools: "ski_schools (écoles de ski)",
  students: "students (stagiaires)",
  inscriptions: "inscriptions",
  invoices: "invoices (factures)",
};

/** Tables concernées par une purge « chaînée » historique (ordre FK). */
export const PURGE_CHAIN_TABLES: ImportTableType[] = [
  "inscriptions",
  "students",
  "ski_schools",
  "instructors",
];

function isEmpty(value: string | undefined | null): boolean {
  return !value || value === "-" || value.toUpperCase() === "N/A" || value.trim() === "";
}

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function sanitizeUUID(id: string): string | null {
  if (!id || isEmpty(id)) return null;
  if (isValidUUID(id)) return id;
  let sanitized = id;
  if (!/^[0-9a-f]/i.test(id[0])) {
    sanitized = "a" + id.slice(1);
  }
  return isValidUUID(sanitized) ? sanitized : null;
}

function requireField(row: CsvRow, key: string, label: string): string {
  const v = row[key];
  if (isEmpty(v)) throw new Error(`Champ obligatoire manquant : ${label} (${key})`);
  return v.trim();
}

function mapInscriptionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    invoiced: "facturee",
    completed: "terminee",
    in_progress: "en_cours",
    cancelled: "annulee",
    facturee: "facturee",
    terminee: "terminee",
    en_cours: "en_cours",
    annulee: "annulee",
    confirmee: "confirmee",
    en_attente: "en_attente",
  };
  const key = (status || "").trim().toLowerCase();
  return statusMap[key] || status || "en_cours";
}

function mapInstructorRow(row: CsvRow): Record<string, unknown> {
  const fullName = row.full_name || `${row.first_name || ""} ${row.last_name || ""}`.trim();
  if (isEmpty(fullName) && isEmpty(row.last_name)) {
    throw new Error("Nom manquant (full_name ou last_name)");
  }

  let firstName = row.first_name?.trim() || null;
  let lastName = row.last_name?.trim() || null;
  if ((!firstName || !lastName) && !isEmpty(row.full_name)) {
    const parts = row.full_name.trim().split(/\s+/);
    firstName = parts.slice(0, -1).join(" ") || firstName || "—";
    lastName = parts[parts.length - 1] || lastName || row.full_name;
  }

  const sanitizedId = sanitizeUUID(row.id || "");
  const languagesRaw = row.languages || row.langues || "";
  const languages = isEmpty(languagesRaw)
    ? null
    : languagesRaw.split(/[,;|]/).map((l) => l.trim()).filter(Boolean);

  const statusRaw = (row.status || row.statut || "active").toLowerCase();
  const isActive = !["inactive", "inactif", "0", "false", "non"].includes(statusRaw);
  const entryDate = row.start_date || row.date_entree || "";
  // Pas de colonne start_date sur instructors : conserver la date d'entrée dans status_notes
  const statusNotes = !isEmpty(entryDate)
    ? `Date d'entrée : ${entryDate.trim()}`
    : null;

  return {
    ...(sanitizedId && { id: sanitizedId }),
    first_name: firstName,
    last_name: lastName || "Inconnu",
    email: isEmpty(row.email) ? null : row.email.trim().toLowerCase(),
    phone: isEmpty(row.phone || row.telephone) ? null : (row.phone || row.telephone).trim(),
    languages,
    is_active: isActive,
    status: isActive ? "active" : "inactive",
    siret: isEmpty(row.siret) ? null : row.siret.trim(),
    address: isEmpty(row.address || row.adresse) ? null : (row.address || row.adresse).trim(),
    status_notes: statusNotes,
  };
}

function mapSkiSchoolRow(row: CsvRow): Record<string, unknown> {
  const name = requireField(row, "name", "nom de l'école");
  const sanitizedId = sanitizeUUID(row.id || "");
  return {
    ...(sanitizedId && { id: sanitizedId }),
    name,
    director_name: isEmpty(row.director_name) ? null : row.director_name,
    director_phone: isEmpty(row.director_phone) ? null : row.director_phone,
    observations: isEmpty(row.contact_notes || row.observations) ? null : (row.contact_notes || row.observations),
  };
}

function mapStudentRow(row: CsvRow): Record<string, unknown> {
  const email = requireField(row, "email", "email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Email invalide : ${email}`);
  }
  const sanitizedId = sanitizeUUID(row.id || "");
  return {
    ...(sanitizedId && { id: sanitizedId }),
    email: email.toLowerCase(),
    first_name: isEmpty(row.first_name) ? "Inconnu" : row.first_name,
    last_name: isEmpty(row.last_name) ? "Inconnu" : row.last_name,
    civility: isEmpty(row.gender || row.civility) ? null : (row.gender || row.civility),
    phone: isEmpty(row.phone) ? null : row.phone,
    street_address: isEmpty(row.address || row.street_address) ? null : (row.address || row.street_address),
    postal_code: isEmpty(row.postal_code) ? null : row.postal_code,
    city: isEmpty(row.city) ? null : row.city,
    company: isEmpty(row.company) ? null : row.company,
  };
}

function mapInscriptionRow(row: CsvRow): Record<string, unknown> {
  const sanitizedStudentId = sanitizeUUID(row.student_id || "");
  if (!sanitizedStudentId) {
    throw new Error("student_id UUID manquant ou invalide");
  }
  if (isEmpty(row.start_date) || isEmpty(row.end_date)) {
    throw new Error("start_date et end_date sont obligatoires");
  }

  const duration = parseFrenchNumber(row.duration_hours);
  const price = parseFrenchNumber(row.price_ht || row.price);
  const deposit = parseFrenchNumber(row.deposit || row.deposit_amount);

  if (row.duration_hours && !isEmpty(row.duration_hours) && duration === null) {
    throw new Error(`duration_hours non numérique : ${row.duration_hours}`);
  }
  if ((row.price_ht || row.price) && !isEmpty(row.price_ht || row.price) && price === null) {
    throw new Error(`prix non numérique : ${row.price_ht || row.price}`);
  }

  const sanitizedId = sanitizeUUID(row.id || "");
  return {
    ...(sanitizedId && { id: sanitizedId }),
    code: isEmpty(row.code) ? null : row.code,
    student_id: sanitizedStudentId,
    instructor_id: sanitizeUUID(row.instructor_id || ""),
    ski_school_id: sanitizeUUID(row.ski_school_id || ""),
    modality: isEmpty(row.modality) ? null : row.modality,
    course_type: isEmpty(row.type || row.course_type) ? null : (row.type || row.course_type),
    language: isEmpty(row.language) ? "Non spécifié" : row.language,
    course_location: isEmpty(row.location || row.course_location) ? null : (row.location || row.course_location),
    start_date: row.start_date,
    end_date: row.end_date,
    duration_hours: duration,
    price,
    deposit_amount: deposit,
    deposit_date: isEmpty(row.deposit_date) ? null : row.deposit_date,
    payment_method: isEmpty(row.payment_mode || row.payment_method) ? null : (row.payment_mode || row.payment_method),
    entry_level: isEmpty(row.level_entry || row.entry_level) ? null : (row.level_entry || row.entry_level),
    final_general_level: isEmpty(row.level_exit_general) ? null : row.level_exit_general,
    final_specific_level: isEmpty(row.level_exit_specific) ? null : row.level_exit_specific,
    certification_type: isEmpty(row.certification) ? null : row.certification,
    certification_date: isEmpty(row.certification_date) ? null : row.certification_date,
    certification_result: isEmpty(row.certification_result) ? null : row.certification_result,
    status: mapInscriptionStatus(row.status || ""),
    observations: isEmpty(row.observations) ? null : row.observations,
  };
}

function mapInvoiceRow(row: CsvRow): Record<string, unknown> {
  const invoiceTypeRaw = (row.invoice_type || "formation").toLowerCase().replace(/-/g, "_");
  const typeMap: Record<string, string> = {
    formation: "formation",
    test: "test",
    tests: "test",
    soustraitance: "soustraitance",
    sous_traitance: "soustraitance",
    "sous-traitance": "soustraitance",
  };
  const type = typeMap[invoiceTypeRaw];
  if (!type) {
    throw new Error(`Type de facture invalide : ${row.invoice_type} (attendu : formation | test | sous_traitance)`);
  }

  const amountHt = parseFrenchNumber(row.amount_ht || row["Total HT"] || row["Prix Unitaire HT"]);
  if (amountHt === null) {
    throw new Error(`amount_ht manquant ou non numérique : ${row.amount_ht}`);
  }

  let tvaRate = parseFrenchNumber(row.tva_rate || row.TVA);
  if (tvaRate === null) {
    tvaRate = type === "formation" ? 0 : 20;
  }
  if (type === "formation" && tvaRate !== 0) {
    throw new Error(`TVA formation doit être 0 (reçu : ${tvaRate})`);
  }
  if (type !== "formation" && tvaRate !== 20) {
    throw new Error(`TVA ${type} doit être 20 (reçu : ${tvaRate})`);
  }

  const statusVal = (row.status || "draft").toLowerCase();
  const validStatuses = ["draft", "sent", "paid", "cancelled"];
  const status = validStatuses.includes(statusVal) ? statusVal : "draft";

  const paymentTypeVal = (row.payment_type || "integral").toLowerCase();
  const paymentTypeMap: Record<string, string> = {
    integral: "integral",
    adiantamento: "adiantamento",
    saldo: "saldo",
    acompte: "adiantamento",
    solde: "saldo",
  };
  const paymentType = paymentTypeMap[paymentTypeVal] || "integral";

  return {
    invoice_number: isEmpty(row.invoice_number) ? null : row.invoice_number,
    invoice_date: isEmpty(row.invoice_date)
      ? new Date().toISOString().split("T")[0]
      : row.invoice_date,
    due_date: isEmpty(row.due_date) ? null : row.due_date,
    invoice_type: type,
    payment_type: paymentType,
    amount_ht: amountHt,
    tva_rate: tvaRate,
    status,
    payment_date: isEmpty(row.payment_date) ? null : row.payment_date,
    payment_method: isEmpty(row.payment_method) ? null : row.payment_method,
    notes: isEmpty(row.notes) ? null : row.notes,
    inscription_id: sanitizeUUID(row.inscription_id || ""),
    related_invoice_id: sanitizeUUID(row.related_invoice_id || ""),
  };
}

function mapRow(row: CsvRow, table: ImportTableType): Record<string, unknown> {
  switch (table) {
    case "instructors":
      return mapInstructorRow(row);
    case "ski_schools":
      return mapSkiSchoolRow(row);
    case "students":
      return mapStudentRow(row);
    case "inscriptions":
      return mapInscriptionRow(row);
    case "invoices":
      return mapInvoiceRow(row);
    default:
      throw new Error(`Table non supportée : ${table}`);
  }
}

/**
 * Prépare un import sans écrire en base (dry-run / avant écriture).
 * lineNumber : numéro de ligne fichier (en-tête = 1).
 */
export function prepareImport(
  rows: CsvRow[],
  table: ImportTableType
): PreparedImport {
  const accepted: Record<string, unknown>[] = [];
  const rejections: ImportRejection[] = [];

  rows.forEach((row, index) => {
    const lineNumber = index + 2; // header = 1
    try {
      const record = mapRow(row, table);
      accepted.push(record);
    } catch (error) {
      rejections.push({
        lineNumber,
        reason: error instanceof Error ? error.message : String(error),
        raw: row,
      });
    }
  });

  return {
    table,
    accepted,
    rejections,
    acceptedCount: accepted.length,
    rejectedCount: rejections.length,
    totalRows: rows.length,
  };
}
