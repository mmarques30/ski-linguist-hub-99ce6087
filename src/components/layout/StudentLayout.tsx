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

/**
 * Coque du portail stagiaire : en-tête dédié, navigation à 5 entrées et barre
 * basse en mobile. Mêmes jetons que le back-office (surfaces, rayons, teintes)
 * pour que ce soit le même produit, sans les affordances staff.
 */
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
    <div className="min-h-screen bg-[hsl(var(--surface-page))]">
      {isAssistMode && (
        <div className="border-b border-[hsl(var(--tint-gold-ring))] bg-[hsl(var(--tint-gold-bg))] text-[hsl(var(--tint-gold-fg))]">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
            <div className="flex min-w-0 items-center gap-2 font-medium">
              <Eye className="h-4 w-4 shrink-0" />
              <span className="min-w-0">
                Mode Assister — vous voyez l&apos;espace de{" "}
                {studentName || "ce stagiaire"}
              </span>
            </div>
            <Button variant="outline" size="sm" className="h-8 bg-card" asChild>
              <Link to={studentId ? `/students/${studentId}` : "/students"}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Quitter
              </Link>
            </Button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-xs">
        <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <img src={fliLogo} alt="FLI" className="h-8 w-auto" />
            <span className="truncate text-sm font-semibold text-muted-foreground">
              {isAssistMode ? "Prévisualisation stagiaire" : "Espace stagiaire"}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="shrink-0">
            {isAssistMode ? (
              <>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour fiche
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="container mx-auto flex gap-6 px-4 py-4">
        <nav className="hidden w-52 shrink-0 flex-col space-y-1 md:flex">
          {studentNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-[var(--radius)] px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary font-medium text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-[hsl(var(--surface-sunken))] hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-border bg-card py-2 shadow-lg md:hidden">
          {studentNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 rounded-[var(--radius)] px-2 py-1 text-2xs transition-colors",
                  isActive ? "font-medium text-primary" : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name.split(" ").pop()}
            </NavLink>
          ))}
        </div>

        <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
