import { describe, expect, it } from "vitest";
import {
  FLI_SCHEDULE_HOURS,
  inferSlotFromSchedule,
  isScheduleMistakenForCode,
  looksLikeInscriptionCode,
  scheduleButtonLabel,
  scheduleLabelForSlot,
  scheduleTextForSlot,
} from "@/lib/fli-schedule-slots";

describe("horaires FLI exacts (BL-019)", () => {
  it("fixe les plages officielles des collectifs en station", () => {
    expect(FLI_SCHEDULE_HOURS.matin).toBe("de 8h30 à 12h30");
    expect(FLI_SCHEDULE_HOURS["apres-midi"]).toBe("de 13h30 à 17h30");
  });

  it("écrit le texte libre schedule, pas le jeton technique", () => {
    expect(scheduleTextForSlot("matin")).toBe("de 8h30 à 12h30");
    expect(scheduleTextForSlot("apres-midi")).toBe("de 13h30 à 17h30");
    expect(scheduleTextForSlot("matin")).not.toBe("matin");
  });

  it("compose le libellé convocation sans code d'inscription", () => {
    expect(scheduleLabelForSlot("matin")).toBe("Groupe matin, de 8h30 à 12h30");
    expect(scheduleLabelForSlot("apres-midi")).toBe(
      "Groupe après-midi, de 13h30 à 17h30"
    );
    expect(scheduleLabelForSlot("matin")).not.toMatch(/FLI-/);
  });

  it("affiche les heures sur les boutons de validation", () => {
    expect(scheduleButtonLabel("matin")).toBe("Matin — 8h30 à 12h30");
    expect(scheduleButtonLabel("apres-midi")).toBe("Après-midi — 13h30 à 17h30");
  });

  it("retrouve le créneau depuis un horaire d'import", () => {
    expect(inferSlotFromSchedule("de 8h30 à 12h30")).toBe("matin");
    expect(inferSlotFromSchedule("de 13h30 à 17h30")).toBe("apres-midi");
    expect(inferSlotFromSchedule("matin")).toBe("matin");
    expect(inferSlotFromSchedule("Planning à définir")).toBeNull();
    expect(inferSlotFromSchedule("de 17h à 19h")).toBeNull();
  });
});

describe("pas de code depuis les horaires (BL-019)", () => {
  it("reconnaît un vrai code FLI-AAnnnn", () => {
    expect(looksLikeInscriptionCode("FLI-260012")).toBe(true);
    expect(looksLikeInscriptionCode("fli-260012")).toBe(true);
    expect(looksLikeInscriptionCode("8h30")).toBe(false);
    expect(looksLikeInscriptionCode("de 8h30 à 12h30")).toBe(false);
    expect(looksLikeInscriptionCode("matin")).toBe(false);
  });

  it("détecte qu'un horaire ne doit pas servir de code", () => {
    expect(isScheduleMistakenForCode("8h30")).toBe(true);
    expect(isScheduleMistakenForCode("de 8h30 à 12h30")).toBe(true);
    expect(isScheduleMistakenForCode("matin")).toBe(true);
    expect(isScheduleMistakenForCode("FLI-260012")).toBe(false);
    expect(isScheduleMistakenForCode("Code test")).toBe(false);
  });
});
