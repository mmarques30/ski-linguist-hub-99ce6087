import { CSSProperties, ReactNode, useState } from "react";
import {
  BarChart3,
  Bell,
  Briefcase,
  ChevronRight,
  Download,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Moon,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  Sun,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import fliMarcaYellow from "@/assets/fli-marca-yellow.png";
import { tx } from "./translations";
import { LivePulse } from "./primitives";
import { seasonLabel } from "./mockData";

/**
 * Dark-surface overrides scoped to the mockup subtree.
 *
 * The app's global `.dark` palette is a neutral warm grey; here we remap the
 * same semantic tokens onto FLI navy so the dark treatment reads as brand
 * rather than as a generic dark mode. FLI yellow stays the accent.
 */
const fliDarkSurface = {
  "--background": "219 52% 9%",
  "--foreground": "210 20% 96%",
  "--card": "219 44% 13%",
  "--card-foreground": "210 20% 96%",
  "--popover": "219 44% 15%",
  "--popover-foreground": "210 20% 96%",
  "--primary": "40 97% 54%",
  "--primary-foreground": "219 52% 11%",
  "--secondary": "219 34% 19%",
  "--secondary-foreground": "210 20% 96%",
  "--muted": "219 32% 20%",
  "--muted-foreground": "217 18% 68%",
  "--accent": "219 34% 21%",
  "--accent-foreground": "210 20% 96%",
  "--border": "219 28% 23%",
  "--input": "219 28% 23%",
  "--ring": "40 97% 54%",
} as CSSProperties;

interface NavItem {
  labelKey: keyof typeof navLabels;
  icon: typeof LayoutDashboard;
  active?: boolean;
}

const navLabels = {
  cockpit: { fr: "Pilotage", "pt-BR": "Pilotagem", en: "Cockpit" },
  finance: { fr: "Finance", "pt-BR": "Financeiro", en: "Finance" },
  commercial: { fr: "Commercial", "pt-BR": "Comercial", en: "Sales" },
  inscriptions: { fr: "Inscriptions", "pt-BR": "Inscrições", en: "Enrolments" },
  invoices: { fr: "Factures", "pt-BR": "Faturas", en: "Invoices" },
  students: { fr: "Stagiaires", "pt-BR": "Alunos", en: "Students" },
  sessions: { fr: "Formations", "pt-BR": "Turmas", en: "Classes" },
  instructors: { fr: "Formateurs", "pt-BR": "Formadores", en: "Instructors" },
  partners: { fr: "Partenaires", "pt-BR": "Parceiros", en: "Partners" },
  quality: { fr: "Qualité", "pt-BR": "Qualidade", en: "Quality" },
  settings: { fr: "Paramètres", "pt-BR": "Configurações", en: "Settings" },
} as const;

const groupLabels = {
  steering: { fr: "Pilotage", "pt-BR": "Pilotagem", en: "Steering" },
  management: { fr: "Gestion", "pt-BR": "Gestão", en: "Management" },
  training: { fr: "Formation", "pt-BR": "Formação", en: "Training" },
  system: { fr: "Système", "pt-BR": "Sistema", en: "System" },
} as const;

const navGroups: { labelKey: keyof typeof groupLabels; items: NavItem[] }[] = [
  {
    labelKey: "steering",
    items: [{ labelKey: "cockpit", icon: LayoutDashboard, active: true }],
  },
  {
    labelKey: "management",
    items: [
      { labelKey: "finance", icon: Wallet },
      { labelKey: "commercial", icon: Briefcase },
      { labelKey: "inscriptions", icon: Users },
      { labelKey: "invoices", icon: Receipt },
      { labelKey: "students", icon: GraduationCap },
    ],
  },
  {
    labelKey: "training",
    items: [
      { labelKey: "sessions", icon: BarChart3 },
      { labelKey: "instructors", icon: Users },
      { labelKey: "partners", icon: Briefcase },
    ],
  },
  {
    labelKey: "system",
    items: [
      { labelKey: "quality", icon: BarChart3 },
      { labelKey: "settings", icon: Settings },
    ],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage();

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scrollbar-thin">
      {navGroups.map((group) => (
        <div key={group.labelKey}>
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
            {t(groupLabels[group.labelKey])}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.labelKey}>
                <button
                  type="button"
                  onClick={onNavigate}
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    item.active
                      ? "bg-[hsl(var(--fli-yellow))] font-semibold text-[hsl(219_52%_14%)]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t(navLabels[item.labelKey])}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage();

  return (
    <>
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <img src={fliMarcaYellow} alt="FLI Formation" className="h-8 w-auto object-contain" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">FLI Formation</p>
          <p className="truncate text-[11px] text-white/50">
            {t(tx.season)} {seasonLabel}
          </p>
        </div>
      </div>

      <div className="px-3 pt-3">
        <label className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-2 text-sm text-white/60 focus-within:ring-1 focus-within:ring-[hsl(var(--fli-yellow))]">
          <Search className="h-4 w-4 shrink-0" />
          <input
            type="search"
            placeholder={t(tx.search)}
            className="min-w-0 flex-1 bg-transparent text-white placeholder:text-white/40 focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-white/20 px-1 text-[10px] text-white/40 sm:block">
            ⌘K
          </kbd>
        </label>
      </div>

      <SidebarNav onNavigate={onNavigate} />

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--fli-yellow))] text-[11px] font-bold text-[hsl(219_52%_14%)]">
            SM
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">Sandrine Morel</p>
            <p className="truncate text-[11px] text-white/50">{t(navLabels.cockpit)}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export type Period = "today" | "d7" | "month" | "quarter" | "season";

const periodLabels: Record<Period, (typeof tx)["periodToday"]> = {
  today: tx.periodToday,
  d7: tx.period7d,
  month: tx.periodMonth,
  quarter: tx.periodQuarter,
  season: tx.periodSeason,
};

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const { t } = useLanguage();
  const periods: Period[] = ["today", "d7", "month", "quarter", "season"];

  return (
    <div
      role="tablist"
      aria-label={t(tx.periodLabel)}
      className="flex w-full gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 scrollbar-thin sm:w-auto"
    >
      {periods.map((period) => (
        <button
          key={period}
          type="button"
          role="tab"
          aria-selected={value === period}
          onClick={() => onChange(period)}
          className={cn(
            "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            value === period
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {t(periodLabels[period])}
        </button>
      ))}
    </div>
  );
}

interface MockupShellProps {
  children: ReactNode;
  rail: ReactNode;
  period: Period;
  onPeriodChange: (p: Period) => void;
}

export function MockupShell({ children, rail, period, onPeriodChange }: MockupShellProps) {
  const { t } = useLanguage();
  const [dark, setDark] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div
      className={cn("min-h-screen bg-background text-foreground", dark && "dark")}
      style={dark ? fliDarkSurface : undefined}
    >
      <div className="flex min-h-screen">
        {/* Persistent sidebar from lg up; drawer below that. */}
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col bg-[hsl(var(--fli-navy))] lg:flex">
          <SidebarBody />
        </aside>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-[272px] max-w-[85vw] flex-col bg-[hsl(var(--fli-navy))] shadow-2xl">
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarBody onNavigate={() => setMobileNavOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[hsl(var(--fli-navy))]">
            <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>

              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
                <span className="truncate text-white/50">{t(tx.breadcrumbRoot)}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/30" />
                <span className="truncate font-medium text-white">{t(tx.breadcrumbCurrent)}</span>
              </nav>

              <span className="ml-auto hidden items-center gap-2 rounded-full bg-[hsl(var(--fli-yellow)/0.15)] px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--fli-yellow))] sm:inline-flex">
                {t(tx.mockupBadge)}
              </span>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDark((d) => !d)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10"
                  aria-label={t(tx.toggleTheme)}
                  title={t(tx.toggleTheme)}
                >
                  {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  className="hidden h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 sm:flex"
                  aria-label={t(tx.refresh)}
                  title={t(tx.refresh)}
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[hsl(var(--fli-yellow))] ring-2 ring-[hsl(var(--fli-navy))]" />
                </button>
                <div className="hidden sm:block">
                  <LanguageSelector />
                </div>
              </div>
            </div>
          </header>

          {/* Page heading + period control */}
          <div className="px-3 pt-4 sm:px-5 sm:pt-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                    {t(tx.pageTitle)}
                  </h1>
                  <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {t(tx.season)} {seasonLabel}
                  </span>
                  <LivePulse className="hidden sm:inline-flex" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{t(tx.subtitle)}</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <PeriodSelector value={period} onChange={onPeriodChange} />
                <button
                  type="button"
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium transition-colors hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" />
                  {t(tx.export)}
                </button>
              </div>
            </div>

            <p className="mt-3 rounded-lg border border-[hsl(var(--fli-yellow)/0.3)] bg-[hsl(var(--fli-yellow)/0.08)] px-3 py-2 text-[11px] text-muted-foreground">
              {t(tx.mockupNotice)}
            </p>
          </div>

          {/*
            Content + rail. The rail only becomes a true right column at 2xl,
            where there is room for three zones; below that it flows underneath
            so nothing is truncated on laptops or tablets.
          */}
          <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-5 2xl:flex-row">
            <main className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">{children}</main>
            <aside className="w-full shrink-0 2xl:w-[312px]">
              <div className="2xl:sticky 2xl:top-[72px]">
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground 2xl:hidden">
                  {t(tx.railTitle)}
                </h2>
                {/* Below 2xl the rail cards tile horizontally instead of stacking. */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4 2xl:block 2xl:space-y-4">
                  {rail}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
