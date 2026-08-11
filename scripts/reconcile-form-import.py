#!/usr/bin/env python3
"""Report form responses that could not be matched to existing students."""
import argparse
import csv
import importlib.util
import json
import re
from pathlib import Path

DEFAULT_FORM = Path(
    "/home/ubuntu/.cursor/projects/workspace/uploads/"
    "Inscription_FLI___re_ponses__-_Re_ponses_au_formulaire_1_04e7.csv"
)


def load_gfi():
    spec = importlib.util.spec_from_file_location(
        "gfi", Path(__file__).resolve().parent / "generate-form-import-sql.py"
    )
    gfi = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gfi)
    return gfi


def norm_name(value: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", (value or "").lower()).strip()


def find_student(row: dict, students: list[dict], gfi) -> tuple[dict | None, str | None]:
    by_email = {s["email"].lower(): s for s in students if s.get("email")}
    by_phone: dict[str, list[dict]] = {}
    by_name: dict[str, list[dict]] = {}

    for student in students:
        phone = gfi.norm_phone(student.get("phone") or "")
        if phone:
            by_phone.setdefault(phone, []).append(student)
        for key in (
            norm_name(f"{student['first_name']} {student['last_name']}"),
            norm_name(f"{student['last_name']} {student['first_name']}"),
        ):
            by_name.setdefault(key, []).append(student)

    email = row.get("email")
    if email and email in by_email:
        return by_email[email], "email"

    name_key = row["name_key"]
    if name_key in by_name and len(by_name[name_key]) == 1:
        return by_name[name_key][0], "name"

    parts = name_key.split()
    if len(parts) >= 2:
        reversed_name = " ".join(reversed(parts))
        if reversed_name in by_name:
            matches = by_name[reversed_name]
            if len(matches) == 1:
                return matches[0], "name_rev"
            if row.get("phone"):
                for candidate in matches:
                    if gfi.norm_phone(candidate.get("phone") or "") == row["phone"]:
                        return candidate, "name_rev+phone"

    phone = row.get("phone")
    if phone and phone in by_phone and len(by_phone[phone]) == 1:
        return by_phone[phone][0], "phone"

    if email:
        fixed = email.replace("gamil.com", "gmail.com")
        if fixed in by_email:
            return by_email[fixed], "email_typo"

    return None, None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--form", type=Path, default=DEFAULT_FORM)
    parser.add_argument("--students-json", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=Path("/opt/cursor/artifacts/form-unmatched-report.json"))
    args = parser.parse_args()

    gfi = load_gfi()
    students = json.loads(args.students_json.read_text())["rows"]

    with args.form.open(encoding="utf-8", errors="replace") as handle:
        raw_rows = list(csv.DictReader(handle))

    parsed = []
    for row in raw_rows:
        name = (row.get("Nom") or "").strip()
        if not name:
            continue
        answers = gfi.extract_answers(row)
        language = gfi.map_lang(
            gfi.get_first(row, "Langue souhaitée") or gfi.detect_lang(answers) or "Anglais"
        )
        score_correct, score_total, score_display = gfi.parse_score(row.get("Score", ""))
        location = gfi.get_first(row, "Lieu et date de formation") or None
        parsed.append(
            {
                "name": name,
                "email": gfi.get_email(row),
                "phone": gfi.norm_phone(row.get("Numéro de portable", "")),
                "name_key": gfi.norm_name(name),
                "language": language,
                "location": location,
                "location_key": gfi.location_key(location or ""),
                "submitted_at": gfi.parse_ts(row.get("Horodateur", "")),
                "score_display": score_display,
            }
        )

    deduped: dict[str, dict] = {}
    for row in parsed:
        person = row["email"] or f"{row['name_key']}|{row['phone'] or ''}"
        key = f"{person}|{row['language'].lower()}|{row['location_key'] or 'any'}"
        if key not in deduped:
            deduped[key] = row

    unmatched_people: dict[tuple[str, str | None], dict] = {}
    matched = 0
    for row in deduped.values():
        student, _ = find_student(row, students, gfi)
        if student:
            matched += 1
            continue
        person_key = (row["name_key"], row.get("phone"))
        if person_key not in unmatched_people:
            unmatched_people[person_key] = row

    report = {
        "deduped_rows": len(deduped),
        "matched_rows": matched,
        "unmatched_people": sorted(unmatched_people.values(), key=lambda item: item["name"].lower()),
        "unmatched_people_count": len(unmatched_people),
    }
    args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
