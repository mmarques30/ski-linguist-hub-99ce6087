export interface RegistrationOffering {
  id: string;
  season_id: string | null;
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
  base_price: number;
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
      (o.start_date && o.end_date ? `${formatDateFr(o.start_date)} → ${formatDateFr(o.end_date)}` : "Dates à confirmer");
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
  }
): RegistrationOffering | null {
  return (
    offerings.find((o) => {
      if (o.location_key !== filters.locationKey) return false;
      if (filters.modalityKey && o.modality_key !== filters.modalityKey) return false;
      if (filters.languageKey && o.language_key !== filters.languageKey) return false;
      if (filters.durationHours != null && o.duration_hours !== filters.durationHours) return false;
      if (filters.dateKey) {
        const oKey = o.start_date && o.end_date ? `${o.start_date}_${o.end_date}` : o.date_label || "flex";
        if (oKey !== filters.dateKey) return false;
      }
      return true;
    }) || null
  );
}

function formatDateFr(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export function formatPriceEUR(price: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
}
