import { useState, useEffect, useRef } from "react";
import { Bell, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import fliLogo from "@/assets/fli-marca-yellow.png";
import { cn } from "@/lib/utils";

export function TopHeader() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { user } = useAuth();

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "US";

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY <= 0) {
        setVisible(true);
      } else if (currentY > lastScrollY.current) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-[hsl(219_52%_25%)] bg-[hsl(219_52%_16%)] backdrop-blur-md px-4 lg:px-6 transition-transform duration-300",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      {/* Left: toggle + logo */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-9 w-9 text-white/80 hover:text-white" />
        <img src={fliLogo} alt="FLI" className="h-7 w-auto" />
      </div>

      {/* Right: dock icons */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-all duration-200 hover:scale-110 hover:bg-white/20 hover:text-white hover:shadow-md"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            3
          </span>
        </button>

        {/* Profile */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-all duration-200 hover:scale-110 hover:bg-white/20 hover:text-white hover:shadow-md"
          aria-label="Profile"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
}
