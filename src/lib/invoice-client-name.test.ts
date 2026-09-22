import { describe, expect, it } from "vitest";
import {
  clientNameFromInvoiceNotes,
  resolveInvoiceClientName,
} from "./invoice-client-name";

describe("clientNameFromInvoiceNotes", () => {
  it("extrait le nom avant le tiret cadratin", () => {
    expect(
      clientNameFromInvoiceNotes(
        "Favre Manon — Stage d'anglais à Châtel\n---\nImport historique point 9 — exercice ≥ 25-26 : à vérifier (BL-007)."
      )
    ).toBe("Favre Manon");
  });

  it("gère les notes sans bandeau d'import", () => {
    expect(clientNameFromInvoiceNotes("Charlotte HANCY — test d'anglais")).toBe(
      "Charlotte HANCY"
    );
  });

  it("gère une école + candidat dans la désignation", () => {
    expect(
      clientNameFromInvoiceNotes(
        "ESF CONTAMINES (LES) — test d'anglais pour Théo Leunis\n---\nImport historique"
      )
    ).toBe("ESF CONTAMINES (LES)");
  });

  it("retourne null si notes vides ou techniques", () => {
    expect(clientNameFromInvoiceNotes(null)).toBeNull();
    expect(clientNameFromInvoiceNotes("")).toBeNull();
    expect(clientNameFromInvoiceNotes("---\nImport historique point 9")).toBeNull();
  });
});

describe("resolveInvoiceClientName", () => {
  it("préfère le stagiaire lié", () => {
    expect(
      resolveInvoiceClientName({
        notes: "Autre Nom — formation",
        inscription: { student_name: "Favre Manon" },
      })
    ).toBe("Favre Manon");
  });

  it("retombe sur les notes sans inscription", () => {
    expect(
      resolveInvoiceClientName({
        notes: "Pietri Maëlys — test d'anglais",
        inscription: undefined,
      })
    ).toBe("Pietri Maëlys");
  });

  it("affiche un tiret si aucune source", () => {
    expect(resolveInvoiceClientName({ notes: null })).toBe("-");
  });
});
