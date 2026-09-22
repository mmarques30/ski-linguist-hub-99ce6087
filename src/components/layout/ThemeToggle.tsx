import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bascule clair / sombre.
 *
 * Volontairement sans dépendance : on pose la classe `dark` sur <html> et on
 * garde le choix dans localStorage. Le thème système sert de valeur initiale
 * quand l'utilisateur n'a jamais choisi.
 */

const STORAGE_KEY = "fli-theme";

type Theme = "light" | "dark";

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

/** Applique le thème mémorisé au démarrage, avant le premier rendu utile. */
export function initTheme() {
  applyTheme(readStoredTheme() ?? systemTheme());
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme() ?? systemTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Suit le système tant que l'utilisateur n'a pas tranché.
  useEffect(() => {
    if (readStoredTheme()) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event: MediaQueryListEvent) => setThemeState(event.matches ? "dark" : "light");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const setTheme = (next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* mode privé : le thème ne survit pas à la session, sans conséquence */
    }
    setThemeState(next);
  };

  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}

/**
 * Sélecteur segmenté clair / sombre (référence : le commutateur en pied de
 * barre latérale). En mode replié, un simple bouton.
 */
export function ThemeToggle({
  collapsed = false,
  className,
  variant = "sidebar",
}: {
  collapsed?: boolean;
  className?: string;
  variant?: "sidebar" | "header";
}) {
  const { theme, setTheme, toggle } = useTheme();

  if (collapsed || variant === "header") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={theme === "dark" ? "Passer en thème clair" : "Passer en thème sombre"}
        title={theme === "dark" ? "Thème clair" : "Thème sombre"}
        className={cn(
          variant === "header"
            ? "flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white"
            : "flex h-8 w-8 items-center justify-center rounded-[var(--radius)] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
          className
        )}
      >
        {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-pill bg-sidebar-accent/60 p-1 text-xs",
        className
      )}
      role="group"
      aria-label="Thème de l'interface"
    >
      {(["light", "dark"] as const).map((value) => {
        const active = theme === value;
        const Icon = value === "light" ? Sun : Moon;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-pill px-2.5 py-1 font-medium transition-all",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {value === "light" ? "Clair" : "Sombre"}
          </button>
        );
      })}
    </div>
  );
}
