#!/usr/bin/env python3
"""Load next batch SQL payload for MCP execution."""
import json
import sys
from pathlib import Path

PROJECT = "34e71e1a-49f7-433e-bb36-fc4d26e86f8e"
RESULTS = Path("/tmp/fli_import_results.json")
PAYLOAD_DIR = Path("/tmp/fli_batch_payloads")
BATCH_DIR = Path("/opt/cursor/artifacts/fli-import-batches")
SKIP = {"01_ski_schools.sql", "02_students_001.sql", "02_students_007.sql"}


def load_results():
    if RESULTS.exists():
        return json.loads(RESULTS.read_text())
    return {"success": [], "failed": [], "skipped": ["01_ski_schools.sql"], "errors": {}, "pending": []}


def save_results(r):
    RESULTS.write_text(json.dumps(r, indent=2))


def pending_files():
    r = load_results()
    done = set(r["success"] + r["failed"] + r.get("skipped", []))
    files = sorted(f.name for f in BATCH_DIR.glob("*.sql") if f.name not in done and f.name not in SKIP)
    return files


def get_payload(filename):
    p = PAYLOAD_DIR / f"{filename}.json"
    if p.exists():
        return json.loads(p.read_text())
    sql = (BATCH_DIR / filename).read_text(encoding="utf-8")
    return {"project_id": PROJECT, "file": filename, "sql": sql}


def mark_ok(filename):
    r = load_results()
    if filename not in r["success"]:
        r["success"].append(filename)
    r["pending"] = [p for p in r.get("pending", []) if p != filename]
    save_results(r)
    return r


def mark_fail(filename, error):
    r = load_results()
    if filename not in r["failed"]:
        r["failed"].append(filename)
    r["errors"][filename] = error
    r["pending"] = [p for p in r.get("pending", []) if p != filename]
    save_results(r)
    return r


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "next"
    if cmd == "next":
        pending = pending_files()
        if not pending:
            print(json.dumps({"done": True, "results": load_results()}))
        else:
            f = pending[0]
            p = get_payload(f)
            p["file"] = f
            print(json.dumps(p, ensure_ascii=False))
    elif cmd == "list":
        print(json.dumps(pending_files(), indent=2))
    elif cmd == "mark-ok" and len(sys.argv) > 2:
        print(json.dumps(mark_ok(sys.argv[2]), indent=2))
    elif cmd == "mark-fail" and len(sys.argv) > 3:
        print(json.dumps(mark_fail(sys.argv[2], sys.argv[3]), indent=2))
    elif cmd == "status":
        print(json.dumps(load_results(), indent=2))
    else:
        print("Usage: next|list|mark-ok FILE|mark-fail FILE ERR|status")
