/**
 * Exercice fiscal FLI — libellé AA-AA.
 * Doit rester aligné avec public.get_fiscal_year (SQL).
 *
 * Règles :
 * - Transition : 01/10/2025 → 30/06/2026 → 25-26
 * - Avant 01/10/2025 : 01/10 → 30/09 (ex. 15/08/2025 → 24-25)
 * - À partir du 01/07/2026 : 01/07 → 30/06 (ex. 15/11/2026 → 26-27)
 */

const TRANSITION_START = new Date(2025, 9, 1); // 1er oct 2025
const TRANSITION_END = new Date(2026, 5, 30); // 30 juin 2026
const JULY_JUNE_START = new Date(2026, 6, 1); // 1er juil 2026

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function labelFromStartYear(startYear: number): string {
  return `${pad2(startYear % 100)}-${pad2((startYear + 1) % 100)}`;
}

/** Libellé d'exercice AA-AA pour une date donnée. */
export function getFiscalYear(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d >= TRANSITION_START && d <= TRANSITION_END) {
    return "25-26";
  }

  if (d < TRANSITION_START) {
    // Exercice 01/10 → 30/09
    const startYear = d.getMonth() >= 9 ? d.getFullYear() : d.getFullYear() - 1;
    return labelFromStartYear(startYear);
  }

  // À partir du 01/07/2026 : 01/07 → 30/06
  const startYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return labelFromStartYear(startYear);
}

export function getCurrentFiscalYear(): string {
  return getFiscalYear(new Date());
}

/** Exercice immédiatement précédent (ex. 26-27 → 25-26). */
export function getPreviousFiscalYear(label: string): string {
  const parts = label.split("-");
  const a = parseInt(parts[0], 10);
  const startYear = 2000 + a - 1;
  return labelFromStartYear(startYear);
}

/**
 * Bornes calendaires d'un libellé AA-AA.
 * 25-26 = transition ; ≤24-25 = oct–sep ; ≥26-27 = juil–juin.
 */
export function getFiscalYearBounds(label: string): { start: Date; end: Date } {
  const parts = label.split("-");
  if (parts.length !== 2) {
    throw new Error(`Libellé d'exercice invalide : ${label}`);
  }
  const a = parseInt(parts[0], 10);
  const startYear = 2000 + a; // FLI : XXIe siècle

  if (label === "25-26") {
    return { start: new Date(2025, 9, 1), end: new Date(2026, 5, 30) };
  }

  // Avant la transition (fin d'exercice ≤ 2025) : oct–sep
  if (startYear + 1 <= 2025) {
    return {
      start: new Date(startYear, 9, 1),
      end: new Date(startYear + 1, 8, 30),
    };
  }

  // Régime juil–juin
  return {
    start: new Date(startYear, 6, 1),
    end: new Date(startYear + 1, 5, 30),
  };
}

/** @deprecated Utiliser getFiscalYear — alias de compatibilité saison/exercice */
export function getSaison(date: Date): string {
  return getFiscalYear(date);
}

export function getDebutSaison(saison: string): Date {
  return getFiscalYearBounds(saison).start;
}

export function getFinSaison(saison: string): Date {
  return getFiscalYearBounds(saison).end;
}

export function getCurrentSaison(): string {
  return getCurrentFiscalYear();
}

/** Numéro de facture attendu : {exercice}.{séquence} */
export function formatInvoiceNumber(fiscalYear: string, sequence: number): string {
  return `${fiscalYear}.${sequence}`;
}
