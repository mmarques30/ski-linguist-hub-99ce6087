/**
 * C3 — Planning unifié : mapping catalogue → cohorte calendrier.
 * La matérialisation SQL vit dans sync_planning_sessions_from_offerings().
 */

import type { RegistrationOffering } from "@/lib/registration-offerings";

/** Capacités documentées (SESSIONS_2026_2027 §5). */
export const PLANNING_MAX_BY_SESSION: Record<string, number> = {
  S05: 24,
  S06: 24,
  S14: 12,
  S10: 16,
};

export const PLANNING_MAX_ONLINE_GROUP = 8;
export const PLANNING_MAX_IN_PERSON = 16;

export function maxStudentsForOffering(
  offering: Pick<RegistrationOffering, "session_code" | "modality_key">
): number {
  if (offering.modality_key === "online_individual") return 1;
  if (offering.modality_key === "online_group") return PLANNING_MAX_ONLINE_GROUP;
  const code = (offering.session_code ?? "").toUpperCase();
  if (code && PLANNING_MAX_BY_SESSION[code] != null) {
    return PLANNING_MAX_BY_SESSION[code];
  }
  return PLANNING_MAX_IN_PERSON;
}

export function planningModalityForOffering(
  modalityKey: RegistrationOffering["modality_key"] | string | null | undefined
): "individuel" | "groupe" {
  return modalityKey === "online_individual" ? "individuel" : "groupe";
}

export function planningSessionTitle(
  offering: Pick<
    RegistrationOffering,
    "session_code" | "location_label" | "language_label"
  >
): string {
  return [offering.session_code, offering.location_label, offering.language_label]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" · ");
}

/** Une offre entre-t-elle dans le calendrier (cohorte datée) ? */
export function offeringEligibleForPlanning(
  offering: Pick<
    RegistrationOffering,
    "start_date" | "end_date" | "modality_key"
  >
): boolean {
  if (!offering.start_date || !offering.end_date) return false;
  if (offering.modality_key === "online_individual") return false;
  return true;
}

/** Jour civil (yyyy-MM-dd) couvert par une session cohorte ? */
export function sessionCoversLocalDay(
  session: { start_datetime: string; end_datetime: string },
  dayIso: string
): boolean {
  const startDay = session.start_datetime.slice(0, 10);
  const endDay = session.end_datetime.slice(0, 10);
  return dayIso >= startDay && dayIso <= endDay;
}

/** Sessions multi-jours (offre semaine) vs créneau horaire manuel. */
export function isCohortSession(session: {
  offering_id?: string | null;
  start_datetime: string;
  end_datetime: string;
}): boolean {
  if (session.offering_id) return true;
  const startDay = session.start_datetime.slice(0, 10);
  const endDay = session.end_datetime.slice(0, 10);
  return startDay !== endDay;
}
