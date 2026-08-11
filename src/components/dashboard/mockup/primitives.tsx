import { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { tx } from "./translations";
import { useFormatters } from "./formatters";
import type { Trend } from "./mockData";

interface DeltaBadgeProps {
  value: number;
  trend: Trend;
  unit?: "percent" | "points";
  /** Set for metrics where a decrease is the good outcome (e.g. costs). */
  inverse?: boolean;
  className?: string;
  /** Renders without a pill background, for use on coloured surfaces. */
  bare?: boolean;
}

export function DeltaBadge({
  value,
  trend,
  unit = "percent",
  inverse = false,
  className,
  bare = false,
}: DeltaBadgeProps) {
  const { locale } = useFormatters();
  const isGood = inverse ? trend === "down" : trend === "up";
  const Icon = trend === "flat" ? Minus : trend === "up" ? ArrowUpRight : ArrowDownRight;

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value));

  const sign = trend === "flat" ? "" : trend === "up" ? "+" : "−";
  const suffix = unit === "points" ? " pts" : "%";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-xs font-semibold tabular-nums",
        !bare && "rounded-full px-2 py-0.5",
        trend === "flat"
          ? cn("text-muted-foreground", !bare && "bg-muted")
          : isGood
            ? cn("text-emerald-600 dark:text-emerald-400", !bare && "bg-emerald-500/10")
            : cn("text-destructive", !bare && "bg-destructive/10"),
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {sign}
      {formatted}
      {suffix}
    </span>
  );
}

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/** Consistent card chrome: title row with optional icon and trailing action. */
export function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card shadow-sm",
        className
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            {/* Wraps rather than truncates: these titles are long in French. */}
            <h2 className="text-base font-semibold leading-snug tracking-tight sm:text-lg">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{description}</p>
            )}
          </div>
        </div>
        {action}
      </header>
      <div className={cn("flex-1 px-4 pb-4 sm:px-5 sm:pb-5", contentClassName)}>{children}</div>
    </section>
  );
}

interface GoalGaugeProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: ReactNode;
}

/**
 * Semicircular progress arc for the season-goal KPI. Pure SVG so it scales with
 * the card and needs no chart library.
 */
export function GoalGauge({
  percent,
  size = 132,
  strokeWidth = 11,
  className,
  children,
}: GoalGaugeProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // Half-circle arc drawn left → right across the top.
  const arc = `M ${strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${cy}`;
  const length = Math.PI * radius;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: cy + strokeWidth }}>
      <svg width={size} height={cy + strokeWidth} viewBox={`0 0 ${size} ${cy + strokeWidth}`} aria-hidden>
        <path
          d={arc}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-muted"
        />
        <path
          d={arc}
          fill="none"
          stroke="hsl(var(--fli-yellow))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length - (length * clamped) / 100}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">{children}</div>
    </div>
  );
}

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

/** Compact full-circle ring used in the class-readiness list. */
export function ProgressRing({
  percent,
  size = 44,
  strokeWidth = 4,
  color = "hsl(var(--fli-yellow))",
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * clamped) / 100}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums">
        {label ?? `${Math.round(clamped)}`}
      </span>
    </div>
  );
}

/** Small "live" indicator reused in the header and activity rail. */
export function LivePulse({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--fli-teal))] opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--fli-teal))]" />
      </span>
      <span className="text-xs text-muted-foreground">{t(tx.updatedNow)}</span>
    </span>
  );
}
