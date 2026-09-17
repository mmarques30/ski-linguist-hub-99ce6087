import { describe, expect, it } from "vitest";
import { applyEmailTemplate } from "./email-template-apply";

describe("applyEmailTemplate", () => {
  it("substitue les variables {{…}}", () => {
    expect(
      applyEmailTemplate("Bonjour {{student_name}} — {{language}}", {
        student_name: "Camille",
        language: "Anglais",
      })
    ).toBe("Bonjour Camille — Anglais");
  });

  it("refuse un envoi si une variable reste", () => {
    expect(() =>
      applyEmailTemplate("Code {{inscription_code}} / {{missing}}", {
        inscription_code: "FLI-260001",
      })
    ).toThrow(/Variables manquantes.*\{\{missing\}\}/);
  });
});
