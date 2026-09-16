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
      { key: "inscriptions.schedule", label: "Horaires J-10" },
      { key: "students", label: "Stagiaires" },
      { key: "formateurs", label: "Formateurs" },
      { key: "tests", label: "Tests de niveau" },
      { key: "evaluations", label: "Évaluations" },
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
      { key: "finance.payments", label: "Paiements" },
      { key: "finance", label: "Vue d'ensemble" },
      { key: "finance.analyses", label: "Analyses" },
      { key: "finance.rentabilite", label: "Rentabilité" },
      { key: "finance.tresorerie", label: "Trésorerie" },
      { key: "finance.charges_fixes", label: "Charges fixes" },
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
  "/inscriptions/schedule-validation": "inscriptions.schedule",
  "/invoices": "invoices",
  "/students": "students",
  "/tests": "tests",
  "/formateur/evaluations": "evaluations",
  "/formateur/evaluations/:id/verifier": "evaluations",
  "/satisfaction-stats": "satisfaction",
  "/amelioration": "amelioration",
  "/admin/seasons": "admin.seasons",
  "/formateurs": "formateurs",
  "/qualite/audit": "qualiopi_audit",
  "/qualite/historique": "audit_history",
};
