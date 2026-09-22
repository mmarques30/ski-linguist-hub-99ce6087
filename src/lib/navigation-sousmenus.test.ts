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
      expect(code, `${fichier} doit contrôler ses onglets`).toContain(
        `<Tabs value={${marqueur}}`,
      );
    }
  });

  it("efface le paramètre quand on revient à l'onglet par défaut", () => {
    const hook = source("src/hooks/useTabParam.ts");
    expect(hook).toContain("params.delete(param)");
    expect(hook).toContain("replace: true");
  });
});

describe("sidebar repliable", () => {
  const sidebar = source("src/components/layout/Sidebar.tsx");

  it("rend les sous-menus dans un Collapsible", () => {
    expect(sidebar).toContain("CollapsibleTrigger");
    expect(sidebar).toContain("SidebarMenuSub");
    expect(sidebar).toContain('collapsible="icon"');
  });

  it("replie les sous-menus par défaut, un seul groupe ouvert à la fois", () => {
    // Un seul identifiant ouvert, pas une liste : ouvrir un groupe ferme l'autre.
    expect(sidebar).toContain("const [openId, setOpenId] = useState<string | null>(activeGroupId)");
    expect(sidebar).toContain("setOpenId(next ? item.id : null)");
    expect(sidebar).toContain("const isOpen = openId === item.id;");
    // Changer de page réaligne l'ouverture sur le groupe de la page courante.
    expect(sidebar).toContain("setOpenId(activeGroupId)");
  });

  it("donne un rendu de bouton aux deux niveaux, le second plus discret", () => {
    const niveau1 = sidebar.slice(sidebar.indexOf("const LEVEL_1"), sidebar.indexOf("const LEVEL_2"));
    const niveau2 = sidebar.slice(sidebar.indexOf("const LEVEL_2"), sidebar.indexOf("* Navigation produit"));
    // Niveau 1 : surface + contour au repos, donc lisible comme un bouton.
    expect(niveau1).toContain("bg-sidebar-accent/40");
    expect(niveau1).toContain("border-sidebar-border/40");
    expect(niveau1).toContain("hover:bg-sidebar-accent");
    // Niveau 2 : aucune surface au repos, seulement au survol.
    expect(niveau2).not.toMatch(/(?<!hover:|data-\[active=true\]:)bg-sidebar-accent\/\d/);
    expect(niveau2).toContain("hover:bg-sidebar-accent/70");
    // Toute largeur de bordure vient avec sa couleur : le `*{@apply border-border}`
    // global peindrait sinon un liseré gris clair sur le bleu nuit.
    expect(niveau1).toContain("border border-sidebar-border/40");
    expect(sidebar).toContain("border-b border-sidebar-border");
    expect(sidebar).toContain("border-t border-sidebar-border");
  });

  it("ne laisse pas de liseré clair entre la sidebar et le contenu", () => {
    // `border-r-0` nu perd contre `group-data-[side=left]:border-r`, plus spécifique.
    expect(sidebar).toContain('className="group-data-[side=left]:border-r-0"');
    expect(sidebar).not.toContain('className="border-r-0"');
  });

  it("garde l'arbre hors du composant", () => {
    expect(sidebar).toContain('from "@/lib/navigation"');
    expect(sidebar).not.toContain('navigationSections');
  });
});
