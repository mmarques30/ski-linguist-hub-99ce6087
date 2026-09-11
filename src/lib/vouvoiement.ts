/** Contrôle de vouvoiement des appréciations (C.3). PDF habillage : C.5. */

const TUTOIEMENT =
  /(?<!\p{L})(tu|te|toi|ton|ta|tes|tien|tienne|tiens|tiennes|t['’](?:as|es|ai|ais|ait|y))(?!\p{L})/giu;

export function findTutoiementMatches(text: string): string[] {
  if (!text.trim()) return [];
  const found = new Set<string>();
  const re = new RegExp(TUTOIEMENT.source, TUTOIEMENT.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    found.add(m[0].toLowerCase());
  }
  return [...found];
}

export function hasTutoiement(text: string): boolean {
  return findTutoiementMatches(text).length > 0;
}

export function collectTutoiement(
  parts: Array<{ label: string; text: string }>
): Array<{ label: string; matches: string[] }> {
  return parts
    .map((p) => ({ label: p.label, matches: findTutoiementMatches(p.text) }))
    .filter((p) => p.matches.length > 0);
}
