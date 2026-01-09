import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Users, 
  ClipboardList, 
  GraduationCap, 
  Calendar,
  FileText,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import fliLogo from "@/assets/fli-logo-white.png";

const navigation = [
  { name: "Painel", href: "/", icon: LayoutDashboard },
  { name: "Inscrições", href: "/inscriptions", icon: ClipboardList },
  { name: "Alunos", href: "/students", icon: Users },
  { name: "Testes de Nível", href: "/tests", icon: GraduationCap },
  { name: "Turmas", href: "/classes", icon: Calendar },
  { name: "Documentos", href: "/documents", icon: FileText },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <img 
              src={fliLogo} 
              alt="FLI - France Langues International" 
              className="h-10 w-auto"
            />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-sidebar-primary-foreground")} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={cn(
          "border-t border-sidebar-border p-4",
          collapsed && "px-2"
        )}>
          {!collapsed && (
            <p className="text-xs text-sidebar-foreground/50">
              France Langues International
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
