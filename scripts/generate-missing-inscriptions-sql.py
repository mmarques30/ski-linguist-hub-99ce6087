#!/usr/bin/env python3
"""Generate SQL for inscriptions missing from DB (by code)."""
import csv, re, json
from pathlib import Path

CSV_PATH = Path("/home/ubuntu/.cursor/projects/workspace/uploads/incriptions_29072026_f0ff.csv")
DB_CODES_PATH = Path("/home/ubuntu/.cursor/projects/workspace/agent-tools/1bc54b74-19d4-4bbc-b2c0-931196b2b218.txt")
OUT = Path("/opt/cursor/artifacts/fli-missing-inscriptions.sql")

# Reuse helpers from main generator
exec(open("/workspace/scripts/generate-fli-import-sql.py").read().split("with open(CSV_PATH")[0])

db_data = json.loads(DB_CODES_PATH.read_text())
db_codes = {r["code"].strip() for r in db_data["rows"] if r.get("code")}

with open(CSV_PATH, encoding="latin-1", errors="replace") as f:
    rows = list(csv.DictReader(f, delimiter=";"))

missing = []
for row in rows:
    email = normalize_email(get_col(row, "Email"))
    full = get_col(row, "Nom et Prénom")
    start = parse_french_date(get_col(row, "Date début", "Date debut"))
    end = parse_french_date(get_col(row, "Date fin"))
    if not start or not end or not full:
        continue
    if not email:
        code = get_col(row, "Code")
        email = f"import.{slugify(code or full + start)}@fli.import"
    code = None if is_empty(get_col(row, "Code")) else get_col(row, "Code")[:250]
    if code and code in db_codes:
        continue

    fn, ln = parse_name(full)
    obs_parts = [get_col(row, "Observation"), get_col(row, "Obervations sur la salle")]
    obs = "\n".join([p for p in obs_parts if not is_empty(p)]) or None

    missing.append({
        "email": email, "code": code,
        "modality": map_modality(get_col(row, "Modalité", "Modalite") or ""),
        "course_type": None if is_empty(get_col(row, "Type")) else get_col(row, "Type"),
        "max_participants": None if is_empty(get_col(row, "Effectif")) else get_col(row, "Effectif"),
        "language": map_language(get_col(row, "Langue") or "Anglais"),
        "course_location": None if is_empty(get_col(row, "Lieu du stage")) else get_col(row, "Lieu du stage"),
        "course_address": None if is_empty(get_col(row, "Adresse du stage")) else get_col(row, "Adresse du stage"),
        "certification_type": None if is_empty(get_col(row, "Certification")) else get_col(row, "Certification"),
        "start_date": start, "end_date": end,
        "duration_hours": parse_number(get_col(row, "Durée (en heures)", "Duree (en heures)")),
        "duration_days": parse_number(get_col(row, "Durée (en jours)", "Duree (en jours)")),
        "hours_per_day": parse_number(get_col(row, "Heures par jour")),
        "pedagogical_cost": parse_number(get_col(row, "Coût pédagogique", "Cout pedagogique")),
        "price": parse_number(get_col(row, "Coût pédagogique", "Cout pedagogique")),
        "rhythm": None if is_empty(get_col(row, "Rythme")) else get_col(row, "Rythme"),
        "entry_test_score": None if is_empty(get_col(row, "Résultat test - entrée", "Resultat test - entree")) else get_col(row, "Résultat test - entrée", "Resultat test - entree"),
        "entry_level": None if is_empty(get_col(row, "Niveau entrée", "Niveau entree")) else get_col(row, "Niveau entrée", "Niveau entree"),
        "group_name": None if is_empty(get_col(row, "Groupe")) else get_col(row, "Groupe"),
        "schedule": None if is_empty(get_col(row, "Horaires")) else get_col(row, "Horaires"),
        "final_general_level": None if is_empty(get_col(row, "Niv général en fin de stage", "Niv general en fin de stage")) else get_col(row, "Niv général en fin de stage", "Niv general en fin de stage"),
        "final_specific_level": None if is_empty(get_col(row, "Niv spécifique", "Niv specifique")) else get_col(row, "Niv spécifique", "Niv specifique"),
        "certification_date": parse_french_date(get_col(row, "Date de la certification")),
        "certification_result": None if is_empty(get_col(row, "Résultat Certif Barème Européen", "Resultat Certif Bareme Europeen")) else get_col(row, "Résultat Certif Barème Européen", "Resultat Certif Bareme Europeen"),
        "expectations": None if is_empty(get_col(row, "Attentes")) else get_col(row, "Attentes"),
        "observations": obs,
        "status": map_status(get_col(row, "Status"), get_col(row, "Status final"), end),
        "ski_school_name": None if is_empty(get_col(row, "École de SKI", "Ecole de SKI")) else get_col(row, "École de SKI", "Ecole de SKI"),
        "instructor_accommodation_dates": None if is_empty(get_col(row, "Dates du logement")) else get_col(row, "Dates du logement"),
        "instructor_accommodation_address": None if is_empty(get_col(row, "Adresse du logement")) else get_col(row, "Adresse du logement"),
        "instructor_accommodation_notes": None if is_empty(get_col(row, "Observations sur le logement")) else get_col(row, "Observations sur le logement"),
    })

parts = ["BEGIN;"]
for r in missing:
    ski_sub = f"(SELECT id FROM ski_schools WHERE name = {esc(r['ski_school_name'])} LIMIT 1)" if r["ski_school_name"] else "NULL"
    conflict = "ON CONFLICT (code) DO NOTHING" if r["code"] else ""
    parts.append(f"""
INSERT INTO inscriptions (
  student_id, ski_school_id, code, modality, course_type, max_participants, language,
  certification_type, course_location, course_address, start_date, end_date,
  duration_hours, duration_days, hours_per_day, rhythm, entry_test_score, entry_level,
  group_name, schedule, final_general_level, final_specific_level,
  certification_date, certification_result, expectations, observations,
  pedagogical_cost, price, status,
  instructor_accommodation_dates, instructor_accommodation_address, instructor_accommodation_notes
) SELECT
  s.id, {ski_sub}, {esc(r['code'])}, {esc(r['modality'])}, {esc(r['course_type'])}, {esc(r['max_participants'])}, {esc(r['language'])},
  {esc(r['certification_type'])}, {esc(r['course_location'])}, {esc(r['course_address'])}, {esc(r['start_date'])}, {esc(r['end_date'])},
  {r['duration_hours'] if r['duration_hours'] is not None else 'NULL'}, {r['duration_days'] if r['duration_days'] is not None else 'NULL'}, {r['hours_per_day'] if r['hours_per_day'] is not None else 'NULL'}, {esc(r['rhythm'])}, {esc(r['entry_test_score'])}, {esc(r['entry_level'])},
  {esc(r['group_name'])}, {esc(r['schedule'])}, {esc(r['final_general_level'])}, {esc(r['final_specific_level'])},
  {esc(r['certification_date']) if r['certification_date'] else 'NULL'}, {esc(r['certification_result'])}, {esc(r['expectations'])}, {esc(r['observations'])},
  {r['pedagogical_cost'] if r['pedagogical_cost'] is not None else 'NULL'}, {r['price'] if r['price'] is not None else 'NULL'}, {esc(r['status'])},
  {esc(r['instructor_accommodation_dates'])}, {esc(r['instructor_accommodation_address'])}, {esc(r['instructor_accommodation_notes'])}
FROM students s WHERE s.email = {esc(r['email'])}
{conflict};""")
parts.append("COMMIT;")
OUT.write_text("\n".join(parts), encoding="utf-8")
print(f"missing rows: {len(missing)}, output: {OUT}, size: {OUT.stat().st_size}")
