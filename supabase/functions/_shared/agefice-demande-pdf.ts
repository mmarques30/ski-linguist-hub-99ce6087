/**
 * Préremplit le PDF éditable « Demande de prise en charge AGEFICE ».
 * Champs inconnus (PTA, SIRET entreprise, NSS…) laissés vides.
 * Ne pas aplatir le formulaire : le stagiaire / FLI doivent pouvoir éditer.
 */
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";
import { FLI_ACTIVITY_NUMBER } from "./organization-identity.ts";

export type AgeficeDemandeStudent = {
  civility?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  street_address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  company?: string | null;
};

export type AgeficeDemandeInscription = {
  code?: string | null;
  language?: string | null;
  course_location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  price?: number | null;
  duration_hours?: number | null;
  modality?: string | null;
  formateur?: string | null;
};

export type AgeficeDemandeOrganization = {
  legal_name?: string | null;
  address_line?: string | null;
  postal_code?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  siret?: string | null;
  activity_number?: string | null;
  representative?: string | null;
};

/** Mentions FLI utilisées si l'identité organisme est incomplète. */
export const AGEFICE_FLI_OF_DEFAULTS = {
  legal_name: "France Langues International",
  address_line: "25 avenue de la Gare",
  postal_code: "73800",
  city: "Montmélian",
  phone: "0479282109",
  email: "info@fli.fr",
  siret: "484 772 041 00048",
  activity_number: FLI_ACTIVITY_NUMBER,
  representative_last_name: "Rangel Halbwachs",
  representative_first_name: "Paula",
} as const;

function texte(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function digitsPhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

/** JJ/MM/AAAA depuis une ISO date. */
export function formatAgeficeDateFr(iso: string | null | undefined): string {
  const raw = texte(iso);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function languageLabelForAgeficeTitle(language: string | null | undefined): string {
  const lang = texte(language) || "langue";
  return lang.charAt(0).toLowerCase() + lang.slice(1);
}

export function buildAgeficeFormationTitle(language: string | null | undefined): string {
  return `Formation professionnelle en ${languageLabelForAgeficeTitle(language)} pour moniteurs de ski`;
}

export function isOnlineModalityForAgefice(modality: string | null | undefined): boolean {
  const m = texte(modality).toLowerCase();
  return (
    m.includes("en_ligne") ||
    m.includes("online") ||
    m.includes("visio") ||
    m.includes("foad") ||
    m.includes("e-learning")
  );
}

export function isIndividualModalityForAgefice(modality: string | null | undefined): boolean {
  const m = texte(modality).toLowerCase();
  return m.includes("individuel") || m.includes("individual");
}

function todayIsoParis(now = new Date()): string {
  // Date civile Europe/Paris (YYYY-MM-DD) via offset fixe approximation UTC+1/+2 :
  // on préfère Intl pour le fuseau.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

async function setText(
  form: ReturnType<PDFDocument["getForm"]>,
  name: string,
  value: string,
): Promise<void> {
  if (!value) return;
  try {
    form.getTextField(name).setText(value);
  } catch {
    // Champ absent / renommé — ignorer pour rester robuste aux versions PDF.
  }
}

async function check(
  form: ReturnType<PDFDocument["getForm"]>,
  name: string,
): Promise<void> {
  try {
    form.getCheckBox(name).check();
  } catch {
    // idem
  }
}

/**
 * Remplit le PDF AGEFICE (bytes source = modèle éditable).
 * Retourne un nouveau PDF toujours éditable (pas d'aplatissement).
 */
export async function fillAgeficeDemandePdf(input: {
  templatePdfBytes: Uint8Array;
  student: AgeficeDemandeStudent;
  inscription: AgeficeDemandeInscription;
  organization?: AgeficeDemandeOrganization | null;
  /** Date de signature préremplie (ISO). Défaut : aujourd'hui (Paris). */
  signatureDateIso?: string | null;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(input.templatePdfBytes, {
    ignoreEncryption: true,
  });
  const form = pdf.getForm();

  const org = input.organization || {};
  const ofName = texte(org.legal_name) || AGEFICE_FLI_OF_DEFAULTS.legal_name;
  const ofAddress = texte(org.address_line) || AGEFICE_FLI_OF_DEFAULTS.address_line;
  const ofPostal = texte(org.postal_code) || AGEFICE_FLI_OF_DEFAULTS.postal_code;
  const ofCity = texte(org.city) || AGEFICE_FLI_OF_DEFAULTS.city;
  const ofPhone = digitsPhone(texte(org.phone) || AGEFICE_FLI_OF_DEFAULTS.phone);
  const ofEmail = texte(org.email) || AGEFICE_FLI_OF_DEFAULTS.email;
  const ofSiret = texte(org.siret) || AGEFICE_FLI_OF_DEFAULTS.siret;
  const ofNda = texte(org.activity_number) || AGEFICE_FLI_OF_DEFAULTS.activity_number;

  const first = texte(input.student.first_name);
  const last = texte(input.student.last_name);
  const email = texte(input.student.email);
  const phone = digitsPhone(texte(input.student.phone));
  const company = texte(input.student.company);
  const street = texte(input.student.street_address);
  const postal = texte(input.student.postal_code);
  const city = texte(input.student.city);

  const civ = texte(input.student.civility).toLowerCase();
  if (civ === "mme" || civ === "madame" || civ.includes("mme")) {
    await check(form, "MME (Stagiaire)");
  } else if (civ === "m" || civ === "mr" || civ === "monsieur") {
    await check(form, "MR (Stagiaire)");
  }

  // —— Entreprise (partiel) ——
  if (company) {
    await setText(form, "Nom / Raison Sociale de L'entreprise (Entreprise)", company);
    await setText(form, "Nom commercial de l'entreprise (Entreprise)", company);
  }
  await setText(
    form,
    "Activité Professionnelle (Entreprise)",
    "Moniteur / monitrice de ski",
  );
  if (street) await setText(form, "Adresse Entreprise", street);
  if (postal) await setText(form, "Code Postal (Entreprise)", postal);
  if (city) await setText(form, "Ville (Entreprise)", city);

  // —— Stagiaire ——
  if (last) await setText(form, "Nom (Stagiaire)", last);
  if (first) await setText(form, "Prénom  (Stagiaire)", first);
  if (phone) await setText(form, "N° de Téléphone  (Stagiaire)", phone);
  if (email) await setText(form, "Adresse Email  (Stagiaire)", email);

  // —— Organisme de formation FLI ——
  await setText(form, "Raison Sociale ( OF)", ofName);
  await setText(form, "NDA (OF)", ofNda);
  await setText(form, "N° SIRET (OF)", ofSiret);
  await setText(form, "Adresse (OF)", ofAddress);
  await setText(form, "Code Postal (OF)", ofPostal);
  await setText(form, "Ville (OF)", ofCity);
  await check(form, "MME (Resp.OF)");
  await setText(form, "Nom Responsable (OF)", AGEFICE_FLI_OF_DEFAULTS.representative_last_name);
  await setText(
    form,
    "Prénom Responsable (OF)",
    AGEFICE_FLI_OF_DEFAULTS.representative_first_name,
  );
  await setText(form, "N° de Téléphone - Responsable (OF)", ofPhone);
  await setText(form, "Adresse Email - Responsable (OF)", ofEmail);
  await check(form, "MME (Contact OF)");
  await setText(form, "Nom - Contact (OF)", AGEFICE_FLI_OF_DEFAULTS.representative_last_name);
  await setText(
    form,
    "Prénom - Contact (OF)",
    AGEFICE_FLI_OF_DEFAULTS.representative_first_name,
  );
  await setText(form, "N° de Téléphone - Contact (OF)", ofPhone);
  await setText(form, "Adresse Email - Contact (OF)", ofEmail);

  // —— Formation ——
  await check(form, "Action de Formation");
  await check(form, "Obligatoire (Non)");
  await check(form, "reconversion ( Non)");
  await setText(
    form,
    "Intitulé Exact ( Formation)",
    buildAgeficeFormationTitle(input.inscription.language),
  );
  await setText(
    form,
    "Thématique (Formation)",
    "Langues étrangères — accueil et conseil clientèle internationale en station",
  );
  await check(form, "Perfectionnement");
  await check(form, "Sans Qualification");

  const startFr = formatAgeficeDateFr(input.inscription.start_date);
  const endFr = formatAgeficeDateFr(input.inscription.end_date);
  if (startFr) await setText(form, "Date de Début (Formation)", startFr);
  if (endFr) await setText(form, "Date de Fin (Formation)", endFr);

  const hours =
    input.inscription.duration_hours != null &&
    Number.isFinite(Number(input.inscription.duration_hours))
      ? String(Math.round(Number(input.inscription.duration_hours)))
      : "";
  const online = isOnlineModalityForAgefice(input.inscription.modality);
  const individual = isIndividualModalityForAgefice(input.inscription.modality);
  if (hours) {
    if (online) {
      await setText(form, "Durée ( FOAD Synchrone - Formation)", hours);
    } else if (individual) {
      await setText(form, "Durée ( Présentiel Individuel - Formation)", hours);
    } else {
      await setText(form, "Durée ( Présentiel Collectif - Formation)", hours);
    }
  }

  const formateur = texte(input.inscription.formateur);
  if (formateur) await setText(form, "Nom du formateur", formateur);

  const price =
    input.inscription.price != null && Number.isFinite(Number(input.inscription.price))
      ? String(Math.round(Number(input.inscription.price)))
      : "";
  if (price) await setText(form, "Prix Ht (Formation)", price);

  await check(form, "Form en Entreprise (Non)");

  const location = texte(input.inscription.course_location);
  const lieuPostal = online ? ofPostal : postal || ofPostal;
  const lieuVille = online ? ofCity : city || location || ofCity;
  await setText(form, "Code Postal (Lieu de Formation)", lieuPostal);
  await setText(form, "Ville (Lieu de Formation)", lieuVille);

  const lieuExact = online
    ? `Formation en visioconférence (FOAD synchrone) organisée par FLI — ${ofCity}`
    : location
      ? `${location}${postal || city ? ` (${[postal, city].filter(Boolean).join(" ")})` : ""} — formation en présentiel organisée par FLI`
      : `Formation en présentiel organisée par FLI — ${ofCity}`;
  await setText(form, "Nom et Adresse exacte du lieu de formation", lieuExact);

  const deroulement = online
    ? "Cours en visioconférence (FOAD synchrone) : compréhension et expression orales professionnelles, vocabulaire technique ski / sécurité / conditions de neige, mises en situation clientèle. Évaluation formative continue + bilan. Contrôle d'assiduité par feuilles de présence / connexion."
    : "Cours en présentiel : compréhension et expression orales professionnelles, vocabulaire technique ski / sécurité / conditions de neige, jeux de rôle clientèle. Évaluation formative continue + bilan. Contrôle d'assiduité par feuilles de présence.";
  await setText(form, "Déroulement Pédagogique (Formation) - 1 -", deroulement);

  await check(form, "Contrôle continu");
  await check(form, "Feuilles de présence");
  await check(form, "Attestation de Stage");

  await check(form, "Mandat (Oui)");
  await setText(form, "Lieu de Signature", ofCity);
  const sigIso = texte(input.signatureDateIso) || todayIsoParis();
  await setText(form, "Date de Signature", formatAgeficeDateFr(sigIso));

  const out = await pdf.save({ updateFieldAppearances: true });
  return out;
}
