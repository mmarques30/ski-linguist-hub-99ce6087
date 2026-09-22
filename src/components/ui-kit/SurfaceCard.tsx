import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Coque de carte du back-office : surface blanche, rayon 16px, bordure
 * discrète, ombre douce. Remplace l'usage direct de <Card> pour tout ce qui
 * porte un en-tête « titre + action à droite ».
 */

interface SurfaceCardProps {
  /** Titre de section. */
  title?: ReactNode;
  /** Sous-titre / contexte (période comparée, source…). */
  description?: ReactNode;
  /** Icône décorative à gauche du titre. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Contrôles alignés à droite de l'en-tête (sélecteur, export, « Voir tout »). */
  actions?: ReactNode;
  /** Bandeau sous l'en-tête : filtres, onglets internes. */
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  /** Retire le padding du corps (tableaux pleine largeur). */
  flush?: boolean;
  /** Profondeur au survol — pour les cartes cliquables. */
  interactive?: boolean;
  /** Accent coloré en filet supérieur. */
  accent?: "none" | "primary" | "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5" | "chart-6";
}

const accentBar: Record<NonNullable<SurfaceCardProps["accent"]>, string> = {
  none: "",
  primary: "before:bg-primary",
  "chart-1": "before:bg-[hsl(var(--chart-1))]",
  "chart-2": "before:bg-[hsl(var(--chart-2))]",
  "chart-3": "before:bg-[hsl(var(--chart-3))]",
  "chart-4": "before:bg-[hsl(var(--chart-4))]",
  "chart-5": "before:bg-[hsl(var(--chart-5))]",
  "chart-6": "before:bg-[hsl(var(--chart-6))]",
};

export const SurfaceCard = forwardRef<HTMLDivElement, SurfaceCardProps>(function SurfaceCard(
  {
    title,
    description,
    icon: Icon,
    actions,
    toolbar,
    footer,
    children,
    className,
    bodyClassName,
    headerClassName,
    flush = false,
    interactive = false,
    accent = "none",
  },
  ref
) {
  const hasHeader = Boolean(title || description || actions);

  return (
    <div
      ref={ref}
      className={cn(
        interactive ? "fli-surface-interactive" : "fli-surface",
        "relative flex flex-col overflow-hidden",
        accent !== "none" &&
          cn(
            "before:absolute before:inset-x-0 before:top-0 before:h-1 before:content-['']",
            accentBar[accent]
          ),
        className
      )}
    >
      {hasHeader && (
        <div
          className={cn(
            "flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5 sm:pt-5",
            headerClassName
          )}
        >
          <div className="min-w-0 space-y-0.5">
            {title && (
              <h3 className="flex items-center gap-2 text-base font-semibold leading-tight text-foreground">
                {Icon && (
                  <span className="fli-icon-chip h-7 w-7 bg-[hsl(var(--tint-neutral-bg))] text-[hsl(var(--tint-neutral-fg))]">
                    <Icon className="h-4 w-4" />
                  </span>
                )}
                <span className="truncate">{title}</span>
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>
      )}

      {toolbar && (
        <div className={cn("px-4 sm:px-5", hasHeader ? "pt-3" : "pt-4 sm:pt-5")}>{toolbar}</div>
      )}

      <div
        className={cn(
          "flex-1 min-w-0",
          flush ? (hasHeader || toolbar ? "mt-4" : "") : "p-4 sm:p-5",
          !flush && (hasHeader || toolbar) && "pt-4",
          bodyClassName
        )}
      >
        {children}
      </div>

      {footer && (
        <div className="border-t border-border bg-[hsl(var(--surface-sunken))] px-4 py-3 sm:px-5">
          {footer}
        </div>
      )}
    </div>
  );
});

/** Grille responsive standard pour un ensemble de cartes. */
export function CardGrid({
  children,
  className,
  cols = 3,
}: {
  children: ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 xl:grid-cols-3",
        cols === 4 && "sm:grid-cols-2 xl:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Découpe une page en deux colonnes (contenu principal + rail).
 * En dessous de 1280px, le rail passe sous le contenu.
 */
export function SplitLayout({
  main,
  rail,
  className,
  railWidth = "narrow",
}: {
  main: ReactNode;
  rail: ReactNode;
  className?: string;
  railWidth?: "narrow" | "wide";
}) {
  return (
    <div
      className={cn(
        "grid gap-4 lg:gap-5",
        railWidth === "narrow" ? "xl:grid-cols-[minmax(0,1fr)_340px]" : "xl:grid-cols-[minmax(0,1fr)_420px]",
        className
      )}
    >
      <div className="min-w-0 space-y-4 lg:space-y-5">{main}</div>
      <aside className="min-w-0 space-y-4 lg:space-y-5">{rail}</aside>
    </div>
  );
}
