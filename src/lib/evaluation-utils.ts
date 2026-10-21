// Language configuration with flags and labels
export const LANGUAGE_FLAGS: Record<string, string> = {
  'all': '🌍',
  'anglais': '🇬🇧',
  'portugais': '🇧🇷',
  'espagnol': '🇪🇸',
  'neerlandais': '🇳🇱',
  'russe': '🇷🇺',
  'italien': '🇮🇹',
  'chinois': '🇨🇳',
  'allemand': '🇩🇪',
  'fle': '🇫🇷'
};

export const LANGUAGE_LABELS: Record<string, string> = {
  'all': 'Toutes langues',
  'anglais': 'Anglais',
  'portugais': 'Portugais brésilien',
  'espagnol': 'Espagnol',
  'neerlandais': 'Néerlandais',
  'russe': 'Russe',
  'italien': 'Italien',
  'chinois': 'Chinois (Mandarin)',
  'allemand': 'Allemand',
  'fle': 'Français Langue Étrangère'
};

export const LANGUAGES = Object.keys(LANGUAGE_LABELS);

export const CATEGORIES = [
  'introduction',
  'comprehension',
  'expression',
  'grammar',
  'technique',
  'conclusion'
] as const;

/** Quatre blocs du compte-rendu C.3 (expression / grammaire restent en banque). */
export const BLOC_CATEGORIES = [
  'introduction',
  'comprehension',
  'technique',
  'conclusion',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  'introduction': 'Introduction',
  'comprehension': 'Compréhension',
  'expression': 'Expression / Prononciation',
  'grammar': 'Grammaire',
  'technique': 'Partie Technique',
  'conclusion': 'Conclusion'
};

export const PROFESSIONS = [
  'moniteur',
  'pisteur',
  'rm',
  'caissier',
  'controleur'
] as const;

export const PROFESSION_LABELS: Record<string, string> = {
  'moniteur': 'Moniteur',
  'pisteur': 'Pisteur',
  'rm': 'RM (Remontées Mécaniques)',
  'caissier': 'Caissier',
  'controleur': 'Contrôleur'
};

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

// Score to Level mappings
export const SCORE_TO_LEVEL_5: Record<number, string> = {
  0: 'A1', 0.5: 'A1+',
  1: 'A2', 1.5: 'A2+',
  2: 'B1', 2.5: 'B1+',
  3: 'B2', 3.5: 'B2+',
  4: 'C1', 4.5: 'C1+',
  5: 'C2'
};

/**
 * Tableau de correspondance ESF Alpe d'Huez / Villard Reculas (note /20).
 * Bornes alignées sur les demi-points saisis (ex. 3,1→3,5 ; 5,9→5,5 ; 7,9→7,5).
 * Les « + » marquent la fourchette haute quand le tableau distingue deux qualificatifs
 * (ex. Moyen vs Moyen confirmé → B2 / B2+) ; pour B1 (une seule fourchette 8–9,9)
 * on garde B1+ sur 9–9,5 (usage formateurs, ex. « B1+ - 9,5 »).
 */
export type AlpeDhuezBand = {
  min: number;
  max: number;
  cecrl: string;
  niveau: number;
  keyword: string;
  qualifier: string;
};

export const ALPE_DHUEZ_CORRESPONDANCE: readonly AlpeDhuezBand[] = [
  { min: 0, max: 0, cecrl: "A1", niveau: 0, keyword: "ÉVEIL", qualifier: "Débutant complet" },
  { min: 0.5, max: 3, cecrl: "A1+", niveau: 0, keyword: "ÉVEIL", qualifier: "Débutant avec notions" },
  { min: 3.5, max: 5.5, cecrl: "A2", niveau: 1, keyword: "SURVIE", qualifier: "Très faible" },
  { min: 6, max: 7.5, cecrl: "A2+", niveau: 1, keyword: "SURVIE", qualifier: "Faible" },
  { min: 8, max: 8.5, cecrl: "B1", niveau: 2, keyword: "AUTONOMIE", qualifier: "Faible" },
  { min: 9, max: 9.5, cecrl: "B1+", niveau: 2, keyword: "AUTONOMIE", qualifier: "Faible" },
  { min: 10, max: 11.5, cecrl: "B2", niveau: 3, keyword: "OPÉRATIONNEL", qualifier: "Moyen" },
  { min: 12, max: 13.5, cecrl: "B2+", niveau: 3, keyword: "OPÉRATIONNEL", qualifier: "Moyen confirmé" },
  { min: 14, max: 15.5, cecrl: "C1", niveau: 4, keyword: "FLUIDITÉ", qualifier: "Bon" },
  { min: 16, max: 17.5, cecrl: "C1+", niveau: 4, keyword: "FLUIDITÉ", qualifier: "Très bon" },
  { min: 18, max: 20, cecrl: "C2", niveau: 5, keyword: "MAÎTRISE", qualifier: "Excellent" },
] as const;

/** Résout une note /20 via le tableau Alpe d'Huez (bornes inclusives). */
export function alpeDhuezFromScore20(score: number): AlpeDhuezBand {
  const n = Number(score);
  if (!Number.isFinite(n) || n < 0) return ALPE_DHUEZ_CORRESPONDANCE[0];
  if (n > 20) return ALPE_DHUEZ_CORRESPONDANCE[ALPE_DHUEZ_CORRESPONDANCE.length - 1];
  const band = ALPE_DHUEZ_CORRESPONDANCE.find((b) => n >= b.min && n <= b.max);
  if (band) return band;
  // Demi-point hors liste (ex. 3,0 déjà couvert) : plus proche inférieur
  for (let i = ALPE_DHUEZ_CORRESPONDANCE.length - 1; i >= 0; i--) {
    if (n >= ALPE_DHUEZ_CORRESPONDANCE[i].min) return ALPE_DHUEZ_CORRESPONDANCE[i];
  }
  return ALPE_DHUEZ_CORRESPONDANCE[0];
}

/** Carte discrète demi-points — dérivée du tableau (compat ScoreInput / exports). */
export const SCORE_TO_LEVEL_20: Record<number, string> = Object.fromEntries(
  Array.from({ length: 41 }, (_, i) => {
    const score = i / 2;
    return [score, alpeDhuezFromScore20(score).cecrl];
  })
);

export function scoreToLevel(score: number, system: 'sur_5' | 'sur_20'): string {
  if (system === "sur_20") return alpeDhuezFromScore20(score).cecrl;
  return SCORE_TO_LEVEL_5[score] || "A1";
}

export function compareLevels(level1: string, level2: string): number {
  const order = ['A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2'];
  return order.indexOf(level1) - order.indexOf(level2);
}

export function generateScoreOptions(system: 'sur_5' | 'sur_20'): number[] {
  const max = system === 'sur_5' ? 5 : 20;
  const options: number[] = [];
  for (let i = 0; i <= max; i += 0.5) {
    options.push(i);
  }
  return options;
}

// Schools that use /20 scoring system (tableau Alpe d'Huez)
export const SCHOOLS_SUR_20 = ["alpe d'huez", "alpe d huez", "villard reculas", "villard-reculas"];

export function getScoringSystem(schoolName: string): 'sur_5' | 'sur_20' {
  const normalized = schoolName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return SCHOOLS_SUR_20.some(s => normalized.includes(s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) ? 'sur_20' : 'sur_5';
}

// Generate phrase code
export function generatePhraseCode(
  category: string,
  language: string,
  index: number
): string {
  const catPrefix: Record<string, string> = {
    'introduction': 'INT',
    'comprehension': 'COMP',
    'expression': 'EXP',
    'grammar': 'GRAM',
    'technique': 'TECH',
    'conclusion': 'CONCL'
  };
  
  const langPrefix = language === 'all' ? '0' : language.substring(0, 2).toUpperCase();
  const cat = catPrefix[category] || category.substring(0, 4).toUpperCase();
  
  return `${cat}-${langPrefix}-${String(index).padStart(2, '0')}`;
}
