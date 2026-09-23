/**
 * BL-019 — horaires FLI exacts pour les groupes matin / après-midi en station.
 *
 * `schedule_status` reste le jeton technique (`pending` | `matin` | `apres-midi`).
 * La colonne libre `schedule` porte le libellé affiché / envoyé aux stagiaires :
 * les plages réelles FLI, jamais le jeton seul ni un code d'inscription.
 *
 * Les codes d'inscription (`FLI-AAnnnn`) viennent uniquement de
 * `generate_inscription_code` / de la colonne Code à l'import — jamais des
 * horaires.
 */

export type FliScheduleSlot = "matin" | "apres-midi";

/** Plages horaires officielles des stages collectifs en station. */
export const FLI_SCHEDULE_HOURS: Record<FliScheduleSlot, string> = {
  matin: "de 8h30 à 12h30",
  "apres-midi": "de 13h30 à 17h30",
};

export const FLI_SCHEDULE_SLOT_LABELS: Record<FliScheduleSlot, string> = {
  matin: "Matin",
  "apres-midi": "Après-midi",
};

/** Texte stocké dans `inscriptions.schedule` à la validation J-10. */
export function scheduleTextForSlot(slot: FliScheduleSlot): string {
  return FLI_SCHEDULE_HOURS[slot];
}

/**
 * Libellé convocation / e-mail (« Groupe matin, de 8h30 à 12h30 »).
 * Ne contient jamais le code d'inscription.
 */
export function scheduleLabelForSlot(slot: FliScheduleSlot): string {
  return `Groupe ${FLI_SCHEDULE_SLOT_LABELS[slot].toLowerCase()}, ${FLI_SCHEDULE_HOURS[slot]}`;
}

/** Libellé court pour boutons UI. */
export function scheduleButtonLabel(slot: FliScheduleSlot): string {
  return `${FLI_SCHEDULE_SLOT_LABELS[slot]} — ${FLI_SCHEDULE_HOURS[slot].replace(/^de /, "")}`;
}

/**
 * Retrouve le créneau à partir d'un horaire libre (import ou validation).
 * Ne lit que les plages FLI connues ; le reste (visio, « à définir ») → null.
 */
export function inferSlotFromSchedule(schedule: string | null | undefined): FliScheduleSlot | null {
  if (!schedule) return null;
  const normalized = schedule.trim().toLowerCase().replace(/\s+/g, " ");
  if (
    normalized === "matin" ||
    (normalized.includes("8h30") && normalized.includes("12h30"))
  ) {
    return "matin";
  }
  if (
    normalized === "apres-midi" ||
    normalized === "après-midi" ||
    (normalized.includes("13h30") && normalized.includes("17h30"))
  ) {
    return "apres-midi";
  }
  return null;
}

/**
 * Garde-fou BL-019 : un horaire n'est jamais un code d'inscription.
 * Un vrai code FLI ressemble à FLI-260012 ; « 8h30 » ou « de 8h30 à 12h30 » non.
 */
export function looksLikeInscriptionCode(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^FLI-\d{2}\d{4}$/i.test(value.trim());
}

export function isScheduleMistakenForCode(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (looksLikeInscriptionCode(trimmed)) return false;
  // Plages / jetons d'horaire courants dans les exports FLI.
  return (
    /h\d{0,2}/i.test(trimmed) ||
    /matin|après-midi|apres-midi|planning/i.test(trimmed) ||
    /^de\s+\d/i.test(trimmed)
  );
}
