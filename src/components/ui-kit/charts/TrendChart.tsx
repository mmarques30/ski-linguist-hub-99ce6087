import { useId, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartEmpty, ChartFrame, ChartLegend, axisProps, gridProps, makeTooltipRenderer } from "./ChartPrimitives";
import { seriesColor } from "../palette";

/**
 * Évolution dans le temps : ligne ou aire dégradée, grille en retrait,
 * curseur + infobulle au survol.
 *
 * Une seule échelle Y. Deux mesures d'ordres de grandeur différents → deux
 * graphiques, jamais deux axes.
 */

export interface TrendSeries {
  /** Clé dans les données. */
  key: string;
  /** Libellé affiché en légende et en infobulle. */
  label: string;
  /** Couleur imposée ; sinon l'emplacement de série correspondant. */
  color?: string;
  /** Trait pointillé — pour un comparatif N-1 ou une tendance. */
  dashed?: boolean;
}

export function TrendChart<T extends Record<string, unknown>>({
  data,
  series,
  xKey,
  variant = "area",
  height = 260,
  formatValue,
  formatAxisValue,
  formatLabel,
  emptyMessage,
  ariaLabel,
  showLegend,
  yWidth = 48,
}: {
  data: T[];
  series: TrendSeries[];
  xKey: keyof T & string;
  variant?: "area" | "line";
  height?: number;
  formatValue?: (value: number | string, name: string) => string;
  formatAxisValue?: (value: number) => string;
  formatLabel?: (label: string | number) => string;
  emptyMessage?: string;
  ariaLabel?: string;
  /** Par défaut : légende dès 2 séries (jamais pour une seule). */
  showLegend?: boolean;
  yWidth?: number;
}) {
  const gradientId = useId().replace(/:/g, "");
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);

  const resolved = useMemo(
    () => series.map((item, index) => ({ ...item, color: item.color ?? seriesColor(index) })),
    [series]
  );

  const visible = resolved.filter((item) => !hiddenKeys.includes(item.key));
  const legendVisible = showLegend ?? series.length >= 2;

  if (!data.length) return <ChartEmpty message={emptyMessage} height={height} />;

  const tooltip = makeTooltipRenderer({ formatValue, formatLabel });
  const Chart = variant === "area" ? AreaChart : LineChart;

  return (
    <div className="space-y-3">
      <ChartFrame height={height} ariaLabel={ariaLabel}>
        <Chart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            {resolved.map((item) => (
              <linearGradient
                key={item.key}
                id={`${gradientId}-${item.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={item.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={item.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid {...gridProps} />
          <XAxis dataKey={xKey} {...axisProps} dy={6} minTickGap={16} />
          <YAxis
            {...axisProps}
            width={yWidth}
            tickFormatter={formatAxisValue ? (value: number) => formatAxisValue(value) : undefined}
          />
          <Tooltip
            content={tooltip}
            cursor={{ stroke: "hsl(var(--chart-cursor))", strokeWidth: 1, strokeDasharray: "4 4" }}
          />

          {visible.map((item) =>
            variant === "area" ? (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.color}
                strokeWidth={2}
                strokeDasharray={item.dashed ? "5 4" : undefined}
                fill={`url(#${gradientId}-${item.key})`}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--surface-raised))" }}
                dot={false}
              />
            ) : (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.color}
                strokeWidth={2}
                strokeDasharray={item.dashed ? "5 4" : undefined}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--surface-raised))" }}
                dot={false}
              />
            )
          )}
        </Chart>
      </ChartFrame>

      {legendVisible && (
        <ChartLegend
          items={resolved.map((item) => ({ key: item.key, label: item.label, color: item.color }))}
          hidden={hiddenKeys}
          onToggle={(key) =>
            setHiddenKeys((current) => {
              const next = current.includes(key)
                ? current.filter((item) => item !== key)
                : [...current, key];
              // Ne jamais tout masquer : le dernier reste visible.
              return next.length === resolved.length ? current : next;
            })
          }
        />
      )}
    </div>
  );
}
