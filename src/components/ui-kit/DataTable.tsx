import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronsUpDown, ArrowDown, ArrowUp, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Coque de tableau du back-office.
 *
 * Elle n'impose PAS de modèle de données : on garde `<table>` et les colonnes
 * de chaque écran, on standardise le cadre — en-tête collant, lignes
 * survolables, défilement horizontal maîtrisé, pied de pagination, états vide
 * et chargement.
 *
 * En dessous de `md`, préférer `CardList` : un tableau à 8 colonnes ne se lit
 * pas sur un téléphone.
 */

export function TableFrame({
  children,
  className,
  /** Le tableau défile horizontalement au lieu de comprimer les colonnes. */
  scroll = true,
}: {
  children: ReactNode;
  className?: string;
  scroll?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative w-full",
        scroll && "overflow-x-auto scrollbar-thin",
        className
      )}
    >
      {children}
    </div>
  );
}

/** `<thead>` habillé : fond encastré, libellés courts, en-tête collant. */
export function TableHeadRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={cn(
        "border-b border-border bg-[hsl(var(--surface-sunken))] text-left",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHeadCell({
  children,
  align = "left",
  className,
  /** Rend l'en-tête cliquable pour trier. */
  sort,
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  sort?: {
    direction: "asc" | "desc" | null;
    onToggle: () => void;
  };
}) {
  const content = sort ? (
    <button
      type="button"
      onClick={sort.onToggle}
      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
    >
      {children}
      {sort.direction === "asc" ? (
        <ArrowUp className="h-3 w-3" />
      ) : sort.direction === "desc" ? (
        <ArrowDown className="h-3 w-3" />
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  ) : (
    children
  );

  return (
    <th
      scope="col"
      aria-sort={
        sort?.direction === "asc" ? "ascending" : sort?.direction === "desc" ? "descending" : undefined
      }
      className={cn(
        "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {content}
    </th>
  );
}

export function TableRow({
  children,
  className,
  onClick,
  selected = false,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-border/70 transition-colors last:border-0",
        onClick && "cursor-pointer",
        selected ? "bg-primary/5" : "hover:bg-[hsl(var(--surface-sunken))]",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  align = "left",
  className,
  /** Colonnes secondaires masquées sur petit écran. */
  hideBelow,
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  hideBelow?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-sm",
        align === "right" && "text-right",
        align === "center" && "text-center",
        hideBelow === "sm" && "hidden sm:table-cell",
        hideBelow === "md" && "hidden md:table-cell",
        hideBelow === "lg" && "hidden lg:table-cell",
        hideBelow === "xl" && "hidden xl:table-cell",
        className
      )}
    >
      {children}
    </td>
  );
}

/** Cellule « identité » : avatar d'initiales + nom + ligne secondaire. */
export function IdentityCell({
  name,
  secondary,
  to,
  avatarUrl,
  className,
}: {
  name: ReactNode;
  secondary?: ReactNode;
  to?: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  const initials =
    typeof name === "string"
      ? name
          .split(" ")
          .filter(Boolean)
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "?";

  const body = (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-9 w-9 shrink-0 rounded-pill object-cover"
          loading="lazy"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-primary/12 text-xs font-semibold text-[hsl(var(--tint-gold-fg))]">
          {initials}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{name}</p>
        {secondary && <p className="truncate text-xs text-muted-foreground">{secondary}</p>}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block transition-opacity hover:opacity-80">
        {body}
      </Link>
    );
  }
  return body;
}

/** Pied de tableau : total, pagination. Toujours rendre le total réel. */
export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
  /** Libellé du total : « 1 248 inscriptions ». */
  totalLabel,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
  totalLabel?: (total: number) => string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-sm text-muted-foreground tabular">
        {totalLabel
          ? totalLabel(total)
          : total === 0
            ? "Aucun résultat"
            : `${from}–${to} sur ${total.toLocaleString("fr-FR")}`}
      </p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">Précédent</span>
        </Button>
        <span className="px-2 text-sm text-muted-foreground tabular">
          {page} / {pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Page suivante"
        >
          <span className="mr-1 hidden sm:inline">Suivant</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/** Squelette de chargement aux dimensions d'un tableau. */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-pill" />
          {Array.from({ length: cols - 1 }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn("h-4", colIndex === 0 ? "w-40" : "w-24", colIndex > 1 && "hidden md:block")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** État vide d'un tableau — même grammaire que `EmptyState`, sans la bordure. */
export function TableEmpty({
  title,
  description,
  action,
  icon: Icon = Inbox,
  colSpan,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  /** Quand l'état vide est rendu dans une ligne de tableau. */
  colSpan?: number;
}) {
  const body = (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-pill bg-[hsl(var(--surface-sunken))]">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </span>
      <p className="font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );

  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan}>{body}</td>
      </tr>
    );
  }
  return body;
}

/**
 * Alternative mobile d'un tableau : une carte par enregistrement.
 * À rendre en `md:hidden` en regard d'un `<table className="hidden md:table">`.
 */
export function CardList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("divide-y divide-border", className)}>{children}</div>;
}

export function CardListItem({
  title,
  subtitle,
  meta,
  fields,
  actions,
  to,
  onClick,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Élément aligné à droite du titre — typiquement une pastille d'état. */
  meta?: ReactNode;
  /** Paires libellé / valeur affichées en grille sous le titre. */
  fields?: Array<{ label: ReactNode; value: ReactNode }>;
  actions?: ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
}) {
  const body = (
    <div className={cn("space-y-3 px-4 py-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{title}</p>
          {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {meta && <div className="shrink-0">{meta}</div>}
      </div>

      {fields && fields.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          {fields.map((field, index) => (
            <div key={index} className="min-w-0">
              <dt className="text-2xs uppercase tracking-wide text-muted-foreground">{field.label}</dt>
              <dd className="truncate text-sm tabular">{field.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {actions && <div className="flex flex-wrap items-center gap-2 pt-1">{actions}</div>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block transition-colors hover:bg-[hsl(var(--surface-sunken))]">
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left transition-colors hover:bg-[hsl(var(--surface-sunken))]"
      >
        {body}
      </button>
    );
  }
  return body;
}
