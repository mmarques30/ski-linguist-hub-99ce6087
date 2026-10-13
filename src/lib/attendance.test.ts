import { describe, expect, it } from "vitest";
import {
  buildAttendanceGroupKey,
  buildEmargerUrl,
  canInstructorValidateSlot,
  computeAttendanceRatePercent,
  dayPartLabel,
  formatSignedElectronically,
  slotRangeForDayPart,
  slotRangeOnTheFly,
} from "@/lib/attendance";

describe("computeAttendanceRatePercent", () => {
  it("compte excuse comme présent", () => {
    expect(
      computeAttendanceRatePercent([
        { status: "present" },
        { status: "excuse" },
        { status: "absent" },
      ])
    ).toBe(66.7);
  });

  it("ignore pending", () => {
    expect(
      computeAttendanceRatePercent([
        { status: "present" },
        { status: "pending" },
      ])
    ).toBe(100);
  });

  it("retourne null sans ligne comptable", () => {
    expect(computeAttendanceRatePercent([{ status: "pending" }])).toBeNull();
    expect(computeAttendanceRatePercent([])).toBeNull();
  });
});

describe("canInstructorValidateSlot", () => {
  it("bloque s’il reste un pending", () => {
    expect(
      canInstructorValidateSlot([{ status: "present" }, { status: "pending" }])
    ).toBe(false);
  });

  it("autorise quand tout est renseigné", () => {
    expect(
      canInstructorValidateSlot([
        { status: "present" },
        { status: "absent" },
        { status: "excuse" },
      ])
    ).toBe(true);
  });
});

describe("buildAttendanceGroupKey", () => {
  it("normalise la cohorte", () => {
    expect(
      buildAttendanceGroupKey({
        language: "Anglais",
        courseLocation: "Les Arcs",
        startDate: "2026-12-01",
        groupName: "G1",
        schedule: "de 8h30 à 12h30",
      })
    ).toBe("anglais|les arcs|2026-12-01|g1|de 8h30 à 12h30");
  });
});

describe("slot ranges", () => {
  it("pose matin / après-midi FLI", () => {
    const matin = slotRangeForDayPart("2026-12-01", "matin");
    expect(matin.startsAt.getHours()).toBe(8);
    expect(matin.startsAt.getMinutes()).toBe(30);
    expect(matin.endsAt.getHours()).toBe(12);

    const am = slotRangeForDayPart("2026-12-01", "apres-midi");
    expect(am.startsAt.getHours()).toBe(13);
    expect(am.endsAt.getHours()).toBe(17);
  });

  it("crée un créneau à la volée", () => {
    const now = new Date("2026-12-01T10:00:00");
    const range = slotRangeOnTheFly(3, now);
    expect(range.slotDate).toBe("2026-12-01");
    expect(range.endsAt.getTime() - range.startsAt.getTime()).toBe(3 * 3600 * 1000);
  });
});

describe("labels & urls", () => {
  it("libellé demi-journée", () => {
    expect(dayPartLabel("matin")).toContain("Matin");
    expect(dayPartLabel("custom")).toBe("Cours");
  });

  it("URL publique", () => {
    expect(buildEmargerUrl("https://plateforme.fli.fr/", "abc")).toBe(
      "https://plateforme.fli.fr/emarger/abc"
    );
  });

  it("texte signature PDF", () => {
    expect(formatSignedElectronically("2026-12-01T10:15:00.000Z")).toMatch(
      /Signé électroniquement/
    );
  });
});
