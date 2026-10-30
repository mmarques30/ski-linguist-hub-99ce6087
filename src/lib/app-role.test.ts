import { describe, expect, it } from "vitest";
import { resolveAppRole } from "./app-role";

describe("resolveAppRole", () => {
  it("renvoie null si aucun rôle", () => {
    expect(resolveAppRole([])).toBeNull();
    expect(resolveAppRole(null)).toBeNull();
    expect(resolveAppRole(undefined)).toBeNull();
  });

  it("privilégie admin quand admin + formateur (compte Paula)", () => {
    expect(resolveAppRole(["formateur", "admin"])).toBe("admin");
    expect(resolveAppRole(["admin", "formateur"])).toBe("admin");
  });

  it("privilégie formateur sur student / user", () => {
    expect(resolveAppRole(["formateur"])).toBe("formateur");
    expect(resolveAppRole(["user", "formateur"])).toBe("formateur");
    expect(resolveAppRole(["student", "formateur"])).toBe("formateur");
  });

  it("privilégie student sur user", () => {
    expect(resolveAppRole(["student"])).toBe("student");
    expect(resolveAppRole(["user", "student"])).toBe("student");
  });

  it("accepte un seul rôle user", () => {
    expect(resolveAppRole(["user"])).toBe("user");
  });

  it("ignore les valeurs vides", () => {
    expect(resolveAppRole(["", null, "admin"])).toBe("admin");
  });
});
