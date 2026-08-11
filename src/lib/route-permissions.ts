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
    label: "Gestion",
    routes: [
      { key: "commercial", label: "Commercial" },
      { key: "moniteurs", label: "Moniteurs ski" },
      { key: "finance", label: "Vue d'ensemble" },
      { key: "finance.analyses", label: "Analyses" },
      { key: "finance.rentabilite", label: "Rentabilité" },
      { key: "finance.tresorerie", label: "Trésorerie" },
      { key: "finance.charges_fixes", label: "Charges fixes" },
      { key: "finance.payments", label: "Paiements" },
      { key: "partenaires", label: "Partenaires" },
      { key: "inscriptions", label: "Inscriptions" },
      { key: "invoices", label: "Factures" },
      { key: "students", label: "Stagiaires" },
    ],
  },
  {
    label: "Formation",
    routes: [
      { key: "tests", label: "Tests de niveau" },
      { key: "evaluations", label: "Évaluations" },
      { key: "classes", label: "Sessions" },
      { key: "formateurs", label: "Formateurs" },
    ],
  },
  {
    label: "Qualité",
    routes: [
      { key: "satisfaction", label: "Satisfaction" },
      { key: "amelioration", label: "Amélioration" },
      { key: "qualiopi_audit", label: "Audit Qualiopi" },
      { key: "audit_history", label: "Historique audit" },
      { key: "documents", label: "Documents" },
    ],
  },
];

export const ALL_ROUTE_KEYS = ROUTE_GROUPS.flatMap((g) =>
  g.routes.map((r) => r.key)
);

// Map URL paths to route_keys for sidebar filtering
export const PATH_TO_ROUTE_KEY: Record<string, string> = {
  "/": "dashboard",
  "/finance": "finance",
  "/finance/analyses": "finance.analyses",
  "/finance/rentabilite": "finance.rentabilite",
  "/finance/tresorerie": "finance.tresorerie",
  "/finance/charges-fixes": "finance.charges_fixes",
  "/finance/payments": "finance.payments",
  "/gestion/commercial": "commercial",
  "/gestion/moniteurs": "moniteurs",
  "/gestion/partenaires": "partenaires",
  "/inscriptions": "inscriptions",
  "/invoices": "invoices",
  "/students": "students",
  "/tests": "tests",
  "/formateur/evaluations": "evaluations",
  "/classes": "classes",
  "/formation/sessions": "classes",
  "/satisfaction-stats": "satisfaction",
  "/amelioration": "amelioration",
  "/documents": "documents",
  "/admin/seasons": "admin.seasons",
  "/formateurs": "formateurs",
  "/qualite/audit": "qualiopi_audit",
  "/qualite/historique": "audit_history",
};
