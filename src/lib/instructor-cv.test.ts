import { describe, expect, it } from "vitest";
import {
  INSTRUCTOR_CV_BUCKET,
  INSTRUCTOR_CV_STORAGE_PREFIX,
  buildInstructorCvPath,
  instructorCvOpenLabel,
  isExternalCvUrl,
  isGoogleDriveCvUrl,
} from "./instructor-cv";

describe("instructor-cv", () => {
  it("construit le chemin staff/instructors/<id>/cv.pdf", () => {
    expect(buildInstructorCvPath("abc-123")).toBe(
      `${INSTRUCTOR_CV_STORAGE_PREFIX}/abc-123/cv.pdf`,
    );
    expect(INSTRUCTOR_CV_BUCKET).toBe("documents");
  });

  it("refuse un instructorId vide", () => {
    expect(() => buildInstructorCvPath("  ")).toThrow(/instructorId/);
  });

  it("détecte Drive et les URL externes", () => {
    const drive = "https://drive.google.com/open?id=1AbC";
    expect(isGoogleDriveCvUrl(drive)).toBe(true);
    expect(isExternalCvUrl(drive)).toBe(true);
    expect(isExternalCvUrl("staff/instructors/x/cv.pdf")).toBe(false);
    expect(isGoogleDriveCvUrl("staff/instructors/x/cv.pdf")).toBe(false);
  });

  it("libellé d’ouverture selon le type de lien", () => {
    expect(instructorCvOpenLabel(null)).toBe("Aucun CV");
    expect(instructorCvOpenLabel("https://drive.google.com/open?id=1")).toContain(
      "Google Drive",
    );
    expect(instructorCvOpenLabel("https://example.com/cv.pdf")).toBe("Ouvrir le CV");
    expect(instructorCvOpenLabel("staff/instructors/x/cv.pdf")).toBe("Télécharger le CV");
  });
});
