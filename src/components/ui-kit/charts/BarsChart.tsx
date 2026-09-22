import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";
import { ChartEmpty, ChartFrame, ChartLegend, axisProps, gridProps, makeTooltipRenderer } from "./ChartPrimitives";
import { seriesColor } from "../palette";

/**
 * Comparaison de grandeurs par catégorie. Barres fines à extrémité arrondie
 * (4px côté donnée, ancrées à la ligne de base), 2px de fond entre segments
 * empilés et entre barres voisines.
 */

export interface BarSeries {
  key: string;
  label: string;
  color?: string;
}

export function BarsChart<T extends Record<string, unknown>>({
  data,
  series,
  xKey,
  height = 280,
  stacked = false,
  layout = "vertical",
  formatValue,
  formatAxisValue,
  emptyMessage,
  ariaLabel,
  /** Met en avant une catégorie (index) — le reste passe en retrait. */
  highlightIndex,
  onBarClick,
  showLegend,
  yWidth = 48,
}: {
  data: T[];
  series: BarSeries[];
  xKey: keyof T & string;
  height?: number;
  stacked?: boolean;
  /** `vertical` : barres montantes. `horizontal` : barres couchées. */
  layout?: "vertical" | "horizontal";
  formatValue?: (value: number | string, name: string) => string;
  formatAxisValue?: (value: number) => string;
  emptyMessage?: string;
  ariaLabel?: string;
  highlightIndex?: number | null;
  onBarClick?: (entry: T, index: number) => void;
  showLegend?: boolean;
  yWidth?: number;
  /** Bornes de l'axe des valeurs, quand l'échelle a un sens absolu. */
  yDomain?: [number | "auto", number | "auto"];
}) {
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);

  const resolved = useMemo(
    () => series.map((item, index) => ({ ...item, color: item.color ?? seriesColor(index) })),
    [series]
  );

  const visible = resolved.filter((item) => !hiddenKeys.includes(item.key));
  const legendVisible = showLegend ?? series.length >= 2;
  const singleSeries = resolved.length === 1;

  if (!data.length) return <ChartEmpty message={emptyMessage} height={height} />;

  const tooltip = makeTooltipRenderer({ formatValue });
  const isHorizontal = layout === "horizontal";

  return (
    <div className="space-y-3">
      <ChartFrame height={height} ariaLabel={ariaLabel}>
        <BarChart
          data={data}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 12, bottom: 0, left: isHorizontal ? 8 : 0 }}
          barGap={2}
          barCategoryGap={isHorizontal ? "22%" : "28%"}
        >
          <CartesianGrid {...gridProps} vertical={isHorizontal} horizontal={!isHorizontal} />

          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                {...axisProps}
                domain={yDomain}
                tickFormatter={formatAxisValue ? (value: number) => formatAxisValue(value) : undefined}
              />
              <YAxis type="category" dataKey={xKey} {...axisProps} width={120} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} {...axisProps} dy={6} minTickGap={8} />
              <YAxis
                {...axisProps}
                width={yWidth}
                domain={yDomain}
                tickFormatter={formatAxisValue ? (value: number) => formatAxisValue(value) : undefined}
              />
            </>
          )}

          <Tooltip content={tooltip} cursor={{ fill: "hsl(var(--chart-cursor) / 0.12)" }} />

          {visible.map((item, seriesIndex) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              stackId={stacked ? "stack" : undefined}
              fill={item.color}
              radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              maxBarSize={isHorizontal ? 18 : 42}
              onClick={
                onBarClick
                  ? (_: unknown, index: number) => onBarClick(data[index], index)
                  : undefined
              }
              cursor={onBarClick ? "pointer" : undefined}
            >
              {/* Une seule série : la mise en avant se fait cellule par cellule. */}
              {singleSeries && typeof highlightIndex === "number"
                ? data.map((_, index) => (
                    <Cell
                      key={index}
                      fill={item.color}
                      fillOpacity={index === highlightIndex ? 1 : 0.35}
                    />
                  ))
                : null}
              {/* Fond de 2px entre segments empilés. */}
              {stacked && seriesIndex >= 0 ? null : null}
            </Bar>
          ))}
        </BarChart>
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
              return next.length === resolved.length ? current : next;
            })
          }
        />
      )}
    </div>
  );
}
