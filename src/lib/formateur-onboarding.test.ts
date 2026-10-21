import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FORMATEUR_ONBOARDING_APP_LINKS,
  FORMATEUR_ONBOARDING_INTRO,
  FORMATEUR_ONBOARDING_PAGE,
  FORMATEUR_ONBOARDING_SECTIONS,
  FORMATEUR_ONBOARDING_TITLE,
} from "./formateur-onboarding";

function source(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("formateur onboarding", () => {
  it("expose un guide structuré (FLI, fonctionnement, cours, appli, contact)", () => {
    expect(FORMATEUR_ONBOARDING_TITLE).toMatch(/FLI/i);
    expect(FORMATEUR_ONBOARDING_INTRO.length).toBeGreaterThan(40);
    expect(FORMATEUR_ONBOARDING_PAGE).toBe("onboarding");
    const ids = FORMATEUR_ONBOARDING_SECTIONS.map((s) => s.id);
    expect(ids).toEqual([
      "qui-est-fli",
      "fonctionnement",
      "cours",
      "appli",
      "contact",
    ]);
    expect(FORMATEUR_ONBOARDING_APP_LINKS.length).toBeGreaterThanOrEqual(5);
  });

  it("route, layout et page sont branchés (propre + Assister)", () => {
    const app = source("src/App.tsx");
    expect(app).toContain('path="/formateur/onboarding"');
    expect(app).toContain('path="onboarding"');
    expect(app).toContain("FormateurOnboarding");

    const layout = source("src/components/layout/FormateurLayout.tsx");
    expect(layout).toContain("onboarding");
    expect(layout).toContain("Guide FLI");

    expect(source("src/pages/formateur/FormateurOnboarding.tsx")).toContain(
      "FORMATEUR_ONBOARDING_SECTIONS"
    );
    expect(source("src/lib/client-links.ts")).toContain('"onboarding"');
  });
});
