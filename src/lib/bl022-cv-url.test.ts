import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("BL-022 — CV formateur", () => {
  it("InstructorDetails expose cv_url et dépôt Storage", () => {
    const details = source("src/pages/formateurs/InstructorDetails.tsx");
    expect(details).toContain("buildInstructorCvPath");
    expect(details).toContain("INSTRUCTOR_CV_BUCKET");
    expect(details).toContain("Curriculum vitæ");
    expect(details).toContain("cv_url");
  });

  it("InstructorFormDialog édite cv_url", () => {
    const dialog = source("src/components/formateurs/InstructorFormDialog.tsx");
    expect(dialog).toContain("cv_url");
    expect(dialog).toContain("CV (lien ou chemin Storage)");
  });

  it("POINT_BL022 documente le cadrage", () => {
    const path = "docs/POINT_BL022_CV_URL.md";
    expect(existsSync(join(process.cwd(), path))).toBe(true);
    const doc = source(path);
    expect(doc).toContain("staff/instructors");
    expect(doc).toContain("CADRÉ");
    expect(doc).not.toMatch(/Georgios|Constandi|Weinreb/);
  });
});
