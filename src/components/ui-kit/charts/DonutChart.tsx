import { ReactNode, useMemo } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { ChartEmpty, ChartFrame, makeTooltipRenderer } from "./ChartPrimitives";
import { foldToSeriesCap, seriesColor } from "../palette";

/**
 * Répartition d'un total. Anneau avec total au centre et légende détaillée à
 * côté (libellé + valeur + part), comme dans les références.
 *
 * Au-delà de 6 catégories, le surplus est replié sur « Autre » : on ne génère
 * jamais une 7e teinte.
 */

export interface DonutSlice {
  name: string;
  value: number;
  color?: string;
  /** Destination au clic — un segment qui représente une liste y mène. */
  href?: string;
}

export function DonutChart({
  data,
  height = 220,
  thickness = 22,
  centerLabel,
  centerValue,
  formatValue,
  legendPosition = "side",
  emptyMessage,
  ariaLabel,
  otherLabel = "Autre",
  className,
}: {
  data: DonutSlice[];
  height?: number;
  thickness?: number;
  /** Libellé sous la valeur centrale (« Total », « Inscriptions »). */
  centerLabel?: ReactNode;
  /** Valeur centrale ; par défaut la somme des tranches. */
  centerValue?: ReactNode;
  formatValue?: (value: number) => string;
  legendPosition?: "side" | "bottom" | "none";
  emptyMessage?: string;
  ariaLabel?: string;
  otherLabel?: string;
  className?: string;
}) {
  const slices = useMemo(() => {
    const folded = foldToSeriesCap(
      data.map((item) => ({ ...item, name: item.name, value: item.value })),
      otherLabel
    ) as DonutSlice[];
    return folded.map((slice, index) => ({
      ...slice,
      color: slice.color ?? seriesColor(index),
    }));
  }, [data, otherLabel]);

  const total = useMemo(() => slices.reduce((sum, slice) => sum + slice.value, 0), [slices]);

  if (!data.length || total === 0) return <ChartEmpty message={emptyMessage} height={height} />;

  const format = formatValue ?? ((value: number) => value.toLocaleString("fr-FR"));
  const tooltip = makeTooltipRenderer({
    formatValue: (value) => {
      const numeric = typeof value === "number" ? value : Number(value);
      const share = total > 0 ? Math.round((numeric / total) * 100) : 0;
      return `${format(numeric)} · ${share}%`;
    },
  });

  const outerRadius = Math.min(height, 260) / 2 - 6;
  const innerRadius = outerRadius - thickness;

  const legend = (
    <ul
      className={cn(
        "min-w-0",
        legendPosition === "side" ? "space-y-2.5" : "flex flex-wrap gap-x-5 gap-y-2"
      )}
    >
      {slices.map((slice) => {
        const share = total > 0 ? Math.round((slice.value / total) * 100) : 0;
        return (
          <li
            key={slice.name}
            className={cn(
              "flex items-center gap-3 text-sm",
              legendPosition === "side" && "justify-between"
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: slice.color }}
                aria-hidden
              />
              <span className="truncate text-muted-foreground">{slice.name}</span>
            </span>
            <span className="shrink-0 tabular">
              <span className="font-semibold text-foreground">{format(slice.value)}</span>
              <span className="ml-1.5 text-xs text-muted-foreground">{share}%</span>
            </span>
          </li>
        );
      })}
    </ul>
  );

  const chart = (
    <div className="relative shrink-0" style={{ width: height, height }}>
      <ChartFrame height={height} ariaLabel={ariaLabel}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            stroke="hsl(var(--surface-raised))"
            strokeWidth={2}
            startAngle={90}
            endAngle={-270}
          >
            {slices.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip content={tooltip} />
        </PieChart>
      </ChartFrame>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold tabular text-foreground">
          {centerValue ?? format(total)}
        </span>
        {centerLabel && (
          <span className="mt-0.5 max-w-[70%] text-xs text-muted-foreground">{centerLabel}</span>
        )}
      </div>
    </div>
  );

  if (legendPosition === "none") return <div className={className}>{chart}</div>;

  return (
    <div
      className={cn(
        legendPosition === "side"
          ? "flex flex-col items-center gap-5 sm:flex-row sm:items-center"
          : "flex flex-col items-center gap-4",
        className
      )}
    >
      {chart}
      <div className="w-full min-w-0 flex-1">{legend}</div>
    </div>
  );
}

/**
 * Anneaux concentriques : une couronne par catégorie, part de 0 à 100 %.
 * Utilisé pour « Projet terminé / En cours / Backlog » de la référence 4.
 */
export function RadialRings({
  items,
  size = 180,
  className,
}: {
  items: Array<{ key: string; label: string; value: number; color?: string }>;
  size?: number;
  className?: string;
}) {
  const stroke = 10;
  const gap = 6;

  return (
    <div className={cn("flex flex-col items-center gap-5 sm:flex-row", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0 -rotate-90"
        role="img"
        aria-label={items.map((item) => `${item.label} ${item.value}%`).join(", ")}
      >
        {items.slice(0, 6).map((item, index) => {
          const radius = size / 2 - stroke / 2 - index * (stroke + gap);
          if (radius <= 0) return null;
          const circumference = 2 * Math.PI * radius;
          const filled = (Math.max(0, Math.min(100, item.value)) / 100) * circumference;
          const color = item.color ?? seriesColor(index);
          return (
            <g key={item.key}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="hsl(var(--chart-grid))"
                strokeWidth={stroke}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${filled} ${circumference - filled}`}
              />
            </g>
          );
        })}
      </svg>

      <ul className="w-full min-w-0 space-y-3">
        {items.map((item, index) => (
          <li key={item.key} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-pill"
                  style={{ backgroundColor: item.color ?? seriesColor(index) }}
                  aria-hidden
                />
                <span className="truncate text-muted-foreground">{item.label}</span>
              </span>
              <span className="shrink-0 font-semibold tabular text-foreground">{item.value}%</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
