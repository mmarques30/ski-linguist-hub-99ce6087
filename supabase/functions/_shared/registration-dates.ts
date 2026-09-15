/**
 * BL-029 — dates d'inscription, copie Deno de `src/lib/registration-dates.ts`.
 *
 * Les fonctions Edge ne peuvent pas importer depuis `src/`, donc la règle est
 * dupliquée comme pour `registration-payments.ts`. `src/lib/registration-dates.test.ts`
 * vérifie que les deux fichiers restent d'accord.
 */

export const DATES_A_PLANIFIER_LABEL = "À planifier";

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export interface ResolvedInscriptionDates {
  start_date: string;
  end_date: string;
  dates_to_confirm: boolean;
}

/**
 * Dates à écrire sur l'inscription. Une session datée du catalogue donne des
 * dates fermes ; sinon on retient la date souhaitée par le stagiaire et on
 * marque l'inscription « à planifier ». Aucune date de saison n'est héritée :
 * sans date exploitable, la fonction renvoie `null` et l'appelant refuse.
 */
export function resolveInscriptionDates(input: {
  startDate?: string | null;
  endDate?: string | null;
  requestedStartDate?: string | null;
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

  // `end_date` est NOT NULL et doit rester >= `start_date` : on la cale sur le
  // début souhaité, et `dates_to_confirm` dit à l'interface de ne pas afficher
  // cette date comme une fin de formation.
  return { start_date: requested, end_date: requested, dates_to_confirm: true };
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

  if (inscription.dates_to_confirm || !start || !end || end === start) {
    const base = "dates à planifier avec l'équipe FLI";
    return start ? `${base} (début souhaité : ${start})` : base;
  }

  return `du ${start} au ${end}`;
}

export const REQUESTED_START_DATE_REQUIRED_MESSAGE =
  "Merci d'indiquer la date à laquelle vous souhaitez commencer la formation.";
