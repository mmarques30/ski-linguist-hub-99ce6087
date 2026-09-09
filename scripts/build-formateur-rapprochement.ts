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

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
  // Fuzzy contains
  const fuzzy: Instructor[] = [];
  for (const [alias, list] of idx.byAlias) {
    if (alias.includes(key) || key.includes(alias)) {
      for (const i of list) {
        if (!fuzzy.some((x) => x.id === i.id)) fuzzy.push(i);
      }
    }
  }
  if (fuzzy.length === 1) {
    return { confidence: "alias_fuzzy", proposed: fuzzy[0], candidates: fuzzy };
  }
  if (fuzzy.length > 1) {
    return { confidence: "alias_ambiguous", proposed: null, candidates: fuzzy };
  }
  return { confidence: "unmatched", proposed: null, candidates: [] };
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Missing Supabase URL/key env");
    process.exit(1);
  }
  const supabase = createClient(url, key);

  const { data: instructors, error: e1 } = await supabase
    .from("instructors")
    .select("id, first_name, last_name, email, status, alias");
  if (e1) throw e1;

  const { data: inscriptions, error: e2 } = await supabase
    .from("inscriptions")
    .select("id, code, formateur, formateur_email, instructor_id, start_date");
  if (e2) throw e2;

  const withName = (inscriptions || []).filter(
    (i) => i.formateur && String(i.formateur).trim() !== ""
  );

  const idx = buildAliasIndex((instructors || []) as Instructor[]);

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
    `Libellés distincts : ${groups.size}`,
    "",
    "| # | formateur (libellé inscriptions) | n inscriptions | proposition | statut prop. | confiance | candidats | déjà lié |",
    "|---|----------------------------------|----------------|-------------|--------------|-----------|-----------|----------|",
  ];

  let i = 0;
  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
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
    lines.push(
      `| ${i} | ${label.replace(/\|/g, "/")} | ${rows.length} | ${propLabel.replace(/\|/g, "/")} | ${p.proposed?.status || "—"} | ${p.confidence} | ${cand.replace(/\|/g, "/") || "—"} | ${already}/${rows.length} |`
    );
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
        distinct_labels: groups.size,
        blocked: withName.length === 0,
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
