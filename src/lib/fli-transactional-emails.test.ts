import { describe, expect, it } from "vitest";
import {
  CONFIRMATION_BODY_FR,
  CONFIRMATION_SUBJECT_FR,
  INVITE_BODY_FR,
  INVITE_SUBJECT_FR,
  J10_SUBJECT_PT,
  textePorteCoordonneesFli,
  texteVouvoie,
} from "./fli-transactional-emails";

describe("modèles 8-minimal", () => {
  it("vouvoie et n'emploie pas tu/ton/ta/tes", () => {
    expect(texteVouvoie(CONFIRMATION_BODY_FR)).toBe(true);
    expect(texteVouvoie(INVITE_BODY_FR)).toBe(true);
    expect(CONFIRMATION_BODY_FR).toMatch(/vous/);
    expect(INVITE_BODY_FR).toMatch(/vous|Votre/);
  });

  it("porte le point médian formateur·rice dans la confirmation", () => {
    expect(CONFIRMATION_BODY_FR).toContain("formateur·rice");
  });

  it("porte les coordonnées FLI", () => {
    expect(textePorteCoordonneesFli(CONFIRMATION_BODY_FR)).toBe(true);
    expect(textePorteCoordonneesFli(INVITE_BODY_FR)).toBe(true);
  });

  it("sujets en français, sans tutoiement", () => {
    expect(CONFIRMATION_SUBJECT_FR).toContain("votre inscription");
    expect(INVITE_SUBJECT_FR).toContain("votre espace stagiaire");
  });

  it("corrige le sujet portugais J-10 (plus de D-10)", () => {
    expect(J10_SUBJECT_PT).toContain("J-10");
    expect(J10_SUBJECT_PT).not.toContain("D-10");
  });
});
