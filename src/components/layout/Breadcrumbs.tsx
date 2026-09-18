import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CHROME_BREADCRUMB, CHROME_UI } from "@/lib/chrome-i18n";

/**
 * Préfixes qui n'ont pas de page dédiée : les afficher en texte, pas en lien,
 * pour éviter un NotFound au clic (ex. /gestion, /admin, /qualite).
 */
const NON_NAVIGABLE_PATHS = new Set([
  "/gestion",
  "/admin",
  "/qualite",
  "/formateur",
  "/formation",
  "/student",
]);

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  if (pathname === "/" || pathname === "/auth") return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const labelize = (seg: string): string => {
    if (CHROME_BREADCRUMB[seg]) return t(CHROME_BREADCRUMB[seg]);
    if (/^[0-9a-f]{8}-/i.test(seg) || /^\d+$/.test(seg)) return t(CHROME_UI.details);
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  };

  const crumbs = segments.map((seg, idx) => {
    const path = "/" + segments.slice(0, idx + 1).join("/");
    return {
      label: labelize(seg),
      path,
      isLast: idx === segments.length - 1,
      navigable: !NON_NAVIGABLE_PATHS.has(path),
    };
  });

  const homeLabel = t(CHROME_BREADCRUMB.dashboard);

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
        <span>{homeLabel}</span>
      </Link>
      {crumbs.map((c) => (
        <Fragment key={c.path}>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          {c.isLast || !c.navigable ? (
            <span
              className={
                c.isLast ? "font-medium text-foreground" : "text-muted-foreground"
              }
            >
              {c.label}
            </span>
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
