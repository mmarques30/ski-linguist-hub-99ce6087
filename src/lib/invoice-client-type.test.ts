import { describe, expect, it } from "vitest";
import {
  applyDsfFormationClientType,
  isDsfFormationClient,
} from "./invoice-client-type";

describe("isDsfFormationClient", () => {
  it("reconnaît DSF Formation", () => {
    expect(isDsfFormationClient("DSF Formation")).toBe(true);
    expect(isDsfFormationClient("dsf formation")).toBe(true);
    expect(isDsfFormationClient("DSF Formation — tests")).toBe(true);
  });

  it("ignore les autres clients", () => {
    expect(isDsfFormationClient("Favre Manon")).toBe(false);
    expect(isDsfFormationClient("ESF CONTAMINES (LES)")).toBe(false);
    expect(isDsfFormationClient(null)).toBe(false);
  });
});

describe("applyDsfFormationClientType", () => {
  it("force dsf même si le paiement classait stagiaire", () => {
    expect(applyDsfFormationClientType("stagiaire", "DSF Formation")).toBe("dsf");
    expect(
      applyDsfFormationClientType(
        "stagiaire",
        null,
        "DSF Formation — Encadrement d'une formation\n---\nImport"
      )
    ).toBe("dsf");
  });

  it("conserve ecole_ski / stagiaire sinon", () => {
    expect(applyDsfFormationClientType("ecole_ski", "ESF VAL")).toBe("ecole_ski");
    expect(applyDsfFormationClientType("stagiaire", "Favre Manon")).toBe(
      "stagiaire"
    );
  });
});
