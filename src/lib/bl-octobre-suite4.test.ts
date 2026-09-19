import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { adaptiveBankSizeForLabel } from "@/hooks/usePlacementTestStats";
import { getPlacementQuestions } from "@/lib/placement-questions-data";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("BL-030 — en-tête register selon profession", () => {
  it("Index.tsx adapte le titre si profession = other", () => {
    const page = source("src/pages/register/Index.tsx");
    expect(page).toContain('profession === "other"');
    expect(page).toContain("Formation linguistique");
    expect(page).toContain("Formation linguistique pour moniteurs de ski");
  });
});

describe("BL-050 — banque chinoise au même format", () => {
  it("chinois a la même taille de banque que anglais", () => {
    expect(getPlacementQuestions("chinese").length).toBe(
      getPlacementQuestions("english").length
    );
    expect(getPlacementQuestions("chinese").length).toBe(25);
    expect(adaptiveBankSizeForLabel("Chinois")).toBe(25);
    expect(adaptiveBankSizeForLabel("Anglais")).toBe(25);
  });

  it("usePlacementTestStats lit la banque JSON, pas MAX(total_questions)", () => {
    const hook = source("src/hooks/usePlacementTestStats.ts");
    expect(hook).toContain("adaptiveBankSizeForLabel");
    expect(hook).toContain("getPlacementQuestions");
    expect(hook).not.toMatch(/total_questions.*totalQuestions/);
  });
});
