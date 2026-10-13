/**
 * BL-029 — dates d'inscription.
 *
 * `submit-registration` retombait sur les dates de la saison courante quand le
 * stagiaire n'avait pas de session datée : toutes les offres en ligne du
 * catalogue sont « Dates flexibles », donc chaque inscription en ligne héritait
 * du 01/12/2026 → 31/03/2027. Ces dates fausses alimentaient ensuite la liste
 * J-10 et les emails de rappel.
 *
 * Règle retenue : on exige toujours une date de début, mais on distingue la
 * session datée du catalogue (dates fermes) de la date souhaitée par le
 * stagiaire (dates à planifier avec FLI). Rien n'est inventé côté serveur.
 *
 * Stages en ligne (dates flexibles) : la fin n'est plus calée sur le même jour
 * que le début. Fenêtre de réalisation selon la durée du pack :
 * 6 h → 2 mois, 12 h → 4 mois, 18 h → 6 mois (et proportionnel au-delà).
 */

/** Libellé affiché partout où les dates ne sont pas encore fermes. */
export const DATES_A_PLANIFIER_LABEL = "À planifier";

/**
 * Délai en deçà duquel FLI ne garantit plus le démarrage : c'est le même J-10
 * que la validation des horaires (`SCHEDULE_ASSIGNMENT_DAYS_BEFORE`).
 */
export const DELAI_DEMARRAGE_JOURS = 10;

export interface OfferingDates {
  start_date?: string | null;
  end_date?: string | null;
}

/** Vrai quand la session du catalogue porte des dates fermes. */
export function offeringHasFixedDates(offering?: OfferingDates | null): boolean {
  return Boolean(offering?.start_date && offering?.end_date);
}

/** Date du jour au format ISO court, dans le fuseau du navigateur. */
export function todayIso(now: Date = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Ajoute des jours à une date ISO courte, sans passer par le fuseau local. */
export function addDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * Ajoute des mois calendaires à une date ISO courte (UTC), en rabattant le jour
 * sur le dernier jour du mois cible si besoin (31 janv. + 1 mois → 28/29 févr.).
 */
export function addMonthsIso(iso: string, months: number): string {
  if (!isIsoDate(iso)) return iso;
  const [year, month, day] = iso.split("-").map(Number);
  const anchor = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const clampedDay = Math.min(day, lastDay);
  return new Date(
    Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), clampedDay)
  )
    .toISOString()
    .slice(0, 10);
}

/**
 * Fenêtre de réalisation (en mois) pour un pack en ligne à dates flexibles.
 * 6 h → 2 mois, 12 h → 4 mois, 18 h → 6 mois ; sinon `round(heures / 3)`.
 */
export function onlineFlexibleWindowMonths(
  durationHours: number | null | undefined
): number {
  const hours = Number(durationHours);
  if (!Number.isFinite(hours) || hours <= 0) return 2;
  return Math.max(1, Math.round(hours / 3));
}

export type RequestedStartDateProblem = "manquante" | "invalide" | "passee";

/**
 * Contrôle la date de début souhaitée. Une date passée est refusée : elle
 * placerait l'inscription en retard dans la liste J-10 dès sa création.
 */
export function requestedStartDateProblem(
  value: string | null | undefined,
  today: string = todayIso()
): RequestedStartDateProblem | null {
  if (!value) return "manquante";
  if (!isIsoDate(value)) return "invalide";
  if (value < today) return "passee";
  return null;
}

export const REQUESTED_START_DATE_MESSAGES: Record<RequestedStartDateProblem, string> = {
  manquante: "Merci d'indiquer la date à laquelle vous souhaitez commencer.",
  invalide: "La date de début souhaitée n'est pas une date valide.",
  passee: "La date de début souhaitée doit être aujourd'hui ou plus tard.",
};

/**
 * Message d'information — pas un blocage : en deçà de dix jours, FLI doit
 * confirmer la faisabilité avant de caler les horaires.
 */
export function requestedStartDateNotice(
  value: string | null | undefined,
  today: string = todayIso()
): string | null {
  if (!isIsoDate(value) || value < today) return null;
  if (value >= addDaysIso(today, DELAI_DEMARRAGE_JOURS)) return null;
  return (
    `Ce début est dans moins de ${DELAI_DEMARRAGE_JOURS} jours : l'équipe FLI vous ` +
    "confirmera la faisabilité et la date définitive."
  );
}

export interface ResolvedInscriptionDates {
  start_date: string;
  end_date: string;
  dates_to_confirm: boolean;
}

/**
 * Dates à écrire sur l'inscription. Une session datée du catalogue donne des
 * dates fermes ; sinon on retient la date souhaitée par le stagiaire, on pose
 * une fenêtre de réalisation selon la durée du pack, et on marque l'inscription
 * « à planifier ». Aucune date de saison n'est héritée : sans date exploitable,
 * la fonction renvoie `null` et l'appelant refuse.
 */
export function resolveInscriptionDates(input: {
  startDate?: string | null;
  endDate?: string | null;
  requestedStartDate?: string | null;
  durationHours?: number | null;
}): ResolvedInscriptionDates | null {
  if (isIsoDate(input.startDate) && isIsoDate(input.endDate)) {
    return {
      start_date: input.startDate,
      end_date: input.endDate,
      dates_to_confirm: false,
    };
  }

  const requested = isIsoDate(input.requestedStartDate)
    ? input.requestedStartDate
    : isIsoDate(input.startDate)
      ? input.startDate
      : null;

  if (!requested) return null;

  const months = onlineFlexibleWindowMonths(input.durationHours);
  return {
    start_date: requested,
    end_date: addMonthsIso(requested, months),
    dates_to_confirm: true,
  };
}

export function formatDateFr(iso: string | null | undefined): string {
  if (!isIsoDate(iso)) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export interface InscriptionDates {
  start_date?: string | null;
  end_date?: string | null;
  dates_to_confirm?: boolean | null;
}

/** Date de début telle qu'elle doit apparaître dans une liste. */
export function inscriptionStartDateLabel(inscription: InscriptionDates): string {
  if (inscription.dates_to_confirm) return DATES_A_PLANIFIER_LABEL;
  return formatDateFr(inscription.start_date) || DATES_A_PLANIFIER_LABEL;
}

/** Période complète, pour une fiche, un PDF ou un email. */
export function inscriptionDateRangeLabel(inscription: InscriptionDates): string {
  const start = formatDateFr(inscription.start_date);
  const end = formatDateFr(inscription.end_date);

  if (inscription.dates_to_confirm) {
    if (!start) return DATES_A_PLANIFIER_LABEL;
    if (end && end !== start) {
      return `${DATES_A_PLANIFIER_LABEL} — début souhaité le ${start}, à réaliser avant le ${end}`;
    }
    return `${DATES_A_PLANIFIER_LABEL} — début souhaité le ${start}`;
  }

  if (!start) return DATES_A_PLANIFIER_LABEL;
  if (!end || end === start) return start;
  return `du ${start} au ${end}`;
}

/**
 * Variante destinée aux emails : le libellé s'insère dans une phrase
 * (« votre inscription à la formation Anglais, {{dates_label}}. »), donc pas de
 * majuscule initiale et jamais un « À planifier » nu qui ne veut rien dire
 * pour le stagiaire.
 */
export function inscriptionDatesSentenceFr(inscription: InscriptionDates): string {
  const start = formatDateFr(inscription.start_date);
  const end = formatDateFr(inscription.end_date);
  const base = "dates à planifier avec l'équipe FLI";

  if (inscription.dates_to_confirm) {
    if (!start) return base;
    if (end && end !== start) {
      return `${base} (début souhaité : ${start}, à réaliser avant le ${end})`;
    }
    return `${base} (début souhaité : ${start})`;
  }

  if (!start || !end || end === start) {
    return start ? `${base} (début souhaité : ${start})` : base;
  }

  return `du ${start} au ${end}`;
}
