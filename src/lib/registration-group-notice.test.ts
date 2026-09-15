import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  expectsStationGroupAssignment,
  STATION_GROUP_NOTICE_AFTER_TEST,
  STATION_GROUP_NOTICE_BEFORE_TEST,
  STATION_GROUP_SIGNATURE,
} from "./registration-group-notice";

/**
 * BL-028 — le message du groupe matin / après-midi est réservé aux collectifs
 * en station et signé « l'équipe FLI ».
 */

describe("message du groupe matin / après-midi", () => {
  it("ne concerne que les collectifs en station", () => {
    expect(expectsStationGroupAssignment("in_person")).toBe(true);
    expect(expectsStationGroupAssignment("presentiel")).toBe(true);
    expect(expectsStationGroupAssignment("Présentiel")).toBe(true);
    expect(expectsStationGroupAssignment("online_individual")).toBe(false);
    expect(expectsStationGroupAssignment("online_group")).toBe(false);
    expect(expectsStationGroupAssignment("en_ligne_groupe")).toBe(false);
    expect(expectsStationGroupAssignment(null)).toBe(false);
    expect(expectsStationGroupAssignment(undefined)).toBe(false);
    expect(expectsStationGroupAssignment("")).toBe(false);
  });

  it("est signé de l'équipe, pas du prénom de la directrice", () => {
    expect(STATION_GROUP_SIGNATURE).toBe("l'équipe FLI");
    for (const message of [
      STATION_GROUP_NOTICE_BEFORE_TEST,
      STATION_GROUP_NOTICE_AFTER_TEST,
    ]) {
      expect(message).not.toMatch(/paula/i);
      expect(message).toMatch(/10 jours/);
    }
  });

  it("conditionne l'affichage dans le test et le récapitulatif", () => {
    for (const relatif of [
      "components/registration/PlacementTestStep.tsx",
      "components/registration/ConfirmationStep.tsx",
    ]) {
      const contenu = readFileSync(join(process.cwd(), "src", relatif), "utf8");
      expect(contenu).toContain("expectsStationGroupAssignment");
      expect(contenu).toContain("isStationGroup &&");
      // Plus aucune phrase « matin » en dur hors du module partagé.
      expect(contenu).not.toMatch(/matin/i);
      expect(contenu).not.toMatch(/validation par Paula/i);
    }
  });
});
