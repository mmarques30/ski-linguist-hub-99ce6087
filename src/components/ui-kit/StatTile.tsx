import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { TileTone } from "./palette";

/**
 * Tuile KPI : chip d'icône teintée, valeur en gros, libellé, écart vs période
 * précédente, et — quand la donnée existe — une destination cliquable.
 *
 * Règle produit : tout compteur mène quelque part. `to` ou `onClick` doivent
 * être fournis dès qu'une liste correspond au chiffre affiché.
 */

export interface StatTileDelta {
  /** Écart en pourcentage (déjà calculé). */
  value: number;
  /** Ce à quoi on compare — « vs mois dernier ». */
  label?: string;
  /**
   * Sens « une hausse est-elle une bonne nouvelle ? ». Pour un impayé ou un
   * retard, passer `inverted` afin que la hausse s'affiche en rouge.
   */
  inverted?: boolean;
}

interface StatTileProps {
  label: string;
  value: ReactNode;
  /** Ligne secondaire sous la valeur. */
  hint?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: TileTone;
  delta?: StatTileDelta;
  /** Rendu en carte pastel pleine (référence visuelle) ou en carte blanche. */
  variant?: "soft" | "plain";
  to?: string;
  onClick?: () => void;
  loading?: boolean;
  /** Contenu libre en pied de tuile : sparkline, barre de progression. */
  children?: ReactNode;
  className?: string;
}

const toneSoft: Record<TileTone, string> = {
  gold: "bg-[hsl(var(--tint-gold-bg))] border-[hsl(var(--tint-gold-ring))]",
  blue: "bg-[hsl(var(--tint-blue-bg))] border-[hsl(var(--tint-blue-ring))]",
  teal: "bg-[hsl(var(--tint-teal-bg))] border-[hsl(var(--tint-teal-ring))]",
  purple: "bg-[hsl(var(--tint-purple-bg))] border-[hsl(var(--tint-purple-ring))]",
  orange: "bg-[hsl(var(--tint-orange-bg))] border-[hsl(var(--tint-orange-ring))]",
  rose: "bg-[hsl(var(--tint-rose-bg))] border-[hsl(var(--tint-rose-ring))]",
  navy: "bg-[hsl(var(--tint-navy-bg))] border-[hsl(var(--tint-navy-ring))]",
  neutral: "bg-[hsl(var(--tint-neutral-bg))] border-[hsl(var(--tint-neutral-ring))]",
};

const toneChip: Record<TileTone, string> = {
  gold: "bg-[hsl(var(--tint-gold-fg))]/12 text-[hsl(var(--tint-gold-fg))]",
  blue: "bg-[hsl(var(--tint-blue-fg))]/12 text-[hsl(var(--tint-blue-fg))]",
  teal: "bg-[hsl(var(--tint-teal-fg))]/12 text-[hsl(var(--tint-teal-fg))]",
  purple: "bg-[hsl(var(--tint-purple-fg))]/12 text-[hsl(var(--tint-purple-fg))]",
  orange: "bg-[hsl(var(--tint-orange-fg))]/12 text-[hsl(var(--tint-orange-fg))]",
  rose: "bg-[hsl(var(--tint-rose-fg))]/12 text-[hsl(var(--tint-rose-fg))]",
  navy: "bg-[hsl(var(--tint-navy-fg))]/12 text-[hsl(var(--tint-navy-fg))]",
  neutral: "bg-[hsl(var(--tint-neutral-fg))]/12 text-[hsl(var(--tint-neutral-fg))]",
};

/** Chip d'icône teintée — réutilisable hors des tuiles. */
export function IconChip({
  icon: Icon,
  tone = "neutral",
  size = "md",
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone?: TileTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "fli-icon-chip",
        toneChip[tone],
        size === "sm" && "h-8 w-8",
        size === "md" && "h-10 w-10",
        size === "lg" && "h-12 w-12",
        className
      )}
    >
      <Icon
        className={cn(size === "sm" && "h-4 w-4", size === "md" && "h-5 w-5", size === "lg" && "h-6 w-6")}
      />
    </span>
  );
}

/** Badge d'écart — flèche + valeur + libellé de comparaison. */
export function DeltaBadge({ delta, className }: { delta: StatTileDelta; className?: string }) {
  const neutral = delta.value === 0;
  const rising = delta.value > 0;
  const favourable = delta.inverted ? !rising : rising;
  const Icon = neutral ? Minus : rising ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-pill px-1.5 py-0.5 tabular",
          neutral && "bg-muted text-muted-foreground",
          !neutral && favourable && "bg-[hsl(var(--status-good))]/12 text-[hsl(var(--status-good))]",
          !neutral && !favourable && "bg-[hsl(var(--status-critical))]/12 text-[hsl(var(--status-critical))]"
        )}
      >
        <Icon className="h-3 w-3" aria-hidden />
        {neutral ? "0" : `${rising ? "+" : ""}${delta.value.toFixed(1)}`}%
      </span>
      {delta.label && <span className="text-muted-foreground">{delta.label}</span>}
    </span>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  delta,
  variant = "soft",
  to,
  onClick,
  loading = false,
  children,
  className,
}: StatTileProps) {
  const clickable = Boolean(to || onClick);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && <IconChip icon={Icon} tone={tone} size="md" />}
      </div>

      <div className="mt-3 space-y-1">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-metric tabular text-foreground">{value}</p>
        )}
        {hint && !loading && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>

      {delta && !loading && <DeltaBadge delta={delta} className="mt-3" />}
      {children && <div className="mt-3">{children}</div>}
    </>
  );

  const shell = cn(
    "flex h-full flex-col rounded-[var(--radius-card)] border p-4 text-left transition-all duration-200 sm:p-5",
    variant === "soft" ? toneSoft[tone] : "border-border bg-card shadow-sm",
    clickable && "hover:-translate-y-0.5 hover:shadow-md focus-visible:-translate-y-0.5",
    className
  );

  if (to) {
    return (
      <Link to={to} className={shell} aria-label={typeof value === "string" ? `${label} : ${value}` : label}>
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(shell, "w-full")}>
        {body}
      </button>
    );
  }

  return <div className={shell}>{body}</div>;
}

/** Bandeau de tuiles KPI : 1 colonne en mobile, jusqu'à 4 en grand écran. */
export function StatTileGrid({
  children,
  className,
  cols = 4,
}: {
  children: ReactNode;
  className?: string;
  cols?: 2 | 3 | 4 | 5;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4",
        cols === 2 && "xs:grid-cols-2",
        cols === 3 && "xs:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "xs:grid-cols-2 lg:grid-cols-4",
        cols === 5 && "xs:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5",
        className
      )}
    >
      {children}
    </div>
  );
}
