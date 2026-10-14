import { CalendarRange } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSeasonFilter } from "@/contexts/SeasonContext";
import {
  periodMenuOptions,
  type PeriodFilterValue,
} from "@/lib/period-filter";

/** Filtre période global (header) — année comptable / saison / mois ± N-1. */
export function SeasonFilterControl({ className }: { className?: string }) {
  const { filter, setFilter, seasons } = useSeasonFilter();
  const current = seasons.find((s) => s.is_current) ?? null;
  const options = periodMenuOptions(seasons, current);

  const fiscal = options.filter((o) => o.value.startsWith("fiscal-"));
  const saison = options.filter((o) => o.value.startsWith("season-"));
  const mois = options.filter((o) => o.value.startsWith("month-"));

  return (
    <div className={className}>
      <Select
        value={filter}
        onValueChange={(v) => setFilter(v as PeriodFilterValue)}
      >
        <SelectTrigger
          className="h-9 w-[240px] rounded-[var(--radius)] border-white/15 bg-white/10 text-xs text-white/80 hover:bg-white/20 focus:ring-white/30 [&>svg]:text-white/60"
          aria-label="Filtrer par période"
        >
          <CalendarRange className="mr-1.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--fli-yellow))]" />
          <SelectValue placeholder="Période" />
        </SelectTrigger>
        <SelectContent className="min-w-[280px]">
          <SelectGroup>
            <SelectLabel>Année comptable</SelectLabel>
            {fiscal.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Saison</SelectLabel>
            {saison.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Mois</SelectLabel>
            {mois.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectItem value="all">Toutes les périodes</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
