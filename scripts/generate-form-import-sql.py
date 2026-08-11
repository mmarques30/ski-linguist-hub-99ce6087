#!/usr/bin/env python3
"""Generate SQL to import Google Form responses as placement_tests + enrich inscriptions."""
import csv, re, json
from pathlib import Path

# Import parser logic inline (mirror TS)
FORM_PATH = Path("/home/ubuntu/.cursor/projects/workspace/uploads/Inscription_FLI___re_ponses__-_Re_ponses_au_formulaire_1_04e7.csv")
OUT_DIR = Path("/opt/cursor/artifacts/form-import-batches")
OUT_DIR.mkdir(parents=True, exist_ok=True)

META = {
    "Horodateur","Score","Nom","Civilité","Adresse postale","Code postal","Ville",
    "Numéro de portable","Adresse mail","Profession","Modalité de financement de la formation",
    "Connaissez-vous votre niveau d'anglais selon le Baréme Européan? Si oui, merci de nous indiquer:",
    "Est ce que vous utilisez l'anglais dans votre quotidien professionnel?",
    "Merci de vous présenter en Anglais, à l'écrit.", "École de ski", "Modalité de formation",
    "Langue et stage", "Durée de la formation",
    "En quelques mots, quelles sont vos attentes pour la formation? ",
    "Comment aimerez vous régler vos frais d'inscription ?",
    "Quelles sont vos attenttes pour cette formation ?",
    "Quelle certification souhaitez-vous ?",
    "Quelle formule de cours envisagez-vous ?",
    "Êtes-vous en situation de handicap et souhaitez-vous être contacté·e par notre référent handicap pour étudier d'éventuelles adaptations ?",
    "Adresse e-mail","Prénom","Date de naissance","Protection de vos données personnelles",
    "Name","Email","Approver signature 1","150€","Colonne 122",
}

STATIONS = [
    "courchevel","samoens","samoëns","aime","morzine","chatel","valmorel","menuires",
    "la rosiere","oz en oisans","val disere","val d isere","clusaz","grand bornand",
    "les gets","vaujany","pralognan","tignes","val thorens","meribel","avoriaz",
    "bourg d oisans","saint gervais","val cenis","les arcs","la plagne","morillon",
    "montvalezan","la norma","saint sorlin","saint jean de maurienne","les avanchers",
    "la lechere","les belleville","brides les bains","les deux alpes","auris",
]

def esc(s):
    if s is None: return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

def esc_json(obj):
    return "'" + json.dumps(obj, ensure_ascii=False).replace("'", "''") + "'::jsonb"

def is_empty(v):
    return not v or v.strip() in ('-', 'N/A', '')

def norm_name(s):
    s = re.sub(r'[^a-z0-9 ]', '', (s or '').lower())
    return ' '.join(s.split())

def norm_phone(s):
    d = re.sub(r'\D', '', s or '')
    return d[-9:] if len(d) >= 9 else None

def get_email(row):
    for k in ['Adresse mail','Adresse e-mail','Email']:
        v = (row.get(k) or '').strip().lower()
        if v and '@' in v: return v
    return None

def get_first(row, prefix):
    for k,v in row.items():
        if k.lower().startswith(prefix.lower()) and not is_empty(v):
            return v.strip()
    return ''

def parse_score(s):
    m = re.match(r'^(\d+)\s*/\s*(\d+)$', (s or '').strip())
    if m: return int(m.group(1)), int(m.group(2)), f"{m.group(1)} / {m.group(2)}"
    return None, None, (s.strip() if s and s.strip() else None)

def parse_ts(s):
    m = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$', (s or '').strip())
    if not m: return None
    d,mo,y,hh,mm,ss = m.groups()
    return f"{y}-{mo.zfill(2)}-{d.zfill(2)}T{hh.zfill(2)}:{mm}:{ss}"

def map_lang(v):
    m = {
        'anglais':'Anglais','portugais brésilien':'Portugais','portugais bresilien':'Portugais',
        'néerlandais':'Néerlandais','neerlandais':'Néerlandais','russe':'Russe','français':'Français',
    }
    return m.get((v or '').strip().lower(), (v or 'Anglais').strip())

def detect_lang(answers):
    keys = ' '.join(answers.keys()).lower()
    if 'my brother' in keys: return 'Anglais'
    if 'minha irmã' in keys or 'calcanhar' in keys: return 'Portugais'
    if 'mijn broer' in keys: return 'Néerlandais'
    if 'comment t' in keys: return 'Français'
    if 'лыж' in keys: return 'Russe'
    return None

def location_key(loc):
    if is_empty(loc): return None
    n = re.sub(r'[^a-z0-9 ]',' ', loc.lower())
    n = ' '.join(n.split())
    found = next((s for s in STATIONS if s.replace(' ','') in n.replace(' ','') or s in n), None)
    year = re.search(r'\b(20\d{2})\b', n)
    month = re.search(r'\b(0?[1-9]|1[0-2])\b', n)
    parts = [found or ' '.join(n.split()[:3]), year.group(1) if year else None, month.group(1) if month else None]
    return '|'.join(p for p in parts if p)

def extract_answers(row):
    out = {}
    for k,v in row.items():
        if k in META: continue
        if k.startswith(('Certification','Langue souhaitée','Lieu et date','Si vous avez déjà')): continue
        if not is_empty(v): out[k] = v
    return out

def row_quality(r):
    q = 0
    if r['email']: q += 100
    if r['score_correct'] is not None: q += 50
    q += len(r['answers'])
    if r['location']: q += 10
    if r['submitted_at']: q += 5
    return q

with open(FORM_PATH, encoding='utf-8', errors='replace') as f:
    raw = list(csv.DictReader(f))

parsed = []
for row in raw:
    name = (row.get('Nom') or '').strip()
    if not name: continue
    answers = extract_answers(row)
    explicit = get_first(row, 'Langue souhaitée')
    lang = map_lang(explicit or detect_lang(answers) or 'Anglais')
    sc, st, sd = parse_score(row.get('Score',''))
    loc = get_first(row, 'Lieu et date de formation') or None
    prev = get_first(row, 'Si vous avez déjà été évalué') or None
    self_lvl = row.get("Connaissez-vous votre niveau d'anglais selon le Baréme Européan? Si oui, merci de nous indiquer:") or None
    if is_empty(self_lvl): self_lvl = None
    expectations = '\n'.join(filter(None, [
        row.get("En quelques mots, quelles sont vos attentes pour la formation? ", '').strip(),
        row.get('Quelles sont vos attenttes pour cette formation ?', '').strip(),
    ])) or None
    parsed.append({
        'name': name,
        'email': get_email(row),
        'phone': norm_phone(row.get('Numéro de portable','')),
        'name_key': norm_name(name),
        'submitted_at': parse_ts(row.get('Horodateur','')),
        'score_correct': sc, 'score_total': st, 'score_display': sd,
        'language': lang,
        'location': loc,
        'location_key': location_key(loc or ''),
        'previous_evaluation': prev,
        'self_assessed_level': self_lvl,
        'expectations': expectations,
        'answers': answers,
        'profession': row.get('Profession') or None,
        'funding': row.get('Modalité de financement de la formation') or None,
        'english_intro': row.get("Merci de vous présenter en Anglais, à l'écrit.") or None,
        'payment': row.get("Comment aimerez vous régler vos frais d'inscription ?") or None,
        'handicap': row.get("Êtes-vous en situation de handicap et souhaitez-vous être contacté·e par notre référent handicap pour étudiser d'éventuelles adaptations ?") or None,
    })

# dedupe
best = {}
for r in parsed:
    person = r['email'] or f"{r['name_key']}|{r['phone'] or ''}"
    key = f"{person}|{r['language'].lower()}|{r['location_key'] or 'any'}"
    if key not in best or row_quality(r) > row_quality(best[key]):
        best[key] = r
    elif key in best and row_quality(r) == row_quality(best[key]):
        if (r['submitted_at'] or '') > (best[key]['submitted_at'] or ''):
            best[key] = r

rows = list(best.values())
print(f"parsed {len(parsed)} -> deduped {len(rows)}")

# Generate SQL using temp matching tables built from students/inscriptions
parts = []
parts.append("""
CREATE TEMP TABLE IF NOT EXISTS _form_import_rows (
  idx serial,
  email text,
  name_key text,
  phone_key text,
  language text,
  location_key text,
  submitted_at timestamptz,
  score_correct int,
  score_total int,
  score_display text,
  determined_level text,
  expectations text,
  answers jsonb
) ON COMMIT DROP;
TRUNCATE _form_import_rows;
""")

vals = []
for r in rows:
    det = r['previous_evaluation'] or r['self_assessed_level']
    answers = {
        'source': 'google_form_legacy_v1',
        'submitted_at': r['submitted_at'],
        'score_display': r['score_display'],
        'profession': r['profession'],
        'funding_type': r['funding'],
        'english_intro': r['english_intro'],
        'course_location': r['location'],
        'payment_preference': r['payment'],
        'handicap': r['handicap'],
        'responses': r['answers'],
    }
    vals.append(f"({esc(r['email'])}, {esc(r['name_key'])}, {esc(r['phone'])}, {esc(r['language'])}, {esc(r['location_key'])}, {esc(r['submitted_at'])}, {r['score_correct'] if r['score_correct'] is not None else 'NULL'}, {r['score_total'] if r['score_total'] is not None else 'NULL'}, {esc(r['score_display'])}, {esc(det)}, {esc(r['expectations'])}, {esc_json(answers)})")

# chunk inserts into temp table
chunk_size = 8
for i in range(0, len(vals), chunk_size):
    chunk = vals[i:i+chunk_size]
    parts.append("INSERT INTO _form_import_rows (email, name_key, phone_key, language, location_key, submitted_at, score_correct, score_total, score_display, determined_level, expectations, answers) VALUES\n" + ",\n".join(chunk) + ";")

# Match students and insert placement_tests + update inscriptions
parts.append("""
WITH matched AS (
  SELECT
    f.*,
    s.id AS student_id,
    COALESCE(
      (SELECT i.id FROM inscriptions i
       WHERE i.student_id = s.id
         AND lower(i.language) LIKE '%' || split_part(lower(f.language), ' ', 1) || '%'
       ORDER BY
         CASE WHEN f.location_key IS NOT NULL AND i.course_location IS NOT NULL
              AND lower(i.course_location) LIKE '%' || split_part(f.location_key, '|', 1) || '%'
              THEN 0 ELSE 1 END,
         abs(extract(year from i.start_date::date) - extract(year from coalesce(f.submitted_at, now())))
       LIMIT 1),
      (SELECT i.id FROM inscriptions i WHERE i.student_id = s.id ORDER BY i.start_date DESC LIMIT 1)
    ) AS inscription_id
  FROM _form_import_rows f
  JOIN students s ON (
    (f.email IS NOT NULL AND lower(s.email) = lower(f.email))
    OR (f.name_key IS NOT NULL AND lower(regexp_replace(s.first_name || ' ' || s.last_name, '[^a-z0-9 ]', '', 'gi')) = f.name_key)
    OR (f.phone_key IS NOT NULL AND right(regexp_replace(coalesce(s.phone,''), '\\D', '', 'g'), 9) = f.phone_key)
  )
),
inserted AS (
  INSERT INTO placement_tests (
    student_id, inscription_id, language, status, completed_at,
    correct_answers, total_questions, score_percentage, determined_level, answers
  )
  SELECT
    m.student_id,
    m.inscription_id,
    m.language,
    'completed',
    coalesce(m.submitted_at, now()),
    m.score_correct,
    m.score_total,
    CASE WHEN m.score_total > 0 THEN round((m.score_correct::numeric / m.score_total) * 100) ELSE NULL END,
    m.determined_level,
    m.answers
  FROM matched m
  WHERE NOT EXISTS (
    SELECT 1 FROM placement_tests pt
    WHERE pt.student_id = m.student_id
      AND coalesce(pt.inscription_id::text,'') = coalesce(m.inscription_id::text,'')
      AND lower(pt.language) = lower(m.language)
  )
  RETURNING id, student_id, inscription_id
)
UPDATE inscriptions i SET
  entry_test_score = coalesce(i.entry_test_score, f.score_display),
  entry_level = coalesce(i.entry_level, f.determined_level),
  expectations = coalesce(i.expectations, f.expectations),
  entry_test_id = coalesce(i.entry_test_id, ins.id)
FROM inserted ins
JOIN matched m ON m.student_id = ins.student_id AND m.inscription_id = ins.inscription_id
JOIN _form_import_rows f ON f.idx = m.idx
WHERE i.id = ins.inscription_id;
""")

sql = '\n'.join(parts)
# split into batches if too large
if len(sql) < 100000:
    p = OUT_DIR / '01_form_import.sql'
    p.write_text(sql, encoding='utf-8')
    print('wrote', p, len(sql))
else:
    # write temp inserts separately
    (OUT_DIR / '01_temp_rows.sql').write_text('\n'.join(parts[:-1]), encoding='utf-8')
    (OUT_DIR / '02_match_insert.sql').write_text(parts[-1], encoding='utf-8')

manifest = {'deduped_rows': len(rows), 'total_parsed': len(parsed)}
(OUT_DIR / 'manifest.json').write_text(json.dumps(manifest, indent=2))
print(json.dumps(manifest))
