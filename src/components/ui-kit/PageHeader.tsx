import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconChip } from "./StatTile";
import type { TileTone } from "./palette";

/**
 * En-tête de page unifié : même position du titre, des actions et de la
 * sous-navigation sur tous les écrans du back-office.
 */

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: TileTone;
  /** Boutons d'action principaux, alignés à droite. */
  actions?: ReactNode;
  /** Badges de contexte affichés sous le titre (saison, gel, état). */
  meta?: ReactNode;
  /** Onglets ou sous-navigation, rendus sous l'en-tête. */
  tabs?: ReactNode;
  /** Élément de retour (lien « ← Liste »). */
  back?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  tone = "gold",
  actions,
  meta,
  tabs,
  back,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("space-y-4", className)}>
      {back && <div className="flex items-center">{back}</div>}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && <IconChip icon={Icon} tone={tone} size="lg" className="mt-0.5 hidden sm:inline-flex" />}
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">{title}</h1>
            {description && (
              <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
            )}
            {meta && <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div>}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">{actions}</div>
        )}
      </div>

      {tabs}
    </header>
  );
}

/**
 * Enveloppe de page : espacement vertical homogène et animation d'entrée.
 * À utiliser comme élément racine du contenu de chaque écran.
 */
export function PageShell({
  children,
  className,
  width = "wide",
}: {
  children: ReactNode;
  className?: string;
  width?: "wide" | "narrow" | "full";
}) {
  return (
    <div
      className={cn(
        "animate-fade-up space-y-5",
        width === "wide" && "mx-auto w-full max-w-[1600px]",
        width === "narrow" && "mx-auto w-full max-w-4xl",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Séparateur de section à l'intérieur d'une page longue. */
export function SectionHeading({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0 space-y-0.5">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
