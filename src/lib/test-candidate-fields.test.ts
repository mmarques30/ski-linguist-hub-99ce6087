import { describe, expect, it } from "vitest";
import {
  formatSkiDisciplineLabel,
  skiFieldsMissing,
} from "./test-candidate-fields";

describe("champs ski du candidat", () => {
  it("exige discipline et cycle seulement pour un moniteur", () => {
    expect(skiFieldsMissing("pisteur", null, null)).toBe(false);
    expect(skiFieldsMissing("moniteur", null, null)).toBe(true);
    expect(skiFieldsMissing("moniteur", "alpin", "")).toBe(true);
    expect(skiFieldsMissing("moniteur", "alpin", "Cycle 2")).toBe(false);
    expect(skiFieldsMissing("moniteur", "telemark", "Cycle 2")).toBe(true);
  });

  it("affiche Alpin / Nordique", () => {
    expect(formatSkiDisciplineLabel("alpin")).toBe("Alpin");
    expect(formatSkiDisciplineLabel("nordique")).toBe("Nordique");
  });
});
