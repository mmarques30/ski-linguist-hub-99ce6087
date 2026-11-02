import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DEFAULT_FILTER_STATUSES,
  LIST_FILTER_STATUSES,
  describeStatusFilter,
  getStatusLabel,
  isAllStatusFilter,
  isDefaultStatusFilter,
  toggleStatusInFilter,
  type InscriptionStatus,
} from "@/lib/inscription-status";
import { cn } from "@/lib/utils";

type Lang = "fr" | "pt-BR" | "en";

const copy = {
  presetDefault: {
    fr: "Tous sauf annulés",
    "pt-BR": "Todos exceto cancelados",
    en: "All except cancelled",
  },
  presetAll: {
    fr: "Tous",
    "pt-BR": "Todos",
    en: "All",
  },
  status: {
    fr: "Statut",
    "pt-BR": "Status",
    en: "Status",
  },
};

function t(lang: Lang, key: keyof typeof copy): string {
  return copy[key][lang];
}

interface InscriptionStatusFilterProps {
  value: InscriptionStatus[];
  onChange: (next: InscriptionStatus[]) => void;
  language: Lang;
  className?: string;
}

export function InscriptionStatusFilter({
  value,
  onChange,
  language,
  className,
}: InscriptionStatusFilterProps) {
  const label = describeStatusFilter(value, language);
  const defaultActive = isDefaultStatusFilter(value);
  const allActive = isAllStatusFilter(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-[200px] justify-between px-3 font-normal",
            !defaultActive && !allActive && "border-primary/40",
            className
          )}
          aria-label={t(language, "status")}
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-3" align="start">
        <div className="mb-3 flex gap-2">
          <Button
            type="button"
            size="xs"
            variant={defaultActive ? "default" : "outline"}
            className="flex-1"
            onClick={() => onChange([...DEFAULT_FILTER_STATUSES])}
          >
            {defaultActive && <Check className="h-3.5 w-3.5" />}
            {t(language, "presetDefault")}
          </Button>
          <Button
            type="button"
            size="xs"
            variant={allActive ? "default" : "outline"}
            className="flex-1"
            onClick={() => onChange([...LIST_FILTER_STATUSES])}
          >
            {allActive && <Check className="h-3.5 w-3.5" />}
            {t(language, "presetAll")}
          </Button>
        </div>
        <ul className="space-y-1" role="listbox" aria-multiselectable="true">
          {LIST_FILTER_STATUSES.map((status) => {
            const checked = value.includes(status);
            const id = `inscription-status-${status}`;
            return (
              <li key={status}>
                <label
                  htmlFor={id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-[var(--radius)] px-2 py-1.5 text-sm hover:bg-accent",
                    checked && "bg-accent/60"
                  )}
                >
                  <Checkbox
                    id={id}
                    checked={checked}
                    disabled={checked && value.length === 1}
                    onCheckedChange={() =>
                      onChange(toggleStatusInFilter(value, status))
                    }
                  />
                  <span>{getStatusLabel(status, language)}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
