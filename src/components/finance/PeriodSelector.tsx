import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from "date-fns";
import { fr } from "date-fns/locale";
import { getCurrentSaison, getDebutSaison, getFinSaison, getSaison } from "@/hooks/useFinancialDashboard";

type Period = 'this-month' | 'last-month' | 'this-season' | 'last-season' | 'this-year' | 'custom';

interface PeriodSelectorProps {
  startDate: string;
  endDate: string;
  onPeriodChange: (start: string, end: string) => void;
}

export function PeriodSelector({ startDate, endDate, onPeriodChange }: PeriodSelectorProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('this-month');
  const [customStart, setCustomStart] = useState<Date | undefined>(new Date(startDate));
  const [customEnd, setCustomEnd] = useState<Date | undefined>(new Date(endDate));
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
    const today = new Date();
    let start: Date, end: Date;

    switch (period) {
      case 'this-month':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'last-month':
        start = startOfMonth(subMonths(today, 1));
        end = endOfMonth(subMonths(today, 1));
        break;
      case 'this-season':
        const currentSaison = getCurrentSaison();
        start = getDebutSaison(currentSaison);
        end = getFinSaison(currentSaison);
        break;
      case 'last-season':
        const lastSaison = getSaison(subYears(today, 1));
        start = getDebutSaison(lastSaison);
        end = getFinSaison(lastSaison);
        break;
      case 'this-year':
        start = startOfYear(today);
        end = endOfYear(today);
        break;
      case 'custom':
        setIsCustomOpen(true);
        return;
      default:
        return;
    }

    onPeriodChange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onPeriodChange(format(customStart, 'yyyy-MM-dd'), format(customEnd, 'yyyy-MM-dd'));
      setIsCustomOpen(false);
    }
  };

  const periods: { value: Period; label: string }[] = [
    { value: 'this-month', label: 'Ce mois' },
    { value: 'last-month', label: 'Mois dernier' },
    { value: 'this-season', label: 'Cette saison' },
    { value: 'last-season', label: 'Saison dernière' },
    { value: 'this-year', label: 'Cette année' },
    { value: 'custom', label: 'Personnalisé' },
  ];

  return (
    <div className="flex items-center gap-3">
      <Select value={selectedPeriod} onValueChange={(val) => handlePeriodChange(val as Period)}>
        <SelectTrigger className="w-auto gap-2 h-9">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periods.map((period) => (
            <SelectItem key={period.value} value={period.value}>
              {period.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedPeriod === 'custom' && (
        <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {customStart && customEnd
                ? `${format(customStart, 'dd/MM/yyyy')} - ${format(customEnd, 'dd/MM/yyyy')}`
                : 'Sélectionner'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Du</label>
                <Calendar
                  mode="single"
                  selected={customStart}
                  onSelect={setCustomStart}
                  locale={fr}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Au</label>
                <Calendar
                  mode="single"
                  selected={customEnd}
                  onSelect={setCustomEnd}
                  locale={fr}
                />
              </div>
              <Button onClick={handleCustomApply} className="w-full">
                Appliquer
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <span className="text-sm text-muted-foreground">
        {format(new Date(startDate), 'dd MMM yyyy', { locale: fr })} - {format(new Date(endDate), 'dd MMM yyyy', { locale: fr })}
      </span>
    </div>
  );
}
