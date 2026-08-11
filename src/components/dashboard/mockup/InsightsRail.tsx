import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  History,
  Mail,
  Phone,
  Smile,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { tx } from "./translations";
import { useFormatters } from "./formatters";
import {
  activities,
  alerts,
  satisfaction,
  team,
  type AlertSeverity,
} from "./mockData";

const alertLabels = {
  overdueInvoices: tx.overdueInvoices,
  testsToEvaluate: tx.testsToEvaluate,
  classesWithoutInstructor: tx.classesWithoutInstructor,
  contractsExpiring: tx.contractsExpiring,
  surveysPending: tx.surveysPending,
} as const;

const activityLabels = {
  inscriptionCreated: tx.inscriptionCreated,
  invoicePaid: tx.invoicePaid,
  evaluationSubmitted: tx.evaluationSubmitted,
  instructorAssigned: tx.instructorAssigned,
  partnerContractSigned: tx.partnerContractSigned,
} as const;

const roleLabels = {
  instructor: tx.instructor,
  coordinator: tx.coordinator,
  commercial: tx.commercial,
} as const;

const severityDot: Record<AlertSeverity, string> = {
  critical: "bg-destructive",
  warning: "bg-[hsl(var(--fli-orange))]",
  info: "bg-[hsl(var(--fli-blue))]",
};

const severityText: Record<AlertSeverity, string> = {
  critical: "text-destructive",
  warning: "text-[hsl(var(--fli-orange))]",
  info: "text-[hsl(var(--fli-blue))]",
};

function RailCard({
  title,
  description,
  icon,
  badge,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{title}</h2>
            {description && (
              <p className="truncate text-[11px] text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {badge}
      </header>
      {children}
    </section>
  );
}

function AlertsCard() {
  const { t } = useLanguage();
  const f = useFormatters();
  const total = alerts.reduce((sum, a) => sum + a.count, 0);

  return (
    <RailCard
      title={t(tx.alertsTitle)}
      description={t(tx.alertsDesc)}
      icon={<AlertTriangle className="h-4 w-4" />}
      badge={
        <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold tabular-nums text-destructive">
          {total}
        </span>
      }
    >
      <ul className="space-y-1">
        {alerts.map((alert) => (
          <li key={alert.id}>
            <Link
              to={alert.route}
              className="group flex items-center gap-2.5 rounded-lg px-1.5 py-2 transition-colors hover:bg-muted/60"
            >
              <span
                className={cn("h-1.5 w-1.5 shrink-0 rounded-full", severityDot[alert.severity])}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">
                  {t(alertLabels[alert.key as keyof typeof alertLabels])}
                </span>
                {alert.amount !== undefined && (
                  <span className="block truncate text-[11px] tabular-nums text-muted-foreground">
                    {f.currency(alert.amount)}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "shrink-0 text-sm font-bold tabular-nums",
                  severityText[alert.severity]
                )}
              >
                {alert.count}
              </span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </RailCard>
  );
}

function SatisfactionCard() {
  const { t } = useLanguage();
  const f = useFormatters();

  return (
    <RailCard title={t(tx.satisfactionTitle)} icon={<Smile className="h-4 w-4" />}>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold tabular-nums">{satisfaction.score.toFixed(1)}</span>
        <div className="min-w-0">
          <div className="flex gap-0.5" aria-hidden>
            {Array.from({ length: satisfaction.max }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < Math.round(satisfaction.score)
                    ? "fill-[hsl(var(--fli-yellow))] text-[hsl(var(--fli-yellow))]"
                    : "text-muted"
                )}
              />
            ))}
          </div>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">
            {f.number(satisfaction.responses)} {t(tx.responsesCount)} · +{satisfaction.delta}
          </p>
        </div>
      </div>
    </RailCard>
  );
}

function ActivityCard() {
  const { t } = useLanguage();

  const ago = (minutes: number) =>
    minutes < 60 ? `${minutes} ${t(tx.minutesAgo)}` : `${Math.round(minutes / 60)} ${t(tx.hoursAgo)}`;

  return (
    <RailCard title={t(tx.activityTitle)} icon={<History className="h-4 w-4" />}>
      <ol className="space-y-3">
        {activities.map((item, index) => (
          <li key={item.id} className="relative flex gap-3 pl-1">
            {/* Timeline spine, omitted on the last item. */}
            {index < activities.length - 1 && (
              <span
                aria-hidden
                className="absolute left-[7px] top-4 h-full w-px bg-border"
              />
            )}
            <span
              aria-hidden
              className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-card"
              style={{ backgroundColor: `hsl(${item.accent})` }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">
                {t(activityLabels[item.key as keyof typeof activityLabels])}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{item.target}</p>
              <p className="truncate text-[11px] text-muted-foreground/70">
                {item.actor} · {ago(item.minutesAgo)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </RailCard>
  );
}

function TeamCard() {
  const { t } = useLanguage();

  return (
    <RailCard
      title={t(tx.teamTitle)}
      description={t(tx.teamDesc)}
      icon={<Bell className="h-4 w-4" />}
    >
      <ul className="space-y-1">
        {team.map((member) => (
          <li
            key={member.id}
            className="group flex items-center gap-2.5 rounded-lg px-1.5 py-2 transition-colors hover:bg-muted/60"
          >
            <span className="relative shrink-0">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  backgroundColor: `hsl(${member.accent} / 0.15)`,
                  color: `hsl(${member.accent})`,
                }}
                aria-hidden
              >
                {member.initials}
              </span>
              {member.online && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[hsl(var(--fli-teal))] ring-2 ring-card" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium">{member.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {t(roleLabels[member.roleKey as keyof typeof roleLabels])} · {member.load}%{" "}
                {t(tx.load)}
              </span>
            </span>
            <span className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Email"
              >
                <Mail className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary transition-colors hover:bg-primary/25"
                aria-label="Phone"
              >
                <Phone className="h-3.5 w-3.5" />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </RailCard>
  );
}

/**
 * Rendered as a fragment so the shell owns the layout: the cards tile
 * horizontally below 2xl and stack inside the right rail above it.
 */
export function InsightsRail() {
  return (
    <>
      <AlertsCard />
      <SatisfactionCard />
      <ActivityCard />
      <TeamCard />
    </>
  );
}
