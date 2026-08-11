#!/usr/bin/env node
/**
 * POST parsed monitor rows to import-ski-monitors edge function (after deploy).
 * Usage:
 *   IMPORT_SECRET=... node scripts/call-import-ski-monitors.mjs [csv-path]
 */

import { readFileSync } from "fs";
import { execSync } from "child_process";

const CSV_PATH = process.argv[2] || "/home/ubuntu/.cursor/projects/workspace/uploads/FLI_Listing_Complet_Contacts_7d13.csv";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://nghkrmvakjomzmfwdhbo.supabase.co";
const IMPORT_SECRET = process.env.IMPORT_SECRET;
const BATCH = 200;

if (!IMPORT_SECRET) {
  console.error("IMPORT_SECRET required");
  process.exit(1);
}

const parsed = JSON.parse(
  execSync(`npx tsx -e "
import { readFileSync } from 'fs';
import { parseSkiMonitorCsv } from './src/lib/ski-monitor-csv-import.ts';
const text = readFileSync('${CSV_PATH}', 'latin1');
const r = parseSkiMonitorCsv(text);
console.log(JSON.stringify(r.rows.map(x => ({
  first_name: x.first_name,
  last_name: x.last_name,
  email: x.email,
  phone: x.phone,
  home_station: x.home_station,
  status: x.status,
  notes: x.source_liste ? 'Liste: ' + x.source_liste + (x.notes ? ' | ' + x.notes : '') : x.notes,
}))));
"`, { encoding: "utf8", cwd: "/workspace", maxBuffer: 50 * 1024 * 1024 })
);

console.log(`Sending ${parsed.length} contacts in batches of ${BATCH}...`);

let imported = 0;
for (let i = 0; i < parsed.length; i += BATCH) {
  const batch = parsed.slice(i, i + BATCH);
  const res = await fetch(`${SUPABASE_URL}/functions/v1/import-ski-monitors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-import-secret": IMPORT_SECRET,
    },
    body: JSON.stringify({ rows: batch }),
  });
  const result = await res.json();
  if (!result.success) {
    console.error("Batch failed:", result);
    process.exit(1);
  }
  imported += result.imported;
  process.stdout.write(`\r${imported}/${parsed.length}`);
}
console.log("\nDone!");
