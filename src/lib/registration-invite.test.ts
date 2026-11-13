import { describe, expect, it } from "vitest";
import {
  isPlausibleInviteEmail,
  nextRegistrationStepId,
  normalizeInviteEmail,
  prevRegistrationStepId,
} from "./registration-invite";
import {
  isEnrollableOffering,
  isInviteOnlyOffering,
  isOpenOffering,
  isWaitlistOffering,
  requiresStudentPayment,
} from "./registration-offerings";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("registration-invite", () => {
  it("normalise les e-mails", () => {
    expect(normalizeInviteEmail("  XAVIER.VASSAL@wanadoo.fr ")).toBe(
      "xavier.vassal@wanadoo.fr"
    );
    expect(isPlausibleInviteEmail("a@b.c")).toBe(true);
    expect(isPlausibleInviteEmail("nope")).toBe(false);
  });

  it("saute certification et paiement dans le wizard", () => {
    const both = { skipCertification: true, skipPayment: true };
    expect(nextRegistrationStepId(4, both)).toBe(7);
    expect(prevRegistrationStepId(7, both)).toBe(4);

    const payOnly = { skipCertification: false, skipPayment: true };
    expect(nextRegistrationStepId(5, payOnly)).toBe(7);
    expect(prevRegistrationStepId(7, payOnly)).toBe(5);

    const certOnly = { skipCertification: true, skipPayment: false };
    expect(nextRegistrationStepId(4, certOnly)).toBe(6);
    expect(prevRegistrationStepId(6, certOnly)).toBe(4);
  });
});

describe("invite_only offering helpers", () => {
  it("reconnaît invite_only et student_payment_required", () => {
    expect(isInviteOnlyOffering({ enrollment_status: "invite_only" })).toBe(true);
    expect(isEnrollableOffering({ enrollment_status: "invite_only" })).toBe(true);
    expect(isOpenOffering({ enrollment_status: "invite_only" })).toBe(false);
    expect(isWaitlistOffering({ enrollment_status: "invite_only" })).toBe(false);
    expect(requiresStudentPayment({ student_payment_required: false })).toBe(false);
    expect(requiresStudentPayment({ student_payment_required: true })).toBe(true);
    expect(requiresStudentPayment({})).toBe(true);
  });

  it("garde la copie Deno d'accord avec le module front", () => {
    const root = resolve(__dirname, "../..");
    const deno = readFileSync(
      resolve(root, "supabase/functions/_shared/registration-offerings.ts"),
      "utf8"
    );
    expect(deno).toContain("export function isInviteOnlyOffering");
    expect(deno).toContain("export function isEnrollableOffering");
    expect(deno).toContain("export function requiresStudentPayment");
    expect(deno).toContain('"invite_only"');
    expect(deno).toContain("student_payment_required");
  });

  it("migration S21 invite_only présente", () => {
    const root = resolve(__dirname, "../..");
    const mig = readFileSync(
      resolve(root, "supabase/migrations/20261113100000_samoens_pt_invite_only.sql"),
      "utf8"
    );
    expect(mig).toContain("invite_only");
    expect(mig).toContain("student_payment_required = false");
    expect(mig).toContain("check_registration_invite");
    expect(mig).toContain("bcrnicole@orange.fr");
    expect(mig).toContain("session_code = 'S21'");
    expect(mig).toContain("register?session=S21");
  });
});
