export interface RoutePermission {
  key: string;
  label: string;
  parent?: string;
}

export interface RouteGroup {
  label: string;
  routes: RoutePermission[];
}

export const ROUTE_GROUPS: RouteGroup[] = [
  {
    label: "Opérations",
    routes: [
      { key: "inscriptions", label: "Inscriptions" },
      { key: "inscriptions.schedule", label: "Constitution des groupes", parent: "inscriptions" },
      { key: "students", label: "Stagiaires" },
      { key: "formateurs", label: "Formateurs" },
      { key: "tests", label: "Tests de niveau" },
      { key: "evaluations", label: "Évaluations orales" },
    ],
  },
  {
    label: "Commercial & partenaires",
    routes: [
      { key: "commercial", label: "Pipeline commercial" },
      { key: "partenaires", label: "Partenaires" },
      { key: "moniteurs", label: "Moniteurs de ski" },
    ],
  },
  {
    label: "Finance",
    routes: [
      { key: "invoices", label: "Factures" },
      { key: "finance.payments", label: "Paiements", parent: "finance" },
      { key: "finance", label: "Pilotage" },
      { key: "finance.tresorerie", label: "Trésorerie", parent: "finance" },
    ],
  },
  {
    label: "Qualité",
    routes: [
      { key: "satisfaction", label: "Satisfaction" },
      { key: "amelioration", label: "Amélioration" },
      { key: "qualiopi_audit", label: "Audit Qualiopi" },
      { key: "audit_history", label: "Journal d'audit" },
    ],
  },
  {
    label: "Portails",
    routes: [
      { key: "portails.stagiaire", label: "Espace stagiaire", parent: "students" },
      { key: "portails.formateur", label: "Espace formateur", parent: "formateurs" },
    ],
  },
];

export const ALL_ROUTE_KEYS = ROUTE_GROUPS.flatMap((g) =>
  g.routes.map((r) => r.key)
);

/** Chemins exacts → clé (les plus longs d'abord pour resolveRouteKey). */
export const PATH_TO_ROUTE_KEY: Record<string, string> = {
  "/": "dashboard",
  "/finance": "finance",
  "/finance/analyses": "finance",
  "/finance/rentabilite": "finance",
  "/finance/tresorerie": "finance.tresorerie",
  "/finance/charges-fixes": "finance.tresorerie",
  "/finance/payments": "finance.payments",
  "/gestion/commercial": "commercial",
  "/gestion/moniteurs": "moniteurs",
  "/gestion/partenaires": "partenaires",
  "/inscriptions": "inscriptions",
  "/inscriptions/schedule-validation": "inscriptions.schedule",
  "/invoices": "invoices",
  "/students": "students",
  "/tests": "tests",
  "/formateur/evaluations": "evaluations",
  "/satisfaction-stats": "satisfaction",
  "/amelioration": "amelioration",
  "/admin/seasons": "admin",
  "/admin/users": "admin",
  "/admin/import": "admin",
  "/admin/emails": "admin",
  "/admin/testing": "admin",
  "/admin/phrases": "admin",
  "/admin/import-phrases": "admin",
  "/admin/registration-documents": "admin",
  "/settings": "admin",
  "/formateurs": "formateurs",
  "/qualite/audit": "qualiopi_audit",
  "/qualite/historique": "audit_history",
  "/portails/stagiaire": "portails.stagiaire",
  "/portails/formateur": "portails.formateur",
};

const SORTED_PATHS = Object.keys(PATH_TO_ROUTE_KEY).sort(
  (a, b) => b.length - a.length
);

/** Résout la clé de permission pour un pathname (préfixe le plus long). */
export function resolveRouteKey(pathname: string): string | null {
  if (PATH_TO_ROUTE_KEY[pathname]) return PATH_TO_ROUTE_KEY[pathname];
  for (const path of SORTED_PATHS) {
    if (path === "/") continue;
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      return PATH_TO_ROUTE_KEY[path];
    }
  }
  if (pathname.startsWith("/admin") || pathname === "/settings") return "admin";
  if (pathname.startsWith("/formateur")) return "evaluations";
  if (pathname.startsWith("/portails/stagiaire")) return "portails.stagiaire";
  if (pathname.startsWith("/portails/formateur")) return "portails.formateur";
  return null;
}

export function routeKeyLabel(routeKey: string): string | undefined {
  if (routeKey === "dashboard") return "Tableau de bord";
  if (routeKey === "admin") return "Administration";
  for (const group of ROUTE_GROUPS) {
    const hit = group.routes.find((r) => r.key === routeKey);
    if (hit) return hit.label;
  }
  return undefined;
}

/** Parent explicite ou premier segment (finance.payments → finance). */
export function routeKeyParent(routeKey: string): string | null {
  for (const group of ROUTE_GROUPS) {
    const hit = group.routes.find((r) => r.key === routeKey);
    if (hit?.parent) return hit.parent;
  }
  if (routeKey.includes(".")) return routeKey.split(".")[0];
  return null;
}
