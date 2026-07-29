#!/usr/bin/env node
/**
 * Import FLI_Listing_Complet_Contacts.csv into ski_monitors.
 * Requires SUPABASE_SERVICE_ROLE_KEY (and applied migration 20260728210000).
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-ski-monitors.mjs [csv-path]
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://nghkrmvakjomzmfwdhbo.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CSV_PATH = process.argv[2] || "/home/ubuntu/.cursor/projects/workspace/uploads/FLI_Listing_Complet_Contacts_7d13.csv";
const BATCH = 150;

// Inline minimal parser (mirrors src/lib/ski-monitor-csv-import.ts)
const STATUS_PRIORITY = { active: 3, unsubscribed: 2 };

function normalizeEmail(email) {
  const cleaned = (email || "").trim().toLowerCase();
  if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return null;
  return cleaned;
}

function mapStatus(raw) {
  return raw.trim().toLowerCase() === "active" ? "active" : "unsubscribed";
}

function parseName(name, nom, prenom) {
  const nomClean = (nom || "").trim();
  const prenomClean = (prenom || "").trim();
  if (prenomClean && nomClean) return { first_name: prenomClean, last_name: nomClean };
  let cleaned = (name || "").trim();
  if (!cleaned && nomClean) return { first_name: prenomClean || "—", last_name: nomClean };
  if (!cleaned) return { first_name: "—", last_name: "—" };
  cleaned = cleaned.replace(/^(MR|MME|MLLE|M\.|MME\.|MONSIEUR|MADAME)\s+/i, "").trim();
  const m = cleaned.match(/attention de\s+(?:m\.|mme\.)?\s*(.+)/i);
  if (m) cleaned = m[1].trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first_name: parts[0] || "—", last_name: "—" };
  if (parts.length === 2) return { first_name: parts[1], last_name: parts[0] };
  return { first_name: parts[parts.length - 1], last_name: parts.slice(0, -1).join(" ") };
}

function getColumn(row, ...candidates) {
  for (const key of candidates) {
    if (row[key] !== undefined) return row[key] || "";
  }
  return "";
}

function parseCsvLine(line, delimiter = ";") {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === delimiter && !inQuotes) { result.push(current); current = ""; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

function rowScore(row) {
  let score = (STATUS_PRIORITY[row.status] || 0) * 10;
  if (row.home_station) score += 2;
  if (row.first_name !== "—" && row.last_name !== "—") score += 2;
  return score;
}

function mergeRows(preferred, other) {
  return {
    ...preferred,
    home_station: preferred.home_station || other.home_station,
    first_name: preferred.first_name !== "—" ? preferred.first_name : other.first_name,
    last_name: preferred.last_name !== "—" ? preferred.last_name : other.last_name,
    notes: [preferred.notes, other.notes].filter(Boolean).join(" | ") || null,
    source_liste: preferred.source_liste || other.source_liste,
  };
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim());
  const headers = parseCsvLine(lines[0], ";");
  const byEmail = new Map();

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], ";");
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] || "").trim(); });

    const email = normalizeEmail(getColumn(row, "Email Address", "email"));
    if (!email) continue;

    const { first_name, last_name } = parseName(
      getColumn(row, "Name"),
      getColumn(row, "Nom", "NOM"),
      getColumn(row, "Prénom", "Prenom")
    );
    const station = getColumn(row, "station", "Station") || getColumn(row, "ESF") || getColumn(row, "VILLE") || null;
    const liste = getColumn(row, "liste") || null;
    const esf = getColumn(row, "ESF");

    const parsed = {
      first_name, last_name, email,
      phone: null,
      home_station: station,
      status: mapStatus(getColumn(row, "Status")),
      source_liste: liste,
      notes: esf && esf !== station ? `ESF: ${esf}` : null,
    };

    const existing = byEmail.get(email);
    if (!existing) byEmail.set(email, parsed);
    else if (rowScore(parsed) > rowScore(existing)) byEmail.set(email, mergeRows(parsed, existing));
    else byEmail.set(email, mergeRows(existing, parsed));
  }

  return Array.from(byEmail.values());
}

async function main() {
  if (!SERVICE_KEY) {
    console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY is required");
    process.exit(1);
  }

  console.log("Reading", CSV_PATH);
  const text = readFileSync(CSV_PATH, "latin1");
  const rows = parseCsv(text);
  console.log(`Parsed ${rows.length} unique contacts`);

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { error: probeError } = await supabase.from("ski_monitors").select("id").limit(1);
  if (probeError) {
    console.error("Table ski_monitors not accessible:", probeError.message);
    console.error("Apply migration 20260728210000_ski_monitors_intakes.sql first.");
    process.exit(1);
  }

  let imported = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH).map((r) => ({
      first_name: r.first_name,
      last_name: r.last_name,
      email: r.email,
      phone: r.phone,
      home_station: r.home_station,
      status: r.status,
      notes: r.source_liste ? `Liste: ${r.source_liste}${r.notes ? ` | ${r.notes}` : ""}` : r.notes,
      partner_id: null,
      ski_school_id: null,
    }));

    const { error } = await supabase.from("ski_monitors").upsert(batch, { onConflict: "email" });
    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH) + 1} failed:`, error.message);
      process.exit(1);
    }
    imported += batch.length;
    process.stdout.write(`\rImported ${imported}/${rows.length}`);
  }

  console.log("\nDone!", { imported, active: rows.filter((r) => r.status === "active").length });
}

main().catch((e) => { console.error(e); process.exit(1); });
