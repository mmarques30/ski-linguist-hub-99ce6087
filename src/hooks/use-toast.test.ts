import { beforeEach, describe, expect, it, vi } from "vitest";

const { success, error, dismiss } = vi.hoisted(() => ({
  success: vi.fn(() => "ok-id"),
  error: vi.fn(() => "err-id"),
  dismiss: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success,
    error,
    dismiss,
  },
}));

import { toast, useToast } from "./use-toast";

describe("use-toast → Sonner", () => {
  beforeEach(() => {
    success.mockClear();
    error.mockClear();
    dismiss.mockClear();
  });

  it("envoie un succès avec titre et description", () => {
    toast({ title: "Enregistré", description: "Dossier à jour" });
    expect(success).toHaveBeenCalledWith("Enregistré", {
      description: "Dossier à jour",
      duration: undefined,
    });
    expect(error).not.toHaveBeenCalled();
  });

  it("envoie une erreur destructive", () => {
    toast({ variant: "destructive", title: "Erreur", description: "Échec" });
    expect(error).toHaveBeenCalledWith("Erreur", {
      description: "Échec",
      duration: undefined,
    });
  });

  it("expose toast via useToast sans pile locale", () => {
    const api = useToast();
    expect(api.toasts).toEqual([]);
    api.toast({ title: "OK" });
    expect(success).toHaveBeenCalledWith("OK", {
      description: undefined,
      duration: undefined,
    });
  });
});
