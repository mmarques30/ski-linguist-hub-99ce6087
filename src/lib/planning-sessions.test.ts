import { describe, expect, it } from "vitest";
import {
  isCohortSession,
  maxStudentsForOffering,
  offeringEligibleForPlanning,
  planningModalityForOffering,
  planningSessionTitle,
  sessionCoversLocalDay,
} from "@/lib/planning-sessions";

describe("planning-sessions", () => {
  it("capacité par code session et modalité", () => {
    expect(
      maxStudentsForOffering({ session_code: "S05", modality_key: "in_person" })
    ).toBe(24);
    expect(
      maxStudentsForOffering({ session_code: "S14", modality_key: "in_person" })
    ).toBe(12);
    expect(
      maxStudentsForOffering({ session_code: "S02", modality_key: "in_person" })
    ).toBe(16);
    expect(
      maxStudentsForOffering({ session_code: null, modality_key: "online_group" })
    ).toBe(8);
    expect(
      maxStudentsForOffering({
        session_code: null,
        modality_key: "online_individual",
      })
    ).toBe(1);
  });

  it("titre et éligibilité catalogue", () => {
    expect(
      planningSessionTitle({
        session_code: "S02",
        location_label: "Saint-Jean-de-Maurienne",
        language_label: "Anglais",
      })
    ).toBe("S02 · Saint-Jean-de-Maurienne · Anglais");

    expect(
      offeringEligibleForPlanning({
        start_date: "2026-11-23",
        end_date: "2026-11-27",
        modality_key: "in_person",
      })
    ).toBe(true);

    expect(
      offeringEligibleForPlanning({
        start_date: null,
        end_date: null,
        modality_key: "online_individual",
      })
    ).toBe(false);

    expect(planningModalityForOffering("online_individual")).toBe("individuel");
    expect(planningModalityForOffering("in_person")).toBe("groupe");
  });

  it("couverture multi-jours et détection cohorte", () => {
    const session = {
      offering_id: "abc",
      start_datetime: "2026-11-23T07:30:00.000Z",
      end_datetime: "2026-11-27T16:30:00.000Z",
    };
    expect(sessionCoversLocalDay(session, "2026-11-23")).toBe(true);
    expect(sessionCoversLocalDay(session, "2026-11-25")).toBe(true);
    expect(sessionCoversLocalDay(session, "2026-11-27")).toBe(true);
    expect(sessionCoversLocalDay(session, "2026-11-28")).toBe(false);
    expect(isCohortSession(session)).toBe(true);
    expect(
      isCohortSession({
        offering_id: null,
        start_datetime: "2026-11-23T09:00:00.000Z",
        end_datetime: "2026-11-23T11:00:00.000Z",
      })
    ).toBe(false);
  });
});
