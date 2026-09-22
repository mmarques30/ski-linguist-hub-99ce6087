/**
 * Tuile KPI historique du module finance.
 *
 * Remplacée par `StatTile` du kit sur tous les écrans ; conservée (sur jetons)
 * le temps qu'aucun écran ne l'importe plus.
 */
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
    gold: 'border-l-[hsl(var(--tint-gold-fg))]',
    navy: 'border-l-[hsl(var(--tint-navy-fg))]',
  };

  const iconBgStyles = {
    default: 'bg-muted text-muted-foreground',
    gold: 'bg-[hsl(var(--tint-gold-bg))] text-[hsl(var(--tint-gold-fg))]',
    navy: 'bg-[hsl(var(--tint-navy-bg))] text-[hsl(var(--tint-navy-fg))]',
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
        isPositive && "bg-[hsl(var(--status-good))]/12 text-[hsl(var(--status-good))]",
        !isPositive && !isNeutral && "bg-[hsl(var(--status-critical))]/12 text-[hsl(var(--status-critical))]",
      )}>
        {getEvolutionIcon()}
        {isPositive ? '+' : ''}{Math.abs(evolution).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className={cn(
      "fli-surface rounded-[var(--radius-card)] border-l-4 p-5",
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
