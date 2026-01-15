import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "warning" | "success" | "info";
}

const variantStyles = {
  default: "bg-card",
  warning: "bg-primary/5 border-primary/20",
  success: "bg-emerald-50 border-emerald-200",
  info: "bg-blue-50 border-blue-200",
};

const iconVariantStyles = {
  default: "bg-muted text-muted-foreground",
  warning: "bg-primary/10 text-primary",
  success: "bg-emerald-100 text-emerald-600",
  info: "bg-blue-100 text-blue-600",
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = "default" 
}: StatCardProps) {
  return (
    <div className={cn(
      "rounded-xl border p-6 transition-all hover:shadow-md",
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-emerald-600" : "text-red-600"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}% vs mois dernier
            </p>
          )}
        </div>
        <div className={cn(
          "rounded-lg p-3",
          iconVariantStyles[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
