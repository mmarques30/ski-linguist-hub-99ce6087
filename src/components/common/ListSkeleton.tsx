import { Skeleton } from "@/components/ui/skeleton";

/**
 * Squelettes de chargement partagés. Contrat stable : noms exportés et props
 * inchangés (d'autres écrans les consomment) — seule l'habillage suit les
 * jetons du design system.
 */

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="fli-surface divide-y divide-border overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-pill" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 shrink-0 rounded-pill" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="fli-surface space-y-3 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-pill" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-pill" />
            <Skeleton className="h-6 w-16 rounded-pill" />
          </div>
        </div>
      ))}
    </div>
  );
}
