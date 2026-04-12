import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Users, 
  ClipboardList,
  UserCog,
  GraduationCap, 
  Calendar,
  FileText,
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
  ChevronRight,
  PanelLeft,
  Briefcase,
  Award,
} from "lucide-react";
import { useState } from "react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { PATH_TO_ROUTE_KEY } from "@/lib/route-permissions";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SubItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubItem[];
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

const dashboardItem: NavItem = {
  name: "Dashboard",
  href: "/",
  icon: LayoutDashboard,
};

const navigationGroups: NavGroup[] = [
  {
    label: "Gestion",
    icon: Briefcase,
    items: [
      { 
        name: "Finance", 
        href: "/finance", 
        icon: Wallet,
        subItems: [
          { name: "Vue d'ensemble", href: "/finance" },
          { name: "Paiements", href: "/finance/payments" },
          { name: "Analyses", href: "/finance/analyses" },
          { name: "Rentabilité", href: "/finance/rentabilite" },
          { name: "Trésorerie", href: "/finance/tresorerie" },
          { name: "Charges fixes", href: "/finance/charges-fixes" },
        ],
      },
      { name: "Commercial", href: "/gestion/commercial", icon: TrendingUp },
      { name: "Partenaires", href: "/gestion/partenaires", icon: Briefcase },
      { name: "Inscriptions", href: "/inscriptions", icon: ClipboardList },
      { name: "Factures", href: "/invoices", icon: Receipt },
      { name: "Stagiaires", href: "/students", icon: Users },
    ],
  },
  {
    label: "Formation",
    icon: GraduationCap,
    items: [
      { name: "Tests de niveau", href: "/tests", icon: GraduationCap },
      { name: "Évaluations", href: "/formateur/evaluations", icon: ClipboardList },
      { name: "Sessions", href: "/formation/sessions", icon: Calendar },
      { name: "Ancien planning", href: "/classes", icon: Calendar },
    ],
  },
  {
    label: "Formateurs",
    icon: UserCog,
    items: [
      { name: "Formateurs", href: "/formateurs", icon: UserCog },
    ],
  },
  {
    label: "Qualité",
    icon: Award,
    items: [
      { name: "Satisfaction", href: "/satisfaction-stats", icon: BarChart3 },
      { name: "Amélioration", href: "/amelioration", icon: TrendingUp },
      { name: "Audit Qualiopi", href: "/qualite/audit", icon: Award },
      { name: "Historique", href: "/qualite/historique", icon: ClipboardList },
      { name: "Documents", href: "/documents", icon: FileText },
    ],
  },
  {
    label: "Administration",
    icon: Settings,
    items: [
      { name: "Import", href: "/admin/import", icon: Upload },
      { name: "Phrases", href: "/admin/phrases", icon: MessageSquare },
      { name: "Saisons", href: "/admin/seasons", icon: Calendar },
      { name: "Tests QA", href: "/admin/testing", icon: FlaskConical },
      { name: "Utilisateurs", href: "/admin/users", icon: UserCog },
      { name: "Paramètres", href: "/settings", icon: Settings },
    ],
  },
];

function isGroupActive(group: NavGroup, pathname: string): boolean {
  return group.items.some(
    (item) =>
      pathname === item.href ||
      item.subItems?.some((sub) => pathname === sub.href)
  );
}

function SubItemCollapsible({ item }: { item: NavItem }) {
  const location = useLocation();
  const isActive = location.pathname === item.href;
  const isSubActive = item.subItems?.some((s) => location.pathname === s.href);
  const [isOpen, setIsOpen] = useState(isActive || !!isSubActive);

  if (!item.subItems) {
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton asChild isActive={isActive}>
          <NavLink to={item.href}>
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
          </NavLink>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton isActive={isActive || !!isSubActive} className="cursor-pointer">
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
            <ChevronRight
              className={cn(
                "ml-auto h-3 w-3 transition-transform duration-200",
                isOpen && "rotate-90"
              )}
            />
          </SidebarMenuSubButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.subItems.map((sub) => (
              <SidebarMenuSubItem key={sub.href}>
                <SidebarMenuSubButton asChild isActive={location.pathname === sub.href}>
                  <NavLink to={sub.href}>
                    <span>{sub.name}</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuSubItem>
  );
}

function NavGroupCollapsible({ group }: { group: NavGroup }) {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const groupActive = isGroupActive(group, location.pathname);
  const [isOpen, setIsOpen] = useState(groupActive);

  return (
    <SidebarMenuItem>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton isActive={groupActive}>
                <group.icon className="h-4 w-4" />
                <span>{group.label}</span>
                <ChevronRight
                  className={cn(
                    "ml-auto h-4 w-4 transition-transform duration-200",
                    isOpen && "rotate-90"
                  )}
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">{group.label}</TooltipContent>
          )}
        </Tooltip>
        <CollapsibleContent>
          <SidebarMenuSub>
            {group.items.map((item) => (
              <SubItemCollapsible key={item.href} item={item} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { isAdmin, canView, loading: permsLoading } = useUserPermissions();

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

  // Filter navigation groups based on permissions
  const filteredGroups = navigationGroups
    .filter((group) => {
      // Administration only for admins
      if (group.label === "Administration") return isAdmin;
      return true;
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (isAdmin) return true;
        const routeKey = PATH_TO_ROUTE_KEY[item.href];
        if (!routeKey) return true;
        // For items with subitems (like Finance), show if any sub has permission
        if (item.subItems) {
          return item.subItems.some((sub) => {
            const subKey = PATH_TO_ROUTE_KEY[sub.href];
            return subKey ? canView(subKey) : true;
          });
        }
        return canView(routeKey);
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border py-1" />

      <SidebarContent className="scrollbar-thin">
        {/* Dashboard - standalone */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === dashboardItem.href}
                    >
                      <NavLink to={dashboardItem.href}>
                        <dashboardItem.icon className="h-4 w-4" />
                        <span>{dashboardItem.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      {dashboardItem.name}
                    </TooltipContent>
                  )}
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collapsible groups */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredGroups.map((group) => (
                <NavGroupCollapsible key={group.label} group={group} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
