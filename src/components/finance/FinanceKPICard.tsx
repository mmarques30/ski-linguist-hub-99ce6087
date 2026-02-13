import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface FinanceKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  evolution?: number;
  variant?: 'default' | 'gold' | 'navy';
  formatAsPrice?: boolean;
  icon?: LucideIcon;
}

export function FinanceKPICard({
  title,
  value,
  subtitle,
  evolution,
  variant = 'default',
  formatAsPrice = false,
  icon: Icon,
}: FinanceKPICardProps) {
  const borderStyles = {
    default: 'border-l-border',
    gold: 'border-l-[hsl(var(--fli-yellow))]',
    navy: 'border-l-[hsl(var(--fli-navy))]',
  };

  const iconBgStyles = {
    default: 'bg-muted text-muted-foreground',
    gold: 'bg-[hsl(var(--fli-yellow))]/10 text-[hsl(var(--fli-yellow))]',
    navy: 'bg-[hsl(var(--fli-navy))]/10 text-[hsl(var(--fli-navy))]',
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

  const getEvolutionBadge = () => {
    if (evolution === undefined) return null;
    const isPositive = evolution > 0;
    const isNeutral = evolution === 0;
    
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
        isNeutral && "bg-muted text-muted-foreground",
        isPositive && "bg-emerald-500/10 text-emerald-600",
        !isPositive && !isNeutral && "bg-destructive/10 text-destructive",
      )}>
        {getEvolutionIcon()}
        {isPositive ? '+' : ''}{Math.abs(evolution).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className={cn(
      "bg-card border border-border rounded-lg p-5 border-l-4",
      borderStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon && (
          <div className={cn("p-2 rounded-lg", iconBgStyles[variant])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight mt-1">{formatValue(value)}</p>
      {(subtitle || evolution !== undefined) && (
        <div className="flex items-center gap-2 text-xs mt-2">
          {getEvolutionBadge()}
          {subtitle && <span className="text-muted-foreground">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
