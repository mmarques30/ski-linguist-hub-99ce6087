import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  ClipboardList,
  LogOut,
  GraduationCap,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useStudentView } from "@/contexts/StudentViewContext";
import { toast } from "sonner";
import fliLogo from "@/assets/fli-logo.png";

interface StudentLayoutProps {
  children: ReactNode;
}

const studentNavPages = [
  { name: "Mon tableau de bord", page: "dashboard", icon: LayoutDashboard },
  { name: "Test de niveau", page: "test", icon: ClipboardList },
  { name: "Mon planning", page: "planning", icon: Calendar },
  { name: "Mes documents", page: "documents", icon: FileText },
  { name: "Évaluation", page: "evaluation", icon: GraduationCap },
] as const;

export function StudentLayout({ children }: StudentLayoutProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { basePath, isAssistMode, studentName, studentId } = useStudentView();

  const studentNav = studentNavPages.map((item) => ({
    ...item,
    href: `${basePath}/${item.page}`,
  }));

  const handleSignOut = async () => {
    if (isAssistMode) {
      navigate(studentId ? `/students/${studentId}` : "/students");
      return;
    }
    await signOut();
    toast.success("Déconnexion réussie");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {isAssistMode && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-950">
          <div className="container mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Eye className="h-4 w-4 shrink-0" />
              <span>
                Mode Assister — vous voyez l&apos;espace de{" "}
                {studentName || "ce stagiaire"}
              </span>
            </div>
            <Button variant="outline" size="sm" className="h-8 bg-white" asChild>
              <Link to={studentId ? `/students/${studentId}` : "/students"}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Quitter
              </Link>
            </Button>
          </div>
        </div>
      )}

      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={fliLogo} alt="FLI" className="h-8 w-auto" />
            <span className="text-sm font-semibold text-muted-foreground">
              {isAssistMode ? "Prévisualisation stagiaire" : "Espace stagiaire"}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            {isAssistMode ? (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour fiche
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 flex gap-6">
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

        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
