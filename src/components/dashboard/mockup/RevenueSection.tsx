import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PieChart as PieIcon, Receipt, TrendingUp, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { tx } from "./translations";
import { DeltaBadge, SectionCard } from "./primitives";
import { useFormatters } from "./formatters";
import {
  microTiles,
  netProfit,
  revenueMix,
  revenueMixTotal,
  revenueVsCosts,
} from "./mockData";

const mixLabels = {
  formation: tx.mixFormation,
  skiMonitors: tx.mixSkiMonitors,
  tests: tx.mixTests,
  subcontracting: tx.mixSubcontracting,
} as const;

function RevenueMixCard() {
  const { t } = useLanguage();
  const f = useFormatters();

  const data = revenueMix.map((slice) => ({
    ...slice,
    name: t(mixLabels[slice.key as keyof typeof mixLabels]),
  }));

  return (
    <SectionCard
      title={t(tx.revenueMixTitle)}
      description={t(tx.revenueMixDesc)}
      icon={<PieIcon className="h-[18px] w-[18px]" />}
      className="lg:col-span-2"
    >
      {/* Donut and legend sit side by side from `sm` up, stacked on phones. */}
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative h-[196px] w-[196px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="66%"
                outerRadius="100%"
                paddingAngle={2}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((slice) => (
                  <Cell key={slice.key} fill={`hsl(${slice.color})`} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--popover))",
                  color: "hsl(var(--popover-foreground))",
                  fontSize: 12,
                }}
                formatter={(value: number) => f.currency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center total, matching the reference's donut treatment. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[22px] font-bold leading-none tabular-nums">
              {f.currency(revenueMixTotal, true)}
            </span>
            <span className="mt-1 max-w-[96px] text-[11px] leading-tight text-muted-foreground">
              {t(tx.totalBilled)}
            </span>
          </div>
        </div>

        <ul className="w-full min-w-0 space-y-2.5">
          {data.map((slice) => {
            const share = (slice.value / revenueMixTotal) * 100;
            return (
              <li key={slice.key} className="min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: `hsl(${slice.color})` }}
                    />
                    <span className="truncate text-sm">{slice.name}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {f.currency(slice.value)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 pl-[18px]">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${share}%`, backgroundColor: `hsl(${slice.color})` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {share.toFixed(0)}%
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </SectionCard>
  );
}

interface MicroTileProps {
  label: string;
  hint?: string;
  value: string;
  delta: number;
  icon: React.ReactNode;
  accent: string;
}

function MicroTile({ label, hint, value, delta, icon, accent }: MicroTileProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `hsl(${accent} / 0.12)`, color: `hsl(${accent})` }}
        >
          {icon}
        </span>
        <DeltaBadge value={delta} trend="up" bare />
      </div>
      <div className="mt-3 min-w-0">
        <p className="truncate text-xl font-bold tabular-nums">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        {hint && <p className="truncate text-[11px] text-muted-foreground/70">{hint}</p>}
      </div>
    </div>
  );
}

function MarginTrendCard() {
  const { t } = useLanguage();
  const f = useFormatters();

  return (
    <SectionCard
      title={t(tx.trendTitle)}
      description={t(tx.trendDesc)}
      icon={<TrendingUp className="h-[18px] w-[18px]" />}
      contentClassName="flex flex-col"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-bold tabular-nums">{f.currency(netProfit)}</span>
        <DeltaBadge value={9.7} trend="up" />
      </div>

      <div className="mt-3 h-[132px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueVsCosts} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="fli-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--fli-yellow))" stopOpacity={0.45} />
                <stop offset="100%" stopColor="hsl(var(--fli-yellow))" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fli-costs-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--fli-blue))" stopOpacity={0.28} />
                <stop offset="100%" stopColor="hsl(var(--fli-blue))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              interval="preserveStartEnd"
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--popover))",
                color: "hsl(var(--popover-foreground))",
                fontSize: 12,
              }}
              formatter={(value: number, key) => [
                f.currency(value),
                key === "revenue" ? t(tx.legendRevenue) : t(tx.legendCosts),
              ]}
            />
            <Area
              type="monotone"
              dataKey="costs"
              stroke="hsl(var(--fli-blue))"
              strokeWidth={2}
              fill="url(#fli-costs-fill)"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--fli-yellow))"
              strokeWidth={2.5}
              fill="url(#fli-revenue-fill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[hsl(var(--fli-yellow))]" />
          {t(tx.legendRevenue)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[hsl(var(--fli-blue))]" />
          {t(tx.legendCosts)}
        </span>
      </div>
    </SectionCard>
  );
}

export function RevenueSection() {
  const { t } = useLanguage();
  const f = useFormatters();

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
      <RevenueMixCard />
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <MicroTile
            label={t(tx.averageTicket)}
            value={f.currency(microTiles.averageTicket.value)}
            delta={microTiles.averageTicket.delta}
            icon={<Receipt className="h-4 w-4" />}
            accent="var(--fli-purple)"
          />
          <MicroTile
            label={t(tx.conversionRate)}
            hint={t(tx.conversionHint)}
            value={f.percent(microTiles.conversionRate.value)}
            delta={microTiles.conversionRate.delta}
            icon={<Users className="h-4 w-4" />}
            accent="var(--fli-teal)"
          />
        </div>
        <MarginTrendCard />
      </div>
    </div>
  );
}
