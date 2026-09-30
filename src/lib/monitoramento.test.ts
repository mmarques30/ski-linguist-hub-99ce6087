import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NAV_SECTIONS } from "@/lib/navigation";
import {
  detectPublicMonitoringFlags,
  emailHealthTone,
  summarizeHealth,
  type HealthCheck,
} from "@/lib/monitoring";
import { resolveRouteKey } from "@/lib/route-permissions";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("monitoring helpers", () => {
  it("calcule la santé e-mail", () => {
    expect(emailHealthTone(0, 10)).toBe("ok");
    expect(emailHealthTone(2, 20)).toBe("warn"); // 2/22 ≈ 9 %
    expect(emailHealthTone(5, 5)).toBe("danger");
  });

  it("agrège les checks", () => {
    const checks: HealthCheck[] = [
      { id: "a", label: "A", tone: "ok", detail: "" },
      { id: "b", label: "B", tone: "warn", detail: "" },
    ];
    expect(summarizeHealth(checks)).toBe("warn");
  });

  it("signale l'absence de GITHUB_TOKEN côté public", () => {
    const flags = detectPublicMonitoringFlags(null);
    expect(flags.githubConfigured).toBe(false);
    expect(flags.notes.length).toBeGreaterThan(0);
  });
});

describe("monitoramento — câblage", () => {
  it("ajoute la section sous Administration", () => {
    const ids = NAV_SECTIONS.map((s) => s.id);
    expect(ids.indexOf("monitoramento")).toBeGreaterThan(ids.indexOf("administration"));
    const mon = NAV_SECTIONS.find((s) => s.id === "monitoramento");
    expect(mon?.adminOnly).toBe(true);
    expect(mon?.items.map((i) => i.href)).toEqual([
      "/monitoramento",
      "/monitoramento/seguranca",
      "/monitoramento/qualidade",
      "/monitoramento/acessos",
    ]);
  });

  it("App et permissions exposent les routes", () => {
    const app = source("src/App.tsx");
    expect(app).toContain('path="/monitoramento"');
    expect(app).toContain('path="/monitoramento/seguranca"');
    expect(app).toContain('path="/monitoramento/qualidade"');
    expect(app).toContain('path="/monitoramento/acessos"');
    expect(resolveRouteKey("/monitoramento/seguranca")).toBe("monitoramento");
  });

  it("edge + docs secrets présents", () => {
    expect(
      existsSync(join(process.cwd(), "supabase/functions/monitoring-status/index.ts"))
    ).toBe(true);
    expect(existsSync(join(process.cwd(), "docs/MONITORAMENTO_SECRETS.md"))).toBe(true);
    expect(source("docs/MONITORAMENTO_SECRETS.md")).toContain("GITHUB_TOKEN");
    expect(source("supabase/config.toml")).toContain("[functions.monitoring-status]");
  });
});
