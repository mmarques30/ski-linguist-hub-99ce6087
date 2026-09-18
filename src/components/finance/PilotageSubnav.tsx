import { Link, useLocation, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

export type PilotageTabId = "overview" | "analyses" | "rentabilite";

const PILOTAGE_TABS: { id: PilotageTabId; label: string; href: string }[] = [
  { id: "overview", label: "Vue d'ensemble", href: "/finance" },
  { id: "analyses", label: "Analyses", href: "/finance/analyses" },
  { id: "rentabilite", label: "Rentabilité", href: "/finance/rentabilite" },
];

export function resolvePilotageTab(pathname: string): PilotageTabId {
  if (pathname.startsWith("/finance/analyses")) return "analyses";
  if (pathname.startsWith("/finance/rentabilite")) return "rentabilite";
  return "overview";
}

/** Sous-navigation Pilotage — Vue d'ensemble · Analyses · Rentabilité (Vague C). */
export function PilotageSubnav() {
  const location = useLocation();
  const current = resolvePilotageTab(location.pathname);

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-px" aria-label="Sous-pages pilotage">
      {PILOTAGE_TABS.map((tab) => {
        const active = current === tab.id;
        return (
          <Link
            key={tab.id}
            to={tab.href}
            className={cn(
              "px-3 py-2 text-sm rounded-t-md border-b-2 -mb-px transition-colors",
              active
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

const TRESORERIE_TABS = [
  { id: "previsionnel", label: "Prévisionnel", href: "/finance/tresorerie" },
  { id: "charges", label: "Charges fixes", href: "/finance/tresorerie?tab=charges" },
] as const;

export function TresorerieSubnav({ activeTab }: { activeTab: "previsionnel" | "charges" }) {
  return (
    <nav className="flex flex-wrap gap-1 border-b pb-px" aria-label="Sous-pages trésorerie">
      {TRESORERIE_TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            to={tab.href}
            className={cn(
              "px-3 py-2 text-sm rounded-t-md border-b-2 -mb-px transition-colors",
              active
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
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
