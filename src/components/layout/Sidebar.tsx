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
} from "lucide-react";
import fliLogo from "@/assets/fli-marca-yellow.png";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LanguageSelector } from "@/components/LanguageSelector";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Navigation produit — 2 niveaux (section fixe + liens).
 * Finance réduit à Factures · Paiements · Pilotage (sous-pages via onglets).
 * Évaluations orales distinctes de Formateurs (CRM équipe).
 */
const navigationSections: NavSection[] = [
  {
    label: "Opérations",
    items: [
      { name: "Inscriptions", href: "/inscriptions", icon: ClipboardList },
      { name: "Constitution des groupes", href: "/inscriptions/schedule-validation", icon: Clock },
      { name: "Stagiaires", href: "/students", icon: Users },
      { name: "Formateurs", href: "/formateurs", icon: UserCog },
      { name: "Tests de niveau", href: "/tests", icon: GraduationCap },
      { name: "Évaluations orales", href: "/formateur/evaluations", icon: ClipboardList },
    ],
  },
  {
    label: "Commercial & partenaires",
    items: [
      { name: "Pipeline commercial", href: "/gestion/commercial", icon: TrendingUp },
      { name: "Partenaires", href: "/gestion/partenaires", icon: Briefcase },
      { name: "Moniteurs de ski", href: "/gestion/moniteurs", icon: Users, badge: "gelé" },
    ],
  },
  {
    label: "Finance",
    items: [
      { name: "Factures", href: "/invoices", icon: Receipt },
      { name: "Paiements", href: "/finance/payments", icon: Wallet },
      { name: "Pilotage", href: "/finance", icon: LayoutDashboard },
    ],
  },
  {
    label: "Qualité",
    items: [
      { name: "Satisfaction", href: "/satisfaction-stats", icon: BarChart3 },
      { name: "Amélioration", href: "/amelioration", icon: TrendingUp },
      { name: "Audit Qualiopi", href: "/qualite/audit", icon: Award },
      { name: "Journal d'audit", href: "/qualite/historique", icon: ClipboardList },
    ],
  },
  {
    label: "Administration",
    items: [
      { name: "Import", href: "/admin/import", icon: Upload },
      { name: "Emails", href: "/admin/emails", icon: Mail },
      { name: "Modèles documents", href: "/admin/registration-documents", icon: FileText },
      { name: "Phrases", href: "/admin/phrases", icon: MessageSquare },
      { name: "Saisons", href: "/admin/seasons", icon: Calendar },
      { name: "Tests QA", href: "/admin/testing", icon: FlaskConical },
      { name: "Utilisateurs", href: "/admin/users", icon: UserCog },
      { name: "Paramètres", href: "/settings", icon: Settings },
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
    return pathname === "/finance";
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
          label: "Espace formateur",
          items: [
            {
              name: "Évaluations",
              href: "/formateur/evaluations",
              icon: ClipboardList,
            },
          ],
        },
      ]
    : navigationSections
        .filter((section) => {
          if (section.label === "Administration") return isAdmin;
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
      <SidebarHeader className="border-b border-sidebar-border py-2 px-2">
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === "/"}
                        tooltip="Tableau de bord"
                      >
                        <NavLink to="/">
                          <LayoutDashboard className="h-4 w-4" />
                          <span>Tableau de bord</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">Tableau de bord</TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[0.65rem] tracking-wider uppercase text-sidebar-foreground/50">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isItemActive(location.pathname, item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={item.name}
                          >
                            <NavLink to={item.href}>
                              <item.icon className="h-4 w-4" />
                              <span className="flex-1">{item.name}</span>
                              {item.badge && !isCollapsed && (
                                <span className="ml-auto text-[10px] uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                  {item.badge}
                                </span>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right">{item.name}</TooltipContent>
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
                  <span>Déconnexion</span>
                </SidebarMenuButton>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">Déconnexion</TooltipContent>
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

export function SidebarToggle() {
  return (
    <SidebarTrigger className="h-9 w-9">
      <PanelLeft className="h-4 w-4" />
    </SidebarTrigger>
  );
}
