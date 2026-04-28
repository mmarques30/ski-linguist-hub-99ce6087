import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

const LABELS: Record<string, string> = {
  finance: "Finance",
  analyses: "Analyses",
  rentabilite: "Rentabilité",
  tresorerie: "Trésorerie",
  payments: "Paiements",
  "charges-fixes": "Charges fixes",
  gestion: "Gestion",
  commercial: "Commercial",
  partenaires: "Partenaires",
  inscriptions: "Inscriptions",
  invoices: "Factures",
  students: "Stagiaires",
  tests: "Tests de niveau",
  classes: "Planning",
  formation: "Formation",
  sessions: "Sessions",
  documents: "Documents",
  settings: "Paramètres",
  admin: "Administration",
  import: "Import",
  "import-phrases": "Import phrases",
  phrases: "Phrases",
  testing: "Tests QA",
  users: "Utilisateurs",
  seasons: "Saisons",
  formateur: "Formateur",
  evaluations: "Évaluations",
  evaluation: "Évaluation",
  "evaluation-view": "Évaluation",
  amelioration: "Amélioration",
  "satisfaction-stats": "Satisfaction",
  formateurs: "Formateurs",
  qualite: "Qualité",
  audit: "Audit Qualiopi",
  historique: "Historique",
  student: "Espace stagiaire",
  dashboard: "Tableau de bord",
  test: "Test",
  planning: "Planning",
};

function labelize(seg: string): string {
  if (LABELS[seg]) return LABELS[seg];
  // UUID / numeric id detection
  if (/^[0-9a-f]{8}-/i.test(seg) || /^\d+$/.test(seg)) return "Détails";
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

export function Breadcrumbs() {
  const { pathname } = useLocation();
  if (pathname === "/" || pathname === "/auth") return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, idx) => {
    const path = "/" + segments.slice(0, idx + 1).join("/");
    return { label: labelize(seg), path, isLast: idx === segments.length - 1 };
  });

  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex items-center gap-1 px-4 lg:px-6 py-2 text-sm text-muted-foreground border-b bg-background/50"
    >
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Dashboard</span>
      </Link>
      {crumbs.map((c) => (
        <Fragment key={c.path}>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          {c.isLast ? (
            <span className="font-medium text-foreground">{c.label}</span>
          ) : (
            <Link to={c.path} className="hover:text-foreground transition-colors">
              {c.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
