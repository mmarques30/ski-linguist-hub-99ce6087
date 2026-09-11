/** Propositions d'orthographe, une à une — jamais de réécriture globale (C.4). */

export type SpellingProposal = {
  id: string;
  field: string;
  label: string;
  from: string;
  to: string;
  index: number;
};

const TYPOS: Record<string, string> = {
  apprecier: "apprécier",
  appreciez: "appréciez",
  apprecie: "apprécie",
  etre: "être",
  etes: "êtes",
  etait: "était",
  deja: "déjà",
  tres: "très",
  plutot: "plutôt",
  egalement: "également",
  evenement: "événement",
  developpement: "développement",
  developper: "développer",
  securite: "sécurité",
  presentez: "présentez",
  presente: "présente",
  presentation: "présentation",
  activite: "activité",
  professionel: "professionnel",
  professionelle: "professionnelle",
  comprehenion: "compréhension",
  comprehension: "compréhension",
  expresion: "expression",
  independant: "indépendant",
  independante: "indépendante",
};

const ACCENTED = [
  "présenté",
  "présentez",
  "présente",
  "présentation",
  "apprécier",
  "appréciez",
  "apprécie",
  "apprécié",
  "être",
  "êtes",
  "était",
  "sécurité",
  "activité",
  "compréhension",
  "indépendant",
  "indépendante",
  "événement",
  "développement",
  "développer",
  "également",
  "plutôt",
  "déjà",
  "très",
  "professionnel",
  "professionnelle",
];

function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function preserveCase(source: string, replacement: string): string {
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

const WORD = /\p{L}+/gu;

export function findSpellingProposals(
  parts: Array<{ field: string; label: string; text: string }>
): SpellingProposal[] {
  const proposals: SpellingProposal[] = [];
  for (const part of parts) {
    const text = part.text ?? "";
    WORD.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = WORD.exec(text)) !== null) {
      const from = match[0];
      const lower = from.toLowerCase();
      let to: string | null = TYPOS[lower] ?? null;
      if (!to) {
        const folded = fold(from);
        const accented = ACCENTED.find((w) => fold(w) === folded);
        if (accented) {
          const suggested = preserveCase(from, accented);
          if (suggested !== from) to = accented;
        }
      }
      if (!to || to.toLowerCase() === lower) continue;
      const suggested = preserveCase(from, to);
      if (suggested === from) continue;
      proposals.push({
        id: `${part.field}:${match.index}:${from}`,
        field: part.field,
        label: part.label,
        from,
        to: suggested,
        index: match.index,
      });
    }
  }
  return proposals;
}

/** Remplace uniquement la première occurrence à l'index donné. */
export function applySpellingProposal(
  text: string,
  proposal: Pick<SpellingProposal, "from" | "to" | "index">
): string {
  const slice = text.slice(proposal.index);
  if (!slice.startsWith(proposal.from)) {
    return text.replace(proposal.from, proposal.to);
  }
  return (
    text.slice(0, proposal.index) + proposal.to + text.slice(proposal.index + proposal.from.length)
  );
}
