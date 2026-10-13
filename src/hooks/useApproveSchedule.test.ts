import { describe, expect, it } from "vitest";
import { buildScheduleApprovalPatch } from "@/hooks/useApproveSchedule";
import { FLI_SCHEDULE_HOURS } from "@/lib/fli-schedule-slots";

describe("buildScheduleApprovalPatch (BL-019)", () => {
  it("écrit les plages FLI exactes, pas le jeton matin/après-midi", () => {
    const matin = buildScheduleApprovalPatch("matin", "user-1");
    expect(matin.schedule_status).toBe("matin");
    expect(matin.schedule).toBe(FLI_SCHEDULE_HOURS.matin);
    expect(matin.schedule).not.toBe("matin");
    expect(matin.schedule_approved_by).toBe("user-1");
    expect(matin.schedule_approved_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const am = buildScheduleApprovalPatch("apres-midi", null);
    expect(am.schedule_status).toBe("apres-midi");
    expect(am.schedule).toBe(FLI_SCHEDULE_HOURS["apres-midi"]);
    expect(am.schedule_approved_by).toBeNull();
  });

  it("ne propose aucune clé code (pas de code depuis les horaires)", () => {
    const patch = buildScheduleApprovalPatch("matin", null);
    expect(Object.keys(patch)).not.toContain("code");
  });
});
