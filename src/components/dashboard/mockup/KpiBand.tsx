import { Euro, Percent, Target, UserPlus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { tx } from "./translations";
import { DeltaBadge, GoalGauge } from "./primitives";
import { useFormatters } from "./formatters";
import { inscriptionsBreakdown, kpis, seasonGoal } from "./mockData";

interface KpiShellProps {
  label: string;
  hint?: string;
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function KpiShell({ label, hint, icon, accent, children, footer }: KpiShellProps) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      {/* Accent hairline keeps the cards distinguishable without four loud fills. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ backgroundColor: `hsl(${accent})` }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-[13px]">
            {label}
          </p>
          {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground/80">{hint}</p>}
        </div>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `hsl(${accent} / 0.12)`, color: `hsl(${accent})` }}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 flex-1">{children}</div>
      {footer && <div className="mt-3 border-t border-border pt-3">{footer}</div>}
    </article>
  );
}

export function KpiBand() {
  const { t } = useLanguage();
  const f = useFormatters();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {/* Revenue */}
      <KpiShell
        label={t(tx.kpiRevenue)}
        hint={t(tx.kpiRevenueHint)}
        icon={<Euro className="h-[18px] w-[18px]" />}
        accent="var(--fli-yellow)"
        footer={
          <div className="flex items-center gap-2">
            <DeltaBadge value={kpis.revenue.delta} trend={kpis.revenue.trend} />
            <span className="truncate text-xs text-muted-foreground">{t(tx.vsPrevious)}</span>
          </div>
        }
      >
        <p className="text-3xl font-bold tracking-tight tabular-nums sm:text-[32px]">
          {f.currency(kpis.revenue.value)}
        </p>
      </KpiShell>

      {/* Net margin — the analytical KPI the current dashboard is missing */}
      <KpiShell
        label={t(tx.kpiMargin)}
        hint={t(tx.kpiMarginHint)}
        icon={<Percent className="h-[18px] w-[18px]" />}
        accent="var(--fli-teal)"
        footer={
          <div className="flex items-center gap-2">
            <DeltaBadge
              value={kpis.margin.delta}
              trend={kpis.margin.trend}
              unit="points"
            />
            <span className="truncate text-xs text-muted-foreground">{t(tx.vsPrevious)}</span>
          </div>
        }
      >
        <p className="text-3xl font-bold tracking-tight tabular-nums sm:text-[32px]">
          {f.percent(kpis.margin.value)}
        </p>
      </KpiShell>

      {/* Season goal — gauge, mirroring the reference's revenue-goal card */}
      <KpiShell
        label={t(tx.kpiGoal)}
        hint={t(tx.kpiGoalHint)}
        icon={<Target className="h-[18px] w-[18px]" />}
        accent="var(--fli-orange)"
      >
        <div className="flex items-center gap-4">
          <GoalGauge percent={seasonGoal.percent} size={116} strokeWidth={10}>
            <span className="text-2xl font-bold leading-none tabular-nums">
              {seasonGoal.percent}%
            </span>
          </GoalGauge>
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-semibold tabular-nums">
              {f.currency(seasonGoal.achieved, true)} / {f.currency(seasonGoal.target, true)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(tx.kpiGoalRemaining)}:{" "}
              <span className="font-medium tabular-nums text-[hsl(var(--fli-orange))]">
                {f.currency(seasonGoal.target - seasonGoal.achieved, true)}
              </span>
            </p>
          </div>
        </div>
      </KpiShell>

      {/* New enrolments */}
      <KpiShell
        label={t(tx.kpiInscriptions)}
        hint={t(tx.periodLabel)}
        icon={<UserPlus className="h-[18px] w-[18px]" />}
        accent="var(--fli-blue)"
        footer={
          <div className="flex items-center gap-2">
            <DeltaBadge value={kpis.inscriptions.delta} trend={kpis.inscriptions.trend} />
            <span className="truncate text-xs text-muted-foreground">{t(tx.vsPrevious)}</span>
          </div>
        }
      >
        <div className="flex items-end gap-3">
          <p className="text-3xl font-bold tracking-tight tabular-nums sm:text-[32px]">
            {f.number(kpis.inscriptions.value)}
          </p>
          <div className="mb-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
            <span className="whitespace-nowrap font-medium text-[hsl(var(--fli-teal))]">
              {inscriptionsBreakdown.confirmed} {t(tx.kpiInscriptionsHint)}
            </span>
            <span className="whitespace-nowrap text-muted-foreground">
              {inscriptionsBreakdown.pending} {t(tx.pendingShort)}
            </span>
          </div>
        </div>
      </KpiShell>
    </div>
  );
}