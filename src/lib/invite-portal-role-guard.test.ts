import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("invite portal — ne pas écraser un rôle existant", () => {
  it("invite-formateur-portal refuse si le rôle n'est pas formateur", () => {
    const src = readFileSync(
      resolve(__dirname, "../../supabase/functions/invite-formateur-portal/index.ts"),
      "utf8"
    );
    expect(src).toContain('select("id, role")');
    expect(src).toContain('existingRole.role !== "formateur"');
    expect(src).not.toMatch(
      /\.update\(\s*\{\s*role:\s*"formateur"\s*\}\s*\)\.eq\("user_id"/
    );
  });

  it("invite-student-portal refuse si le rôle n'est pas student", () => {
    const src = readFileSync(
      resolve(__dirname, "../../supabase/functions/invite-student-portal/index.ts"),
      "utf8"
    );
    expect(src).toContain('select("id, role")');
    expect(src).toContain('existingRole.role !== "student"');
    expect(src).not.toMatch(
      /\.update\(\s*\{\s*role:\s*"student"\s*\}\s*\)\.eq\("user_id"/
    );
  });
});
