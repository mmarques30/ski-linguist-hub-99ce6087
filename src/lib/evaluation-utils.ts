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

export const SCORE_TO_LEVEL_20: Record<number, string> = {
  0: 'A1', 0.5: 'A1', 1: 'A1+', 1.5: 'A1+', 2: 'A1+', 2.5: 'A1+', 3: 'A1+',
  3.5: 'A2', 4: 'A2', 4.5: 'A2', 5: 'A2', 5.5: 'A2',
  6: 'A2+', 6.5: 'A2+', 7: 'A2+', 7.5: 'A2+',
  8: 'B1', 8.5: 'B1', 9: 'B1+', 9.5: 'B1+',
  10: 'B2', 10.5: 'B2', 11: 'B2', 11.5: 'B2',
  12: 'B2+', 12.5: 'B2+', 13: 'B2+', 13.5: 'B2+',
  14: 'C1', 14.5: 'C1', 15: 'C1', 15.5: 'C1',
  16: 'C1+', 16.5: 'C1+', 17: 'C1+', 17.5: 'C1+',
  18: 'C2', 18.5: 'C2', 19: 'C2', 19.5: 'C2', 20: 'C2'
};

export function scoreToLevel(score: number, system: 'sur_5' | 'sur_20'): string {
  const map = system === 'sur_5' ? SCORE_TO_LEVEL_5 : SCORE_TO_LEVEL_20;
  return map[score] || 'A1';
}

export function compareLevels(level1: string, level2: string): number {
  const order = ['A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2'];
  const cleanLevel1 = level1.replace('+', '');
  const cleanLevel2 = level2.replace('+', '');
  return order.indexOf(cleanLevel1) - order.indexOf(cleanLevel2);
}

export function generateScoreOptions(system: 'sur_5' | 'sur_20'): number[] {
  const max = system === 'sur_5' ? 5 : 20;
  const options: number[] = [];
  for (let i = 0; i <= max; i += 0.5) {
    options.push(i);
  }
  return options;
}

// Schools that use /20 scoring system
export const SCHOOLS_SUR_20 = ['alpe-dhuez', 'villard-reculas'];

export function getScoringSystem(schoolName: string): 'sur_5' | 'sur_20' {
  const normalized = schoolName.toLowerCase().replace(/['\s]/g, '-');
  return SCHOOLS_SUR_20.some(s => normalized.includes(s)) ? 'sur_20' : 'sur_5';
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
