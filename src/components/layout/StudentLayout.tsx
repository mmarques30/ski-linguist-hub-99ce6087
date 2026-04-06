import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  ClipboardList,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import fliLogo from "@/assets/fli-logo.png";

interface StudentLayoutProps {
  children: ReactNode;
}

const studentNav = [
  { name: "Mon tableau de bord", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Test de niveau", href: "/student/test", icon: ClipboardList },
  { name: "Mon planning", href: "/student/planning", icon: Calendar },
  { name: "Mes documents", href: "/student/documents", icon: FileText },
  { name: "Évaluation", href: "/student/evaluation", icon: GraduationCap },
];

export function StudentLayout({ children }: StudentLayoutProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnexion réussie");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={fliLogo} alt="FLI" className="h-8 w-auto" />
            <span className="text-sm font-semibold text-muted-foreground">Espace stagiaire</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 flex gap-6">
        {/* Sidebar nav */}
        <nav className="hidden md:flex flex-col w-52 shrink-0 space-y-1">
          {studentNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t flex justify-around py-2">
          {studentNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px]",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name.split(" ").pop()}
            </NavLink>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
