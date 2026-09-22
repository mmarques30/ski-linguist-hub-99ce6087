import { useId } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { seriesColor } from "../palette";

/**
 * Mini-courbe sans axes, destinée à l'intérieur d'une tuile KPI : elle donne
 * la forme de la période, pas ses valeurs. Le chiffre exact reste porté par
 * la tuile — la courbe ne remplace jamais une lecture précise.
 *
 * Dessinée à la main en SVG plutôt qu'avec recharts : à cette taille, un
 * conteneur responsive et une infobulle coûteraient plus qu'ils n'apportent.
 */
export function Sparkline({
  points,
  height = 36,
  color = "hsl(var(--chart-1))",
  className,
  ariaLabel,
  variant = "area",
}: {
  points: number[];
  height?: number;
  color?: string;
  className?: string;
  ariaLabel?: string;
  variant?: "area" | "line" | "bars";
}) {
  const gradientId = useId().replace(/:/g, "");
  if (points.length < 2) return null;

  const width = 100;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const step = width / (points.length - 1);

  const coords = points.map((value, index) => ({
    x: index * step,
    y: height - ((value - min) / span) * (height - 4) - 2,
  }));

  const line = coords
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height }}
      role="img"
      aria-label={ariaLabel}
    >
      {variant === "bars" ? (
        points.map((value, index) => {
          const barHeight = ((value - min) / span) * (height - 2);
          const barWidth = Math.max(1, step * 0.6);
          return (
            <rect
              key={index}
              x={index * step - barWidth / 2 + barWidth / 2}
              y={height - barHeight}
              width={barWidth}
              height={Math.max(1, barHeight)}
              rx={1}
              fill={color}
              opacity={0.85}
            />
          );
        })
      ) : (
        <>
          {variant === "area" && (
            <>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <path d={area} fill={`url(#${gradientId})`} />
            </>
          )}
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
    </svg>
  );
}

export interface FunnelStageItem {
  key: string;
  label: string;
  value: number;
  /** Conversion depuis l'étape précédente, en pourcentage. */
  conversion?: number | null;
  href?: string;
}

/**
 * Entonnoir : une barre par étape, largeur proportionnelle à la première, et
 * la conversion depuis l'étape précédente affichée en clair. On lit où le
 * processus perd, pas seulement combien il reste.
 */
export function FunnelBars({
  stages,
  className,
  emptyMessage = "Aucune donnée",
}: {
  stages: FunnelStageItem[];
  className?: string;
  emptyMessage?: string;
}) {
  if (!stages.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  // Échelle commune : le plus grand volume, pour qu'aucune barre ne déborde
  // quand une étape compte plus d'éléments que la première.
  const scale = Math.max(...stages.map((stage) => stage.value), 1);

  return (
    <ol className={cn("space-y-2.5", className)}>
      {stages.map((stage, index) => {
        const ratio = Math.max(0.02, Math.min(1, stage.value / scale));
        const color = seriesColor(index);

        const body = (
          <div className="group">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-sm text-foreground">{stage.label}</span>
              <span className="flex shrink-0 items-baseline gap-2">
                {typeof stage.conversion === "number" && (
                  <span className="text-xs tabular text-muted-foreground">
                    {stage.conversion}%
                  </span>
                )}
                <span className="text-sm font-semibold tabular text-foreground">
                  {stage.value.toLocaleString("fr-FR")}
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-pill bg-[hsl(var(--chart-grid))]">
              <div
                className="h-full rounded-pill transition-[width] duration-500 ease-emphasized"
                style={{ width: `${ratio * 100}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );

        return (
          <li key={stage.key}>
            {stage.href ? (
              <Link
                to={stage.href}
                className="block rounded-[var(--radius)] p-1 -m-1 transition-colors hover:bg-[hsl(var(--surface-sunken))]"
              >
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ol>
  );
}
