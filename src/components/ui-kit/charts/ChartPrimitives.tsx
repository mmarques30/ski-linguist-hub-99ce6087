import { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { seriesColor } from "../palette";

/**
 * Briques communes à tous les graphiques : conteneur responsive, infobulle,
 * légende. Elles fixent la grammaire visuelle (marques fines, grille en
 * retrait, texte en encre neutre) pour que deux graphiques de deux écrans
 * différents se lisent pareil.
 */

/** Conteneur responsive à hauteur explicite — jamais de hauteur en %. */
export function ChartFrame({
  children,
  height = 260,
  className,
  /** Description lue par les lecteurs d'écran à la place du dessin. */
  ariaLabel,
}: {
  children: ReactNode;
  height?: number;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      className={cn("w-full", className)}
      style={{ height }}
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children as never}
      </ResponsiveContainer>
    </div>
  );
}

export interface TooltipEntry {
  name: string;
  value: number | string;
  color?: string;
}

/**
 * Infobulle : carte surélevée, titre = point de l'axe, une ligne par série
 * avec pastille de couleur. Le texte reste en encre neutre, la pastille porte
 * l'identité.
 */
export function ChartTooltipCard({
  title,
  entries,
  footer,
  formatValue,
}: {
  title?: ReactNode;
  entries: TooltipEntry[];
  footer?: ReactNode;
  formatValue?: (value: number | string, name: string) => ReactNode;
}) {
  return (
    <div className="pointer-events-none min-w-[10rem] rounded-[var(--radius)] border border-border bg-popover p-3 shadow-lg">
      {title && (
        <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      )}
      <ul className="space-y-1.5">
        {entries.map((entry, index) => (
          <li key={`${entry.name}-${index}`} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: entry.color ?? seriesColor(index) }}
                aria-hidden
              />
              <span className="truncate text-muted-foreground">{entry.name}</span>
            </span>
            <span className="shrink-0 font-semibold tabular text-foreground">
              {formatValue ? formatValue(entry.value, entry.name) : entry.value}
            </span>
          </li>
        ))}
      </ul>
      {footer && <div className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">{footer}</div>}
    </div>
  );
}

/** Adaptateur de l'infobulle recharts vers `ChartTooltipCard`. */
export function makeTooltipRenderer(options?: {
  formatValue?: (value: number | string, name: string) => ReactNode;
  formatLabel?: (label: string | number) => ReactNode;
  footer?: (payload: readonly unknown[]) => ReactNode;
}) {
  return function TooltipRenderer(props: {
    active?: boolean;
    payload?: Array<{ name?: string; value?: number | string; color?: string; dataKey?: string }>;
    label?: string | number;
  }) {
    if (!props.active || !props.payload?.length) return null;
    return (
      <ChartTooltipCard
        title={options?.formatLabel ? options.formatLabel(props.label ?? "") : props.label}
        entries={props.payload.map((item) => ({
          name: item.name ?? String(item.dataKey ?? ""),
          value: item.value ?? 0,
          color: item.color,
        }))}
        formatValue={options?.formatValue}
        footer={options?.footer?.(props.payload)}
      />
    );
  };
}

/**
 * Légende : toujours présente dès 2 séries — l'identité ne repose jamais sur
 * la seule couleur. Cliquable pour isoler une série quand `onToggle` est
 * fourni.
 */
export function ChartLegend({
  items,
  className,
  layout = "row",
  onToggle,
  hidden = [],
}: {
  items: Array<{ key: string; label: ReactNode; color: string; value?: ReactNode }>;
  className?: string;
  layout?: "row" | "column";
  onToggle?: (key: string) => void;
  hidden?: string[];
}) {
  return (
    <ul
      className={cn(
        layout === "row" ? "flex flex-wrap items-center gap-x-4 gap-y-2" : "space-y-2.5",
        className
      )}
    >
      {items.map((item) => {
        const isHidden = hidden.includes(item.key);
        const content = (
          <>
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: item.color, opacity: isHidden ? 0.3 : 1 }}
                aria-hidden
              />
              <span className={cn("truncate text-sm", isHidden ? "text-muted-foreground/60" : "text-muted-foreground")}>
                {item.label}
              </span>
            </span>
            {item.value !== undefined && (
              <span className="shrink-0 text-sm font-semibold tabular text-foreground">{item.value}</span>
            )}
          </>
        );

        return (
          <li key={item.key} className={layout === "column" ? "w-full" : undefined}>
            {onToggle ? (
              <button
                type="button"
                onClick={() => onToggle(item.key)}
                aria-pressed={!isHidden}
                className={cn(
                  "flex w-full items-center rounded-md px-1 py-0.5 text-left transition-colors hover:bg-[hsl(var(--surface-sunken))]",
                  layout === "column" ? "justify-between gap-4" : "gap-2"
                )}
              >
                {content}
              </button>
            ) : (
              <span
                className={cn(
                  "flex items-center",
                  layout === "column" ? "w-full justify-between gap-4" : "gap-2"
                )}
              >
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Axes et grille communs — définis une fois, réutilisés par chaque graphique. */
export const axisProps = {
  stroke: "hsl(var(--chart-axis))",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

export const gridProps = {
  stroke: "hsl(var(--chart-grid))",
  strokeDasharray: "4 4",
  vertical: false,
} as const;

/** État vide d'un graphique — jamais un dessin vide sans explication. */
export function ChartEmpty({
  message = "Aucune donnée sur la période",
  height = 260,
}: {
  message?: string;
  height?: number;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-[var(--radius)] border border-dashed border-border bg-[hsl(var(--surface-sunken))] text-sm text-muted-foreground"
      style={{ height }}
    >
      {message}
    </div>
  );
}
