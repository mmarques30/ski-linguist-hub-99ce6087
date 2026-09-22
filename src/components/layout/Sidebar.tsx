import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, LayoutDashboard, LogOut, PanelLeft } from "lucide-react";
import fliLogo from "@/assets/fli-marca-yellow.png";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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

const OPEN_GROUPS_KEY = "fli.sidebar.openGroups";

function readOpenGroups(): string[] {
  try {
    const raw = window.localStorage.getItem(OPEN_GROUPS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Navigation produit — 3 niveaux : section (titre fixe) · entrée repliable ·
 * sous-menus. L'arbre vit dans `@/lib/navigation` ; ce composant ne fait que
 * le rendre, filtrer par permission et retenir les groupes ouverts.
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

  const [openGroups, setOpenGroups] = useState<string[]>(readOpenGroups);

  const persistOpenGroups = useCallback((next: string[]) => {
    setOpenGroups(next);
    try {
      window.localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(next));
    } catch {
      /* stockage indisponible : l'état reste en mémoire */
    }
  }, []);

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

  /** Le groupe contenant la page courante s'ouvre tout seul. */
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

  useEffect(() => {
    if (!activeGroupId) return;
    setOpenGroups((current) =>
      current.includes(activeGroupId) ? current : [...current, activeGroupId],
    );
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

    if (!item.children?.length) {
      return (
        <SidebarMenuItem key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton asChild isActive={active} tooltip={label}>
                <NavLink to={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 truncate">{label}</span>
                  {badge && !isCollapsed && <FrozenBadge label={badge} />}
                </NavLink>
              </SidebarMenuButton>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
          </Tooltip>
        </SidebarMenuItem>
      );
    }

    // Replié en mode icône : le parent redevient un simple lien vers sa page.
    if (isCollapsed) {
      return (
        <SidebarMenuItem key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton asChild isActive={active} tooltip={label}>
                <NavLink to={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 truncate">{label}</span>
                </NavLink>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      );
    }

    const isOpen = openGroups.includes(item.id);
    const currentChild = activeChildHref(item, pathname, search);

    return (
      <Collapsible
        key={item.id}
        asChild
        open={isOpen}
        onOpenChange={(next) =>
          persistOpenGroups(
            next
              ? [...openGroups.filter((id) => id !== item.id), item.id]
              : openGroups.filter((id) => id !== item.id),
          )
        }
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              isActive={active && !isOpen}
              aria-label={label}
              className="gap-2"
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1 truncate text-left">{label}</span>
              {badge && <FrozenBadge label={badge} />}
              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 text-sidebar-foreground/50 transition-transform ${
                  isOpen ? "rotate-90" : ""
                }`}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) => (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={currentChild === child.href}
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

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
        <div className="flex items-center gap-2.5 px-1">
          <img src={fliLogo} alt="FLI" className="h-7 w-7 shrink-0 object-contain" />
          {!isCollapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                FLI Formation
              </p>
              <p className="truncate text-[0.65rem] text-sidebar-foreground/60">
                France Langues International
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {!isFormateur && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        asChild
                        isActive={matchScore("/", pathname, search) >= 0}
                        tooltip={dashboardLabel}
                      >
                        <NavLink to="/">
                          <LayoutDashboard className="h-4 w-4" />
                          <span>{dashboardLabel}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">{dashboardLabel}</TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {sections.map((section) => (
          <SidebarGroup key={section.id}>
            <SidebarGroupLabel className="px-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/45">
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
                <SidebarMenuButton onClick={handleLogout}>
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

function FrozenBadge({ label }: { label: string }) {
  return (
    <span className="ml-auto rounded-pill bg-[hsl(var(--tint-gold-bg))] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[hsl(var(--tint-gold-fg))]">
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
