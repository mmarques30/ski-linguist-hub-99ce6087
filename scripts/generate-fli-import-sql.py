#!/usr/bin/env python3
"""Generate SQL batches for FLI inscriptions import."""
import csv, io, re, json, hashlib
from pathlib import Path

CSV_PATH = Path("/home/ubuntu/.cursor/projects/workspace/uploads/incriptions_29072026_f0ff.csv")
OUT_DIR = Path("/opt/cursor/artifacts/fli-import-batches")
OUT_DIR.mkdir(parents=True, exist_ok=True)

def esc(s):
    if s is None: return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

def is_empty(v):
    return not v or v.strip() in ('-', 'N/A', '')

def parse_french_date(value):
    m = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{2,4})$', (value or '').strip())
    if not m: return None
    d, mo, y = m.groups()
    if len(y) == 2: y = '20' + y
    return f"{y}-{mo.zfill(2)}-{d.zfill(2)}"

def normalize_email(email):
    e = (email or '').strip().lower()
    if not e or not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', e):
        return None
    return e

def slugify(s):
    s = re.sub(r'[^a-z0-9]+', '-', s.lower().strip())
    return s[:40] or 'unknown'

def parse_name(full):
    parts = full.strip().split()
    if not parts: return '—', '—'
    if len(parts) == 1: return parts[0], '—'
    return parts[0], ' '.join(parts[1:])

def map_status(status, status_final, end_date):
    raw = f"{status} {status_final}".lower()
    if 'annul' in raw: return 'annulee'
    if 'factur' in raw: return 'facturee'
    if 'formation' in raw or 'cours' in raw: return 'en_cours'
    if 'docs' in raw: return 'confirmee'
    if end_date:
        from datetime import datetime
        try:
            if datetime.strptime(end_date, '%Y-%m-%d') < datetime.now():
                return 'terminee'
        except: pass
    return 'confirmee'

def map_modality(v):
    v = v.lower()
    if 'ligne' in v: return 'en_ligne'
    if 'sentiel' in v: return 'presentiel'
    return None

def map_language(v):
    m = {'portugais bresilien': 'Portugais', 'portugais brésilien': 'Portugais'}
    return m.get(v.lower().strip(), v.strip())

def norm_key(s):
    return re.sub(r'[^a-z0-9]', '', (s or '').lower())

def get_col(row, *names):
    for n in names:
        if n in row:
            return row[n]
    targets = {norm_key(n) for n in names}
    for k, v in row.items():
        if norm_key(k) in targets:
            return v
    return ''

def parse_number(v):
    if is_empty(v): return None
    n = re.sub(r'[^\d.,-]', '', v.replace(',', '.'))
    try: return float(n)
    except: return None

with open(CSV_PATH, encoding='latin-1', errors='replace') as f:
    rows = list(csv.DictReader(f, delimiter=';'))

parsed = []
monitors = {}

for row in rows:
    email = normalize_email(get_col(row, 'Email'))
    full = get_col(row, 'Nom et Prénom')
    if email and full:
        fn, ln = parse_name(full)
        monitors[email] = {
            'first_name': fn, 'last_name': ln, 'email': email,
            'phone': None if is_empty(get_col(row, 'Tél', 'Tel')) else get_col(row, 'Tél', 'Tel'),
            'home_station': None if is_empty(get_col(row, 'Ville')) else get_col(row, 'Ville'),
            'company': None if is_empty(get_col(row, 'Entreprise')) else get_col(row, 'Entreprise'),
            'ski_school': None if is_empty(get_col(row, 'École de SKI', 'Ecole de SKI')) else get_col(row, 'École de SKI', 'Ecole de SKI'),
        }

    start = parse_french_date(get_col(row, 'Date début', 'Date debut'))
    end = parse_french_date(get_col(row, 'Date fin'))
    if not start or not end or not full: continue

    if not email:
        code = get_col(row, 'Code')
        email = f"import.{slugify(code or full + start)}@fli.import"

    fn, ln = parse_name(full)
    obs_parts = [get_col(row, 'Observation'), get_col(row, 'Obervations sur la salle')]
    obs = '\n'.join([p for p in obs_parts if not is_empty(p)]) or None

    parsed.append({
        'email': email, 'first_name': fn, 'last_name': ln,
        'civility': None if is_empty(get_col(row, 'Civilité', 'Civilite')) else get_col(row, 'Civilité', 'Civilite'),
        'phone': None if is_empty(get_col(row, 'Tél', 'Tel')) else get_col(row, 'Tél', 'Tel'),
        'street': None if is_empty(get_col(row, 'Rue ou localité', 'Rue ou localite')) else get_col(row, 'Rue ou localité', 'Rue ou localite'),
        'postal_code': None if is_empty(get_col(row, 'CP')) else get_col(row, 'CP'),
        'city': None if is_empty(get_col(row, 'Ville')) else get_col(row, 'Ville'),
        'company': None if is_empty(get_col(row, 'Entreprise')) else get_col(row, 'Entreprise'),
        'modality': map_modality(get_col(row, 'Modalité', 'Modalite') or ''),
        'course_type': None if is_empty(get_col(row, 'Type')) else get_col(row, 'Type'),
        'max_participants': None if is_empty(get_col(row, 'Effectif')) else get_col(row, 'Effectif'),
        'language': map_language(get_col(row, 'Langue') or 'Anglais'),
        'course_location': None if is_empty(get_col(row, 'Lieu du stage')) else get_col(row, 'Lieu du stage'),
        'course_address': None if is_empty(get_col(row, 'Adresse du stage')) else get_col(row, 'Adresse du stage'),
        'certification_type': None if is_empty(get_col(row, 'Certification')) else get_col(row, 'Certification'),
        'start_date': start, 'end_date': end,
        'duration_hours': parse_number(get_col(row, 'Durée (en heures)', 'Duree (en heures)')),
        'duration_days': parse_number(get_col(row, 'Durée (en jours)', 'Duree (en jours)')),
        'hours_per_day': parse_number(get_col(row, 'Heures par jour')),
        'pedagogical_cost': parse_number(get_col(row, 'Coût pédagogique', 'Cout pedagogique')),
        'price': parse_number(get_col(row, 'Coût pédagogique', 'Cout pedagogique')),
        'rhythm': None if is_empty(get_col(row, 'Rythme')) else get_col(row, 'Rythme'),
        'entry_test_score': None if is_empty(get_col(row, 'Résultat test - entrée', 'Resultat test - entree')) else get_col(row, 'Résultat test - entrée', 'Resultat test - entree'),
        'entry_level': None if is_empty(get_col(row, 'Niveau entrée', 'Niveau entree')) else get_col(row, 'Niveau entrée', 'Niveau entree'),
        'group_name': None if is_empty(get_col(row, 'Groupe')) else get_col(row, 'Groupe'),
        'schedule': None if is_empty(get_col(row, 'Horaires')) else get_col(row, 'Horaires'),
        'final_general_level': None if is_empty(get_col(row, 'Niv général en fin de stage', 'Niv general en fin de stage')) else get_col(row, 'Niv général en fin de stage', 'Niv general en fin de stage'),
        'final_specific_level': None if is_empty(get_col(row, 'Niv spécifique', 'Niv specifique')) else get_col(row, 'Niv spécifique', 'Niv specifique'),
        'certification_date': parse_french_date(get_col(row, 'Date de la certification')),
        'certification_result': None if is_empty(get_col(row, 'Résultat Certif Barème Européen', 'Resultat Certif Bareme Europeen')) else get_col(row, 'Résultat Certif Barème Européen', 'Resultat Certif Bareme Europeen'),
        'expectations': None if is_empty(get_col(row, 'Attentes')) else get_col(row, 'Attentes'),
        'observations': obs,
        'code': None if is_empty(get_col(row, 'Code')) else get_col(row, 'Code')[:250],
        'status': map_status(get_col(row, 'Status'), get_col(row, 'Status final'), end),
        'ski_school_name': None if is_empty(get_col(row, 'École de SKI', 'Ecole de SKI')) else get_col(row, 'École de SKI', 'Ecole de SKI'),
        'ski_school_director': None if is_empty(get_col(row, "Directeur de l'école de ski", "Directeur de l'ecole de ski")) else get_col(row, "Directeur de l'école de ski", "Directeur de l'ecole de ski"),
        'ski_school_director_phone': None if is_empty(get_col(row, 'N° de Portable du Directeur', 'N de Portable du Directeur')) else get_col(row, 'N° de Portable du Directeur', 'N de Portable du Directeur'),
        'instructor_accommodation_dates': None if is_empty(get_col(row, 'Dates du logement')) else get_col(row, 'Dates du logement'),
        'instructor_accommodation_address': None if is_empty(get_col(row, 'Adresse du logement')) else get_col(row, 'Adresse du logement'),
        'instructor_accommodation_notes': None if is_empty(get_col(row, 'Observations sur le logement')) else get_col(row, 'Observations sur le logement'),
    })

# unique students
students = {}
for r in parsed:
    students[r['email']] = r

# ski schools
schools = {}
for r in parsed:
    if r['ski_school_name']:
        schools[r['ski_school_name']] = {
            'director': r['ski_school_director'],
            'phone': r['ski_school_director_phone'],
        }

print(f"parsed inscriptions: {len(parsed)}, students: {len(students)}, schools: {len(schools)}, monitors: {len(monitors)}")

# Generate SQL batches
batch_files = []

# Batch 1: ski schools
if schools:
    vals = []
    for name, meta in schools.items():
        vals.append(f"({esc(name)}, {esc(meta['director'])}, {esc(meta['phone'])})")
    sql = "INSERT INTO ski_schools (name, director_name, director_phone) VALUES\n" + ",\n".join(vals) + "\nON CONFLICT (name) DO NOTHING;"
    p = OUT_DIR / "01_ski_schools.sql"
    p.write_text(sql, encoding='utf-8')
    batch_files.append(p)

# Batch 2: students in chunks
student_list = list(students.values())
for i in range(0, len(student_list), 100):
    chunk = student_list[i:i+100]
    vals = []
    for s in chunk:
        vals.append(f"({esc(s['email'])}, {esc(s['first_name'])}, {esc(s['last_name'])}, {esc(s['civility'])}, {esc(s['phone'])}, {esc(s['street'])}, {esc(s['postal_code'])}, {esc(s['city'])}, {esc(s['company'])})")
    sql = """INSERT INTO students (email, first_name, last_name, civility, phone, street_address, postal_code, city, company) VALUES\n""" + ",\n".join(vals) + """
ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = COALESCE(EXCLUDED.phone, students.phone),
  street_address = COALESCE(EXCLUDED.street_address, students.street_address),
  postal_code = COALESCE(EXCLUDED.postal_code, students.postal_code),
  city = COALESCE(EXCLUDED.city, students.city),
  company = COALESCE(EXCLUDED.company, students.company);"""
    p = OUT_DIR / f"02_students_{i//100+1:03d}.sql"
    p.write_text(sql, encoding='utf-8')
    batch_files.append(p)

# Batch 3: inscriptions - need student_id and ski_school_id via subqueries
for i in range(0, len(parsed), 50):
    chunk = parsed[i:i+50]
    parts = ["BEGIN;"]
    for r in chunk:
        ski_sub = f"(SELECT id FROM ski_schools WHERE name = {esc(r['ski_school_name'])} LIMIT 1)" if r['ski_school_name'] else "NULL"
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
ON CONFLICT (code) DO NOTHING;""")
    parts.append("COMMIT;")
    p = OUT_DIR / f"03_inscriptions_{i//50+1:03d}.sql"
    p.write_text('\n'.join(parts), encoding='utf-8')
    batch_files.append(p)

# Batch 4: enrich ski_monitors
monitor_list = list(monitors.values())
for i in range(0, len(monitor_list), 100):
    chunk = monitor_list[i:i+100]
    vals = []
    for m in chunk:
        notes = ' | '.join(filter(None, [
            f"Entreprise: {m['company']}" if m['company'] else None,
            f"ESF: {m['ski_school']}" if m['ski_school'] else None,
            'Source: inscriptions FLI',
        ]))
        vals.append(f"({esc(m['first_name'])}, {esc(m['last_name'])}, {esc(m['email'])}, {esc(m['phone'])}, {esc(m['home_station'])}, 'active', {esc(notes)})")
    sql = """INSERT INTO ski_monitors (first_name, last_name, email, phone, home_station, status, notes) VALUES\n""" + ",\n".join(vals) + """
ON CONFLICT (email) DO UPDATE SET
  phone = COALESCE(EXCLUDED.phone, ski_monitors.phone),
  home_station = COALESCE(EXCLUDED.home_station, ski_monitors.home_station),
  notes = EXCLUDED.notes;"""
    p = OUT_DIR / f"04_monitors_{i//100+1:03d}.sql"
    p.write_text(sql, encoding='utf-8')
    batch_files.append(p)

manifest = {
    'inscriptions': len(parsed),
    'students': len(students),
    'schools': len(schools),
    'monitors': len(monitors),
    'batch_files': [str(p) for p in batch_files],
}
(OUT_DIR / 'manifest.json').write_text(json.dumps(manifest, indent=2))
print(json.dumps(manifest, indent=2))
