import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  activeChildHref,
  isItemActive,
  matchScore,
  navRouteKey,
  NAV_SECTIONS,
  splitHref,
  type NavItem,
} from "@/lib/navigation";
import { PATH_TO_ROUTE_KEY } from "@/lib/route-permissions";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

const ALL_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);
const ALL_HREFS = ALL_ITEMS.flatMap((item) =>
  item.children?.length ? item.children.map((c) => c.href) : [item.href],
);

function item(id: string): NavItem {
  const hit = ALL_ITEMS.find((i) => i.id === id);
  if (!hit) throw new Error(`entrée de menu introuvable : ${id}`);
  return hit;
}

describe("arborescence de navigation — 3 niveaux", () => {
  it("regroupe les sections attendues", () => {
    expect(NAV_SECTIONS.map((s) => s.id)).toEqual([
      "operations",
      "commercial",
      "finance",
      "qualite",
      "portails",
      "administration",
    ]);
    expect(NAV_SECTIONS.find((s) => s.id === "administration")?.adminOnly).toBe(true);
  });

  it("place chaque destination sous un seul sous-menu", () => {
    const doublons = ALL_HREFS.filter((h, i) => ALL_HREFS.indexOf(h) !== i);
    expect(doublons).toEqual([]);
  });

  it("fait pointer chaque parent repliable vers son premier sous-menu", () => {
    for (const nav of ALL_ITEMS) {
      if (nav.children?.length) {
        expect(nav.href).toBe(nav.children[0].href);
      }
    }
  });

  it("n'expose que des chemins déclarés dans le routeur", () => {
    const app = source("src/App.tsx");
    for (const href of ALL_HREFS) {
      const { path } = splitHref(href);
      expect(app, `route manquante pour ${href}`).toContain(`path="${path}"`);
    }
  });

  it("résout une clé de permission pour chaque destination", () => {
    for (const nav of ALL_ITEMS) {
      for (const child of nav.children ?? []) {
        expect(navRouteKey(child), `clé manquante pour ${child.href}`).toBeTruthy();
      }
      if (!nav.children?.length) {
        expect(navRouteKey(nav), `clé manquante pour ${nav.href}`).toBeTruthy();
      }
    }
    expect(PATH_TO_ROUTE_KEY["/formation/sessions"]).toBe("inscriptions");
  });

  it("réserve à l'admin les sous-menus sensibles", () => {
    const phrases = item("evaluations").children?.find(
      (c) => c.href === "/admin/phrases",
    );
    expect(phrases?.adminOnly).toBe(true);
  });
});

describe("état actif — chemins et paramètres d'URL", () => {
  it("distingue les filtres frères d'une même page", () => {
    const inscriptions = item("inscriptions");
    expect(activeChildHref(inscriptions, "/inscriptions", "")).toBe("/inscriptions");
    expect(activeChildHref(inscriptions, "/inscriptions", "?status=en_attente")).toBe(
      "/inscriptions?status=en_attente",
    );
    expect(activeChildHref(inscriptions, "/inscriptions", "?status=terminee")).toBe(
      "/inscriptions?status=terminee",
    );
  });

  it("sort la constitution des groupes du lien « toutes les inscriptions »", () => {
    expect(matchScore("/inscriptions", "/inscriptions/schedule-validation", "")).toBe(-1);
    expect(
      activeChildHref(item("inscriptions"), "/inscriptions/schedule-validation", ""),
    ).toBe("/inscriptions/schedule-validation");
    expect(matchScore("/inscriptions", "/inscriptions/abc-123", "")).toBe(0);
  });

  it("suit les sous-routes finance", () => {
    const pilotage = item("pilotage");
    expect(activeChildHref(pilotage, "/finance", "")).toBe("/finance");
    expect(activeChildHref(pilotage, "/finance/analyses", "")).toBe("/finance/analyses");
    expect(activeChildHref(pilotage, "/finance/rentabilite", "")).toBe(
      "/finance/rentabilite",
    );
    expect(isItemActive(pilotage, "/finance/tresorerie", "")).toBe(false);

    const tresorerie = item("tresorerie");
    expect(activeChildHref(tresorerie, "/finance/tresorerie", "")).toBe(
      "/finance/tresorerie",
    );
    expect(activeChildHref(tresorerie, "/finance/tresorerie", "?tab=charges")).toBe(
      "/finance/tresorerie?tab=charges",
    );
  });

  it("garde la facturation active sur les paiements", () => {
    const facturation = item("facturation");
    expect(isItemActive(facturation, "/finance/payments", "")).toBe(true);
    expect(activeChildHref(facturation, "/invoices", "?status=a_verifier")).toBe(
      "/invoices?status=a_verifier",
    );
  });

  it("garde le groupe Tests & évaluations actif sur les sous-pages formateur", () => {
    expect(isItemActive(item("evaluations"), "/formateur/evaluation/abc", "")).toBe(true);
    expect(isItemActive(item("evaluations"), "/tests", "")).toBe(true);
  });

  it("ouvre Planning depuis l'ancienne route /classes", () => {
    expect(isItemActive(item("planning"), "/classes", "")).toBe(true);
    expect(isItemActive(item("planning"), "/formation/sessions", "")).toBe(true);
  });
});

describe("pages alignées sur les sous-menus (`?tab=`)", () => {
  const attendus: [string, string][] = [
    ["src/pages/admin/Emails.tsx", "emailsTab"],
    ["src/pages/Settings.tsx", "settingsTab"],
    ["src/pages/moniteurs/MoniteursSki.tsx", "moniteursTab"],
    ["src/pages/commercial/CommercialDashboard.tsx", "commercialTab"],
    ["src/pages/SatisfactionStats.tsx", "activeTab"],
  ];

  it("pilote l'onglet de page par l'URL", () => {
    for (const [fichier, marqueur] of attendus) {
      const code = source(fichier);
      expect(code, `${fichier} doit utiliser useTabParam`).toContain("useTabParam");
      // Le contrôle d'onglets est passé de <Tabs> à SegmentedControl (kit) ;
      // l'invariant reste le même : la valeur affichée vient de l'URL.
      expect(code, `${fichier} doit contrôler ses onglets`).toContain(
        `value={${marqueur}}`,
      );
    }
  });

  it("efface le paramètre quand on revient à l'onglet par défaut", () => {
    const hook = source("src/hooks/useTabParam.ts");
    expect(hook).toContain("params.delete(param)");
    expect(hook).toContain("replace: true");
  });
});

describe("sidebar — la section est le menu parent", () => {
  const sidebar = source("src/components/layout/Sidebar.tsx");

  it("donne une icône à chaque section, puisqu'elle est devenue un bouton", () => {
    for (const section of NAV_SECTIONS) {
      expect(section.icon, `icône manquante pour ${section.id}`).toBeTruthy();
    }
  });

  it("replie la section elle-même, et la page à filtres à l'intérieur", () => {
    expect(sidebar).toContain("CollapsibleTrigger");
    expect(sidebar).toContain('collapsible="icon"');
    // Niveau 1 = la section : c'est elle qu'on ouvre.
    expect(sidebar).toContain("setOpenSection(next ? section.id : null)");
    // Niveau 2 = la page, repliable à son tour quand elle a des filtres.
    expect(sidebar).toContain("setOpenItem(next ? item.id : null)");
  });

  it("n'ouvre qu'une section à la fois et suit la page courante", () => {
    // Un identifiant, pas une liste : ouvrir une section ferme la précédente.
    expect(sidebar).toContain("const [openSection, setOpenSection] = useState<string | null>(activeSectionId)");
    expect(sidebar).toContain("const [openItem, setOpenItem] = useState<string | null>(activeItemId)");
    expect(sidebar).toContain("setOpenSection(activeSectionId)");
    expect(sidebar).toContain("setOpenItem(activeItemId)");
  });

  it("dégrade la hiérarchie sur trois niveaux", () => {
    const slice = (de: string, a: string) => sidebar.slice(sidebar.indexOf(de), sidebar.indexOf(a));
    const niveau1 = slice("const LEVEL_1", "/** Niveau 2");
    const niveau2 = slice("const LEVEL_2", "/** Niveau 3");
    const niveau3 = slice("const LEVEL_3", "* Navigation produit");

    // Niveau 1 — la section : surface ET contour au repos, elle se lit comme un bouton.
    expect(niveau1).toContain("bg-sidebar-accent/40");
    expect(niveau1).toContain("border border-sidebar-border/40");
    // Niveaux 2 et 3 — pas de surface ni de contour au repos, seulement au survol.
    for (const [nom, niveau] of [["2", niveau2], ["3", niveau3]] as const) {
      expect(niveau, `niveau ${nom} : pas de contour au repos`).not.toContain("border-sidebar-border");
      expect(niveau, `niveau ${nom} : surface seulement au survol ou actif`).not.toMatch(
        /(?<!hover:|data-\[active=true\]:)bg-sidebar-accent/,
      );
    }
    // Contraste décroissant : chaque niveau s'efface un peu plus que le précédent.
    expect(niveau1).toContain("text-sidebar-foreground/90");
    expect(niveau2).toContain("text-sidebar-foreground/75");
    expect(niveau3).toContain("text-sidebar-foreground/60");
    // Le déclencheur du niveau 2 est un <button> : sans w-full il ne remplit pas sa ligne.
    expect(niveau2).toContain("w-full");
  });

  it("garde une couleur sur chaque bordure", () => {
    // `* { @apply border-border }` peindrait sinon un liseré gris clair sur le bleu nuit.
    expect(sidebar).toContain("border-b border-sidebar-border");
    expect(sidebar).toContain("border-t border-sidebar-border");
  });

  it("ne laisse pas de liseré clair entre la sidebar et le contenu", () => {
    // `border-r-0` nu perd contre `group-data-[side=left]:border-r`, plus spécifique.
    expect(sidebar).toContain('className="group-data-[side=left]:border-r-0"');
    expect(sidebar).not.toContain('className="border-r-0"');
  });

  it("retombe sur un trilho plat de pages en mode icône", () => {
    // Une section sans libellé n'a aucun sens : en mode icône on montre les pages.
    expect(sidebar).toContain("renderIconRail");
    expect(sidebar).toContain("isCollapsed ? renderIconRail() : sections.map(renderSection)");
  });

  it("garde l'arbre hors du composant", () => {
    expect(sidebar).toContain('from "@/lib/navigation"');
    expect(sidebar).not.toContain("navigationSections");
  });
});
