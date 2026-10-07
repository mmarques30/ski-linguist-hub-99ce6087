import { describe, expect, it } from "vitest";
import {
  parseEvaluationResultsCcSettings,
  resolveEvaluationResultsRecipients,
} from "./evaluation-results-recipients";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PARTNER_ID = "b475774d-e0c4-4651-9f7f-0be03c560de8";

describe("resolveEvaluationResultsRecipients", () => {
  const settings = {
    [PARTNER_ID]: {
      emails: ["contact@esf-courchevel.com", "direction@esf-courchevel.com"],
      label: "Stéphanie Sarratea + Lucas Dyen — ESF Courchevel 1550",
    },
  };
  const partner = {
    id: PARTNER_ID,
    contact_email: "direction@esf-courchevel.com",
  };

  it("met la secrétaire en CC quand le TO est la direction", () => {
    expect(
      resolveEvaluationResultsRecipients({ partner, settings })
    ).toEqual({
      to: "direction@esf-courchevel.com",
      cc: ["contact@esf-courchevel.com"],
    });
  });

  it("met Lucas en CC quand le TO est la secrétaire", () => {
    expect(
      resolveEvaluationResultsRecipients({
        partner,
        settings,
        toOverride: "contact@esf-courchevel.com",
      })
    ).toEqual({
      to: "contact@esf-courchevel.com",
      cc: ["direction@esf-courchevel.com"],
    });
  });

  it("accepte le CC du répertoire écoles", () => {
    expect(
      resolveEvaluationResultsRecipients({
        partner: { contact_email: "direction@esf-courchevel.com" },
        directoryCc: "contact@esf-courchevel.com",
      })
    ).toEqual({
      to: "direction@esf-courchevel.com",
      cc: ["contact@esf-courchevel.com"],
    });
  });
});

describe("parseEvaluationResultsCcSettings", () => {
  it("lit le JSON Courchevel 1550", () => {
    const parsed = parseEvaluationResultsCcSettings({
      [PARTNER_ID]: {
        emails: ["contact@esf-courchevel.com"],
        label: "Stéphanie Sarratea",
      },
    });
    expect(parsed[PARTNER_ID]?.emails).toEqual(["contact@esf-courchevel.com"]);
  });
});

describe("sendFliEmail CC (source Deno)", () => {
  const edge = readFileSync(
    join(process.cwd(), "supabase/functions/_shared/fli-email.ts"),
    "utf8"
  );

  it("expose normalizeFliEmailCc et pose body.cc", () => {
    expect(edge).toContain("export function normalizeFliEmailCc");
    expect(edge).toContain("body.cc = ccList");
    expect(edge).toContain("cc?: string[]");
  });
});
