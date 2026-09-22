import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Contrôles récurrents : segments de période, barre de filtres, chips de
 * filtres actifs, sous-navigation en pastilles.
 */

/* ---------------------------------------------------------------- Segments */

export interface SegmentOption<T extends string = string> {
  value: T;
  label: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  /** Compteur affiché en pastille (nombre de lignes de l'onglet). */
  count?: number;
}

/**
 * Sélecteur segmenté (« Jour / Semaine / Mois »). Défile horizontalement en
 * mobile plutôt que de compresser les libellés.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
  ariaLabel,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-pill border border-border bg-[hsl(var(--surface-sunken))] p-1 scrollbar-thin",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-pill font-medium transition-all duration-200",
              size === "sm" ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.icon && <option.icon className="h-3.5 w-3.5" />}
            {option.label}
            {typeof option.count === "number" && (
              <span
                className={cn(
                  "rounded-pill px-1.5 text-2xs tabular",
                  active ? "bg-primary/15 text-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------- Sous-navigation */

export interface SubNavItem {
  to: string;
  label: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

/** Sous-navigation par routes, en pastilles — même grammaire que les segments. */
export function SubNav({ items, className }: { items: SubNavItem[]; className?: string }) {
  return (
    <nav
      className={cn(
        "flex max-w-full items-center gap-1 overflow-x-auto rounded-pill border border-border bg-[hsl(var(--surface-sunken))] p-1 scrollbar-thin",
        className
      )}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {item.icon && <item.icon className="h-3.5 w-3.5" />}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------- Barre filtres */

/**
 * Barre de filtres : recherche à gauche, contrôles au centre, actions à droite.
 * Les filtres actifs sont rappelés en chips effaçables sous la barre.
 */
const FILTER_BAR_LABELS = {
  activeFilters: {
    fr: "Filtres actifs",
    "pt-BR": "Filtros ativos",
    en: "Active filters",
  },
  clearAll: {
    fr: "Tout effacer",
    "pt-BR": "Limpar tudo",
    en: "Clear all",
  },
  removeFilter: {
    fr: "Retirer ce filtre",
    "pt-BR": "Remover este filtro",
    en: "Remove this filter",
  },
} as const;

export function FilterBar({
  search,
  filters,
  actions,
  activeFilters,
  onClearAll,
  className,
  labels,
}: {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    /** Libellé accessible quand le champ n'a pas de <label> visible. */
    ariaLabel?: string;
  };
  filters?: ReactNode;
  actions?: ReactNode;
  activeFilters?: Array<{ key: string; label: ReactNode; onRemove?: () => void }>;
  onClearAll?: () => void;
  className?: string;
  /** Surcharge des libellés internes, quand l'écran a sa propre formulation. */
  labels?: { activeFilters?: string; clearAll?: string; removeFilter?: string };
}) {
  const { t } = useLanguage();
  const hasChips = Boolean(activeFilters && activeFilters.length > 0);
  const activeFiltersLabel = labels?.activeFilters ?? t(FILTER_BAR_LABELS.activeFilters);
  const clearAllLabel = labels?.clearAll ?? t(FILTER_BAR_LABELS.clearAll);
  const removeFilterLabel = labels?.removeFilter ?? t(FILTER_BAR_LABELS.removeFilter);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {search && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
                placeholder={search.placeholder}
                aria-label={search.ariaLabel ?? search.placeholder}
                className="pl-9"
              />
            </div>
          )}
          {filters && (
            <div className="flex flex-wrap items-center gap-2">{filters}</div>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {hasChips && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {activeFiltersLabel}
          </span>
          {activeFilters!.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="gap-1 rounded-pill font-normal"
            >
              {filter.label}
              {filter.onRemove && (
                <button
                  type="button"
                  onClick={filter.onRemove}
                  className="ml-0.5 rounded-pill p-0.5 transition-colors hover:bg-foreground/10"
                  aria-label={removeFilterLabel}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {onClearAll && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-7 px-2 text-xs"
            >
              {clearAllLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
