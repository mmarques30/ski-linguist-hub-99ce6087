/**
 * Destinataires des résultats de tests oraux (ESF / école / DSF).
 * CC systématique : app_settings.evaluation_results_cc (par partner id)
 * et/ou ski_school_directory.courriel_resultats_cc.
 * `partners` est gelé (point 5) — ne pas compter sur partners.evaluation_results_cc.
 */

export type EvaluationResultsCcEntry = {
  emails?: string[] | null;
  label?: string | null;
};

/** Valeur de app_settings.evaluation_results_cc : map partner_id → entrée. */
export type EvaluationResultsCcSettings = Record<string, EvaluationResultsCcEntry>;

export type EvaluationResultsPartner = {
  id?: string | null;
  contact_email?: string | null;
  evaluation_results_cc?: string[] | null;
};

export type EvaluationResultsRecipients = {
  to: string | null;
  cc: string[];
};

function normalizeEmail(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

function pushUniqueCc(cc: string[], seen: Set<string>, toKey: string, email: string | null) {
  if (!email) return;
  const key = email.toLowerCase();
  if (key === toKey || seen.has(key)) return;
  seen.add(key);
  cc.push(email);
}

/**
 * Calcule TO + CC pour un envoi de résultats.
 * - `toOverride` : force le destinataire (ex. envoi demandé à la secrétaire).
 * - Sinon TO = contact_email du partenaire.
 * - CC = settings[partnerId].emails ∪ partner.evaluation_results_cc ∪ directoryCc,
 *   sans doublon du TO.
 */
export function resolveEvaluationResultsRecipients(options: {
  partner?: EvaluationResultsPartner | null;
  toOverride?: string | null;
  settings?: EvaluationResultsCcSettings | null;
  directoryCc?: string | null;
}): EvaluationResultsRecipients {
  const { partner, toOverride, settings, directoryCc } = options;
  const to =
    normalizeEmail(toOverride) ?? normalizeEmail(partner?.contact_email ?? null);
  const toKey = to?.toLowerCase() ?? "";
  const seen = new Set<string>();
  const cc: string[] = [];

  const fromSettings =
    partner?.id && settings ? settings[partner.id]?.emails ?? [] : [];
  for (const entry of fromSettings) {
    pushUniqueCc(cc, seen, toKey, normalizeEmail(entry));
  }
  for (const entry of partner?.evaluation_results_cc ?? []) {
    pushUniqueCc(cc, seen, toKey, normalizeEmail(entry));
  }
  pushUniqueCc(cc, seen, toKey, normalizeEmail(directoryCc));

  return { to, cc };
}

/** Parse le JSON app_settings.evaluation_results_cc (objet ou string). */
export function parseEvaluationResultsCcSettings(
  raw: unknown
): EvaluationResultsCcSettings {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: EvaluationResultsCcSettings = {};
  for (const [partnerId, entry] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const emailsRaw = (entry as EvaluationResultsCcEntry).emails;
    const emails = Array.isArray(emailsRaw)
      ? emailsRaw.filter((e): e is string => typeof e === "string")
      : [];
    out[partnerId] = {
      emails,
      label:
        typeof (entry as EvaluationResultsCcEntry).label === "string"
          ? (entry as EvaluationResultsCcEntry).label
          : null,
    };
  }
  return out;
}
