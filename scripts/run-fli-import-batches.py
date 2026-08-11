#!/usr/bin/env python3
"""Print SQL batch files for MCP import execution."""
import json
from pathlib import Path

BATCH_DIR = Path("/opt/cursor/artifacts/fli-import-batches")
PROJECT_ID = "34e71e1a-49f7-433e-bb36-fc4d26e86f8e"

files = sorted(BATCH_DIR.glob("*.sql"))
manifest = []
for p in files:
    manifest.append({
        "file": p.name,
        "size": p.stat().st_size,
        "sql": p.read_text(encoding="utf-8"),
    })

print(json.dumps({"project_id": PROJECT_ID, "batches": manifest}, ensure_ascii=False))
