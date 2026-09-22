import { Link, useSearchParams } from "react-router-dom";
import { BarChart3, LayoutDashboard, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubNav, type SubNavItem } from "@/components/ui-kit";

export type PilotageTabId = "overview" | "analyses" | "rentabilite";

const PILOTAGE_TABS: (SubNavItem & { id: PilotageTabId })[] = [
  { id: "overview", to: "/finance", label: "Vue d'ensemble", icon: LayoutDashboard, end: true },
  { id: "analyses", to: "/finance/analyses", label: "Analyses", icon: BarChart3 },
  { id: "rentabilite", to: "/finance/rentabilite", label: "Rentabilité", icon: Percent },
];

export function resolvePilotageTab(pathname: string): PilotageTabId {
  if (pathname.startsWith("/finance/analyses")) return "analyses";
  if (pathname.startsWith("/finance/rentabilite")) return "rentabilite";
  return "overview";
}

/** Sous-navigation Pilotage — Vue d'ensemble · Analyses · Rentabilité (Vague C). */
export function PilotageSubnav() {
  return <SubNav items={PILOTAGE_TABS} />;
}

const TRESORERIE_TABS = [
  { id: "previsionnel", label: "Prévisionnel", href: "/finance/tresorerie" },
  { id: "charges", label: "Charges fixes", href: "/finance/tresorerie?tab=charges" },
] as const;

/**
 * Même grammaire de pastilles que `SubNav`, mais l'onglet actif est imposé :
 * les deux routes partagent `/finance/tresorerie` (l'onglet « charges fixes »
 * passe par une redirection), donc `NavLink` ne peut pas les distinguer seul.
 */
export function TresorerieSubnav({ activeTab }: { activeTab: "previsionnel" | "charges" }) {
  return (
    <nav
      className="flex max-w-full items-center gap-1 overflow-x-auto rounded-pill border border-border bg-[hsl(var(--surface-sunken))] p-1 scrollbar-thin"
      aria-label="Sous-pages trésorerie"
    >
      {TRESORERIE_TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            to={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Helper for tresorerie active tab from search params. */
export function useTresorerieTab(): "previsionnel" | "charges" {
  const [params] = useSearchParams();
  return params.get("tab") === "charges" ? "charges" : "previsionnel";
}
