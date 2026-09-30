import { describe, expect, it } from "vitest";
import {
  bucketByHour,
  classifyActionTone,
  computeOverallHealth,
  errorHeatmapMatrix,
  isErrorLikeAction,
  loadBand,
  MONITORING_SECRET_CATALOG,
  SENSITIVE_TABLES,
} from "@/lib/monitoramento";
import {
  activeChildHref,
  isItemActive,
  isPathActive,
  NAV_SECTIONS,
} from "@/lib/navigation";
import { PATH_TO_ROUTE_KEY, resolveRouteKey } from "@/lib/route-permissions";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("monitoramento — modèle", () => {
  it("classe les actions sensibles", () => {
    expect(isErrorLikeAction("securite_rls_test")).toBe(true);
    expect(isErrorLikeAction("import_dry_run")).toBe(false);
    expect(classifyActionTone("delete")).toBe("warn");
    expect(classifyActionTone("create")).toBe("ok");
  });

  it("calcule la santé globale", () => {
    expect(
      computeOverallHealth({
        databaseReachable: false,
        errorLikeActions24h: 0,
        githubConnected: true,
        secretsConfigured: true,
      }),
    ).toBe("danger");
    expect(
      computeOverallHealth({
        databaseReachable: true,
        errorLikeActions24h: 0,
        githubConnected: true,
        secretsConfigured: true,
      }),
    ).toBe("ok");
    expect(
      computeOverallHealth({
        databaseReachable: true,
        errorLikeActions24h: 2,
        githubConnected: false,
        secretsConfigured: false,
      }),
    ).toBe("warn");
  });

  it("expose le catalogue de secrets et tables sensibles", () => {
    expect(MONITORING_SECRET_CATALOG.map((s) => s.key)).toEqual(
      expect.arrayContaining(["GITHUB_TOKEN", "GITHUB_REPO", "SENTRY_DSN"]),
    );
    expect(SENSITIVE_TABLES.length).toBeGreaterThanOrEqual(8);
  });

  it("agrége les heures et la heatmap", () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const iso = now.toISOString();
    const buckets = bucketByHour([
      { created_at: iso, action: "create" },
      { created_at: iso, action: "error_failed" },
    ]);
    expect(buckets).toHaveLength(24);
    expect(buckets[now.getHours()].count).toBe(2);
    expect(buckets[now.getHours()].errors).toBe(1);
    expect(loadBand(10, 10)).toBe("peak");

    const matrix = errorHeatmapMatrix([{ created_at: iso, action: "security_denied" }], 7);
    expect(matrix).toHaveLength(7);
    expect(matrix[6][now.getHours()]).toBe(1);
  });
});

describe("monitoramento — navigation & routes", () => {
  it("place la section après Administration", () => {
    expect(NAV_SECTIONS.map((s) => s.id)).toEqual([
      "operations",
      "commercial",
      "finance",
      "qualite",
      "portails",
      "administration",
      "monitoramento",
    ]);
    const section = NAV_SECTIONS.find((s) => s.id === "monitoramento");
    expect(section?.adminOnly).toBe(true);
    expect(section?.items[0]?.children?.map((c) => c.href)).toEqual([
      "/monitoramento",
      "/monitoramento/seguranca",
      "/monitoramento/qualidade",
      "/monitoramento/acessos",
    ]);
  });

  it("distingue le hub des sous-pages", () => {
    expect(isPathActive("/monitoramento/seguranca", "/monitoramento")).toBe(false);
    expect(isPathActive("/monitoramento", "/monitoramento")).toBe(true);
    const hub = NAV_SECTIONS.find((s) => s.id === "monitoramento")!.items[0];
    expect(activeChildHref(hub, "/monitoramento/qualidade", "")).toBe(
      "/monitoramento/qualidade",
    );
    expect(isItemActive(hub, "/monitoramento/acessos", "")).toBe(true);
  });

  it("résout les permissions monitoramento", () => {
    expect(resolveRouteKey("/monitoramento")).toBe("monitoramento");
    expect(resolveRouteKey("/monitoramento/seguranca")).toBe("monitoramento");
    expect(PATH_TO_ROUTE_KEY["/monitoramento/acessos"]).toBe("monitoramento");
  });

  it("déclare les routes dans App.tsx", () => {
    const app = source("src/App.tsx");
    for (const path of [
      "/monitoramento",
      "/monitoramento/seguranca",
      "/monitoramento/qualidade",
      "/monitoramento/acessos",
    ]) {
      expect(app).toContain(`path="${path}"`);
    }
  });

  it("livre le guide de secrets", () => {
    const doc = source("docs/MONITORAMENTO_SECRETS.md");
    expect(doc).toContain("GITHUB_TOKEN");
    expect(doc).toContain("Lovable");
    expect(doc).toContain("supabase secrets set");
  });

  it("livre les edge functions monitoring", () => {
    expect(source("supabase/functions/check-monitoring-config/index.ts")).toContain(
      "GITHUB_TOKEN",
    );
    expect(source("supabase/functions/monitoring-overview/index.ts")).toContain(
      "api.github.com",
    );
  });

  it("embarque les widgets du modèle SmartHR", () => {
    expect(source("src/components/monitoramento/MonitoringWidgets.tsx")).toContain(
      "ErrorHeatmap",
    );
    expect(source("src/pages/monitoramento/MonitoramentoDashboard.tsx")).toContain(
      "PeakHoursList",
    );
    expect(source("src/pages/monitoramento/MonitoramentoDashboard.tsx")).toContain(
      "EnvToggle",
    );
  });

  it("structure chaque sous-menu en KPI cards + tableaux d'analyse", () => {
    const widgets = source("src/components/monitoramento/MonitoringWidgets.tsx");
    expect(widgets).toContain("KpiAnalysisTable");
    for (const page of [
      "src/pages/monitoramento/MonitoramentoSeguranca.tsx",
      "src/pages/monitoramento/MonitoramentoQualidade.tsx",
      "src/pages/monitoramento/MonitoramentoAcessos.tsx",
    ]) {
      const code = source(page);
      expect(code, `${page} doit avoir des KPI cards`).toContain("MonitoringKpiCard");
      expect(code, `${page} doit avoir le tableau d'analyse`).toContain("KpiAnalysisTable");
      expect(code, `${page} doit avoir TableFrame`).toContain("TableFrame");
    }
  });
});
