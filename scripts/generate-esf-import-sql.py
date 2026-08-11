#!/usr/bin/env python3
"""Generate SQL batches for BD ESF directors import."""
import csv
import re
import unicodedata
from pathlib import Path

CSV_PATH = Path("/home/ubuntu/.cursor/projects/workspace/uploads/BD_ESF_caa7.csv")
OUT_DIR = Path("/opt/cursor/artifacts/esf-import-batches")
OUT_DIR.mkdir(parents=True, exist_ok=True)

def esc(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

def normalize_text(value):
    if not value:
        return ""
    s = unicodedata.normalize("NFD", value.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def normalize_email(email):
    e = (email or "").strip().lower().replace("\xa0", "")
    e = re.sub(r"[\u200b-\u200d\ufeff]", "", e)
    if not e or not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", e):
        return None
    return e

def extract_station(name):
    aliases = {
        "la rosiere": "la rosiere",
        "les menuires": "les menuires",
        "menuires": "les menuires",
        "oz en oisans": "oz en oisans",
        "oz 3300": "oz en oisans",
        "auris en oisans": "auris en oisans",
        "val cenis": "val cenis",
        "saint gervais": "saint gervais",
        "st gervais": "saint gervais",
        "les gets": "les gets",
        "la clusaz": "la clusaz",
        "samoens": "samoens",
        "morzine": "morzine",
        "chatel": "chatel",
        "valmorel": "valmorel",
        "pralognan": "pralognan",
        "courchevel": "courchevel",
    }
    n = normalize_text(name)
    without = re.sub(r"^esf\s+", "", n)
    for alias, canonical in aliases.items():
        if alias in without or alias in n:
            return canonical
    tokens = without.split()
    if not tokens:
        return None
    if len(tokens) <= 3:
        return " ".join(tokens)
    return " ".join(tokens[-2:])

def build_notes(row):
    parts = [f"Import BD ESF (code {row['esf_code']})"]
    if row.get("region"):
        parts.append(f"Région: {row['region']}")
    if row.get("siret"):
        parts.append(f"SIRET: {row['siret']}")
    if row.get("cards_total") is not None:
        parts.append(f"Cartes: {row.get('cards_active', '?')}/{row['cards_total']}")
    if row.get("school_email") and row["school_email"] != row.get("director_email"):
        parts.append(f"Courriel école: {row['school_email']}")
    return " | ".join(parts)

def parse_rows():
    rows = []
    with CSV_PATH.open("r", encoding="latin-1", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        for raw in reader:
            school = (raw.get("Ecole") or "").strip()
            code = (raw.get("ESF") or "").strip()
            if not school or school.startswith("---") or not code:
                continue
            civ = (raw.get("Civ.") or "").strip()
            nom = (raw.get("Nom") or "").strip()
            prenom = (raw.get("Prénom") or raw.get("Prenom") or "").strip()
            director_name = " ".join(p for p in [civ, prenom, nom] if p).strip() or "—"
            addr_parts = [p.strip() for p in [
                raw.get("Adresse1") or "",
                raw.get("Adresse2") or "",
                raw.get("Adresse3") or "",
            ] if p.strip()]
            postal = (raw.get("Code postal") or "").strip()
            ville = (raw.get("Ville") or "").strip()
            if postal:
                addr_parts.append(postal)
            if ville:
                addr_parts.append(ville)
            school_email = normalize_email(raw.get("Courriel ESF"))
            director_email = normalize_email(raw.get("Courriel Dir.")) or school_email
            school_phone = (raw.get("Tél. E") or "").strip() or None
            director_phone = (raw.get("Portable directeur") or "").strip() or school_phone
            region = (raw.get("Région") or raw.get("Region") or "").strip() or None
            siret = (raw.get("Siret ESF") or "").strip() or None
            cards_total = re.sub(r"[^\d]", "", raw.get("Cartes") or "")
            cards_active = re.sub(r"[^\d]", "", raw.get("Cartes actifs") or "")
            rows.append({
                "esf_code": code,
                "school_name": school,
                "director_name": director_name,
                "address": ", ".join(addr_parts) if addr_parts else None,
                "station": extract_station(school) or (normalize_text(ville) if ville else None),
                "director_email": director_email,
                "director_phone": director_phone,
                "school_email": school_email,
                "region": region,
                "siret": siret,
                "cards_total": int(cards_total) if cards_total else None,
                "cards_active": int(cards_active) if cards_active else None,
            })
    return rows

def partner_sql(row):
    notes = build_notes(row)
    contact_name = row["director_name"] if row["director_name"] != "—" else None
    return f"""
INSERT INTO partners (name, type, esf_code, station, address, contact_name, contact_email, contact_phone, status, notes)
VALUES ({esc(row['school_name'])}, 'esf', {esc(row['esf_code'])}, {esc(row['station'])}, {esc(row['address'])}, {esc(contact_name)}, {esc(row['director_email'])}, {esc(row['director_phone'])}, 'actif', {esc(notes)})
ON CONFLICT (esf_code) WHERE esf_code IS NOT NULL DO UPDATE SET
  name = EXCLUDED.name,
  type = 'esf',
  station = COALESCE(EXCLUDED.station, partners.station),
  address = COALESCE(EXCLUDED.address, partners.address),
  contact_name = COALESCE(EXCLUDED.contact_name, partners.contact_name),
  contact_email = COALESCE(EXCLUDED.contact_email, partners.contact_email),
  contact_phone = COALESCE(EXCLUDED.contact_phone, partners.contact_phone),
  notes = EXCLUDED.notes,
  updated_at = now();
"""

def contact_sql(row):
    contact_name = row["director_name"] if row["director_name"] != "—" else row["school_name"]
    return f"""
INSERT INTO partner_contacts (partner_id, name, role, email, phone, is_primary)
SELECT p.id, {esc(contact_name)}, 'Directeur', {esc(row['director_email'])}, {esc(row['director_phone'])}, true
FROM partners p WHERE p.esf_code = {esc(row['esf_code'])}
ON CONFLICT DO NOTHING;
"""

def main():
    rows = parse_rows()
    print(f"Parsed {len(rows)} ESF rows")

    # Batch partners
    batch_size = 15
    batches = []
    for i in range(0, len(rows), batch_size):
        chunk = rows[i:i + batch_size]
        sql = "BEGIN;\n" + "\n".join(partner_sql(r) for r in chunk) + "\nCOMMIT;"
        path = OUT_DIR / f"partners-batch-{i // batch_size + 1:02d}.sql"
        path.write_text(sql, encoding="utf-8")
        batches.append(path)

    # Contacts: delete+insert approach per partner via subquery update
    contact_batches = []
    for i in range(0, len(rows), batch_size):
        chunk = rows[i:i + batch_size]
        stmts = []
        for r in chunk:
            contact_name = r["director_name"] if r["director_name"] != "—" else r["school_name"]
            stmts.append(f"""
DELETE FROM partner_contacts pc
USING partners p
WHERE pc.partner_id = p.id AND p.esf_code = {esc(r['esf_code'])} AND pc.role = 'Directeur';

INSERT INTO partner_contacts (partner_id, name, role, email, phone, is_primary)
SELECT p.id, {esc(contact_name)}, 'Directeur', {esc(r['director_email'])}, {esc(r['director_phone'])}, true
FROM partners p WHERE p.esf_code = {esc(r['esf_code'])};
""")
        sql = "BEGIN;\n" + "\n".join(stmts) + "\nCOMMIT;"
        path = OUT_DIR / f"contacts-batch-{i // batch_size + 1:02d}.sql"
        path.write_text(sql, encoding="utf-8")
        contact_batches.append(path)

  # Update existing 13 ESF partners without esf_code by name match - separate file
    update_existing = []
    existing_map = {
        "ESF Courchevel 1550": "302",
        "ESF Samoens": "599",
        "ESF LA Rosière": "548",
        "ESF OZ EN OISANS": "523",
        "ESF Auris en Oisans": "164",
        "ESF LES Menuires": "419",
        "ESF CHATEL": "260",
        "ESF MORZINE": "470",
        "ESF VALMOREL": "686",
        "ESF SAINT GERVAIS": "569",
        "ESF LA CLUSAZ": "263",
        "ESF LES GETS": "347",
        "ESF PRALOGNAN": "518",
    }
    by_code = {r["esf_code"]: r for r in rows}
    for partner_name, code in existing_map.items():
        if not code:
            continue
        row = by_code.get(code)
        if not row:
            continue
        notes = build_notes(row)
        contact_name = row["director_name"] if row["director_name"] != "—" else None
        update_existing.append(f"""
UPDATE partners SET
  esf_code = {esc(code)},
  contact_name = COALESCE({esc(contact_name)}, contact_name),
  contact_email = COALESCE({esc(row['director_email'])}, contact_email),
  contact_phone = COALESCE({esc(row['director_phone'])}, contact_phone),
  address = COALESCE({esc(row['address'])}, address),
  station = COALESCE({esc(row['station'])}, station),
  notes = {esc(notes)},
  updated_at = now()
WHERE name ILIKE {esc(partner_name)};
""")

    # ski_schools update
    ski_updates = []
    school_map = {
        "ESF Courchevel 1550": "302",
        "ESF Samoens": "599",
        "ESF LA Rosière": "548",
        "ESF OZ EN OISANS": "523",
        "ESF Auris en Oisans": "164",
        "ESF LES Menuires": "419",
        "ESF CHATEL": "260",
        "ESF MORZINE": "470",
        "ESF VALMOREL": "686",
        "ESF SAINT GERVAIS": "569",
        "ESF LA CLUSAZ": "263",
        "ESF LES GETS": "347",
        "ESF PRALOGNAN": "518",
    }
    for school_name, code in school_map.items():
        row = by_code.get(code)
        if not row:
            continue
        contact_name = row["director_name"] if row["director_name"] != "—" else None
        ski_updates.append(f"""
UPDATE ski_schools s SET
  director_name = COALESCE({esc(contact_name)}, s.director_name),
  director_phone = COALESCE({esc(row['director_phone'])}, s.director_phone),
  school_kind = 'esf',
  station = COALESCE({esc(row['station'])}, s.station),
  partner_id = COALESCE(s.partner_id, (SELECT id FROM partners WHERE esf_code = {esc(code)} LIMIT 1))
WHERE s.name ILIKE {esc(school_name)};
""")

    enrich_path = OUT_DIR / "enrich-existing.sql"
    enrich_path.write_text("BEGIN;\n" + "\n".join(update_existing + ski_updates) + "\nCOMMIT;\n", encoding="utf-8")

    print("Batches:", len(batches), "partner,", len(contact_batches), "contacts")
    for p in batches:
        print(p)
    print(enrich_path)

if __name__ == "__main__":
    main()
