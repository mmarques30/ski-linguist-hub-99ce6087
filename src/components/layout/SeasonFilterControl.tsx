import { Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSeasonFilter, type SeasonFilterValue } from "@/contexts/SeasonContext";

/** Filtre saison global (header / listes) — Onda D3. */
export function SeasonFilterControl({ className }: { className?: string }) {
  const { filter, setFilter, seasons, season } = useSeasonFilter();

  return (
    <div className={className}>
      <Select
        value={filter}
        onValueChange={(v) => setFilter(v as SeasonFilterValue)}
      >
        <SelectTrigger className="h-9 w-[190px] rounded-[var(--radius)] border-white/15 bg-white/10 text-xs text-white/80 hover:bg-white/20 focus:ring-white/30 [&>svg]:text-white/60" aria-label="Filtrer par saison">
          <SelectValue placeholder="Saison" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="current">
            <span className="flex items-center gap-1.5">
              <Star className="h-3 w-3 text-[hsl(var(--fli-yellow))] fill-current" />
              Saison en cours
              {season?.is_current ? ` (${season.name})` : ""}
            </span>
          </SelectItem>
          <SelectItem value="all">Toutes les saisons</SelectItem>
          {seasons.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              <span className="flex items-center gap-1.5">
                {s.is_current && (
                  <Star className="h-3 w-3 text-[hsl(var(--fli-yellow))] fill-current" />
                )}
                {s.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
