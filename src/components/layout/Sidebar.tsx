import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Users, 
  ClipboardList, 
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  label: string | null;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard }
    ]
  },
  {
    label: "Gestion",
    items: [
      { 
        name: "Finance", 
        href: "/finance", 
        icon: Wallet,
        subItems: [
          { name: "Vue d'ensemble", href: "/finance" },
          { name: "Analyses", href: "/finance/analyses" },
          { name: "Rentabilité", href: "/finance/rentabilite" },
          { name: "Trésorerie", href: "/finance/tresorerie" },
          { name: "Charges fixes", href: "/finance/charges-fixes" }
        ]
      },
      { name: "Inscriptions", href: "/inscriptions", icon: ClipboardList },
      { name: "Factures", href: "/invoices", icon: Receipt },
      { name: "Stagiaires", href: "/students", icon: Users }
    ]
  },
  {
    label: "Formation",
    items: [
      { name: "Tests de niveau", href: "/tests", icon: GraduationCap },
      { name: "Évaluations", href: "/formateur/evaluations", icon: ClipboardList },
      { name: "Sessions", href: "/classes", icon: Calendar }
    ]
  },
  {
    label: "Qualité",
    items: [
      { name: "Satisfaction", href: "/satisfaction-stats", icon: BarChart3 },
      { name: "Amélioration", href: "/amelioration", icon: TrendingUp },
      { name: "Documents", href: "/documents", icon: FileText }
    ]
  },
  {
    label: "Administration",
    items: [
      { name: "Import", href: "/admin/import", icon: Upload },
      { name: "Phrases", href: "/admin/phrases", icon: MessageSquare },
      { name: "Tests QA", href: "/admin/testing", icon: FlaskConical },
      { name: "Paramètres", href: "/settings", icon: Settings }
    ]
  }
];

function NavItemWithSub({ item }: { item: NavItem }) {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const isActive = location.pathname === item.href;
  const isSubActive = item.subItems?.some(sub => location.pathname === sub.href);
  const shouldBeOpen = isActive || isSubActive;
  
  const [isOpen, setIsOpen] = useState(shouldBeOpen);

  if (!item.subItems) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton asChild isActive={isActive}>
              <NavLink to={item.href}>
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </NavLink>
            </SidebarMenuButton>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              {item.name}
            </TooltipContent>
          )}
        </Tooltip>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible">
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton isActive={isActive || isSubActive}>
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
                <ChevronRight className={cn(
                  "ml-auto h-4 w-4 transition-transform duration-200",
                  isOpen && "rotate-90"
                )} />
              </SidebarMenuButton>
            </CollapsibleTrigger>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              {item.name}
            </TooltipContent>
          )}
        </Tooltip>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.subItems.map((subItem) => (
              <SidebarMenuSubItem key={subItem.href}>
                <SidebarMenuSubButton asChild isActive={location.pathname === subItem.href}>
                  <NavLink to={subItem.href}>
                    <span>{subItem.name}</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function NavItemSimple({ item }: { item: NavItem }) {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isActive = location.pathname === item.href;

  return (
    <SidebarMenuItem>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuButton asChild isActive={isActive}>
            <NavLink to={item.href}>
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </NavLink>
          </SidebarMenuButton>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right">
            {item.name}
          </TooltipContent>
        )}
      </Tooltip>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

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

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={cn(
          "flex items-center gap-2 px-2 py-2",
          isCollapsed ? "justify-center" : "justify-start"
        )}>
          {!isCollapsed && (
            <img 
              src={fliLogo} 
              alt="FLI" 
              className="h-8 w-auto"
            />
          )}
          {isCollapsed && (
            <div className="h-8 w-8 rounded-md bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-sm">FLI</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="scrollbar-thin">
        {navigationGroups.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex}>
            {group.label && (
              <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-xs tracking-wider">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  item.subItems ? (
                    <NavItemWithSub key={item.href} item={item} />
                  ) : (
                    <NavItemSimple key={item.href} item={item} />
                  )
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
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
                <TooltipContent side="right">
                  Déconnexion
                </TooltipContent>
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
