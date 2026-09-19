/**
 * BL-038 — détection et fusion de doublons partenaires.
 *
 * Règles (strictes, pour éviter les faux positifs magasin↔ESF même station) :
 * 1. Même nom normalisé + même station normalisée
 * 2. Fiche directeur / e-mail / « À l'attention » (prospect) dont la station
 *    désigne explicitement une fiche ESF active (égalité après normalisation)
 *
 * La fusion réelle écrit les FK vers le gardien ; la suppression de la fiche
 * perdante demande que le gel prospection soit levé (sinon on enregistre le
 * mapping dans `app_settings.partner_dedup_map`).
 */

import {
  looksLikeEmailName,
  startsWithAttention,
} from "@/lib/partner-name-quality";

export const PARTNER_DEDUP_MAP_KEY = "partner_dedup_map";

export type PartnerDedupReason = "same_name_station" | "directeur_esf";

export interface PartnerDedupInput {
  id: string;
  name: string;
  type: string;
  status: string;
  station: string | null;
  contact_email?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
}

export interface PartnerDedupMatch {
  partner: PartnerDedupInput;
  reason: PartnerDedupReason;
  label: string;
}

export interface PartnerDedupCluster {
  key: string;
  reason: PartnerDedupReason;
  members: PartnerDedupInput[];
  keeperId: string;
}

export type PartnerDedupMap = Record<string, string>;

const REASON_LABELS: Record<PartnerDedupReason, string> = {
  same_name_station: "Même nom et station",
  directeur_esf: "Directeur / prospect ↔ ESF actif",
};

export function normalizePartnerText(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Station comparable : retire un préfixe « esf » éventuel. */
export function normalizePartnerStation(value: string | null | undefined): string {
  return normalizePartnerText(value).replace(/^esf\s+/, "").trim();
}

export function isDirectorLikePartner(p: PartnerDedupInput): boolean {
  if (p.type === "directeur") return true;
  if (looksLikeEmailName(p.name) || startsWithAttention(p.name)) return true;
  return false;
}

export function isActiveEsf(p: PartnerDedupInput): boolean {
  return p.type === "esf" && p.status === "actif";
}

/**
 * Station du directeur désigne-t-elle cette ESF ?
 * Égalité stricte après normalisation (pas de sous-chaîne floue).
 */
export function directorStationMatchesEsf(
  directorStation: string | null | undefined,
  esf: PartnerDedupInput
): boolean {
  const d = normalizePartnerStation(directorStation);
  if (!d || d.length < 3) return false;
  const esfName = normalizePartnerStation(esf.name);
  const esfStation = normalizePartnerStation(esf.station);
  if (d === esfName) return true;
  if (esfStation && d === esfStation) return true;
  return false;
}

/** Nom affiché suggéré pour une fiche « À l'attention… » ou e-mail. */
export function suggestPartnerDisplayName(p: PartnerDedupInput): string | null {
  const name = (p.name ?? "").trim();
  if (startsWithAttention(name)) {
    const stripped = name
      .replace(/^[àa]\s*l[''']attention\s*(de\s*)?/i, "")
      .replace(/^m\.?\s+/i, "")
      .replace(/^mr\.?\s+/i, "")
      .replace(/^mme\.?\s+/i, "")
      .trim();
    return stripped.length >= 2 ? stripped : null;
  }
  if (looksLikeEmailName(name)) {
    const contact = (p.contact_name ?? "").trim();
    if (contact && !looksLikeEmailName(contact) && !startsWithAttention(contact)) {
      return contact;
    }
    return null;
  }
  return null;
}

const STATUS_RANK: Record<string, number> = {
  actif: 3,
  prospect: 2,
  inactif: 1,
};

const TYPE_RANK: Record<string, number> = {
  esf: 5,
  ecole_ski: 4,
  magasin: 2,
  directeur: 1,
  autre: 1,
};

/** Choisit la fiche à conserver dans un cluster. */
export function pickPreferredPartner(members: PartnerDedupInput[]): PartnerDedupInput {
  if (members.length === 0) {
    throw new Error("pickPreferredPartner: cluster vide");
  }
  return [...members].sort((a, b) => {
    const statusDiff = (STATUS_RANK[b.status] ?? 0) - (STATUS_RANK[a.status] ?? 0);
    if (statusDiff !== 0) return statusDiff;
    const typeDiff = (TYPE_RANK[b.type] ?? 0) - (TYPE_RANK[a.type] ?? 0);
    if (typeDiff !== 0) return typeDiff;
    const aBad = looksLikeEmailName(a.name) || startsWithAttention(a.name) ? 1 : 0;
    const bBad = looksLikeEmailName(b.name) || startsWithAttention(b.name) ? 1 : 0;
    if (aBad !== bBad) return aBad - bBad;
    const aInfo = [a.contact_email, a.contact_phone, a.station].filter(Boolean).length;
    const bInfo = [b.contact_email, b.contact_phone, b.station].filter(Boolean).length;
    if (bInfo !== aInfo) return bInfo - aInfo;
    return a.id.localeCompare(b.id);
  })[0];
}

function nameStationKey(p: PartnerDedupInput): string | null {
  const n = normalizePartnerText(p.name);
  const s = normalizePartnerStation(p.station);
  if (!n) return null;
  // Sans station : seulement si le nom est assez discriminant (pas « Mr LE DIRECTEUR »)
  if (!s) {
    if (n === "mr le directeur" || n === "intersport" || n.length < 8) return null;
    return `name:${n}|station:`;
  }
  return `name:${n}|station:${s}`;
}

/**
 * Construit les clusters de doublons sur un inventaire complet.
 */
export function buildPartnerDedupClusters(
  partners: PartnerDedupInput[]
): PartnerDedupCluster[] {
  const clusters: PartnerDedupCluster[] = [];
  const seenPairKeys = new Set<string>();

  // 1. Même nom + station
  const byNameStation = new Map<string, PartnerDedupInput[]>();
  for (const p of partners) {
    const key = nameStationKey(p);
    if (!key) continue;
    const list = byNameStation.get(key) ?? [];
    list.push(p);
    byNameStation.set(key, list);
  }
  for (const [key, members] of byNameStation) {
    if (members.length < 2) continue;
    const keeper = pickPreferredPartner(members);
    clusters.push({
      key: `same:${key}`,
      reason: "same_name_station",
      members,
      keeperId: keeper.id,
    });
    for (const m of members) {
      if (m.id !== keeper.id) seenPairKeys.add(pairKey(keeper.id, m.id));
    }
  }

  // 2. Directeur / e-mail / attention → ESF actif
  const esfs = partners.filter(isActiveEsf);
  const directors = partners.filter(
    (p) => p.status === "prospect" && isDirectorLikePartner(p) && !!normalizePartnerStation(p.station)
  );

  for (const esf of esfs) {
    const matched = directors.filter((d) => directorStationMatchesEsf(d.station, esf));
    if (matched.length === 0) continue;
    const members = [esf, ...matched];
    // Évite de recréer un cluster déjà couvert par same_name_station
    const uncovered = matched.filter((d) => !seenPairKeys.has(pairKey(esf.id, d.id)));
    if (uncovered.length === 0) continue;
    const keeper = pickPreferredPartner(members);
    clusters.push({
      key: `esf:${esf.id}`,
      reason: "directeur_esf",
      members: [esf, ...uncovered],
      keeperId: keeper.id,
    });
    for (const m of uncovered) {
      seenPairKeys.add(pairKey(esf.id, m.id));
    }
  }

  return clusters;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function partnerIdsInDedupClusters(clusters: PartnerDedupCluster[]): Set<string> {
  const ids = new Set<string>();
  for (const c of clusters) {
    for (const m of c.members) ids.add(m.id);
  }
  return ids;
}

/** Matches pour une fiche donnée (hors elle-même). */
export function findDedupMatchesFor(
  partnerId: string,
  clusters: PartnerDedupCluster[]
): PartnerDedupMatch[] {
  const matches: PartnerDedupMatch[] = [];
  const seen = new Set<string>();
  for (const cluster of clusters) {
    if (!cluster.members.some((m) => m.id === partnerId)) continue;
    for (const m of cluster.members) {
      if (m.id === partnerId || seen.has(m.id)) continue;
      seen.add(m.id);
      matches.push({
        partner: m,
        reason: cluster.reason,
        label: REASON_LABELS[cluster.reason],
      });
    }
  }
  return matches;
}

export function parsePartnerDedupMap(value: unknown): PartnerDedupMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: PartnerDedupMap = {};
  for (const [loser, keeper] of Object.entries(value as Record<string, unknown>)) {
    if (typeof keeper === "string" && keeper && loser && loser !== keeper) {
      out[loser] = keeper;
    }
  }
  return out;
}

export function mergeDedupMapEntry(
  current: PartnerDedupMap,
  loserId: string,
  keeperId: string
): PartnerDedupMap {
  if (loserId === keeperId) return current;
  const next: PartnerDedupMap = { ...current, [loserId]: keeperId };
  // Chaînes : si quelqu'un pointait vers loser, rediriger vers keeper
  for (const [l, k] of Object.entries(next)) {
    if (k === loserId) next[l] = keeperId;
  }
  return next;
}

export function resolveDedupKeeper(id: string, map: PartnerDedupMap): string {
  let current = id;
  const seen = new Set<string>();
  while (map[current] && !seen.has(current)) {
    seen.add(current);
    current = map[current];
  }
  return current;
}

export function partnerDedupReasonLabel(reason: PartnerDedupReason): string {
  return REASON_LABELS[reason];
}
