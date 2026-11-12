import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REGISTRATION_LANGUAGE_MAP } from "./registration-utils";
import { PORTUGUESE_LABEL } from "./language-catalog";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("REGISTRATION_LANGUAGE_MAP", () => {
  it("canonise le portugais en Portugais brésilien", () => {
    expect(REGISTRATION_LANGUAGE_MAP.portuguese).toBe(PORTUGUESE_LABEL);
  });

  it("garde la copie Deno submit-registration d'accord avec le module front", () => {
    const edge = source("supabase/functions/submit-registration/index.ts");
    for (const [key, label] of Object.entries(REGISTRATION_LANGUAGE_MAP)) {
      expect(edge).toContain(`${key}: "${label}"`);
    }
  });
});
