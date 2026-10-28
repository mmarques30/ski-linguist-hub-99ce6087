import { describe, expect, it } from "vitest";
import { homePathForRole } from "@/lib/auth-home";
import { ADMIN_HOME_PATH } from "@/lib/admin-home";

describe("homePathForRole", () => {
  it("envoie les formateurs vers leur tableau de bord", () => {
    expect(homePathForRole("formateur")).toBe("/formateur/tableau-de-bord");
  });

  it("envoie les stagiaires vers le portail stagiaire", () => {
    expect(homePathForRole("student")).toBe("/student/dashboard");
  });

  it("envoie admin / staff vers /app", () => {
    expect(homePathForRole("admin")).toBe(ADMIN_HOME_PATH);
    expect(homePathForRole("user")).toBe(ADMIN_HOME_PATH);
    expect(homePathForRole(null)).toBe(ADMIN_HOME_PATH);
  });
});
