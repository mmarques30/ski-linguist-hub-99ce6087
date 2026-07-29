export type SchoolKind = "esf" | "ecole_ski" | "autre";

export interface SkiSchoolRecord {
  id: string;
  name: string;
  director_name?: string | null;
  director_phone?: string | null;
  partner_id?: string | null;
  school_kind?: string | null;
  station?: string | null;
}

export interface PartnerRecord {
  id: string;
  name: string;
  type: string;
  station: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  status?: string | null;
}

export interface PartnerMatchSuggestion {
  partner: PartnerRecord;
  score: number;
  reason: string;
}

export interface SkiSchoolMatchPreview {
  school: SkiSchoolRecord;
  school_kind: SchoolKind;
  station: string | null;
  suggestions: PartnerMatchSuggestion[];
  best_match: PartnerMatchSuggestion | null;
  auto_link: boolean;
}

const STATION_ALIASES: Record<string, string> = {
  "la rosiere": "la rosiere",
  "la rosière": "la rosiere",
  "les menuires": "les menuires",
  "menuires": "les menuires",
  "oz en oisans": "oz en oisans",
  "ozenoisans": "oz en oisans",
  "auris en oisans": "auris en oisans",
  "val cenis": "val cenis",
  "saint gervais": "saint gervais",
  "st gervais": "saint gervais",
  "les gets": "les gets",
  "la clusaz": "la clusaz",
  "samoens": "samoens",
  "samoëns": "samoens",
  "morzine": "morzine",
  "chatel": "chatel",
  "châtel": "chatel",
  "valmorel": "valmorel",
  "pralognan": "pralognan",
  "courchevel": "courchevel",
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectSchoolKind(name: string): SchoolKind {
  const normalized = normalizeText(name);
  if (/\besf\b/.test(normalized) || normalized.startsWith("esf ")) return "esf";
  if (normalized.includes("ecole de ski") || normalized.includes("ski school")) return "ecole_ski";
  return "ecole_ski";
}

export function extractStation(name: string): string | null {
  const normalized = normalizeText(name);
  const withoutPrefix = normalized
    .replace(/^esf\s+/i, "")
    .replace(/^ecole de ski\s+/i, "")
    .trim();

  for (const [alias, canonical] of Object.entries(STATION_ALIASES)) {
    if (withoutPrefix.includes(alias) || normalized.includes(alias)) {
      return canonical;
    }
  }

  const tokens = withoutPrefix.split(" ").filter(Boolean);
  if (tokens.length === 0) return null;
  if (tokens.length <= 3) return tokens.join(" ");
  return tokens.slice(-2).join(" ");
}

function partnerTypesForSchool(kind: SchoolKind): string[] {
  if (kind === "esf") return ["esf", "ecole_ski"];
  return ["ecole_ski", "esf", "autre"];
}

export function scorePartnerMatch(
  school: SkiSchoolRecord,
  partner: PartnerRecord,
  schoolKind: SchoolKind,
  station: string | null
): PartnerMatchSuggestion | null {
  let score = 0;
  const reasons: string[] = [];
  const schoolNorm = normalizeText(school.name);
  const partnerNorm = normalizeText(partner.name);
  const partnerStation = partner.station ? normalizeText(partner.station) : null;
  const targetStation = station ? normalizeText(station) : null;

  if (partnerTypesForSchool(schoolKind).includes(partner.type)) {
    score += 15;
    reasons.push(`type:${partner.type}`);
  }

  if (targetStation && partnerStation) {
    if (partnerStation === targetStation || partnerStation.includes(targetStation) || targetStation.includes(partnerStation)) {
      score += 40;
      reasons.push("station");
    }
  }

  if (schoolNorm === partnerNorm) {
    score += 50;
    reasons.push("nom exact");
  } else if (schoolNorm.includes(partnerNorm) || partnerNorm.includes(schoolNorm)) {
    score += 30;
    reasons.push("nom partiel");
  }

  const schoolTokens = new Set(schoolNorm.split(" ").filter((t) => t.length > 2));
  const partnerTokens = new Set(partnerNorm.split(" ").filter((t) => t.length > 2));
  const overlap = [...schoolTokens].filter((t) => partnerTokens.has(t)).length;
  if (overlap >= 2) {
    score += overlap * 8;
    reasons.push("tokens communs");
  }

  if (school.director_name && partner.contact_name) {
    const directorNorm = normalizeText(school.director_name);
    const contactNorm = normalizeText(partner.contact_name);
    if (directorNorm && contactNorm && (directorNorm.includes(contactNorm) || contactNorm.includes(directorNorm))) {
      score += 20;
      reasons.push("directeur");
    }
  }

  if (partner.type === "directeur" && targetStation && partnerStation === targetStation) {
    score += 10;
    reasons.push("directeur station");
  }

  if (score < 35) return null;
  return { partner, score, reason: reasons.join(", ") };
}

export function suggestSchoolPartnerMatches(
  school: SkiSchoolRecord,
  partners: PartnerRecord[]
): SkiSchoolMatchPreview {
  const school_kind = (school.school_kind as SchoolKind) || detectSchoolKind(school.name);
  const station = school.station || extractStation(school.name);

  const suggestions = partners
    .map((partner) => scorePartnerMatch(school, partner, school_kind, station))
    .filter((item): item is PartnerMatchSuggestion => item !== null)
    .sort((a, b) => b.score - a.score);

  const best_match = suggestions[0] || null;
  const auto_link = !!best_match && best_match.score >= 70 && (best_match.score - (suggestions[1]?.score || 0)) >= 15;

  return {
    school,
    school_kind,
    station,
    suggestions: suggestions.slice(0, 5),
    best_match,
    auto_link,
  };
}

export function buildPartnerPayloadFromSchool(
  school: SkiSchoolRecord,
  schoolKind: SchoolKind,
  station: string | null
): {
  name: string;
  type: string;
  station: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  status: string;
  notes: string;
} {
  return {
    name: school.name,
    type: schoolKind === "esf" ? "esf" : "ecole_ski",
    station,
    contact_name: school.director_name || null,
    contact_phone: school.director_phone || null,
    status: "actif",
    notes: `Créé automatiquement depuis ski_schools (${schoolKind})`,
  };
}
