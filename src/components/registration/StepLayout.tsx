import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SurfaceCard } from "@/components/ui-kit";

/**
 * Habillage commun des étapes du formulaire public d'inscription.
 *
 * Purement visuel : aucune règle métier ici — chaque étape garde ses champs,
 * ses validations et son bouton d'action. Le kit n'ayant pas de brique
 * « étape d'assistant », on la compose localement à partir de `SurfaceCard`.
 */

export function StepCard({
  title,
  description,
  icon,
  children,
  className,
  bodyClassName,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <SurfaceCard
      title={title}
      description={description}
      icon={icon}
      className={className}
      bodyClassName={bodyClassName}
    >
      {children}
    </SurfaceCard>
  );
}

/**
 * Barre d'action de l'étape : collée en bas de l'écran sur mobile (le doigt
 * reste sur le bouton pendant que le formulaire défile), posée dans le flux
 * à partir de `sm`. À rendre **hors** de la `SurfaceCard` — une carte en
 * `overflow-hidden` annule `position: sticky`.
 */
export function StepActions({
  children,
  hint,
  className,
}: {
  children: ReactNode;
  /** Ligne d'aide affichée au-dessus des boutons (état de complétion…). */
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 -mx-4 border-t border-border bg-[hsl(var(--surface-raised))]/95 px-4 py-3 backdrop-blur",
        "sm:static sm:z-auto sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none",
        className
      )}
    >
      {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
      <div className="flex flex-col gap-2 sm:flex-row-reverse sm:items-center sm:justify-start">
        {children}
      </div>
    </div>
  );
}

/** Bloc encastré « libellé → valeur » utilisé dans les récapitulatifs. */
export function SummaryRow({
  label,
  value,
  emphasis = false,
}: {
  label: ReactNode;
  value: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1",
        emphasis && "border-t border-border pt-2 font-semibold"
      )}
    >
      <span className={cn("text-sm", emphasis ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
      <span className="min-w-0 max-w-[65%] text-right text-sm font-medium tabular text-foreground">
        {value}
      </span>
    </div>
  );
}

/** Zone encastrée d'un récapitulatif (tarifs, informations saisies). */
export function SummaryPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-[var(--radius-card)] bg-[hsl(var(--surface-sunken))] p-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Option cochable pleine largeur (radio ou case) : la cible tactile couvre
 * toute la carte, l'état sélectionné se lit sans la couleur seule.
 */
export function OptionCard({
  selected = false,
  className,
  children,
  dashed = false,
}: {
  selected?: boolean;
  className?: string;
  children: ReactNode;
  dashed?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border transition-colors",
        dashed ? "border-dashed" : "",
        selected
          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
          : "border-border bg-card hover:bg-[hsl(var(--surface-sunken))]",
        className
      )}
    >
      {children}
    </div>
  );
}
