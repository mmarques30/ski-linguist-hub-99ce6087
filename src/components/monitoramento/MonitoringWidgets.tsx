import { cn } from "@/lib/utils";
import { Sparkline, StatusPill, SurfaceCard } from "@/components/ui-kit";
import { loadBandColor, type HourlyBucket, type LoadBand } from "@/lib/monitoramento";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

/** KPI dense façon SmartHR : chiffre + sparkline. */
export function MonitoringKpiCard({
  label,
  value,
  hint,
  points,
  sparkColor = "hsl(var(--chart-1))",
  sparkVariant = "area",
  status,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  points: number[];
  sparkColor?: string;
  sparkVariant?: "area" | "line" | "bars";
  status?: ReactNode;
  className?: string;
}) {
  return (
    <SurfaceCard className={cn("min-h-[140px]", className)} bodyClassName="pt-1">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {status}
      </div>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      {points.length >= 2 && (
        <div className="mt-3">
          <Sparkline
            points={points}
            height={40}
            color={sparkColor}
            variant={sparkVariant}
            ariaLabel={`${label} tendance`}
          />
        </div>
      )}
    </SurfaceCard>
  );
}

export function ModuleStatusCard({
  name,
  uptimeLabel,
  ok,
  detail,
}: {
  name: string;
  uptimeLabel: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <span
          className={cn(
            "h-2.5 w-2.5 shrink-0 rounded-full",
            ok ? "bg-[hsl(var(--status-good))]" : "bg-[hsl(var(--status-critical))]",
          )}
          aria-hidden
        />
      </div>
      <p
        className={cn(
          "mt-2 text-lg font-semibold tabular",
          ok ? "text-foreground" : "text-[hsl(var(--status-critical))]",
        )}
      >
        {uptimeLabel}
      </p>
      {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

export function PeakHoursList({ hours }: { hours: HourlyBucket[] }) {
  const max = Math.max(...hours.map((h) => h.count), 1);
  // Fenêtre métier 06h–22h (comme le modèle SmartHR) — densifie sans 24 lignes vides.
  const window = hours.filter((h) => h.hour >= 6 && h.hour <= 22);

  return (
    <ul className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
      {window.map((h) => {
        const ratio = h.count > 0 ? Math.max(0.04, h.count / max) : 0;
        return (
          <li key={h.hour} className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-xs tabular text-muted-foreground">{h.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-pill bg-[hsl(var(--chart-grid))]">
              <div
                className="h-full rounded-pill transition-[width] duration-500"
                style={{
                  width: `${ratio * 100}%`,
                  backgroundColor: loadBandColor(h.band),
                }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs font-medium tabular">{h.count}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function LoadLegend() {
  const items: { band: LoadBand; label: string }[] = [
    { band: "low", label: "Faible" },
    { band: "medium", label: "Moyen" },
    { band: "high", label: "Élevé" },
    { band: "peak", label: "Pic" },
  ];
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {items.map((item) => (
        <span key={item.band} className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: loadBandColor(item.band) }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/** Heatmap 7j × 24h — teintes orange comme le modèle SmartHR. */
export function ErrorHeatmap({
  matrix,
  dayLabels,
}: {
  matrix: number[][];
  dayLabels: string[];
}) {
  const safeMatrix =
    matrix.length > 0
      ? matrix
      : Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  const labels =
    dayLabels.length === safeMatrix.length
      ? dayLabels
      : ["j-6", "j-5", "j-4", "j-3", "j-2", "j-1", "auj."];
  const flat = safeMatrix.flat();
  const max = Math.max(...flat, 1);
  const hasSignal = flat.some((v) => v > 0);

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `2.5rem repeat(24, minmax(0.55rem, 1fr))` }}
        >
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="text-center text-[9px] text-muted-foreground"
              title={`${h}h`}
            >
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
          {safeMatrix.map((row, dayIndex) => (
            <div key={dayIndex} className="contents">
              <div className="flex items-center text-[10px] text-muted-foreground">
                {labels[dayIndex] ?? `J${dayIndex}`}
              </div>
              {row.map((value, hour) => {
                const intensity = value / max;
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    title={`${labels[dayIndex] ?? ""} ${hour}h — ${value} erreur(s)`}
                    className="aspect-square min-h-[10px] rounded-[3px]"
                    style={{
                      backgroundColor:
                        value === 0
                          ? "hsl(var(--chart-grid))"
                          : `color-mix(in srgb, hsl(var(--tint-orange-fg)) ${Math.round(
                              25 + intensity * 75,
                            )}%, hsl(var(--chart-grid)))`,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {hasSignal
            ? "Intensité = actions type erreur / sécurité (7 derniers jours)"
            : "Aucune erreur taguée sur 7 jours — grille au repos (données audit_log)"}
        </p>
      </div>
    </div>
  );
}

export function SecurityMetricRow({
  label,
  value,
  points,
  tone = "danger",
}: {
  label: string;
  value: number;
  points: number[];
  tone?: "danger" | "warning" | "info";
}) {
  const color =
    tone === "danger"
      ? "hsl(var(--status-critical))"
      : tone === "warning"
        ? "hsl(var(--tint-gold-fg))"
        : "hsl(var(--tint-blue-fg))";

  return (
    <div className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tabular" style={{ color }}>
          {value}
        </p>
      </div>
      {points.length >= 2 && (
        <div className="w-28 shrink-0">
          <Sparkline points={points} height={32} color={color} variant="area" />
        </div>
      )}
    </div>
  );
}

export function RolesStackBar({
  roles,
}: {
  roles: Array<{ role: string; label: string; count: number }>;
}) {
  if (!roles.length) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
        Aucun rôle lisible (RLS / session admin requise pour <code>user_roles</code>).
      </p>
    );
  }

  const total = roles.reduce((sum, r) => sum + r.count, 0) || 1;
  const palette = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
  ];

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-pill bg-[hsl(var(--chart-grid))]">
        {roles.map((r, i) => (
          <div
            key={r.role}
            style={{
              width: `${(r.count / total) * 100}%`,
              backgroundColor: palette[i % palette.length],
            }}
            title={`${r.label}: ${r.count}`}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {roles.map((r, i) => (
          <li key={r.role} className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: palette[i % palette.length] }}
            />
            {r.label}{" "}
            <span className="font-medium text-foreground tabular">{r.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QuickActionTile({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-center transition-colors hover:border-primary/40 hover:bg-[hsl(var(--surface-sunken))]"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--tint-navy-bg))] text-[hsl(var(--tint-navy-fg))]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </Link>
  );
}

export function EnvToggle({
  value,
  onChange,
}: {
  value: "production" | "staging" | "development";
  onChange: (v: "production" | "staging" | "development") => void;
}) {
  const options = [
    { id: "production" as const, label: "Production" },
    { id: "staging" as const, label: "Staging" },
    { id: "development" as const, label: "Development" },
  ];
  return (
    <div className="inline-flex rounded-pill border border-border bg-[hsl(var(--surface-sunken))] p-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "rounded-pill px-3 py-1 text-xs font-medium transition-colors",
            value === opt.id
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
          {value === opt.id && opt.id === "production" ? " (actif)" : ""}
        </button>
      ))}
    </div>
  );
}

export function HeaderStatBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone: "success" | "danger" | "neutral";
}) {
  return (
    <StatusPill
      tone={tone === "success" ? "success" : tone === "danger" ? "danger" : "neutral"}
      dot
    >
      {label}: {value}
    </StatusPill>
  );
}
