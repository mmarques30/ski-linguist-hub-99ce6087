import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { seriesColor } from "../palette";

/**
 * Jauges et barres classées — les formes « une valeur, une cible » des
 * références : liste de barres horizontales, anneau de progression, demi-jauge.
 * Toutes portent le chiffre en clair : la couleur n'est jamais seule.
 */

/* ------------------------------------------------------- Barres classées */

export interface RankedBarItem {
  key: string;
  label: ReactNode;
  value: number;
  /** Valeur affichée si différente de `value` (montant formaté, « 42 % »). */
  display?: ReactNode;
  color?: string;
  /** Ligne secondaire sous le libellé. */
  hint?: ReactNode;
  href?: string;
}

/**
 * Liste de barres horizontales : libellé, piste, valeur alignée à droite.
 * Le maximum sert d'échelle commune — jamais une échelle par ligne.
 */
export function RankedBarList({
  items,
  max,
  className,
  barHeight = 8,
  emptyMessage = "Aucune donnée",
  /** Répartit une couleur de série par ligne au lieu d'une teinte unique. */
  colorBySeries = false,
}: {
  items: RankedBarItem[];
  max?: number;
  className?: string;
  barHeight?: number;
  emptyMessage?: string;
  colorBySeries?: boolean;
}) {
  if (!items.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const scale = max ?? Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className={cn("space-y-3.5", className)}>
      {items.map((item, index) => {
        const ratio = scale > 0 ? Math.max(0, Math.min(1, item.value / scale)) : 0;
        const color = item.color ?? (colorBySeries ? seriesColor(index) : "hsl(var(--chart-1))");

        const row = (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-sm text-foreground">{item.label}</span>
              <span className="shrink-0 text-sm font-semibold tabular text-foreground">
                {item.display ?? item.value.toLocaleString("fr-FR")}
              </span>
            </div>
            <div
              className="mt-1.5 w-full overflow-hidden rounded-pill bg-[hsl(var(--chart-grid))]"
              style={{ height: barHeight }}
              role="meter"
              aria-valuenow={item.value}
              aria-valuemin={0}
              aria-valuemax={scale}
            >
              <div
                className="h-full rounded-pill transition-[width] duration-500 ease-emphasized"
                style={{ width: `${ratio * 100}%`, backgroundColor: color }}
              />
            </div>
            {item.hint && <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>}
          </>
        );

        return (
          <li key={item.key}>
            {item.href ? (
              <Link
                to={item.href}
                className="block rounded-[var(--radius)] p-1 -m-1 transition-colors hover:bg-[hsl(var(--surface-sunken))]"
              >
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------ Anneau de progression */

/** Anneau de progression avec valeur au centre. */
export function ProgressRing({
  value,
  max = 100,
  size = 96,
  thickness = 8,
  color = "hsl(var(--chart-1))",
  label,
  children,
  className,
}: {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  color?: string;
  label?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const radius = size / 2 - thickness / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = ratio * circumference;

  return (
    <div className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--chart-grid))"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          className="transition-[stroke-dasharray] duration-700 ease-emphasized"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children ?? (
          <>
            <span className="text-base font-bold tabular text-foreground">
              {Math.round(ratio * 100)}%
            </span>
            {label && <span className="text-2xs text-muted-foreground">{label}</span>}
          </>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Demi-jauge */

/**
 * Demi-jauge « 0 → 100 » : une mesure unique face à sa cible, avec les bornes
 * affichées aux extrémités (référence 5).
 */
export function GaugeMeter({
  value,
  max = 100,
  min = 0,
  size = 180,
  color = "hsl(var(--chart-1))",
  label,
  icon: Icon,
  className,
  formatValue,
}: {
  value: number;
  max?: number;
  min?: number;
  size?: number;
  color?: string;
  label?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  formatValue?: (value: number) => string;
}) {
  const span = max - min || 1;
  const ratio = Math.max(0, Math.min(1, (value - min) / span));
  const thickness = 14;
  const radius = size / 2 - thickness / 2;
  const circumference = Math.PI * radius; // demi-cercle
  const filled = ratio * circumference;
  const height = size / 2 + 12;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height }}>
        <svg
          width={size}
          height={height}
          viewBox={`0 0 ${size} ${height}`}
          role="meter"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
        >
          <path
            d={`M ${thickness / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - thickness / 2} ${size / 2}`}
            fill="none"
            stroke="hsl(var(--chart-grid))"
            strokeWidth={thickness}
            strokeLinecap="round"
          />
          <path
            d={`M ${thickness / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - thickness / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
            className="transition-[stroke-dasharray] duration-700 ease-emphasized"
          />
        </svg>

        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
          {Icon && (
            <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-pill bg-[hsl(var(--surface-sunken))] text-foreground">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <span className="text-xl font-bold tabular text-foreground">
            {formatValue ? formatValue(value) : `${Math.round(ratio * 100)}%`}
          </span>
        </div>

        <span className="absolute bottom-0 left-0 text-2xs text-muted-foreground tabular">{min}</span>
        <span className="absolute bottom-0 right-0 text-2xs text-muted-foreground tabular">{max}</span>
      </div>

      {label && <p className="mt-1 text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}

/* ------------------------------------------------------------- Mini barres */

/**
 * Barre de progression compacte avec libellé et pourcentage — pour les
 * checklists et les listes de complétion.
 */
export function MeterRow({
  label,
  value,
  max = 100,
  color = "hsl(var(--chart-1))",
  display,
  className,
}: {
  label: ReactNode;
  value: number;
  max?: number;
  color?: string;
  display?: ReactNode;
  className?: string;
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-muted-foreground">{label}</span>
        <span className="shrink-0 font-semibold tabular text-foreground">
          {display ?? `${Math.round(ratio * 100)}%`}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-pill bg-[hsl(var(--chart-grid))]"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className="h-full rounded-pill transition-[width] duration-500 ease-emphasized"
          style={{ width: `${ratio * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
