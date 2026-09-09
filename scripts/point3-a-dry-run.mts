/**
 * Dry-run complément formateur·rices (Point 3 A).
 * Aucune écriture — classifie insert / update par email puis nom+prénom.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { parseCsvText } from "../src/lib/csv-import-parser.ts";
import { prepareImport } from "../src/lib/admin-import-engine.ts";

// Charge .env Vite sans dépendance dotenv
for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

function normName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const csvPath =
  process.argv[2] ||
  "/home/ubuntu/.cursor/projects/workspace/uploads/formateurs_FLI_import09092026_new_980c.csv";

const text = readFileSync(csvPath, "utf8");
const { rows, encodingNotes } = parseCsvText(text);
const prep = prepareImport(rows, "instructors");

const url = process.env.VITE_SUPABASE_URL!;
const key =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY!;
const sb = createClient(url, key);

const { data: instructors, error } = await sb
  .from("instructors")
  .select(
    "id,email,first_name,last_name,status,phone,languages,alias,civilite,statut_administratif"
  );
if (error) throw error;

const byEmail = new Map<string, (typeof instructors)[0]>();
const byName = new Map<string, (typeof instructors)[0]>();
for (const i of instructors || []) {
  if (i.email) byEmail.set(String(i.email).toLowerCase(), i);
  byName.set(normName(`${i.first_name || ""}|${i.last_name || ""}`), i);
}

const insert: Record<string, unknown>[] = [];
const update: Record<string, unknown>[] = [];

for (const rec of prep.accepted) {
  const email = rec.email ? String(rec.email).toLowerCase() : null;
  const nk = normName(`${rec.first_name || ""}|${rec.last_name || ""}`);
  const existing = (email && byEmail.get(email)) || byName.get(nk);
  if (!existing) {
    insert.push(rec);
  } else {
    update.push({
      id: existing.id,
      match_key: email && byEmail.get(email) ? "email" : "nom_prenom",
      record: rec,
      existing_status: existing.status,
    });
  }
}

const byStatus = prep.accepted.reduce<Record<string, number>>((a, r) => {
  const s = String(r.status);
  a[s] = (a[s] || 0) + 1;
  return a;
}, {});

const report = {
  source: csvPath.split("/").pop(),
  encodingNotes,
  total_csv: rows.length,
  accepted: prep.acceptedCount,
  rejected: prep.rejectedCount,
  rejections: prep.rejections,
  by_status_csv: byStatus,
  db_before: instructors?.length ?? 0,
  to_insert: insert.length,
  to_update: update.length,
  inserts: insert.map((r) => ({
    last_name: r.last_name,
    first_name: r.first_name,
    email: r.email,
    status: r.status,
    languages: r.languages,
  })),
  update_match_keys: update.reduce<Record<string, number>>((a, u) => {
    const k = String(u.match_key);
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {}),
  expected_after: (instructors?.length ?? 0) + insert.length,
};

mkdirSync("/tmp/p3c", { recursive: true });
writeFileSync("/tmp/p3c/a_dry_run.json", JSON.stringify({ report, insert, update }, null, 2));
console.log(JSON.stringify(report, null, 2));
