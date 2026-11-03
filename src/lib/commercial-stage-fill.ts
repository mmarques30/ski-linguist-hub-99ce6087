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

/** Groupe de stages d'une même station pour un seul mail directeurs. */
export type DirectorStationGroup = {
  stationKey: string;
  stationLabel: string;
  rows: StageFillRow[];
};

/** Sessions / lieux exclus des relances directeurs (Paula 2026-11-03). */
export const DIRECTOR_OUTREACH_EXCLUDED_SESSION_CODES = new Set([
  "S06", // Méribel anglais — liste à recevoir de l'ESF
  "S14", // Méribel portugais
  "S21", // Samoëns portugais
]);

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

/** Clé de regroupement station (ex. Oz anglais + néerlandais). */
export function directorStationKey(
  offering: Pick<RegistrationOffering, "location_key" | "location_label">
): string {
  const fromKey = (offering.location_key ?? "").trim().toLowerCase();
  if (fromKey) return fromKey;
  return normalizePlaceLabel(offering.location_label) || "autre";
}

export function directorStationLabel(
  offering: Pick<RegistrationOffering, "location_label">
): string {
  return (offering.location_label ?? "").trim() || "Station";
}

function offeringPlaceParts(
  offering: Pick<RegistrationOffering, "location_label" | "location_key">
): { place: string; placeKey: string } {
  return {
    place: normalizePlaceLabel(offering.location_label),
    placeKey: normalizePlaceLabel(offering.location_key),
  };
}

function isMeribelOffering(
  offering: Pick<RegistrationOffering, "session_code" | "location_label" | "location_key">
): boolean {
  const code = (offering.session_code ?? "").trim().toUpperCase();
  if (code === "S06" || code === "S14") return true;
  const { place, placeKey } = offeringPlaceParts(offering);
  return place.includes("meribel") || placeKey.includes("meribel");
}

function isSamoensPortugueseOffering(
  offering: Pick<
    RegistrationOffering,
    "session_code" | "location_label" | "location_key" | "language_label" | "language_key"
  >
): boolean {
  const code = (offering.session_code ?? "").trim().toUpperCase();
  if (code === "S21") return true;
  const { place, placeKey } = offeringPlaceParts(offering);
  const isSamoens = place.includes("samoens") || placeKey.includes("samoens");
  const lang =
    offering.language_key?.trim() ||
    languageKeyLoose(offering.language_label) ||
    "";
  return isSamoens && lang === "portuguese";
}

/** Samoëns anglais : on en parle à tous (directeurs + anciens toutes langues). */
export function isSamoensEnglishOffering(
  offering: Pick<
    RegistrationOffering,
    "session_code" | "location_label" | "location_key" | "language_label" | "language_key"
  >
): boolean {
  const code = (offering.session_code ?? "").trim().toUpperCase();
  if (code === "S13") return true;
  const { place, placeKey } = offeringPlaceParts(offering);
  const isSamoens = place.includes("samoens") || placeKey.includes("samoens");
  const lang =
    offering.language_key?.trim() ||
    languageKeyLoose(offering.language_label) ||
    "";
  return isSamoens && lang === "english";
}

/**
 * Pas de mail directeurs pour Méribel (liste ESF à venir) ni Samoëns portugais
 * (inscriptions directement avec Seb).
 */
export function isDirectorOutreachExcluded(
  offering: Pick<
    RegistrationOffering,
    "session_code" | "location_label" | "location_key" | "language_label" | "language_key"
  >
): boolean {
  const code = (offering.session_code ?? "").trim().toUpperCase();
  if (DIRECTOR_OUTREACH_EXCLUDED_SESSION_CODES.has(code)) return true;
  if (isMeribelOffering(offering)) return true;
  if (isSamoensPortugueseOffering(offering)) return true;
  return false;
}

/**
 * Pas d'anciens pour Méribel ni Samoëns portugais (Seb gère le PT en direct).
 * Samoëns anglais : ciblage élargi (voir selectAlumniForStage).
 */
export function isAlumniOutreachExcluded(
  offering: Pick<
    RegistrationOffering,
    "session_code" | "location_label" | "location_key" | "language_label" | "language_key"
  >
): boolean {
  return isMeribelOffering(offering) || isSamoensPortugueseOffering(offering);
}

function isMeribelDirectorySchool(school: {
  nom_affiche: string;
  station: string | null;
}): boolean {
  return (
    normalizePlaceLabel(school.station).includes("meribel") ||
    normalizePlaceLabel(school.nom_affiche).includes("meribel")
  );
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

type DirectorySchool = {
  code: string;
  nom_affiche: string;
  station: string | null;
  directeur: string | null;
  courriel_direction?: string | null;
  courriel_ecole?: string | null;
  is_active?: boolean;
};

/**
 * Directeurs à relancer pour un ou plusieurs stages d'une station :
 * écoles partenaires listées + école dont la station / le nom colle au lieu.
 * Jamais l'ESF Méribel (liste à recevoir).
 */
export function selectDirectorsForStage(
  offering: Pick<RegistrationOffering, "location_label" | "partner_school_codes">,
  directory: DirectorySchool[]
): StageFillDirector[] {
  return selectDirectorsForOfferings([offering], directory);
}

export function selectDirectorsForOfferings(
  offerings: Array<Pick<RegistrationOffering, "location_label" | "partner_school_codes">>,
  directory: DirectorySchool[]
): StageFillDirector[] {
  const partnerCodes = new Set(
    offerings.flatMap((o) => o.partner_school_codes ?? [])
  );
  const places = offerings
    .map((o) => normalizePlaceLabel(o.location_label))
    .filter(Boolean);
  const out: StageFillDirector[] = [];
  const seen = new Set<string>();

  for (const school of directory) {
    if (school.is_active === false) continue;
    if (isMeribelDirectorySchool(school)) continue;
    const picked = pickDirectorEmail(school);
    if (!picked) continue;

    const schoolStation = normalizePlaceLabel(school.station);
    const schoolName = normalizePlaceLabel(school.nom_affiche);
    const byPartner = partnerCodes.has(school.code);
    const byPlace = places.some(
      (place) =>
        place.length > 0 &&
        (schoolStation.includes(place) ||
          place.includes(schoolStation) ||
          schoolName.includes(place) ||
          place.includes(schoolName))
    );

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

/**
 * Regroupe les stages sous le min par station pour un seul mail directeurs.
 * Exclut Méribel et Samoëns portugais.
 */
export function groupRowsForDirectorOutreach(
  rows: StageFillRow[]
): DirectorStationGroup[] {
  const eligible = rows.filter(
    (r) => r.underMin && !isDirectorOutreachExcluded(r.offering)
  );
  const byStation = new Map<string, DirectorStationGroup>();

  for (const row of eligible) {
    const key = directorStationKey(row.offering);
    let group = byStation.get(key);
    if (!group) {
      group = {
        stationKey: key,
        stationLabel: directorStationLabel(row.offering),
        rows: [],
      };
      byStation.set(key, group);
    }
    group.rows.push(row);
  }

  const groups = Array.from(byStation.values());
  for (const group of groups) {
    group.rows.sort((a, b) => {
      const byLang = a.offering.language_label.localeCompare(
        b.offering.language_label,
        "fr"
      );
      if (byLang !== 0) return byLang;
      return (a.offering.start_date ?? "").localeCompare(b.offering.start_date ?? "");
    });
  }

  return groups.sort((a, b) => a.stationLabel.localeCompare(b.stationLabel, "fr"));
}

/** Lien public d'inscription (brouillon Paula 2026-11-03). */
export const COMMERCIAL_REGISTER_URL = "https://www.fli.fr/register";

/** Signature commerciale — toujours « nous », jamais un prénom. */
export const COMMERCIAL_EMAIL_SIGNATURE = "L'équipe FLI";

/** Destinataire unique des essais commerciaux (jamais une adresse client). */
export const COMMERCIAL_TEST_TO = "info@fli.fr";

/**
 * Enveloppe d'un mail test : un seul message à info@fli.fr, avec le brouillon
 * et le décompte des destinataires prévus — pas de copie par personne.
 */
export function buildCommercialTestEnvelope(input: {
  audience: RelanceAudience;
  draftSubject: string;
  draftBody: string;
  recipients: Array<{ email: string; name: string; detail?: string }>;
  contextLabel?: string;
}): { subject: string; bodyText: string } {
  const n = input.recipients.length;
  const audienceLabel =
    input.audience === "directeur" ? "directeurs" : "anciens stagiaires";
  const context = input.contextLabel?.trim()
    ? ` · ${input.contextLabel.trim()}`
    : "";
  const preview = input.recipients
    .slice(0, 25)
    .map((r) => `— ${r.name} <${r.email}>${r.detail ? ` (${r.detail})` : ""}`)
    .join("\n");
  const more =
    n > 25 ? `\n… et ${n - 25} autre${n - 25 > 1 ? "s" : ""}` : "";

  const subject = `[FLI][TEST] Relance ${audienceLabel}${context} — ${n} destinataire${n !== 1 ? "s" : ""}`;

  const bodyText = `Mail test commercial (un seul envoi à ${COMMERCIAL_TEST_TO}).

Campagne : ${audienceLabel}${context}
Destinataires prévus : ${n}
${preview || "— (aucun)"}${more}

——— Brouillon qui partirait ———
Sujet : ${input.draftSubject}

${input.draftBody}`
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { subject, bodyText };
}

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

function stageBulletLine(offering: RegistrationOffering): string {
  const dates = offering.date_label?.trim() ||
    [offering.start_date, offering.end_date].filter(Boolean).join(" → ");
  return `— ${offering.language_label} (${dates})`;
}

/**
 * Brouillon directeur — un mail par station, langues regroupées
 * (ex. Oz : anglais + néerlandais). Voix « nous » + L'équipe FLI.
 */
export function buildDirectorRelanceDraft(input: {
  /** @deprecated préférer `offerings` (regroupement station). */
  offering?: RegistrationOffering;
  offerings?: RegistrationOffering[];
  directeurName?: string | null;
  enrolledCount?: number;
  minRequired?: number;
  registerUrl?: string;
}): RelanceDraft {
  const offerings =
    input.offerings && input.offerings.length > 0
      ? input.offerings
      : input.offering
        ? [input.offering]
        : [];
  if (offerings.length === 0) {
    throw new Error("buildDirectorRelanceDraft : aucun stage fourni");
  }

  const greeting = formatDirectorGreeting(input.directeurName ?? null);
  const url = input.registerUrl ?? COMMERCIAL_REGISTER_URL;
  const station = directorStationLabel(offerings[0]);
  const languages = offerings.map((o) => o.language_label).join(" / ");

  const subject =
    offerings.length === 1
      ? `Stage FLI ${offerings[0].language_label} — ${station} — places encore disponibles`
      : `Stages FLI ${station} (${languages}) — places encore disponibles`;

  const stagesBlock =
    offerings.length === 1
      ? `Pour le moment il nous manque encore des stagiaires pour le stage ${stageLine(offerings[0])}.`
      : `Pour le moment il nous manque encore des stagiaires pour les stages suivants à ${station} :\n${offerings
          .map((o) => stageBulletLine(o))
          .join("\n")}`;

  const bodyText = `${greeting}

${stagesBlock}

Inscription en ligne (tarif selon l'école, FIF-PL possible) :
${url}

Si vous avez des moniteur·rices intéressé·es — ou une autre école du secteur à prévenir — merci de leur transmettre ce lien, ou de nous répondre avec leurs coordonnées : nous nous occupons du reste.

${COMMERCIAL_EMAIL_SIGNATURE}`
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { audience: "directeur", subject, bodyText };
}

/** Brouillon ancien stagiaire — ton commercial, sans parler d'effectif. */
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

  const subject = `Reprendre un stage FLI pour bien préparer votre saison ?`;

  const bodyText = `${greeting}

Nous pensions à vous : et si vous recommenciez un stage avec nous pour mieux préparer votre saison de ski ?

Nous avons encore des places sur ${stage}.

Inscription en ligne (tarif selon l'école, FIF-PL possible) :
${url}

Et si ce n'est pas pour vous cette fois-ci, n'hésitez pas à en parler autour de vous — collègues, moniteur·rices de votre école : le bouche-à-oreille reste notre meilleure pub. Ils peuvent s'inscrire au même lien, ou nous écrire et nous nous occupons du reste.

Si vous avez une question sur les dates, le tarif ou le financement, répondez simplement à ce message : nous vous répondons avec plaisir.

${COMMERCIAL_EMAIL_SIGNATURE}`
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { audience: "ancien", subject, bodyText };
}

/**
 * Anciens stagiaires : e-mail réel, inscription terminée/facturée,
 * pas déjà inscrit·e sur ce stage.
 * — Méribel / Samoëns PT : aucun (Seb pour le PT).
 * — Samoëns anglais : tous les anciens (toutes langues) — « parler à tous ».
 * — Autres stages : anciens de la même langue.
 */
export function selectAlumniForStage(
  offering: Pick<
    RegistrationOffering,
    | "language_label"
    | "language_key"
    | "start_date"
    | "end_date"
    | "location_label"
    | "location_key"
    | "session_code"
  >,
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
  if (isAlumniOutreachExcluded(offering)) return [];

  const talkToEveryone = isSamoensEnglishOffering(offering);

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
      .filter((h) => {
        if (h.status !== "terminee" && h.status !== "facturee") return false;
        if (talkToEveryone) return true;
        return languageKeysMatch(offering.language_label, h.language);
      })
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
