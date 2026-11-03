/**
 * Relances commerciales pour compléter les stages sous le minimum d'inscrits.
 *
 * Cibles : directeurs (ski_school_directory) et anciens stagiaires (students
 * avec inscription terminée / facturée). Hors gel moniteurs (ski_monitors).
 *
 * Aucun envoi automatique : les textes sont des brouillons à valider avant
 * déclenchement manuel (AGENTS.md — validation Paula).
 */

import type { RegistrationOffering } from "@/lib/registration-offerings";
import { resolveRegistrationLanguageKey } from "@/lib/client-links";
import { isFliPlaceholderEmail } from "@/lib/email-guards";

/** Statuts qui comptent pour l'effectif d'un stage à venir. */
export const STAGE_FILL_COUNT_STATUSES = new Set([
  "brouillon",
  "en_attente",
  "confirmee",
  "en_cours",
]);

/** Minimum documenté (SESSIONS_2026_2027 §5), hors cas forfait école. */
export const STAGE_MIN_IN_PERSON = 6;
export const STAGE_MIN_ONLINE_GROUP = 4;

/** Exceptions de minimum / capacité (session_code → min). */
export const STAGE_MIN_BY_SESSION: Record<string, number> = {
  // Méribel anglais : 2 groupes — on garde un plancher opérationnel de 6.
  S06: 6,
  // Méribel portugais : 2 × 6.
  S14: 6,
  // Val d'Isère anglais jusqu'à 24 — min standard 6.
  S05: 6,
};

export type StageFillInscription = {
  id: string;
  student_id?: string | null;
  language: string;
  start_date: string;
  end_date: string;
  course_location?: string | null;
  status: string;
  modality?: string | null;
};

export type StageFillDirector = {
  code: string;
  nom_affiche: string;
  station: string | null;
  directeur: string | null;
  email: string;
  emailSource: "direction" | "ecole";
};

export type StageFillAlumni = {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  languageLabel: string;
  skiSchoolCode: string | null;
};

export type StageFillRow = {
  offering: RegistrationOffering;
  enrolledCount: number;
  minRequired: number;
  missing: number;
  underMin: boolean;
  inscriptionIds: string[];
};

export type RelanceAudience = "directeur" | "ancien";

export type RelanceDraft = {
  audience: RelanceAudience;
  subject: string;
  bodyText: string;
};

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Normalise un lieu pour rapprochement offering ↔ inscription ↔ école. */
export function normalizePlaceLabel(value: string | null | undefined): string {
  return stripDiacritics((value ?? "").trim().toLowerCase())
    .replace(/^esf\s+/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function minEnrollmentForOffering(
  offering: Pick<RegistrationOffering, "session_code" | "modality_key">
): number | null {
  if (offering.modality_key === "online_individual") return null;
  const code = offering.session_code ?? "";
  if (code && STAGE_MIN_BY_SESSION[code] != null) {
    return STAGE_MIN_BY_SESSION[code];
  }
  if (offering.modality_key === "online_group") return STAGE_MIN_ONLINE_GROUP;
  if (offering.modality_key === "in_person") return STAGE_MIN_IN_PERSON;
  return STAGE_MIN_IN_PERSON;
}

export function countsTowardStageFill(status: string | null | undefined): boolean {
  return STAGE_FILL_COUNT_STATUSES.has((status ?? "").trim());
}

function languageKeyLoose(label: string): string | null {
  const direct = resolveRegistrationLanguageKey(label);
  if (direct) return direct;
  const normalized = normalizePlaceLabel(label);
  if (normalized.startsWith("portugais")) return "portuguese";
  if (normalized.startsWith("anglais")) return "english";
  if (normalized.startsWith("espagnol")) return "spanish";
  if (normalized.startsWith("neerlandais") || normalized.startsWith("hollandais")) {
    return "dutch";
  }
  if (normalized.startsWith("russe")) return "russian";
  if (normalized.startsWith("allemand")) return "german";
  if (normalized.startsWith("italien")) return "italian";
  return null;
}

function languageKeysMatch(
  offeringLabel: string,
  inscriptionLanguage: string
): boolean {
  const a = languageKeyLoose(offeringLabel);
  const b = languageKeyLoose(inscriptionLanguage);
  if (a && b) return a === b;
  const na = normalizePlaceLabel(offeringLabel);
  const nb = normalizePlaceLabel(inscriptionLanguage);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function placesMatch(offeringLabel: string, courseLocation: string | null | undefined): boolean {
  const a = normalizePlaceLabel(offeringLabel);
  const b = normalizePlaceLabel(courseLocation);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

/** Une inscription appartient-elle à cette session catalogue ? */
export function inscriptionMatchesOffering(
  offering: Pick<
    RegistrationOffering,
    "language_label" | "location_label" | "start_date" | "end_date"
  >,
  inscription: StageFillInscription
): boolean {
  if (!offering.start_date || !offering.end_date) return false;
  if (inscription.start_date !== offering.start_date) return false;
  if (inscription.end_date !== offering.end_date) return false;
  if (!languageKeysMatch(offering.language_label, inscription.language)) return false;
  return placesMatch(offering.location_label, inscription.course_location);
}

export function computeStageFillRows(
  offerings: RegistrationOffering[],
  inscriptions: StageFillInscription[]
): StageFillRow[] {
  const active = inscriptions.filter((i) => countsTowardStageFill(i.status));

  return offerings
    .filter((o) => o.modality_key !== "online_individual")
    .map((offering) => {
      const matched = active.filter((i) => inscriptionMatchesOffering(offering, i));
      const minRequired = minEnrollmentForOffering(offering) ?? 0;
      const enrolledCount = matched.length;
      const missing = Math.max(0, minRequired - enrolledCount);
      return {
        offering,
        enrolledCount,
        minRequired,
        missing,
        underMin: minRequired > 0 && enrolledCount < minRequired,
        inscriptionIds: matched.map((m) => m.id),
      };
    })
    .sort((a, b) => {
      // Priorité : sous le min, puis date, puis manquants.
      if (a.underMin !== b.underMin) return a.underMin ? -1 : 1;
      const da = a.offering.start_date ?? "";
      const db = b.offering.start_date ?? "";
      if (da !== db) return da.localeCompare(db);
      return b.missing - a.missing;
    });
}

export function pickDirectorEmail(row: {
  courriel_direction?: string | null;
  courriel_ecole?: string | null;
}): { email: string; emailSource: "direction" | "ecole" } | null {
  const direction = (row.courriel_direction ?? "").trim();
  if (direction && !isFliPlaceholderEmail(direction)) {
    return { email: direction, emailSource: "direction" };
  }
  const ecole = (row.courriel_ecole ?? "").trim();
  if (ecole && !isFliPlaceholderEmail(ecole)) {
    return { email: ecole, emailSource: "ecole" };
  }
  return null;
}

/**
 * Directeurs à relancer pour un stage : écoles partenaires listées, sinon
 * école dont la station / le nom colle au lieu du stage.
 */
export function selectDirectorsForStage(
  offering: Pick<RegistrationOffering, "location_label" | "partner_school_codes">,
  directory: Array<{
    code: string;
    nom_affiche: string;
    station: string | null;
    directeur: string | null;
    courriel_direction?: string | null;
    courriel_ecole?: string | null;
    is_active?: boolean;
  }>
): StageFillDirector[] {
  const partnerCodes = new Set(offering.partner_school_codes ?? []);
  const place = normalizePlaceLabel(offering.location_label);
  const out: StageFillDirector[] = [];
  const seen = new Set<string>();

  for (const school of directory) {
    if (school.is_active === false) continue;
    const picked = pickDirectorEmail(school);
    if (!picked) continue;

    const byPartner = partnerCodes.has(school.code);
    const byPlace =
      place.length > 0 &&
      (normalizePlaceLabel(school.station).includes(place) ||
        place.includes(normalizePlaceLabel(school.station)) ||
        normalizePlaceLabel(school.nom_affiche).includes(place) ||
        place.includes(normalizePlaceLabel(school.nom_affiche)));

    if (!byPartner && !byPlace) continue;
    if (seen.has(picked.email.toLowerCase())) continue;
    seen.add(picked.email.toLowerCase());
    out.push({
      code: school.code,
      nom_affiche: school.nom_affiche,
      station: school.station,
      directeur: school.directeur,
      email: picked.email,
      emailSource: picked.emailSource,
    });
  }

  return out.sort((a, b) => a.nom_affiche.localeCompare(b.nom_affiche, "fr"));
}

/** Lien public d'inscription (brouillon Paula 2026-11-03). */
export const COMMERCIAL_REGISTER_URL = "https://www.fli.fr/register";

/** Signature commerciale — toujours « nous », jamais un prénom. */
export const COMMERCIAL_EMAIL_SIGNATURE = "équipe FLI";

function formatDirectorGreeting(directeur: string | null): string {
  const name = (directeur ?? "").trim();
  if (!name) return "Bonjour,";
  const first = name.split(/\s+/)[0] ?? name;
  return `Bonjour ${first},`;
}

function stageLine(offering: RegistrationOffering): string {
  const dates = offering.date_label?.trim() ||
    [offering.start_date, offering.end_date].filter(Boolean).join(" → ");
  return `${offering.location_label} — ${offering.language_label} (${dates})`;
}

/** Brouillon directeur — texte validé Paula (court, nous + équipe FLI). */
export function buildDirectorRelanceDraft(input: {
  offering: RegistrationOffering;
  directeurName?: string | null;
  enrolledCount: number;
  minRequired: number;
  registerUrl?: string;
}): RelanceDraft {
  const { offering } = input;
  const greeting = formatDirectorGreeting(input.directeurName ?? null);
  const url = input.registerUrl ?? COMMERCIAL_REGISTER_URL;
  const stage = stageLine(offering);

  const subject = `Stage FLI ${offering.language_label} — ${offering.location_label} — places encore disponibles`;

  const bodyText = `${greeting}

Pour le moment il nous manque encore des stagiaires pour le stage ${stage}.

Inscription en ligne (tarif selon l'école, FIF-PL possible) :
${url}

Si vous avez des moniteur·rices intéressé·es — ou une autre école du secteur à prévenir — merci de leur transmettre ce lien, ou de nous répondre avec leurs coordonnées : nous nous occupons du reste.

${COMMERCIAL_EMAIL_SIGNATURE}`
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { audience: "directeur", subject, bodyText };
}

/** Brouillon ancien stagiaire — même voix (nous + équipe FLI). */
export function buildAlumniRelanceDraft(input: {
  offering: RegistrationOffering;
  firstName: string;
  registerUrl?: string;
}): RelanceDraft {
  const { offering } = input;
  const first = (input.firstName || "").trim() || "Bonjour";
  const greeting = first === "Bonjour" ? "Bonjour," : `Bonjour ${first},`;
  const url =
    input.registerUrl ?? `${COMMERCIAL_REGISTER_URL}?lang=${offering.language_key}`;
  const stage = stageLine(offering);

  const subject = `FLI — une place pour vous ? ${offering.language_label} · ${offering.location_label}`;

  const bodyText = `${greeting}

Vous avez déjà suivi une formation FLI — pour le moment il nous manque encore des stagiaires pour le stage ${stage}.

Inscription en ligne (tarif selon l'école, FIF-PL possible) :
${url}

Si vous avez une question sur les dates, le tarif ou le financement, répondez simplement à ce message : nous vous répondons rapidement.

${COMMERCIAL_EMAIL_SIGNATURE}`
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { audience: "ancien", subject, bodyText };
}

/**
 * Anciens stagiaires : e-mail réel, au moins une inscription terminée/facturée
 * dans la langue du stage, et pas déjà inscrit·e sur ce stage.
 */
export function selectAlumniForStage(
  offering: Pick<RegistrationOffering, "language_label" | "start_date" | "end_date" | "location_label">,
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    ski_school_code?: string | null;
  }>,
  history: Array<{
    student_id: string;
    language: string;
    status: string;
    start_date: string;
    end_date: string;
    course_location?: string | null;
  }>
): StageFillAlumni[] {
  const alreadyOnStage = new Set(
    history
      .filter(
        (h) =>
          countsTowardStageFill(h.status) &&
          inscriptionMatchesOffering(offering, {
            id: h.student_id,
            language: h.language,
            start_date: h.start_date,
            end_date: h.end_date,
            course_location: h.course_location,
            status: h.status,
          })
      )
      .map((h) => h.student_id)
  );

  const alumniIds = new Set(
    history
      .filter(
        (h) =>
          (h.status === "terminee" || h.status === "facturee") &&
          languageKeysMatch(offering.language_label, h.language)
      )
      .map((h) => h.student_id)
  );

  const out: StageFillAlumni[] = [];
  const seenEmail = new Set<string>();

  for (const student of students) {
    if (!alumniIds.has(student.id)) continue;
    if (alreadyOnStage.has(student.id)) continue;
    const email = studentEmailOrNull(student.email);
    if (!email) continue;
    const key = email.toLowerCase();
    if (seenEmail.has(key)) continue;
    seenEmail.add(key);
    out.push({
      studentId: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      email,
      languageLabel: offering.language_label,
      skiSchoolCode: student.ski_school_code ?? null,
    });
  }

  return out.sort((a, b) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "fr")
  );
}

function studentEmailOrNull(email: string | null | undefined): string | null {
  const value = (email ?? "").trim();
  if (!value || isFliPlaceholderEmail(value)) return null;
  return value;
}

/** CSV destinataires (export manuel / validation Paula). */
export function recipientsToCsv(
  rows: Array<{ email: string; name: string; detail?: string }>
): string {
  const header = "email;nom;detail";
  const lines = rows.map((r) =>
    [r.email, r.name, r.detail ?? ""]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(";")
  );
  return [header, ...lines].join("\n");
}
