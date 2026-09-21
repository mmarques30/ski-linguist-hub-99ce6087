import { describe, expect, it } from "vitest";
import {
  formatOpcoQuestionnaireSummary,
  OPCO_REGISTER_COPY,
  parseFundingDetails,
  serializeFundingDetails,
  validateOpcoQuestionnaire,
} from "./opco-funding";

describe("opco-funding", () => {
  it("valide le questionnaire OPCO", () => {
    expect(
      validateOpcoQuestionnaire({
        knowsOpco: null,
        opcoName: "",
        nafCode: "",
        caseNotes: "",
      })
    ).toMatch(/connaissez/i);

    expect(
      validateOpcoQuestionnaire({
        knowsOpco: true,
        opcoName: "",
        nafCode: "",
        caseNotes: "",
      })
    ).toMatch(/OPCO/);

    expect(
      validateOpcoQuestionnaire({
        knowsOpco: false,
        opcoName: "",
        nafCode: "",
        caseNotes: "",
      })
    ).toMatch(/NAF/);

    expect(
      validateOpcoQuestionnaire({
        knowsOpco: true,
        opcoName: "AKTO",
        nafCode: "",
        caseNotes: "ok",
      })
    ).toBeNull();
  });

  it("sérialise et parse funding_details", () => {
    const raw = serializeFundingDetails({
      version: 1,
      source: "register",
      opco: {
        knowsOpco: false,
        opcoName: "",
        nafCode: "8551Z",
        caseNotes: "Moniteur indépendant",
      },
    });
    const parsed = parseFundingDetails(raw);
    expect(parsed?.opco?.nafCode).toBe("8551Z");
    expect(parsed?.source).toBe("register");
  });

  it("résume le questionnaire pour observations", () => {
    const summary = formatOpcoQuestionnaireSummary({
      knowsOpco: true,
      opcoName: "Uniformation",
      nafCode: "",
      caseNotes: "Dossier en cours",
    });
    expect(summary).toContain("Uniformation");
    expect(summary).toContain("Dossier en cours");
    expect(summary).toContain("aucun frais");
  });

  it("expose les textes publics validés", () => {
    expect(OPCO_REGISTER_COPY.fundingChoiceHelp).toContain("étudié par FLI");
    expect(OPCO_REGISTER_COPY.paymentAlert).toContain("Aucun frais pour le moment");
    expect(OPCO_REGISTER_COPY.confirmationAlert).toContain("modalités du contrat");
  });
});
