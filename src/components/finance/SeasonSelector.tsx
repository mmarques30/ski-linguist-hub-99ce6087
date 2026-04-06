import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";
import { useSeasons } from "@/hooks/useSeasons";
import { useLanguage } from "@/contexts/LanguageContext";

const translations = {
  label: { fr: "Saison", "pt-BR": "Temporada", en: "Season" },
  all: { fr: "Toutes les saisons", "pt-BR": "Todas as temporadas", en: "All seasons" },
};

interface Props {
  value: string | undefined;
  onChange: (seasonId: string | undefined, startDate?: string, endDate?: string) => void;
}

export function SeasonSelector({ value, onChange }: Props) {
  const { t } = useLanguage();
  const { data: seasons } = useSeasons();

  const handleChange = (v: string) => {
    if (v === "all") {
      onChange(undefined);
    } else {
      const season = seasons?.find((s) => s.id === v);
      onChange(v, season?.start_date, season?.end_date);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">{t(translations.label)} :</span>
      <Select value={value || "all"} onValueChange={handleChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t(translations.all)}</SelectItem>
          {seasons?.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              <span className="flex items-center gap-1.5">
                {s.is_current && <Star className="h-3 w-3 text-[hsl(var(--fli-yellow))] fill-current" />}
                {s.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
