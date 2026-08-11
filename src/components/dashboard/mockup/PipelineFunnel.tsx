import { ChevronRight, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { tx } from "./translations";
import { SectionCard } from "./primitives";
import { useFormatters } from "./formatters";
import { funnel } from "./mockData";

const stageLabels = {
  leads: tx.funnelLeads,
  tests: tx.funnelTests,
  inscriptions: tx.funnelInscriptions,
  activeClasses: tx.funnelActiveClasses,
  invoiced: tx.funnelInvoiced,
  paid: tx.funnelPaid,
} as const;

const stageAccents = [
  "var(--fli-purple)",
  "var(--fli-blue)",
  "var(--fli-yellow)",
  "var(--fli-orange)",
  "var(--fli-teal)",
  "var(--fli-teal)",
];

export function PipelineFunnel() {
  const { t } = useLanguage();
  const f = useFormatters();

  const entry = funnel[0].count;
  const exit = funnel[funnel.length - 1].count;
  const endToEnd = (exit / entry) * 100;

  return (
    <SectionCard
      title={t(tx.funnelTitle)}
      description={t(tx.funnelDesc)}
      icon={<Filter className="h-[18px] w-[18px]" />}
      action={
        <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5">
          <span className="text-xs text-muted-foreground">{t(tx.globalConversion)}</span>
          <span className="text-sm font-bold tabular-nums text-[hsl(var(--fli-teal))]">
            {endToEnd.toFixed(1)}%
          </span>
        </div>
      }
    >
      <ol className="grid grid-cols-1 gap-x-2 gap-y-3 sm:grid-cols-2 lg:grid-cols-6 lg:gap-y-0">
        {funnel.map((stage, index) => {
          const next = funnel[index + 1];
          const share = (stage.count / entry) * 100;
          const conversion = next ? (next.count / stage.count) * 100 : null;
          const accent = stageAccents[index];

          return (
            <li key={stage.key} className="relative min-w-0">
              <Link
                to={stage.route}
                className="group block rounded-xl p-2.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-muted-foreground">
                    {t(stageLabels[stage.key as keyof typeof stageLabels])}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                <p className="mt-1 text-2xl font-bold tabular-nums">{f.number(stage.count)}</p>

                {/* Bar length encodes volume relative to the funnel entry. */}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${share}%`, backgroundColor: `hsl(${accent})` }}
                  />
                </div>

                <p className="mt-1.5 text-[11px] tabular-nums text-muted-foreground">
                  {share.toFixed(0)}% {t(tx.ofEntry)}
                </p>
              </Link>

              {/* Step-to-step conversion, shown between cells on wide screens. */}
              {conversion !== null && (
                <span
                  className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground lg:absolute lg:-right-1 lg:top-9 lg:z-10 lg:mt-0 lg:border lg:border-border lg:bg-card"
                  title={t(tx.stepConversion)}
                >
                  <ChevronRight className="h-3 w-3" aria-hidden />
                  {conversion.toFixed(0)}%
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}
