export type EnrollmentStatus = "open" | "waitlist";

/** Mode de financement session (SESSIONS §3). */
export type SessionFundingMode =
  | "individuel"
  | "forfait_ecole"
  | "fifpl_stagiaire_solde_ecole";

export interface RegistrationOffering {
  id: string;
  season_id: string | null;
  session_code?: string | null;
  location_key: string;
  location_label: string;
  language_key: string;
  language_label: string;
  modality_key: "in_person" | "online_individual" | "online_group";
  modality_label: string;
  duration_hours: number;
  start_date: string | null;
  end_date: string | null;
  date_label: string | null;
  format_label?: string | null;
  instructor_label?: string | null;
  base_price: number;
  partner_price?: number | null;
  /** Second tarif partenaire (ex. Châtel 800 sans studio). */
  partner_price_alt?: number | null;
  /** Tarif partenaire non définitif → inscription sans paiement. */
  partner_price_pending?: boolean | null;
  partner_school_codes?: string[] | null;
  funding_mode?: SessionFundingMode | null;
  enrollment_status?: EnrollmentStatus | null;
  sort_order: number;
}

export interface LocationOption {
  key: string;
  label: string;
  count: number;
}

export interface DateOption {
  key: string;
  label: string;
  start_date: string | null;
  end_date: string | null;
}

/** Tarif appliqué selon l'école (SESSIONS §3.1). */
export function resolveOfferingPrice(
  offering: Pick<
    RegistrationOffering,
    "base_price" | "partner_price" | "partner_school_codes" | "partner_price_pending"
  >,
  skiSchoolCode?: string | null
): number | null {
  const codes = offering.partner_school_codes ?? [];
  const isPartner =
    Boolean(skiSchoolCode) &&
    skiSchoolCode !== "__autre__" &&
    codes.includes(skiSchoolCode as string);

  // Châtel §3.6 : partenaire sans tarif définitif → pas de montant unique.
  if (isPartner && offering.partner_price_pending) {
    return null;
  }

  const partner = offering.partner_price;
  if (isPartner && partner != null) {
    return Number(partner);
  }
  return Number(offering.base_price);
}

export function isPartnerSchool(
  offering: Pick<RegistrationOffering, "partner_school_codes">,
  skiSchoolCode?: string | null
): boolean {
  const codes = offering.partner_school_codes ?? [];
  return Boolean(
    skiSchoolCode && skiSchoolCode !== "__autre__" && codes.includes(skiSchoolCode)
  );
}

/** Inscription partenaire sans paiement tant que le tarif n'est pas fixé (Châtel). */
export function isPartnerPricePending(
  offering: Pick<
    RegistrationOffering,
    "partner_price_pending" | "partner_school_codes" | "partner_price" | "partner_price_alt"
  >,
  skiSchoolCode?: string | null
): boolean {
  return Boolean(offering.partner_price_pending) && isPartnerSchool(offering, skiSchoolCode);
}

export function getSessionFundingMode(
  offering: Pick<RegistrationOffering, "funding_mode"> | null | undefined
): SessionFundingMode {
  const mode = offering?.funding_mode;
  if (mode === "forfait_ecole" || mode === "fifpl_stagiaire_solde_ecole") return mode;
  return "individuel";
}

/** Méribel / La Rosière : pas d'option acompte 150 € (décision 02/10). */
export function hidesDepositPaymentOptions(fundingMode: SessionFundingMode): boolean {
  return fundingMode === "forfait_ecole" || fundingMode === "fifpl_stagiaire_solde_ecole";
}

/** La Rosière : calculatrice FIF-PL obligatoire (sert de base part moniteur / solde ESF). */
export function requiresMandatoryFifplEstimate(fundingMode: SessionFundingMode): boolean {
  return fundingMode === "fifpl_stagiaire_solde_ecole";
}

export const CHATEL_PENDING_PRICE_MESSAGE =
  "Nous attendons la décision de la direction de l'ESF Châtel sur les moyens logistiques. Vos documents de formation (convention, programme, dossier FIF-PL) vous seront envoyés dès que cette décision nous est communiquée.";

export function formatPartnerConditionalPriceHint(
  offering: Pick<RegistrationOffering, "partner_price" | "partner_price_alt">
): string {
  const low = offering.partner_price != null ? Number(offering.partner_price) : null;
  const high = offering.partner_price_alt != null ? Number(offering.partner_price_alt) : null;
  if (low != null && high != null && low !== high) {
    return `${formatPriceEUR(low)} si l'ESF fournit le logement de l'intervenant·e, ${formatPriceEUR(high)} sinon`;
  }
  if (low != null) return formatPriceEUR(low);
  if (high != null) return formatPriceEUR(high);
  return "tarif à confirmer";
}

export function isWaitlistOffering(
  offering: Pick<RegistrationOffering, "enrollment_status">
): boolean {
  return offering.enrollment_status === "waitlist";
}

export function isOpenOffering(
  offering: Pick<RegistrationOffering, "enrollment_status">
): boolean {
  return (offering.enrollment_status ?? "open") === "open";
}

/** Libellé tarif avant connaissance de l'école. */
export function formatOfferingPriceHint(
  offering: Pick<
    RegistrationOffering,
    | "base_price"
    | "partner_price"
    | "partner_price_alt"
    | "partner_price_pending"
    | "partner_school_codes"
  >
): string {
  const base = Number(offering.base_price);
  const partner = offering.partner_price != null ? Number(offering.partner_price) : base;
  const hasPartnerList = (offering.partner_school_codes ?? []).length > 0;
  if (offering.partner_price_pending && hasPartnerList) {
    return `${formatPartnerConditionalPriceHint(offering)} · ${formatPriceEUR(base)} autres`;
  }
  if (hasPartnerList && partner !== base) {
    return `${formatPriceEUR(partner)} école partenaire · ${formatPriceEUR(base)} autres`;
  }
  return formatPriceEUR(base);
}

export function filterInPersonSessions(offerings: RegistrationOffering[]) {
  return offerings
    .filter((o) => o.modality_key === "in_person")
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function filterOnlineGroupSessions(offerings: RegistrationOffering[]) {
  return offerings
    .filter((o) => o.modality_key === "online_group")
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function filterOnlineIndividual(offerings: RegistrationOffering[]) {
  return offerings
    .filter((o) => o.modality_key === "online_individual")
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function uniqueLocations(offerings: RegistrationOffering[]): LocationOption[] {
  const map = new Map<string, LocationOption>();
  for (const o of offerings) {
    const existing = map.get(o.location_key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(o.location_key, { key: o.location_key, label: o.location_label, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export function filterByLocation(offerings: RegistrationOffering[], locationKey: string) {
  return offerings.filter((o) => o.location_key === locationKey);
}

export function uniqueModalities(offerings: RegistrationOffering[]) {
  const map = new Map<string, { key: string; label: string }>();
  for (const o of offerings) {
    map.set(o.modality_key, { key: o.modality_key, label: o.modality_label });
  }
  return Array.from(map.values());
}

export function uniqueLanguages(offerings: RegistrationOffering[]) {
  const map = new Map<string, { key: string; label: string }>();
  for (const o of offerings) {
    map.set(o.language_key, { key: o.language_key, label: o.language_label });
  }
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export function uniqueDateOptions(offerings: RegistrationOffering[]): DateOption[] {
  const map = new Map<string, DateOption>();
  for (const o of offerings) {
    const key = o.start_date && o.end_date ? `${o.start_date}_${o.end_date}` : o.date_label || "flex";
    const label =
      o.date_label ||
      (o.start_date && o.end_date
        ? `${formatDateFr(o.start_date)} → ${formatDateFr(o.end_date)}`
        : "Dates à confirmer");
    map.set(key, { key, label, start_date: o.start_date, end_date: o.end_date });
  }
  return Array.from(map.values());
}

export function uniqueDurations(offerings: RegistrationOffering[]) {
  const hours = [...new Set(offerings.map((o) => o.duration_hours))].sort((a, b) => a - b);
  const modality = offerings[0]?.modality_key;
  return hours.map((h) => ({ hours: h, label: formatDurationLabel(h, modality) }));
}

export function formatDurationLabel(hours: number, modalityKey?: string): string {
  if (modalityKey === "in_person") {
    if (hours === 20) return "20 heures — 1 semaine";
    if (hours === 24) return "24 heures — 1 semaine";
    if (hours === 40) return "40 heures — 2 semaines";
  }
  return `${hours} heures`;
}

export function matchOffering(
  offerings: RegistrationOffering[],
  filters: {
    locationKey: string;
    modalityKey?: string;
    languageKey?: string;
    dateKey?: string;
    durationHours?: number;
    sessionCode?: string;
  }
): RegistrationOffering | null {
  return (
    offerings.find((o) => {
      if (filters.sessionCode && o.session_code !== filters.sessionCode) return false;
      if (o.location_key !== filters.locationKey) return false;
      if (filters.modalityKey && o.modality_key !== filters.modalityKey) return false;
      if (filters.languageKey && o.language_key !== filters.languageKey) return false;
      if (filters.durationHours != null && o.duration_hours !== filters.durationHours) return false;
      if (filters.dateKey) {
        const oKey =
          o.start_date && o.end_date ? `${o.start_date}_${o.end_date}` : o.date_label || "flex";
        if (oKey !== filters.dateKey) return false;
      }
      return true;
    }) || null
  );
}

function formatDateFr(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatPriceEUR(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

/** Valeur spéciale pour « Autres formats — sur devis » */
export const CUSTOM_FORMAT_DURATION = "custom";

export function isCustomFormatDuration(duration?: string): boolean {
  return duration === CUSTOM_FORMAT_DURATION;
}

export const WAITLIST_MESSAGE =
  "Cette formation est en attente de confirmation. Merci de nous laisser vos coordonnées : nous vous appellerons dès que la session est confirmée.";
