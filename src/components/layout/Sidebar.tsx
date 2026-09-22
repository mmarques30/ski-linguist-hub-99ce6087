import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, LayoutDashboard, LogOut, PanelLeft } from "lucide-react";
import fliLogo from "@/assets/fli-marca-yellow.png";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/LanguageSelector";
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
  SidebarGroupLabel,
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
 * Niveau 1 — se lit comme un bouton : surface et contour au repos, survol
 * franc, repère jaune sur l'entrée courante.
 */
const LEVEL_1 = cn(
  "relative h-9 border border-sidebar-border/40 bg-sidebar-accent/40 text-sidebar-foreground/90",
  "transition-colors hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground",
  "data-[state=open]:bg-sidebar-accent/70",
  "data-[active=true]:border-sidebar-primary/40 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground",
  "before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-primary",
  "before:opacity-0 data-[active=true]:before:opacity-100",
  "group-data-[collapsible=icon]:before:hidden",
);

/** Niveau 2 — cliquable mais plus discret : pas de surface au repos. */
const LEVEL_2 = cn(
  "h-7 text-sidebar-foreground/65 transition-colors",
  "hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
  "data-[active=true]:bg-sidebar-accent/80 data-[active=true]:font-medium data-[active=true]:text-sidebar-foreground",
);

/**
 * Navigation produit — 3 niveaux : section (titre fixe) · entrée repliable ·
 * sous-menus. L'arbre vit dans `@/lib/navigation` ; ce composant ne fait que
 * le rendre, filtrer par permission et gérer l'ouverture.
 *
 * Les sous-menus sont repliés par défaut : un seul groupe reste ouvert à la
 * fois, celui que l'on ouvre, ou celui de la page courante.
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

  /** Groupe qui contient la page courante, s'il y en a un. */
  const activeGroupId = useMemo(() => {
    for (const section of sections) {
      for (const item of section.items) {
        if (item.children?.length && isItemActive(item, pathname, search)) {
          return item.id;
        }
      }
    }
    return null;
  }, [pathname, search, sections]);

  const [openId, setOpenId] = useState<string | null>(activeGroupId);

  // Changer de page réaligne l'ouverture sur le groupe de la page.
  useEffect(() => {
    setOpenId(activeGroupId);
  }, [activeGroupId]);

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

  const renderItem = (item: NavItem) => {
    const label = t(item.label);
    const badge = item.badgeKey === "frozen" ? t(CHROME_UI.frozen) : undefined;
    const active = isItemActive(item, pathname, search);
    const hasChildren = Boolean(item.children?.length);

    // Feuille, ou parent en mode icône : un simple lien.
    if (!hasChildren || isCollapsed) {
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton asChild isActive={active} tooltip={label} className={LEVEL_1}>
            <NavLink to={item.href}>
              <item.icon className="h-4 w-4" />
              <span className="flex-1 truncate">{label}</span>
              {badge && !isCollapsed && <FrozenBadge label={badge} />}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    const isOpen = openId === item.id;
    const currentChild = activeChildHref(item, pathname, search);

    return (
      <Collapsible
        key={item.id}
        asChild
        open={isOpen}
        onOpenChange={(next) => setOpenId(next ? item.id : null)}
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              isActive={active}
              aria-label={label}
              className={LEVEL_1}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1 truncate text-left">{label}</span>
              {badge && <FrozenBadge label={badge} />}
              <ChevronRight
                aria-hidden
                className={cn(
                  "h-4 w-4 shrink-0 text-sidebar-foreground/45 transition-transform duration-200",
                  isOpen && "rotate-90 text-sidebar-foreground/80",
                )}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {/* mr/pr à 0 : rend la largeur aux libellés longs, le guide reste à gauche. */}
            <SidebarMenuSub className="mt-1 mr-0 pr-0">
              {item.children.map((child) => (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={currentChild === child.href}
                    className={LEVEL_2}
                  >
                    <NavLink to={child.href}>
                      <span className="truncate">{t(child.label)}</span>
                    </NavLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  // Pas de liseré entre la sidebar et le contenu : `border-r-0` seul ne suffit
  // pas, le composant pose la bordure via `group-data-[side=left]:border-r`
  // (plus spécifique). Même variante = même poids, et la règle tombe.
  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
      {/* h-14 : la bordure basse prolonge exactement celle du TopHeader. */}
      <SidebarHeader className="h-14 shrink-0 justify-center border-b border-sidebar-border px-2 py-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-1">
            <img src={fliLogo} alt="FLI" className="h-7 w-auto" />
            <span className="text-xs font-medium text-sidebar-foreground/80 truncate">
              Formation
            </span>
          </div>
        )}
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

        {sections.map((section) => (
          <SidebarGroup key={section.id}>
            <SidebarGroupLabel className="text-[0.65rem] tracking-wider uppercase text-sidebar-foreground/50">
              {t(section.label)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{section.items.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
        {!isCollapsed && (
          <p className="text-xs text-sidebar-foreground/50 px-2 py-2">
            France Langues International
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function FrozenBadge({ label }: { label: string }) {
  return (
    <span className="text-[10px] uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
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
