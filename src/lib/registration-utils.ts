/** Maps registration form language keys to DB inscription language labels. */
export const REGISTRATION_LANGUAGE_MAP: Record<string, string> = {
  english: "Anglais",
  portuguese: "Portugais",
  russian: "Russe",
  dutch: "Néerlandais",
  german: "Allemand",
  spanish: "Espagnol",
  italian: "Italien",
  chinese: "Chinois",
  french: "Français",
};

export const REGISTRATION_MODALITY_MAP: Record<string, string> = {
  in_person: "presentiel",
  online_individual: "en_ligne_individuel",
  online_group: "en_ligne_groupe",
};

export const REGISTRATION_FUNDING_MAP: Record<string, string> = {
  opco: "OPCO / FIFPL",
  company: "Entreprise",
  self: "Autofinancement",
};

export const LOCATION_LABELS: Record<string, string> = {
  valdisere: "Val d'Isère",
  courchevel: "Courchevel",
  meribel: "Méribel",
  lesarcs: "Les Arcs",
  chamonix: "Chamonix",
};

export function parseDurationHours(duration?: string): number | null {
  if (!duration) return null;
  const match = duration.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}
