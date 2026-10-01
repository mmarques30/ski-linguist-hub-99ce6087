/**
 * BL-029 — dates d'inscription, copie Deno de `src/lib/registration-dates.ts`.
 *
 * Les fonctions Edge ne peuvent pas importer depuis `src/`, donc la règle est
 * dupliquée comme pour `registration-payments.ts`. `src/lib/registration-dates.test.ts`
 * vérifie que les deux fichiers restent d'accord.
 *
 * Stages en ligne (dates flexibles) : fenêtre 6 h → 2 mois, 12 h → 4 mois,
 * 18 h → 6 mois.
 */

export const DATES_A_PLANIFIER_LABEL = "À planifier";

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

export const REQUESTED_START_DATE_REQUIRED_MESSAGE =
  "Merci d'indiquer la date à laquelle vous souhaitez commencer la formation.";
