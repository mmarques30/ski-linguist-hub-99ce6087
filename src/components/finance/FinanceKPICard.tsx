import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FinanceKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  evolution?: number;
  variant?: 'default' | 'gold' | 'navy';
  formatAsPrice?: boolean;
  // Keep icon prop for backward compat but don't render it
  icon?: any;
}

export function FinanceKPICard({
  title,
  value,
  subtitle,
  evolution,
  variant = 'default',
  formatAsPrice = false,
}: FinanceKPICardProps) {
  const borderStyles = {
    default: 'border-l-border',
    gold: 'border-l-[hsl(var(--fli-yellow))]',
    navy: 'border-l-[hsl(var(--fli-navy))]',
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'number' && formatAsPrice) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val;
  };

  const getEvolutionIcon = () => {
    if (evolution === undefined || evolution === 0) return <Minus className="h-3 w-3" />;
    return evolution > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  const getEvolutionColor = () => {
    if (evolution === undefined || evolution === 0) return 'text-muted-foreground';
    return evolution > 0 ? 'text-emerald-600' : 'text-destructive';
  };

  return (
    <div className={cn(
      "bg-card border border-border rounded-lg p-5 border-l-4",
      borderStyles[variant]
    )}>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold tracking-tight mt-1">{formatValue(value)}</p>
      {(subtitle || evolution !== undefined) && (
        <div className="flex items-center gap-2 text-xs mt-2">
          {subtitle && <span className="text-muted-foreground">{subtitle}</span>}
          {evolution !== undefined && (
            <span className={cn("flex items-center gap-1 font-medium", getEvolutionColor())}>
              {getEvolutionIcon()}
              {Math.abs(evolution).toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
