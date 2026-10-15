import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Lovable joint tout `_shared` à chaque fonction. Limite d'envoi ≈ 4,5 Mo. */
const SHARED_LIMIT_BYTES = 3_000_000;

function directoryBytes(dir: string): number {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) total += directoryBytes(path);
    else if (entry.isFile()) total += statSync(path).size;
  }
  return total;
}

describe("poids de supabase/functions/_shared", () => {
  it("reste sous la limite d'envoi Lovable", () => {
    const shared = join(process.cwd(), "supabase/functions/_shared");
    const bytes = directoryBytes(shared);
    expect(bytes).toBeLessThan(SHARED_LIMIT_BYTES);
  });

  it("garde les binaires lourds hors de _shared", () => {
    const shared = join(process.cwd(), "supabase/functions/_shared");
    const names = readdirSync(shared);
    expect(names).not.toContain("registration-documents");
    expect(names).not.toContain("evaluation-pdf-assets");
  });
});
