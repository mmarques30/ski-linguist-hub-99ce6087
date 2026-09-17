import { describe, it, expect } from "vitest";
import {
  canPublish,
  checkVariables,
  EMAIL_PREVIEW_SAMPLE,
  modelStatus,
  needsReview,
  parseEmailModelsOverview,
  renderPreview,
  variablesUsedIn,
  type EmailModel,
  type EmailModelVariant,
} from "./email-models";

function variant(overrides: Partial<EmailModelVariant> = {}): EmailModelVariant {
  return {
    slug: "invoice_reminder_1",
    position: 1,
    variant_label: "Premier rappel (J+7)",
    subject_fr: "Rappel — facture {{invoice_number}} échue",
    subject_en: "",
    subject_pt: "",
    body_fr: "<p>Bonjour {{client_name}}, montant {{amount}} échu le {{due_date}}.</p>",
    body_en: "",
    body_pt: "",
    variables: ["client_name", "invoice_number", "amount", "due_date", "days_overdue"],
    notes: null,
    draft_updated_at: null,
    is_active: false,
    validated_at: null,
    live_subject_fr: null,
    live_body_fr: null,
    in_sync: false,
    ...overrides,
  };
}

function model(overrides: Partial<EmailModel> = {}): EmailModel {
  return {
    model_key: "invoice_reminder",
    position: 5,
    title_fr: "Relance de paiement",
    trigger_fr: "Relance quotidienne des factures échues.",
    audience: "client",
    edge_function: "process-invoice-reminders",
    cron_jobname: "process-invoice-reminders",
    cron: { exists: true, active: false, schedule: "0 9 * * *" },
    variants: [variant()],
    ...overrides,
  };
}

describe("parseEmailModelsOverview", () => {
  it("trie les modèles et leurs variantes", () => {
    const parsed = parseEmailModelsOverview([
      {
        model_key: "invoice_reminder",
        position: 5,
        title_fr: "Relance de paiement",
        trigger_fr: "Factures échues",
        audience: "client",
        edge_function: "process-invoice-reminders",
        cron_jobname: "process-invoice-reminders",
        cron: { exists: true, active: false, schedule: "0 9 * * *" },
        variants: [
          { slug: "invoice_reminder_3", position: 3, variables: ["amount"] },
          { slug: "invoice_reminder_1", position: 1, variables: ["amount"] },
        ],
      },
      {
        model_key: "inscription_confirmation",
        position: 1,
        title_fr: "Confirmation d'inscription",
        trigger_fr: "/register",
        audience: "candidat",
        edge_function: "submit-registration",
        cron_jobname: null,
        cron: null,
        variants: [],
      },
    ]);

    expect(parsed.map((m) => m.model_key)).toEqual([
      "inscription_confirmation",
      "invoice_reminder",
    ]);
    expect(parsed[1].variants.map((v) => v.slug)).toEqual([
      "invoice_reminder_1",
      "invoice_reminder_3",
    ]);
    expect(parsed[1].cron?.active).toBe(false);
    expect(parsed[0].cron).toBeNull();
  });

  it("tolère une charge vide ou mal formée", () => {
    expect(parseEmailModelsOverview(null)).toEqual([]);
    expect(parseEmailModelsOverview([{ position: 1 }])).toEqual([]);
  });
});

describe("variablesUsedIn", () => {
  it("relève chaque variable une seule fois, sujet et corps confondus", () => {
    expect(
      variablesUsedIn("Facture {{invoice_number}}", "<p>{{client_name}} — {{invoice_number}}</p>"),
    ).toEqual(["invoice_number", "client_name"]);
  });

  it("ignore les accolades sans variable", () => {
    expect(variablesUsedIn("style={{ margin: 0 }}")).toEqual([]);
  });
});

describe("checkVariables", () => {
  it("signale une variable déclarée mais jamais utilisée", () => {
    expect(checkVariables(variant()).unused).toEqual(["days_overdue"]);
  });

  it("signale une variable utilisée mais non déclarée", () => {
    const check = checkVariables(
      variant({ body_fr: "<p>Bonjour {{client_name}} {{iban}}</p>" }),
    );
    expect(check.undeclared).toEqual(["iban"]);
  });

  it("ignore le contenu EN/PT résiduel", () => {
    const check = checkVariables(
      variant({
        body_en: "<p>Hello {{orphan_en}}</p>",
        body_pt: "<p>Olá {{orphan_pt}}</p>",
      }),
    );
    expect(check.undeclared).toEqual([]);
    expect(check.unused).toEqual(["days_overdue"]);
  });
});

describe("modelStatus", () => {
  it("brouillon quand aucune variante n'est active", () => {
    expect(modelStatus(model())).toBe("brouillon");
  });

  it("partiel quand seule une partie des variantes est active", () => {
    expect(
      modelStatus(
        model({
          variants: [
            variant({ slug: "invoice_reminder_1", is_active: true }),
            variant({ slug: "invoice_reminder_2", position: 2 }),
          ],
        }),
      ),
    ).toBe("partiel");
  });

  it("actif quand toutes les variantes sont actives", () => {
    expect(
      modelStatus(model({ variants: [variant({ is_active: true })] })),
    ).toBe("actif");
  });
});

describe("needsReview", () => {
  it("vrai dès qu'un brouillon diffère du texte actif", () => {
    expect(needsReview(model())).toBe(true);
    expect(
      needsReview(model({ variants: [variant({ in_sync: true, is_active: true })] })),
    ).toBe(false);
  });
});

describe("canPublish", () => {
  it("refuse un brouillon sans texte français", () => {
    expect(canPublish(variant({ subject_fr: "  " }))).toBe(false);
    expect(canPublish(variant({ body_fr: "" }))).toBe(false);
    expect(canPublish(variant())).toBe(true);
  });
});

describe("renderPreview", () => {
  it("remplace les variables connues par le jeu ZZTEST", () => {
    expect(renderPreview("Facture {{invoice_number}} — {{amount}}")).toBe(
      `Facture ${EMAIL_PREVIEW_SAMPLE.invoice_number} — ${EMAIL_PREVIEW_SAMPLE.amount}`,
    );
  });

  it("laisse visible une variable inconnue au lieu de vider le texte", () => {
    expect(renderPreview("Solde {{iban}}")).toBe("Solde {{iban}}");
  });

  it("n'utilise que des adresses non délivrables dans le jeu d'essai", () => {
    const urls = Object.values(EMAIL_PREVIEW_SAMPLE).filter((v) => v.startsWith("http"));
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).toContain("exemple.invalid");
    }
  });
});
