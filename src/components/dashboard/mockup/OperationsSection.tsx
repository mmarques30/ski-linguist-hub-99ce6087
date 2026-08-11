import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpDown,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  MapPin,
  Users2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { tx } from "./translations";
import { ProgressRing, SectionCard } from "./primitives";
import { useFormatters } from "./formatters";
import {
  classReadiness,
  recentInscriptions,
  type InscriptionRowMock,
  type InscriptionStatus,
} from "./mockData";

const statusLabels: Record<InscriptionStatus, typeof tx.statusConfirmed> = {
  confirmed: tx.statusConfirmed,
  pending: tx.statusPending,
  invoiced: tx.statusInvoiced,
  inProgress: tx.statusInProgress,
};

const statusStyles: Record<InscriptionStatus, string> = {
  confirmed:
    "bg-[hsl(var(--fli-teal)/0.12)] text-[hsl(var(--fli-teal))] border-[hsl(var(--fli-teal)/0.3)]",
  inProgress:
    "bg-[hsl(var(--fli-yellow)/0.14)] text-[hsl(var(--fli-orange))] border-[hsl(var(--fli-yellow)/0.35)]",
  invoiced:
    "bg-[hsl(var(--fli-blue)/0.12)] text-[hsl(var(--fli-blue))] border-[hsl(var(--fli-blue)/0.3)]",
  pending: "bg-muted text-muted-foreground border-border",
};

function StatusPill({ status }: { status: InscriptionStatus }) {
  const { t } = useLanguage();
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        statusStyles[status]
      )}
    >
      {t(statusLabels[status])}
    </span>
  );
}

function Avatar({ row }: { row: InscriptionRowMock }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{ backgroundColor: `hsl(${row.accent} / 0.15)`, color: `hsl(${row.accent})` }}
      aria-hidden
    >
      {row.initials}
    </span>
  );
}

type SortKey = "student" | "startDate" | "price";

function InscriptionsTable() {
  const { t } = useLanguage();
  const f = useFormatters();
  const [sortKey, setSortKey] = useState<SortKey>("startDate");
  const [descending, setDescending] = useState(true);

  const rows = useMemo(() => {
    const sorted = [...recentInscriptions].sort((a, b) => {
      if (sortKey === "price") return a.price - b.price;
      if (sortKey === "student") return a.student.localeCompare(b.student);
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
    return descending ? sorted.reverse() : sorted;
  }, [sortKey, descending]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDescending((d) => !d);
      return;
    }
    setSortKey(key);
    setDescending(true);
  };

  const SortButton = ({ column, label, align = "left" }: { column: SortKey; label: string; align?: "left" | "right" }) => (
    <button
      type="button"
      onClick={() => toggleSort(column)}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
        align === "right" && "flex-row-reverse"
      )}
      aria-label={label}
    >
      {label}
      <ArrowUpDown
        className={cn("h-3 w-3", sortKey === column ? "text-primary" : "opacity-50")}
      />
    </button>
  );

  return (
    <SectionCard
      title={t(tx.tableTitle)}
      description={t(tx.tableDesc)}
      icon={<Users2 className="h-[18px] w-[18px]" />}
      className="lg:col-span-2"
      contentClassName="px-0 sm:px-0"
      action={
        <Link
          to="/inscriptions"
          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
        >
          {t(tx.viewAll)}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      {/* Mobile: stacked cards — avoids a horizontally scrolling table on phones. */}
      <div className="space-y-2 px-4 md:hidden">
        <div className="flex items-center gap-3 pb-1">
          <SortButton column="startDate" label={t(tx.colStart)} />
          <SortButton column="price" label={t(tx.colValue)} />
          <SortButton column="student" label={t(tx.colStudent)} />
        </div>
        {rows.map((row) => (
          <Link
            key={row.id}
            to="/inscriptions"
            className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/60"
          >
            <Avatar row={row} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{row.student}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.language} · {row.modality} · {f.date(row.startDate)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm font-semibold tabular-nums">{f.currency(row.price)}</span>
              <StatusPill status={row.status} />
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop: full table with sortable headers. */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-border bg-muted/40">
              <th className="px-5 py-2.5 text-left font-medium">
                <SortButton column="student" label={t(tx.colStudent)} />
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                {t(tx.colLanguage)}
              </th>
              <th className="hidden px-3 py-2.5 text-left text-xs font-medium text-muted-foreground lg:table-cell">
                {t(tx.colModality)}
              </th>
              <th className="px-3 py-2.5 text-left font-medium">
                <SortButton column="startDate" label={t(tx.colStart)} />
              </th>
              <th className="px-3 py-2.5 text-right font-medium">
                <SortButton column="price" label={t(tx.colValue)} align="right" />
              </th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">
                {t(tx.colStatus)}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/40">
                <td className="px-5 py-3">
                  <Link to="/inscriptions" className="flex items-center gap-3">
                    <Avatar row={row} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{row.student}</span>
                      <span className="block truncate text-xs tabular-nums text-muted-foreground">
                        {row.code}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{row.language}</td>
                <td className="hidden px-3 py-3 text-muted-foreground lg:table-cell">{row.modality}</td>
                <td className="whitespace-nowrap px-3 py-3 tabular-nums text-muted-foreground">
                  {f.date(row.startDate)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums">
                  {f.currency(row.price)}
                </td>
                <td className="px-5 py-3 text-right">
                  <StatusPill status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function ClassReadinessCard() {
  const { t } = useLanguage();

  const checkLabels = {
    students: tx.checkStudents,
    location: tx.checkLocation,
    instructor: tx.checkInstructor,
    materials: tx.checkMaterials,
  } as const;

  return (
    <SectionCard
      title={t(tx.readinessTitle)}
      description={t(tx.readinessDesc)}
      icon={<ClipboardCheck className="h-[18px] w-[18px]" />}
      contentClassName="space-y-3"
    >
      {classReadiness.map((item) => {
        const checks = Object.entries(item.checks) as [keyof typeof checkLabels, boolean][];
        const done = checks.filter(([, ok]) => ok).length;
        const percent = (done / checks.length) * 100;
        const isReady = done === checks.length;

        return (
          <Link
            key={item.id}
            to="/formation/sessions"
            className="block rounded-xl border border-border p-3 transition-colors hover:bg-muted/60"
          >
            <div className="flex items-center gap-3">
              <ProgressRing
                percent={percent}
                label={`${done}/${checks.length}`}
                color={isReady ? "hsl(var(--fli-teal))" : "hsl(var(--fli-yellow))"}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{item.language}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                      isReady
                        ? "border-[hsl(var(--fli-teal)/0.3)] bg-[hsl(var(--fli-teal)/0.12)] text-[hsl(var(--fli-teal))]"
                        : "border-[hsl(var(--fli-orange)/0.3)] bg-[hsl(var(--fli-orange)/0.12)] text-[hsl(var(--fli-orange))]"
                    )}
                  >
                    {isReady ? t(tx.ready) : t(tx.blocked)}
                  </span>
                </div>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {item.station} · {item.students}/{item.capacity} {t(tx.seats)}
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-muted px-2 py-1 text-[11px] font-semibold tabular-nums">
                {t(tx.startsInDays)}
                {item.startsIn}
              </span>
            </div>

            {/* Each chip maps to a concrete record, not an inferred threshold. */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {checks.map(([key, ok]) => (
                <span
                  key={key}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]",
                    ok
                      ? "bg-[hsl(var(--fli-teal)/0.1)] text-[hsl(var(--fli-teal))]"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {t(checkLabels[key])}
                </span>
              ))}
            </div>
          </Link>
        );
      })}
    </SectionCard>
  );
}

export function OperationsSection() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
      <InscriptionsTable />
      <ClassReadinessCard />
    </div>
  );
}
