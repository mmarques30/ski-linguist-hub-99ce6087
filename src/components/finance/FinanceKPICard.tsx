import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface FinanceKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  evolution?: number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  formatAsPrice?: boolean;
}

export function FinanceKPICard({
  title,
  value,
  subtitle,
  evolution,
  icon: Icon,
  variant = 'default',
  formatAsPrice = false,
}: FinanceKPICardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    danger: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  };

  const iconStyles = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
    info: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
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
    return evolution > 0 ? 'text-emerald-600' : 'text-red-600';
  };

  return (
    <Card className={cn("p-4 border", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{formatValue(value)}</p>
          {(subtitle || evolution !== undefined) && (
            <div className="flex items-center gap-2 text-xs">
              {subtitle && <span className="text-muted-foreground">{subtitle}</span>}
              {evolution !== undefined && (
                <span className={cn("flex items-center gap-1", getEvolutionColor())}>
                  {getEvolutionIcon()}
                  {Math.abs(evolution).toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>
        <div className={cn("p-2 rounded-lg", iconStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
