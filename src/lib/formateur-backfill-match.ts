/**
 * Rapprochement CSV Excel inscriptions ↔ lignes DB pour backfill formateur.
 * Clé principale : Code (avec variantes d'encodage MacRoman).
 * Secours : Nom et Prénom + Date début + Langue (casse/accents ignorés).
 * Aucune écriture ici.
 */

export type DbInscriptionForMatch = {
  id: string;
  code: string | null;
  start_date: string | null;
  language: string | null;
  status: string | null;
  first_name: string | null;
  last_name: string | null;
};

export type CsvInscriptionRow = Record<string, string>;

export type FormateurMatch = {
  dbId: string;
  csvLine: number;
  method: string;
  formateur: string | null;
  formateur_email: string | null;
  formateur_telephone: string | null;
  student: string;
  start_date: string | null;
  status: string | null;
};

export type FormateurMatchReport = {
  dbCount: number;
  csvCount: number;
  matched: FormateurMatch[];
  unmatchedDb: Array<{
    id: string;
    status: string | null;
    start_date: string | null;
    language: string;
    student: string;
    code: string | null;
    isEncodingDup: boolean;
  }>;
  unmatchedCsv: Array<{
    csvLine: number;
    status: string;
    statusFinal: string;
    start: string;
    language: string;
    name: string;
    code: string;
    formateur: string;
  }>;
  multiples: Array<Record<string, unknown>>;
};

/** Table MacRoman 0x80–0xFF (Apple) pour corriger les libellés historiques mal décodés. */
const MAC_ROMAN_HIGH =
  "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø" +
  "¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ";

/** Corrige un libellé potentiellement stocké en MacRoman lu comme Latin-1. */
export function fixMacRomanMojibake(s: string | null | undefined): string {
  if (!s) return "";
  if ([...s].some((c) => c.charCodeAt(0) > 255)) return s;
  let out = "";
  for (const ch of s) {
    const o = ch.charCodeAt(0);
    if (o >= 0x80 && o <= 0xff) {
      out += MAC_ROMAN_HIGH[o - 0x80] || ch;
    } else {
      out += ch;
    }
  }
  return out;
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normCode(s: string): string {
  if (!s) return "";
  return stripAccents(s.trim().toLowerCase()).replace(/\s+/g, " ").trim();
}

function alnum(s: string): string {
  if (!s) return "";
  return stripAccents(s.trim().toLowerCase()).replace(/[^a-z0-9]+/g, "");
}

function variants(s: string | null | undefined): string[] {
  if (!s) return [""];
  const out = new Set<string>([s]);
  // latin1 → mac_roman approximation for Node/browser without mac codec:
  // re-interpret code points 0-255
  try {
    if (![...s].some((c) => c.charCodeAt(0) > 255)) {
      const fixed = fixMacRomanMojibake(s);
      out.add(fixed);
    }
  } catch {
    /* ignore */
  }
  return [...out];
}

function allCodeNorms(s: string | null | undefined): Set<string> {
  return new Set(variants(s).map(normCode).filter(Boolean));
}

function allAlnum(s: string | null | undefined): Set<string> {
  return new Set(variants(s).map(alnum).filter(Boolean));
}

function parseDate(s: string | null | undefined): string {
  const raw = (s || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const m = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) {
    return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return raw;
}

function mojibakeScore(s: string | null | undefined): number {
  if (!s) return 999;
  let score = 0;
  for (const c of s) {
    const o = c.charCodeAt(0);
    if (o < 32 || (o >= 0x80 && o <= 0x9f) || [0x8e, 0x88, 0xcb, 0x8f].includes(o)) {
      score += 3;
    }
  }
  const fixed = fixMacRomanMojibake(s);
  if (fixed !== s) score += 2;
  return score;
}

function dbNameKeys(d: DbInscriptionForMatch): Set<string> {
  const fn = d.first_name || "";
  const ln = d.last_name || "";
  const keys = new Set<string>();
  for (const pair of [`${fn} ${ln}`, `${ln} ${fn}`]) {
    for (const k of allAlnum(pair)) keys.add(k);
  }
  for (const p of [fn, ln]) {
    for (const k of allAlnum(p)) {
      if (k.length >= 4) keys.add(k);
    }
  }
  return keys;
}

function namesMatch(a: Set<string>, b: Set<string>): boolean {
  if (!a.size || !b.size) return false;
  for (const x of a) {
    if (b.has(x)) return true;
    for (const y of b) {
      if (x.length >= 4 && y.length >= 4 && (x.includes(y) || y.includes(x))) return true;
    }
  }
  return false;
}

function cell(row: CsvInscriptionRow, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim() !== "") return String(row[k]).trim();
  }
  return "";
}

/**
 * Rapproche chaque ligne CSV à au plus une inscription DB.
 * Les doublons d'encodage en DB sont préférés côté « propre ».
 */
export function matchInscriptionsFormateur(
  dbRows: DbInscriptionForMatch[],
  csvRows: CsvInscriptionRow[]
): FormateurMatchReport {
  type DbEnrich = DbInscriptionForMatch & {
    _i: number;
    _codes: Set<string>;
    _names: Set<string>;
    _date: string;
    _langs: Set<string>;
    _score: number;
  };
  type CsvEnrich = CsvInscriptionRow & {
    _i: number;
    _codes: Set<string>;
    _names: Set<string>;
    _date: string;
    _langs: Set<string>;
  };

  const db: DbEnrich[] = dbRows.map((d, i) => ({
    ...d,
    _i: i,
    _codes: allCodeNorms(d.code),
    _names: dbNameKeys(d),
    _date: parseDate(d.start_date),
    _langs: allAlnum(d.language),
    _score: mojibakeScore(d.code),
  }));

  const csv: CsvEnrich[] = csvRows.map((r, i) => ({
    ...r,
    _i: i,
    _codes: allCodeNorms(cell(r, "Code")),
    _names: allAlnum(cell(r, "Nom et Prénom", "Nom")),
    _date: parseDate(cell(r, "Date début", "start_date")),
    _langs: allAlnum(cell(r, "Langue", "language")),
  }));

  const codeToDb = new Map<string, number[]>();
  for (const d of db) {
    for (const c of d._codes) {
      const arr = codeToDb.get(c) || [];
      arr.push(d._i);
      codeToDb.set(c, arr);
    }
  }
  const codeToCsv = new Map<string, number[]>();
  for (const r of csv) {
    for (const c of r._codes) {
      const arr = codeToCsv.get(c) || [];
      arr.push(r._i);
      codeToCsv.set(c, arr);
    }
  }

  const usedDb = new Set<number>();
  const usedCsv = new Set<number>();
  const matched: FormateurMatch[] = [];
  const multiples: Array<Record<string, unknown>> = [];

  const take = (di: number, ci: number, method: string) => {
    usedDb.add(di);
    usedCsv.add(ci);
    const d = db[di];
    const r = csv[ci];
    matched.push({
      dbId: d.id,
      csvLine: ci + 2,
      method,
      formateur: cell(r, "Formateur") || null,
      formateur_email: cell(r, "e-mail Prof", "email Prof") || null,
      formateur_telephone: cell(r, "Tél Prof", "Tel Prof") || null,
      student: `${d.first_name || ""} ${d.last_name || ""}`.trim(),
      start_date: d.start_date,
      status: d.status,
    });
  };

  // Pass 1 — code unique des deux côtés
  for (const r of csv) {
    if (usedCsv.has(r._i)) continue;
    const cands = new Set<number>();
    for (const c of r._codes) for (const i of codeToDb.get(c) || []) if (!usedDb.has(i)) cands.add(i);
    if (cands.size !== 1) continue;
    const di = [...cands][0];
    const rivals = new Set<number>();
    for (const c of db[di]._codes)
      for (const i of codeToCsv.get(c) || []) if (!usedCsv.has(i)) rivals.add(i);
    if (rivals.size === 1 && rivals.has(r._i)) take(di, r._i, "code_unique");
  }

  // Pass 2 — code + nom
  for (const r of csv) {
    if (usedCsv.has(r._i)) continue;
    const cands = [...new Set(
      [...r._codes].flatMap((c) => codeToDb.get(c) || []).filter((i) => !usedDb.has(i))
    )];
    if (!cands.length) continue;
    const named = cands.filter((i) => namesMatch(db[i]._names, r._names));
    if (named.length === 1) {
      take(named[0], r._i, "code+name");
    } else if (named.length > 1) {
      named.sort((a, b) => db[a]._score - db[b]._score || db[a].id.localeCompare(db[b].id));
      if (
        namesMatch(db[named[0]]._names, db[named[1]]._names) &&
        db[named[0]]._date === db[named[1]]._date
      ) {
        take(named[0], r._i, "code+name_dup");
      } else {
        multiples.push({
          csv: cell(r, "Nom et Prénom"),
          reason: "code+name multi",
          cands: named.map((i) => `${db[i].first_name} ${db[i].last_name}`),
        });
      }
    }
  }

  // Pass 3 — fallback nom+date+langue
  const fb = new Map<string, number[]>();
  for (const d of db) {
    for (const nm of d._names) {
      for (const lg of d._langs.size ? d._langs : new Set([""])) {
        const k = `${nm}|${d._date}|${lg}`;
        const arr = fb.get(k) || [];
        arr.push(d._i);
        fb.set(k, arr);
      }
    }
  }

  for (const r of csv) {
    if (usedCsv.has(r._i)) continue;
    let cands: number[] = [];
    for (const nm of r._names) {
      for (const lg of r._langs.size ? r._langs : new Set([""])) {
        cands.push(...(fb.get(`${nm}|${r._date}|${lg}`) || []));
      }
    }
    cands = [...new Set(cands.filter((i) => !usedDb.has(i)))];
    if (!cands.length) {
      cands = db
        .filter(
          (d) =>
            !usedDb.has(d._i) &&
            d._date === r._date &&
            [...d._langs].some((l) => r._langs.has(l)) &&
            namesMatch(d._names, r._names)
        )
        .map((d) => d._i);
    }
    if (cands.length === 1) take(cands[0], r._i, "fallback");
    else if (cands.length > 1) {
      cands.sort((a, b) => db[a]._score - db[b]._score || db[a].id.localeCompare(db[b].id));
      if (
        namesMatch(db[cands[0]]._names, db[cands[1]]._names) &&
        db[cands[0]]._date === db[cands[1]]._date
      ) {
        take(cands[0], r._i, "fallback_dup");
      } else {
        multiples.push({
          csv: cell(r, "Nom et Prénom"),
          reason: "fallback multi",
          cands: cands.map((i) => `${db[i].first_name} ${db[i].last_name}`),
        });
      }
    }
  }

  // Pass 4 — code exclusif restant (facture « à l'attention de »)
  for (const r of csv) {
    if (usedCsv.has(r._i)) continue;
    const cands = [...new Set(
      [...r._codes].flatMap((c) => codeToDb.get(c) || []).filter((i) => !usedDb.has(i))
    )];
    if (cands.length !== 1) {
      if (cands.length > 1) {
        multiples.push({
          csv: cell(r, "Nom et Prénom"),
          code: cell(r, "Code").slice(0, 60),
          reason: "code leftover multi",
          cands: cands.map((i) => `${db[i].first_name} ${db[i].last_name}`),
        });
      }
      continue;
    }
    const di = cands[0];
    const rivals = new Set<number>();
    for (const c of db[di]._codes)
      for (const i of codeToCsv.get(c) || []) if (!usedCsv.has(i)) rivals.add(i);
    if (rivals.size === 1 && rivals.has(r._i)) take(di, r._i, "code_exclusive");
  }

  const matchedKeys = new Set(
    matched.map((m) => {
      const d = db.find((x) => x.id === m.dbId)!;
      return `${[...d._names].sort().join(",")}|${d._date}|${[...d._langs].sort().join(",")}`;
    })
  );

  const unmatchedDb = db
    .filter((d) => !usedDb.has(d._i))
    .map((d) => {
      const key = `${[...d._names].sort().join(",")}|${d._date}|${[...d._langs].sort().join(",")}`;
      return {
        id: d.id,
        status: d.status,
        start_date: d.start_date,
        language: fixMacRomanMojibake(d.language) || d.language || "",
        student: `${d.first_name || ""} ${d.last_name || ""}`.trim(),
        code: d.code,
        isEncodingDup: matchedKeys.has(key),
      };
    });

  const unmatchedCsv = csv
    .filter((r) => !usedCsv.has(r._i))
    .map((r) => ({
      csvLine: r._i + 2,
      status: cell(r, "Status", "Statut"),
      statusFinal: cell(r, "Status final"),
      start: cell(r, "Date début"),
      language: cell(r, "Langue"),
      name: cell(r, "Nom et Prénom"),
      code: cell(r, "Code"),
      formateur: cell(r, "Formateur"),
    }));

  return {
    dbCount: db.length,
    csvCount: csv.length,
    matched,
    unmatchedDb,
    unmatchedCsv,
    multiples,
  };
}
