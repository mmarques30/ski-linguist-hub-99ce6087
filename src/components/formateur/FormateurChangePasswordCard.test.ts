import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useAuth", () => ({ useAuth: vi.fn() }));
import { passwordChangeSchema } from "./FormateurChangePasswordCard";

describe("password change validation", () => {
  it("rejects passwords shorter than eight characters", () => {
    expect(passwordChangeSchema.safeParse({ password: "1234567", confirmation: "1234567" }).success).toBe(false);
  });
  it("accepts matching eight-character passwords", () => {
    expect(passwordChangeSchema.safeParse({ password: "12345678", confirmation: "12345678" }).success).toBe(true);
  });
  it("rejects a confirmation different from the new password", () => {
    expect(passwordChangeSchema.safeParse({ password: "12345678", confirmation: "87654321" }).success).toBe(false);
  });
});