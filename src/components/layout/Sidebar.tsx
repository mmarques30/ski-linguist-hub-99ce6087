import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  ClipboardList,
  UserCog,
  GraduationCap,
  Calendar,
  Receipt,
  LayoutDashboard,
  Settings,
  LogOut,
  TrendingUp,
  BarChart3,
  Wallet,
  FlaskConical,
  Upload,
  MessageSquare,
  PanelLeft,
  Briefcase,
  Award,
  Mail,
  Clock,
  FileText,
  Landmark,
} from "lucide-react";
import fliLogo from "@/assets/fli-marca-yellow.png";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { PATH_TO_ROUTE_KEY } from "@/lib/route-permissions";
import { useLanguage } from "@/contexts/LanguageContext";
import { CHROME_NAV, CHROME_SECTIONS, CHROME_UI, CHROME_BREADCRUMB } from "@/lib/chrome-i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: "frozen";
}

interface NavSection {
  sectionKey: keyof typeof CHROME_SECTIONS;
  items: NavItem[];
}

/**
 * Navigation produit — 2 niveaux (section fixe + liens).
 * Libellés via chrome-i18n (Onda D6).
 */
const navigationSections: NavSection[] = [
  {
    sectionKey: "operations",
    items: [
      { href: "/inscriptions", icon: ClipboardList },
      { href: "/inscriptions/schedule-validation", icon: Clock },
      { href: "/students", icon: Users },
      { href: "/formateurs", icon: UserCog },
      { href: "/tests", icon: GraduationCap },
      { href: "/formateur/evaluations", icon: ClipboardList },
    ],
  },
  {
    sectionKey: "commercial",
    items: [
      { href: "/gestion/commercial", icon: TrendingUp },
      { href: "/gestion/partenaires", icon: Briefcase },
      { href: "/gestion/moniteurs", icon: Users, badgeKey: "frozen" },
    ],
  },
  {
    sectionKey: "finance",
    items: [
      { href: "/invoices", icon: Receipt },
      { href: "/finance/payments", icon: Wallet },
      { href: "/finance", icon: LayoutDashboard },
      { href: "/finance/tresorerie", icon: Landmark },
    ],
  },
  {
    sectionKey: "qualite",
    items: [
      { href: "/satisfaction-stats", icon: BarChart3 },
      { href: "/amelioration", icon: TrendingUp },
      { href: "/qualite/audit", icon: Award },
      { href: "/qualite/historique", icon: ClipboardList },
    ],
  },
  {
    sectionKey: "portails",
    items: [
      { href: "/portails/stagiaire", icon: Users },
      { href: "/portails/formateur", icon: UserCog },
    ],
  },
  {
    sectionKey: "administration",
    items: [
      { href: "/admin/import", icon: Upload },
      { href: "/admin/emails", icon: Mail },
      { href: "/admin/registration-documents", icon: FileText },
      { href: "/admin/phrases", icon: MessageSquare },
      { href: "/admin/seasons", icon: Calendar },
      { href: "/admin/testing", icon: FlaskConical },
      { href: "/admin/users", icon: UserCog },
      { href: "/settings", icon: Settings },
    ],
  },
];

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/inscriptions") {
    return pathname === "/inscriptions" || /^\/inscriptions\/[^/]+$/.test(pathname);
  }
  if (href === "/students") {
    return pathname === "/students" || pathname.startsWith("/students/");
  }
  if (href === "/formateurs") {
    return pathname === "/formateurs" || pathname.startsWith("/formateurs/");
  }
  if (href === "/gestion/partenaires") {
    return pathname === "/gestion/partenaires" || pathname.startsWith("/gestion/partenaires/");
  }
  if (href === "/finance") {
    return (
      pathname === "/finance" ||
      pathname.startsWith("/finance/analyses") ||
      pathname.startsWith("/finance/rentabilite")
    );
  }
  if (href === "/finance/tresorerie") {
    return (
      pathname.startsWith("/finance/tresorerie") ||
      pathname.startsWith("/finance/charges-fixes")
    );
  }
  if (href === "/finance/payments") {
    return pathname.startsWith("/finance/payments");
  }
  if (href === "/portails/stagiaire") {
    return pathname === "/portails/stagiaire" || pathname.startsWith("/portails/stagiaire/");
  }
  if (href === "/portails/formateur") {
    return pathname === "/portails/formateur" || pathname.startsWith("/portails/formateur/");
  }
  if (href === "/formateur/evaluations") {
    return pathname.startsWith("/formateur/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { isAdmin, isFormateur, canView } = useUserPermissions();
  const { t } = useLanguage();

  const navLabel = (href: string) =>
    CHROME_NAV[href] ? t(CHROME_NAV[href]) : href;
  const sectionLabel = (key: keyof typeof CHROME_SECTIONS) =>
    t(CHROME_SECTIONS[key]);
  const dashboardLabel = t(CHROME_BREADCRUMB.dashboard);
  const logoutLabel = t(CHROME_UI.logout);

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

  const filteredSections = isFormateur
    ? [
        {
          sectionKey: "portails" as const,
          items: [{ href: "/formateur/evaluations", icon: ClipboardList }],
        },
      ]
    : navigationSections
        .filter((section) => {
          if (section.sectionKey === "administration") return isAdmin;
          return true;
        })
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => {
            if (isAdmin) return true;
            const routeKey = PATH_TO_ROUTE_KEY[item.href];
            if (!routeKey) return true;
            return canView(routeKey);
          }),
        }))
        .filter((section) => section.items.length > 0);

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
                        isActive={location.pathname === "/"}
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

        {filteredSections.map((section) => (
          <SidebarGroup key={section.sectionKey}>
            <SidebarGroupLabel className="px-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/45">
              {sectionLabel(section.sectionKey)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isItemActive(location.pathname, item.href);
                  const name = navLabel(item.href);
                  const badge =
                    item.badgeKey === "frozen" ? t(CHROME_UI.frozen) : undefined;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={name}
                          >
                            <NavLink to={item.href}>
                              <item.icon className="h-4 w-4" />
                              <span className="flex-1">{name}</span>
                              {badge && !isCollapsed && (
                                <span className="ml-auto rounded-pill bg-[hsl(var(--tint-gold-bg))] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[hsl(var(--tint-gold-fg))]">
                                  {badge}
                                </span>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right">{name}</TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
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

export function SidebarToggle() {
  return (
    <SidebarTrigger className="h-9 w-9">
      <PanelLeft className="h-4 w-4" />
    </SidebarTrigger>
  );
}
