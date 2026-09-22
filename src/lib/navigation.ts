import type { ComponentType } from "react";
import {
  Award,
  BadgeCheck,
  BarChart3,
  Briefcase,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Cog,
  Database,
  DoorOpen,
  GraduationCap,
  Handshake,
  Layers,
  Landmark,
  LayoutDashboard,
  Mail,
  Receipt,
  ShieldCheck,
  Smile,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import type { Translations } from "@/contexts/LanguageContext";
import { CHROME_NAV, CHROME_NAV_GROUPS, CHROME_SECTIONS } from "@/lib/chrome-i18n";
import { resolveRouteKey } from "@/lib/route-permissions";

type Icon = ComponentType<{ className?: string }>;

/** Feuille de sous-menu : une destination réelle (chemin + éventuels `?param=`). */
export interface NavChild {
  /** URL complète, paramètres compris — ex. `/invoices?status=a_verifier`. */
  href: string;
  label: Translations;
  /** Clé de permission ; déduite du chemin si absente. */
  routeKey?: string;
  adminOnly?: boolean;
}

/** Entrée de premier niveau : lien simple, ou parent repliable avec sous-menus. */
export interface NavItem {
  id: string;
  label: Translations;
  icon: Icon;
  /** Destination du parent (= premier sous-menu quand il y en a). */
  href: string;
  routeKey?: string;
  adminOnly?: boolean;
  badgeKey?: "frozen";
  children?: NavChild[];
}

/**
 * Section — premier niveau de la navigation, et **entrée repliable** : c'est
 * elle que l'on ouvre pour révéler ses pages.
 */
export interface NavSection {
  id: keyof typeof CHROME_SECTIONS;
  label: Translations;
  icon: Icon;
  adminOnly?: boolean;
  items: NavItem[];
}

const L = CHROME_NAV;
const G = CHROME_NAV_GROUPS;

/**
 * Arborescence produit — 3 niveaux : section (titre fixe) ·
 * entrée repliable · sous-menus pointant vers de vraies destinations.
 *
 * Règle : tout sous-menu est une URL partageable (sous-route ou `?tab=` /
 * `?status=` honoré par la page), jamais un onglet purement local.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "operations",
    label: CHROME_SECTIONS.operations,
    icon: Layers,
    items: [
      {
        id: "inscriptions",
        label: L["/inscriptions"],
        icon: ClipboardList,
        href: "/inscriptions",
        children: [
          { href: "/inscriptions", label: G.inscriptionsAll },
          { href: "/inscriptions?status=en_attente", label: G.inscriptionsPending },
          {
            href: "/inscriptions/schedule-validation",
            label: L["/inscriptions/schedule-validation"],
            routeKey: "inscriptions.schedule",
          },
          { href: "/inscriptions?status=terminee", label: G.inscriptionsDone },
        ],
      },
      { id: "students", label: L["/students"], icon: Users, href: "/students" },
      { id: "formateurs", label: L["/formateurs"], icon: UserCog, href: "/formateurs" },
      {
        id: "planning",
        label: G.planning,
        icon: CalendarDays,
        href: "/formation/sessions",
        routeKey: "inscriptions",
      },
      {
        id: "evaluations",
        label: G.evaluations,
        icon: GraduationCap,
        href: "/tests",
        children: [
          { href: "/tests", label: L["/tests"], routeKey: "tests" },
          {
            href: "/formateur/evaluations",
            label: L["/formateur/evaluations"],
            routeKey: "evaluations",
          },
          { href: "/admin/phrases", label: L["/admin/phrases"], adminOnly: true },
        ],
      },
    ],
  },
  {
    id: "commercial",
    label: CHROME_SECTIONS.commercial,
    icon: Handshake,
    items: [
      {
        id: "commercial",
        label: L["/gestion/commercial"],
        icon: TrendingUp,
        href: "/gestion/commercial",
        children: [
          { href: "/gestion/commercial", label: G.commercialPipeline },
          { href: "/gestion/commercial?tab=analytics", label: G.commercialAnalytics },
        ],
      },
      {
        id: "partenaires",
        label: L["/gestion/partenaires"],
        icon: Briefcase,
        href: "/gestion/partenaires",
      },
      {
        id: "moniteurs",
        label: L["/gestion/moniteurs"],
        icon: Users,
        href: "/gestion/moniteurs",
        badgeKey: "frozen",
        children: [
          { href: "/gestion/moniteurs", label: G.moniteursDates },
          { href: "/gestion/moniteurs?tab=ecoles", label: G.moniteursEcoles },
          { href: "/gestion/moniteurs?tab=base", label: G.moniteursBase },
        ],
      },
    ],
  },
  {
    id: "finance",
    label: CHROME_SECTIONS.finance,
    icon: Wallet,
    items: [
      {
        id: "facturation",
        label: G.facturation,
        icon: Receipt,
        href: "/invoices",
        children: [
          { href: "/invoices", label: L["/invoices"], routeKey: "invoices" },
          {
            href: "/invoices?status=en_attente",
            label: G.invoicesPending,
            routeKey: "invoices",
          },
          {
            href: "/invoices?status=a_relancer",
            label: G.invoicesToChase,
            routeKey: "invoices",
          },
          {
            href: "/invoices?status=a_verifier",
            label: G.invoicesToCheck,
            routeKey: "invoices",
          },
          {
            href: "/finance/payments",
            label: L["/finance/payments"],
            routeKey: "finance.payments",
          },
        ],
      },
      {
        id: "pilotage",
        label: L["/finance"],
        icon: LayoutDashboard,
        href: "/finance",
        children: [
          { href: "/finance", label: G.financeOverview },
          { href: "/finance/analyses", label: G.financeAnalyses },
          { href: "/finance/rentabilite", label: G.financeRentabilite },
        ],
      },
      {
        id: "tresorerie",
        label: L["/finance/tresorerie"],
        icon: Landmark,
        href: "/finance/tresorerie",
        children: [
          { href: "/finance/tresorerie", label: G.tresoreriePrevisionnel },
          { href: "/finance/tresorerie?tab=charges", label: G.tresorerieCharges },
        ],
      },
    ],
  },
  {
    id: "qualite",
    label: CHROME_SECTIONS.qualite,
    icon: BadgeCheck,
    items: [
      {
        id: "satisfaction",
        label: L["/satisfaction-stats"],
        icon: Smile,
        href: "/satisfaction-stats",
        children: [
          { href: "/satisfaction-stats", label: G.satisfactionStats },
          { href: "/satisfaction-stats?tab=comparison", label: G.satisfactionComparison },
        ],
      },
      {
        id: "amelioration",
        label: L["/amelioration"],
        icon: BarChart3,
        href: "/amelioration",
      },
      {
        id: "qualiopi",
        label: G.qualiopi,
        icon: Award,
        href: "/qualite/audit",
        children: [
          { href: "/qualite/audit", label: L["/qualite/audit"], routeKey: "qualiopi_audit" },
          {
            href: "/qualite/historique",
            label: L["/qualite/historique"],
            routeKey: "audit_history",
          },
        ],
      },
    ],
  },
  {
    id: "portails",
    label: CHROME_SECTIONS.portails,
    icon: DoorOpen,
    items: [
      {
        id: "portail-stagiaire",
        label: L["/portails/stagiaire"],
        icon: Users,
        href: "/portails/stagiaire",
      },
      {
        id: "portail-formateur",
        label: L["/portails/formateur"],
        icon: UserCog,
        href: "/portails/formateur",
      },
    ],
  },
  {
    id: "administration",
    label: CHROME_SECTIONS.administration,
    icon: ShieldCheck,
    adminOnly: true,
    items: [
      {
        id: "communications",
        label: G.communications,
        icon: Mail,
        href: "/admin/emails",
        children: [
          { href: "/admin/emails", label: G.emailModels },
          { href: "/admin/emails?tab=journal", label: G.emailJournal },
          {
            href: "/admin/registration-documents",
            label: L["/admin/registration-documents"],
          },
        ],
      },
      {
        id: "donnees",
        label: G.donnees,
        icon: Database,
        href: "/admin/import",
        children: [
          { href: "/admin/import", label: L["/admin/import"] },
          { href: "/admin/import-phrases", label: G.importPhrases },
          { href: "/admin/testing", label: L["/admin/testing"] },
        ],
      },
      {
        id: "configuration",
        label: G.configuration,
        icon: Cog,
        href: "/settings",
        children: [
          { href: "/settings", label: G.settingsOrganisation },
          { href: "/admin/seasons", label: L["/admin/seasons"] },
          { href: "/settings?tab=languages", label: G.settingsLanguages },
          { href: "/settings?tab=notifications", label: G.settingsNotifications },
          { href: "/settings?tab=integrations", label: G.settingsIntegrations },
          { href: "/admin/users", label: L["/admin/users"] },
        ],
      },
    ],
  },
];

/** Navigation réduite affichée aux comptes formateur. */
export const FORMATEUR_SECTIONS: NavSection[] = [
  {
    id: "portails",
    label: CHROME_SECTIONS.portails,
    icon: DoorOpen,
    items: [
      {
        id: "mes-evaluations",
        label: L["/formateur/evaluations"],
        icon: ClipboardCheck,
        href: "/formateur/evaluations",
        routeKey: "evaluations",
      },
    ],
  },
];

/** Sépare `/chemin?a=b` en chemin et paramètres. */
export function splitHref(href: string): { path: string; params: URLSearchParams } {
  const [path, query = ""] = href.split("?");
  return { path, params: new URLSearchParams(query) };
}

/** Clé de permission d'une entrée (explicite, sinon déduite du chemin). */
export function navRouteKey(node: { href: string; routeKey?: string }): string | null {
  if (node.routeKey) return node.routeKey;
  return resolveRouteKey(splitHref(node.href).path);
}

/** Le pathname courant relève-t-il de ce chemin de menu ? */
export function isPathActive(pathname: string, path: string): boolean {
  if (path === "/") return pathname === "/";
  if (path === "/inscriptions") {
    if (pathname === "/inscriptions/schedule-validation") return false;
    return pathname === "/inscriptions" || /^\/inscriptions\/[^/]+$/.test(pathname);
  }
  if (path === "/finance") {
    return pathname === "/finance";
  }
  if (path === "/finance/tresorerie") {
    return (
      pathname.startsWith("/finance/tresorerie") ||
      pathname.startsWith("/finance/charges-fixes")
    );
  }
  if (path === "/formateur/evaluations") {
    return pathname.startsWith("/formateur/");
  }
  if (path === "/formation/sessions") {
    return pathname.startsWith("/formation/sessions") || pathname === "/classes";
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * Score de correspondance d'une destination : -1 si hors sujet, sinon le
 * nombre de paramètres d'URL satisfaits (le plus précis l'emporte entre
 * frères — `?status=x` bat le lien nu quand le paramètre est présent).
 */
export function matchScore(href: string, pathname: string, search: string): number {
  const { path, params } = splitHref(href);
  if (!isPathActive(pathname, path)) return -1;
  const current = new URLSearchParams(search);
  let score = 0;
  for (const [key, value] of params) {
    if (current.get(key) !== value) return -1;
    score += 1;
  }
  return score;
}

/** Sous-menu actif d'une entrée (le mieux noté), ou `null`. */
export function activeChildHref(
  item: NavItem,
  pathname: string,
  search: string,
): string | null {
  if (!item.children?.length) return null;
  let best: { href: string; score: number } | null = null;
  for (const child of item.children) {
    const score = matchScore(child.href, pathname, search);
    if (score < 0) continue;
    if (!best || score > best.score) best = { href: child.href, score };
  }
  return best?.href ?? null;
}

/** Une entrée est active si elle-même ou l'un de ses sous-menus l'est. */
export function isItemActive(item: NavItem, pathname: string, search: string): boolean {
  if (matchScore(item.href, pathname, search) >= 0) return true;
  return activeChildHref(item, pathname, search) !== null;
}
