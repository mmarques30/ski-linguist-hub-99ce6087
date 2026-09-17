import { describe, expect, it } from "vitest";
import {
  displayLanguageLabel,
  isPortugueseLanguage,
  languagesInclude,
  normalizeInstructorLanguage,
  PORTUGUESE_LABEL,
  PORTUGUESE_LABEL_LOWER,
} from "./taught-languages";

describe("taught-languages", () => {
  it("détecte toutes les variantes de portugais", () => {
    expect(isPortugueseLanguage("Portugais")).toBe(true);
    expect(isPortugueseLanguage("portugais brésilien")).toBe(true);
    expect(isPortugueseLanguage("portuguese")).toBe(true);
    expect(isPortugueseLanguage("anglais")).toBe(false);
  });

  it("affiche toujours Portugais brésilien", () => {
    expect(displayLanguageLabel("Portugais")).toBe(PORTUGUESE_LABEL);
    expect(displayLanguageLabel("portugais")).toBe(PORTUGUESE_LABEL);
    expect(displayLanguageLabel("anglais")).toBe("anglais");
  });

  it("normalise le stockage formateur en minuscules", () => {
    expect(normalizeInstructorLanguage("Portugais")).toBe(PORTUGUESE_LABEL_LOWER);
    expect(normalizeInstructorLanguage("Anglais")).toBe("anglais");
  });

  it("reconnaît portugais dans un filtre langues", () => {
    expect(languagesInclude(["portugais brésilien", "anglais"], "Portugais")).toBe(true);
    expect(languagesInclude(["portugais brésilien"], "portugais brésilien")).toBe(true);
    expect(languagesInclude(["anglais"], "Portugais")).toBe(false);
  });
});
