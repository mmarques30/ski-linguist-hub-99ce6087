import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, LayoutDashboard, LogOut, PanelLeft } from "lucide-react";
import fliLogo from "@/assets/fli-marca-yellow.png";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useLanguage } from "@/contexts/LanguageContext";
import { CHROME_UI, CHROME_BREADCRUMB } from "@/lib/chrome-i18n";
import {
  activeChildHref,
  FORMATEUR_SECTIONS,
  isItemActive,
  matchScore,
  navRouteKey,
  NAV_SECTIONS,
  type NavItem,
  type NavSection,
} from "@/lib/navigation";

/**
 * Niveau 1 — la section. C'est elle, le menu parent : un vrai bouton, surface
 * et contour au repos, qui déplie ses pages.
 */
const LEVEL_1 = cn(
  "relative h-9 border border-sidebar-border/40 bg-sidebar-accent/40 font-medium text-sidebar-foreground/90",
  "transition-colors hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground",
  "data-[state=open]:bg-sidebar-accent/70",
  "data-[active=true]:border-sidebar-primary/40 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground",
  "before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-primary",
  "before:opacity-0 data-[active=true]:before:opacity-100",
  "group-data-[collapsible=icon]:before:hidden",
);

/** Niveau 2 — les pages d'une section : cliquables, subordonnées. */
const LEVEL_2 = cn(
  // `w-full` : un <button> se dimensionne sur son contenu, pas un <a>.
  "h-8 w-full gap-2 text-sidebar-foreground/75 transition-colors",
  "hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
  "data-[state=open]:text-sidebar-foreground",
  "data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-foreground",
);

/** Niveau 3 — les filtres et onglets d'une page : le plus discret. */
const LEVEL_3 = cn(
  "h-7 text-xs text-sidebar-foreground/60 transition-colors",
  "hover:bg-sidebar-accent/60 hover:text-sidebar-foreground/90",
  "data-[active=true]:bg-sidebar-accent/80 data-[active=true]:font-medium data-[active=true]:text-sidebar-foreground",
);

/**
 * Navigation produit — 3 niveaux : **section repliable** (le menu parent) ·
 * pages · filtres. L'arbre vit dans `@/lib/navigation` ; ce composant ne fait
 * que le rendre, filtrer par permission et gérer l'ouverture.
 *
 * Tout est replié par défaut : une seule section ouverte à la fois, celle que
 * l'on ouvre ou celle de la page courante. Idem pour les pages à filtres.
 */
export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { isAdmin, isFormateur, canView } = useUserPermissions();
  const { t } = useLanguage();

  const { pathname, search } = location;
  const dashboardLabel = t(CHROME_BREADCRUMB.dashboard);
  const logoutLabel = t(CHROME_UI.logout);

  const sections: NavSection[] = useMemo(() => {
    if (isFormateur) return FORMATEUR_SECTIONS;
    const visible = (node: { href: string; routeKey?: string; adminOnly?: boolean }) => {
      if (node.adminOnly && !isAdmin) return false;
      if (isAdmin) return true;
      const key = navRouteKey(node);
      return key ? canView(key) : true;
    };
    return NAV_SECTIONS.filter((section) => !section.adminOnly || isAdmin)
      .map((section) => ({
        ...section,
        items: section.items.flatMap((item) => {
          if (item.adminOnly && !isAdmin) return [];
          if (!item.children?.length) return visible(item) ? [item] : [];
          const children = item.children.filter(visible);
          if (children.length === 0) return [];
          // Le parent mène toujours vers un sous-menu autorisé.
          return [{ ...item, children, href: children[0].href }];
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [canView, isAdmin, isFormateur]);

  /** Section et page qui contiennent l'URL courante. */
  const { activeSectionId, activeItemId } = useMemo(() => {
    for (const section of sections) {
      for (const item of section.items) {
        if (isItemActive(item, pathname, search)) {
          return {
            activeSectionId: section.id as string,
            activeItemId: item.children?.length ? item.id : null,
          };
        }
      }
    }
    return { activeSectionId: null, activeItemId: null };
  }, [pathname, search, sections]);

  const [openSection, setOpenSection] = useState<string | null>(activeSectionId);
  const [openItem, setOpenItem] = useState<string | null>(activeItemId);

  // Changer de page réaligne l'ouverture sur la section et la page courantes.
  useEffect(() => {
    setOpenSection(activeSectionId);
  }, [activeSectionId]);
  useEffect(() => {
    setOpenItem(activeItemId);
  }, [activeItemId]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur de déconnexion",
        description: error.message,
      });
    } else {
      navigate("/auth", { replace: true });
    }
  };

  /** Niveau 2 — une page de la section, avec ses filtres au niveau 3. */
  const renderItem = (item: NavItem) => {
    const label = t(item.label);
    const badge = item.badgeKey === "frozen" ? t(CHROME_UI.frozen) : undefined;
    const active = isItemActive(item, pathname, search);

    if (!item.children?.length) {
      return (
        <SidebarMenuSubItem key={item.id}>
          <SidebarMenuSubButton asChild isActive={active} className={LEVEL_2}>
            <NavLink to={item.href}>
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {badge && <FrozenBadge label={badge} />}
            </NavLink>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      );
    }

    const isOpen = openItem === item.id;
    const currentChild = activeChildHref(item, pathname, search);

    return (
      <Collapsible
        key={item.id}
        asChild
        open={isOpen}
        onOpenChange={(next) => setOpenItem(next ? item.id : null)}
      >
        <SidebarMenuSubItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuSubButton asChild isActive={active && !isOpen} className={LEVEL_2}>
              <button type="button" aria-label={label}>
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-left">{label}</span>
                {badge && <FrozenBadge label={badge} />}
                <Chevron open={isOpen} />
              </button>
            </SidebarMenuSubButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {/* mr/pr à 0 : rend la largeur aux libellés longs, le guide reste à gauche. */}
            <SidebarMenuSub className="mx-0 mt-1 mr-0 pr-0 pl-2">
              {item.children.map((child) => (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={currentChild === child.href}
                    className={LEVEL_3}
                  >
                    <NavLink to={child.href}>
                      <span className="truncate">{t(child.label)}</span>
                    </NavLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuSubItem>
      </Collapsible>
    );
  };

  /** Niveau 1 — la section repliable. */
  const renderSection = (section: NavSection) => {
    const label = t(section.label);
    const isOpen = openSection === section.id;
    const active = activeSectionId === section.id;

    return (
      <SidebarGroup key={section.id}>
        <SidebarGroupContent>
          <SidebarMenu>
            <Collapsible
              asChild
              open={isOpen}
              onOpenChange={(next) => setOpenSection(next ? section.id : null)}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    isActive={active && !isOpen}
                    aria-label={label}
                    className={LEVEL_1}
                  >
                    <section.icon className="h-4 w-4" />
                    <span className="flex-1 truncate text-left">{label}</span>
                    <Chevron open={isOpen} />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mt-1 mr-0 pr-0">
                    {section.items.map(renderItem)}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  /**
   * Mode icône — les sections n'ont plus de place : on retombe sur un trilho
   * plat des pages, chacune avec son infobulle.
   */
  const renderIconRail = () => (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {sections.flatMap((section) =>
            section.items.map((item) => (
              <SidebarMenuItem key={`${section.id}-${item.id}`}>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive(item, pathname, search)}
                  tooltip={t(item.label)}
                  className={LEVEL_1}
                >
                  <NavLink to={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 truncate">{t(item.label)}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )),
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  // Pas de liseré entre la sidebar et le contenu : `border-r-0` seul ne suffit
  // pas, le composant pose la bordure via `group-data-[side=left]:border-r`
  // (plus spécifique). Même variante = même poids, et la règle tombe.
  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
      {/* h-14 : la bordure basse prolonge exactement celle du TopHeader. */}
      <SidebarHeader className="h-14 shrink-0 justify-center border-b border-sidebar-border px-2 py-0">
        <div className="flex items-center gap-2 px-1">
          <img src={fliLogo} alt="FLI" className="h-7 w-7 shrink-0 object-contain" />
          {!isCollapsed && (
            <span className="truncate text-xs font-medium text-sidebar-foreground/80">
              Formation
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {!isFormateur && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={matchScore("/", pathname, search) >= 0}
                    tooltip={dashboardLabel}
                    className={LEVEL_1}
                  >
                    <NavLink to="/">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>{dashboardLabel}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isCollapsed ? renderIconRail() : sections.map(renderSection)}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <LanguageSelector collapsed={isCollapsed} />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton onClick={handleLogout} className={LEVEL_1}>
                  <LogOut className="h-4 w-4" />
                  <span>{logoutLabel}</span>
                </SidebarMenuButton>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">{logoutLabel}</TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className={isCollapsed ? "flex justify-center py-1" : "px-1 pb-1 pt-2"}>
          <ThemeToggle collapsed={isCollapsed} className={isCollapsed ? undefined : "w-full"} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <ChevronRight
      aria-hidden
      className={cn(
        "h-4 w-4 shrink-0 text-sidebar-foreground/45 transition-transform duration-200",
        open && "rotate-90 text-sidebar-foreground/80",
      )}
    />
  );
}

function FrozenBadge({ label }: { label: string }) {
  return (
    <span className="rounded-pill bg-[hsl(var(--tint-gold-bg))] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[hsl(var(--tint-gold-fg))]">
      {label}
    </span>
  );
}

export function SidebarToggle() {
  return (
    <SidebarTrigger className="h-9 w-9">
      <PanelLeft className="h-4 w-4" />
    </SidebarTrigger>
  );
}
