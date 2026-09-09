#!/usr/bin/env npx tsx
/**
 * Table de rapprochement inscriptions.formateur → instructors (alias).
 * Aucun UPDATE instructor_id — sortie CSV/MD pour validation Paula ligne à ligne.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... npx tsx scripts/build-formateur-rapprochement.ts
 * Ou avec un export JSON local des deux tables.
 *
 * Sans colonne formateur remplie : produit un rapport « bloqué » (état actuel).
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

/** Floor for automatic alias_fuzzy; below this requires Paula validation. */
export const ALIAS_FUZZY_MIN_SCORE = 0.5;

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Jaccard sur tokens (libellé vs alias). */
function tokenJaccard(a: string, b: string): number {
  const ta = new Set(norm(a).split(/\s+/).filter(Boolean));
  const tb = new Set(norm(b).split(/\s+/).filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}

type Instructor = {
  id: string;
  first_name: string | null;
  last_name: string;
  email: string | null;
  status: string | null;
  alias: string[] | null;
};

type Inscription = {
  id: string;
  code: string | null;
  formateur: string | null;
  formateur_email: string | null;
  instructor_id: string | null;
  start_date: string | null;
};

function buildAliasIndex(instructors: Instructor[]) {
  const byAlias = new Map<string, Instructor[]>();
  const byEmail = new Map<string, Instructor>();

  for (const ins of instructors) {
    if (ins.email) byEmail.set(norm(ins.email), ins);
    const names = new Set<string>();
    const full = `${ins.first_name || ""} ${ins.last_name}`.trim();
    if (full) names.add(norm(full));
    names.add(norm(ins.last_name));
    for (const a of ins.alias || []) {
      for (const part of a.split(/[,|/]/)) {
        const t = part.trim();
        if (t) names.add(norm(t));
      }
    }
    for (const n of names) {
      if (!n) continue;
      const list = byAlias.get(n) || [];
      if (!list.some((x) => x.id === ins.id)) list.push(ins);
      byAlias.set(n, list);
    }
  }
  return { byAlias, byEmail };
}

function propose(row: Inscription, idx: ReturnType<typeof buildAliasIndex>) {
  if (row.formateur_email) {
    const byE = idx.byEmail.get(norm(row.formateur_email));
    if (byE) {
      return {
        confidence: "email",
        proposed: byE,
        candidates: [byE],
      };
    }
  }
  const key = norm(row.formateur || "");
  if (!key) {
    return { confidence: "empty", proposed: null, candidates: [] as Instructor[] };
  }
  const exact = idx.byAlias.get(key) || [];
  if (exact.length === 1) {
    return { confidence: "alias_exact", proposed: exact[0], candidates: exact };
  }
  if (exact.length > 1) {
    return { confidence: "alias_ambiguous", proposed: null, candidates: exact };
  }
  // Fuzzy contains — score Jaccard ; rejet auto sous ALIAS_FUZZY_MIN_SCORE (0,5)
  type Scored = { instructor: Instructor; score: number; alias: string };
  const scored: Scored[] = [];
  for (const [alias, list] of idx.byAlias) {
    if (!(alias.includes(key) || key.includes(alias))) continue;
    const score = tokenJaccard(key, alias);
    if (score < ALIAS_FUZZY_MIN_SCORE) continue;
    for (const i of list) {
      const prev = scored.find((x) => x.instructor.id === i.id);
      if (!prev || score > prev.score) {
        if (prev) {
          prev.score = score;
          prev.alias = alias;
        } else {
          scored.push({ instructor: i, score, alias });
        }
      }
    }
  }
  scored.sort((a, b) => b.score - a.score);
  const fuzzy = scored.map((s) => s.instructor);
  if (fuzzy.length === 1) {
    return {
      confidence: "alias_fuzzy",
      proposed: fuzzy[0],
      candidates: fuzzy,
      score: scored[0].score,
    };
  }
  if (fuzzy.length > 1) {
    return {
      confidence: "alias_ambiguous",
      proposed: null,
      candidates: fuzzy,
      score: scored[0]?.score,
    };
  }
  return { confidence: "unmatched", proposed: null, candidates: [] };
}

async function main() {
  // Charge .env Vite si présent
  try {
    const { readFileSync: rf } = await import("fs");
    for (const line of rf(".env", "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^"|"$/g, "");
      }
    }
  } catch {
    /* ignore */
  }

  const localInsPath = process.argv[2];
  const localInstPath = process.argv[3];

  let instructors: Instructor[] = [];
  let inscriptions: Inscription[] = [];

  if (localInsPath && localInstPath) {
    const { readFileSync } = await import("fs");
    inscriptions = JSON.parse(readFileSync(localInsPath, "utf8"));
    instructors = JSON.parse(readFileSync(localInstPath, "utf8"));
    console.error(`Local JSON: ${inscriptions.length} inscriptions, ${instructors.length} instructors`);
  } else {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key =
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.error("Missing Supabase URL/key env (or pass local JSON paths)");
      process.exit(1);
    }
    const supabase = createClient(url, key);

    const { data: inst, error: e1 } = await supabase
      .from("instructors")
      .select("id, first_name, last_name, email, status, alias");
    if (e1) throw e1;
    instructors = (inst || []) as Instructor[];

    const { data: insc, error: e2 } = await supabase
      .from("inscriptions")
      .select("id, code, formateur, formateur_email, instructor_id, start_date");
    if (e2) throw e2;
    inscriptions = (insc || []) as Inscription[];
  }

  const withName = (inscriptions || []).filter(
    (i) => i.formateur && String(i.formateur).trim() !== ""
  );
  const withoutFormateur = (inscriptions || []).filter(
    (i) => !i.formateur || String(i.formateur).trim() === ""
  );

  const idx = buildAliasIndex((instructors || []) as Instructor[]);

  // Comptage ligne à ligne (référence Paula Excel : email / alias / sans formateur / ambigu)
  const methodCounts = {
    email: 0,
    alias: 0,
    alias_fuzzy: 0,
    alias_ambiguous: 0,
    unmatched: 0,
    no_formateur: withoutFormateur.length,
  };
  const rowResults: Array<Record<string, unknown>> = [];
  for (const row of withName as Inscription[]) {
    const p = propose(row, idx);
    if (p.confidence === "email") methodCounts.email++;
    else if (p.confidence === "alias" || p.confidence === "alias_exact") methodCounts.alias++;
    else if (p.confidence === "alias_fuzzy") methodCounts.alias_fuzzy++;
    else if (p.confidence === "alias_ambiguous") methodCounts.alias_ambiguous++;
    else if (p.confidence === "empty") methodCounts.unmatched++;
    else methodCounts.unmatched++;
    rowResults.push({
      id: row.id,
      formateur: row.formateur,
      formateur_email: row.formateur_email,
      method: p.confidence,
      proposed_id: p.proposed?.id || null,
      proposed_name: p.proposed
        ? `${p.proposed.first_name || ""} ${p.proposed.last_name}`.trim()
        : null,
    });
  }

  // Aggregate by formateur label
  const groups = new Map<string, Inscription[]>();
  for (const row of withName as Inscription[]) {
    const label = String(row.formateur).trim();
    const g = groups.get(label) || [];
    g.push(row);
    groups.set(label, g);
  }

  const lines: string[] = [
    "# Rapprochement inscriptions.formateur → instructors",
    "",
    `Généré : ${new Date().toISOString()}`,
    `Instructors en base : ${(instructors || []).length}`,
    `Inscriptions totales : ${(inscriptions || []).length}`,
    `Inscriptions avec formateur renseigné : ${withName.length}`,
    `Inscriptions sans formateur : ${withoutFormateur.length}`,
    `Libellés distincts : ${groups.size}`,
    "",
    "## Comptage par méthode (ligne à ligne, aucun `instructor_id` écrit)",
    "",
    `| Méthode | n | Réf. Paula (878 CSV) |`,
    `|---------|---|----------------------|`,
    `| email | ${methodCounts.email} | 719 |`,
    `| alias | ${methodCounts.alias} | 96 |`,
    `| alias_fuzzy | ${methodCounts.alias_fuzzy} | (inclus alias) |`,
    `| alias_ambiguous | ${methodCounts.alias_ambiguous} | 0 |`,
    `| unmatched (libellé sans instructor) | ${methodCounts.unmatched} | — |`,
    `| sans formateur (DB) | ${methodCounts.no_formateur} | 35 (CSV) |`,
    "",
    "| # | formateur (libellé inscriptions) | email sample | n inscriptions | proposition | statut prop. | confiance | candidats | déjà lié |",
    "|---|----------------------------------|--------------|----------------|-------------|--------------|-----------|-----------|----------|",
  ];

  let i = 0;
  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const tableRows: Array<Record<string, unknown>> = [];
  for (const [label, rows] of sorted) {
    i++;
    const sample = rows[0];
    const p = propose(sample, idx);
    const propLabel = p.proposed
      ? `${p.proposed.first_name || ""} ${p.proposed.last_name}`.trim()
      : "—";
    const cand = p.candidates
      .map((c) => `${c.first_name || ""} ${c.last_name}`.trim())
      .join(" ; ");
    const already = rows.filter((r) => r.instructor_id).length;
    const emailSample = sample.formateur_email || "—";
    lines.push(
      `| ${i} | ${label.replace(/\|/g, "/")} | ${String(emailSample).replace(/\|/g, "/")} | ${rows.length} | ${propLabel.replace(/\|/g, "/")} | ${p.proposed?.status || "—"} | ${p.confidence} | ${cand.replace(/\|/g, "/") || "—"} | ${already}/${rows.length} |`
    );
    tableRows.push({
      label,
      n: rows.length,
      email_sample: sample.formateur_email,
      method: p.confidence,
      proposed: propLabel,
      proposed_status: p.proposed?.status || null,
      proposed_id: p.proposed?.id || null,
      candidates: p.candidates.map((c) => ({
        id: c.id,
        name: `${c.first_name || ""} ${c.last_name}`.trim(),
      })),
      already_linked: already,
    });
  }

  if (withName.length === 0) {
    lines.push("");
    lines.push("## Bloqueur");
    lines.push("");
    lines.push(
      "Aucune inscription n’a `formateur` renseigné. L’import historique n’a conservé que `instructor_id` (aujourd’hui NULL pour toutes) et a **jeté** le libellé Excel « Formateur »."
    );
    lines.push("");
    lines.push(
      "Pour produire la table de validation ligne à ligne : fournir le CSV inscriptions (colonne Formateur), backfill `inscriptions.formateur` / `formateur_email`, puis relancer ce script. **Aucun rattachement `instructor_id` sans validation Paula.**"
    );
  }

  // Écarts vs référence Paula (sur base DB post-backfill, pas les 878 CSV brutes)
  lines.push("");
  lines.push("## Écarts vs référence Paula (878 CSV → 719 email / 96 alias / 35 sans / 0 ambigu)");
  lines.push("");
  lines.push(
    "Périmètre différent : ce script compte les **inscriptions DB** avec `formateur` non vide après backfill B (pas les 878 lignes Excel). Les 32 matches B à Formateur vide + 69 DB non rapprochées restent dans « sans formateur »."
  );
  lines.push("");
  const emailDelta = methodCounts.email - 719;
  const aliasCombined = methodCounts.alias + methodCounts.alias_fuzzy;
  const aliasDelta = aliasCombined - 96;
  lines.push(`- email : ${methodCounts.email} (Δ ${emailDelta >= 0 ? "+" : ""}${emailDelta} vs 719)`);
  lines.push(`- alias(+fuzzy) : ${aliasCombined} (Δ ${aliasDelta >= 0 ? "+" : ""}${aliasDelta} vs 96)`);
  lines.push(`- ambigu : ${methodCounts.alias_ambiguous} (attendu 0)`);
  lines.push(`- sans formateur DB : ${methodCounts.no_formateur} (réf. CSV 35)`);
  lines.push(`- unmatched libellé : ${methodCounts.unmatched}`);

  const outMd = "/opt/cursor/artifacts/point3_rapprochement_formateurs.md";
  const outJson = "/opt/cursor/artifacts/point3_rapprochement_formateurs.json";
  writeFileSync(outMd, lines.join("\n"));
  writeFileSync(
    outJson,
    JSON.stringify(
      {
        instructors: (instructors || []).length,
        inscriptions: (inscriptions || []).length,
        with_formateur: withName.length,
        without_formateur: withoutFormateur.length,
        distinct_labels: groups.size,
        method_counts: methodCounts,
        alias_combined: aliasCombined,
        paula_ref: { email: 719, alias: 96, no_formateur: 35, ambiguous: 0 },
        blocked: withName.length === 0,
        table: tableRows,
        rows: rowResults,
      },
      null,
      2
    )
  );
  console.log(lines.join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
