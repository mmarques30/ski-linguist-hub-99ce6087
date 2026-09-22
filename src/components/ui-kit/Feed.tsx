import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { IconChip } from "./StatTile";
import type { TileTone } from "./palette";

/**
 * Flux d'activité et listes compactes : les blocs « Recent Activities »,
 * « Rank Performance » et « Attention units » des références.
 */

export interface FeedItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Horodatage déjà formaté (« il y a 40 min »). */
  timestamp?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: TileTone;
  to?: string;
  onClick?: () => void;
  /** Élément aligné à droite : pastille d'état, montant. */
  trailing?: ReactNode;
}

export function ActivityFeed({
  items,
  className,
  emptyMessage = "Aucune activité récente",
  /** Trait vertical reliant les entrées — pour un historique chronologique. */
  connected = false,
}: {
  items: FeedItem[];
  className?: string;
  emptyMessage?: string;
  connected?: boolean;
}) {
  if (!items.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className={cn("relative", connected ? "space-y-0" : "space-y-1", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        const body = (
          <div className={cn("flex gap-3", connected ? "pb-5" : "")}>
            <div className="relative flex shrink-0 flex-col items-center">
              {item.icon ? (
                <IconChip icon={item.icon} tone={item.tone ?? "neutral"} size="sm" />
              ) : (
                <span
                  className={cn(
                    "mt-1.5 h-2.5 w-2.5 rounded-pill",
                    item.tone === "teal" && "bg-[hsl(var(--tint-teal-fg))]",
                    item.tone === "gold" && "bg-[hsl(var(--tint-gold-fg))]",
                    item.tone === "rose" && "bg-[hsl(var(--tint-rose-fg))]",
                    item.tone === "blue" && "bg-[hsl(var(--tint-blue-fg))]",
                    !item.tone && "bg-muted-foreground/40"
                  )}
                />
              )}
              {connected && !isLast && (
                <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
              )}
            </div>

            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-sm font-medium text-foreground">{item.title}</p>
                {item.trailing && <div className="shrink-0">{item.trailing}</div>}
              </div>
              {item.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
              )}
              {item.timestamp && (
                <p className="mt-1 text-xs text-muted-foreground">{item.timestamp}</p>
              )}
            </div>
          </div>
        );

        return (
          <li key={item.id}>
            {item.to ? (
              <Link
                to={item.to}
                className="block rounded-[var(--radius)] px-2 py-2 -mx-2 transition-colors hover:bg-[hsl(var(--surface-sunken))]"
              >
                {body}
              </Link>
            ) : item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className="block w-full rounded-[var(--radius)] px-2 py-2 -mx-2 text-left transition-colors hover:bg-[hsl(var(--surface-sunken))]"
              >
                {body}
              </button>
            ) : (
              <div className="px-2 py-2 -mx-2">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Pile d'avatars avec débordement « +N ». */
export function AvatarStack({
  people,
  max = 4,
  size = "md",
  className,
}: {
  people: Array<{ id: string; name: string; avatarUrl?: string | null }>;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;
  const dimension = size === "sm" ? "h-6 w-6 text-2xs" : "h-8 w-8 text-xs";

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {shown.map((person) => {
        const initials = person.name
          .split(" ")
          .filter(Boolean)
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        return person.avatarUrl ? (
          <img
            key={person.id}
            src={person.avatarUrl}
            alt={person.name}
            title={person.name}
            className={cn(
              "shrink-0 rounded-pill object-cover ring-2 ring-[hsl(var(--surface-raised))]",
              dimension
            )}
            loading="lazy"
          />
        ) : (
          <span
            key={person.id}
            title={person.name}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-pill bg-[hsl(var(--tint-navy-bg))] font-semibold text-[hsl(var(--tint-navy-fg))] ring-2 ring-[hsl(var(--surface-raised))]",
              dimension
            )}
          >
            {initials}
          </span>
        );
      })}
      {overflow > 0 && (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-pill bg-muted font-semibold text-muted-foreground ring-2 ring-[hsl(var(--surface-raised))]",
            dimension
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

/**
 * Liste « libellé → valeur » pour les blocs de synthèse d'une fiche.
 * Rend une vraie `<dl>` : la relation clé/valeur reste lisible sans le style.
 */
export function DefinitionList({
  items,
  columns = 1,
  className,
}: {
  items: Array<{ label: ReactNode; value: ReactNode; hint?: ReactNode }>;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {items.map((item, index) => (
        <div key={index} className="min-w-0 space-y-0.5">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </dt>
          <dd className="text-sm text-foreground">{item.value}</dd>
          {item.hint && <p className="text-xs text-muted-foreground">{item.hint}</p>}
        </div>
      ))}
    </dl>
  );
}
