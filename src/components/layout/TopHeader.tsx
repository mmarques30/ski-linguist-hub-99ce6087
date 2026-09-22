import { useState, useEffect, useRef } from "react";
import { Bell, BookOpen, CreditCard, ClipboardCheck, GraduationCap, CheckCheck, CalendarClock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount, useRecentNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";
import fliLogo from "@/assets/fli-marca-yellow.png";
import { GlobalSearch } from "./GlobalSearch";
import { ThemeToggle } from "./ThemeToggle";
import { SeasonFilterControl } from "./SeasonFilterControl";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS, ptBR } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { CHROME_UI, CHROME_NAV } from "@/lib/chrome-i18n";

const typeIcons: Record<string, React.ElementType> = {
  inscription: BookOpen,
  paiement: CreditCard,
  test: ClipboardCheck,
  evaluation: GraduationCap,
  schedule_validation: CalendarClock,
};

export function TopHeader() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const unreadCount = useUnreadCount();
  const { data: notifications = [] } = useRecentNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const [open, setOpen] = useState(false);

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "FL";

  const dateLocale = language === "pt-BR" ? ptBR : language === "en" ? enUS : fr;

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

  const handleNotificationClick = (notif: { id: string; link: string | null; is_read: boolean }) => {
    if (!notif.is_read) {
      markAsRead.mutate(notif.id);
    }
    setOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <header
      data-app-header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar/95 px-3 backdrop-blur-md transition-transform duration-300 supports-[backdrop-filter]:bg-sidebar/85 sm:gap-4 sm:px-4 lg:px-6",
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
        <div className="mr-2 hidden lg:block">
          <SeasonFilterControl />
        </div>
        {/* Global search */}
        <div className="mr-1 sm:mr-2">
          <GlobalSearch />
        </div>
        {/* Thème clair / sombre */}
        <ThemeToggle variant="header" className="mr-1" />

        {/* Notifications */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-white/10 text-white/70 transition-all duration-200 hover:bg-white/20 hover:text-white"
              aria-label={t(CHROME_UI.notifications)}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-destructive px-1 text-[10px] font-bold tabular text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h4 className="text-sm font-semibold">{t(CHROME_UI.notifications)}</h4>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={() => markAllAsRead.mutate()}
                >
                  <CheckCheck className="mr-1 h-3 w-3" />
                  {t(CHROME_UI.markAllRead)}
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {t(CHROME_UI.noNotifications)}
                </p>
              ) : (
                notifications.map((notif) => {
                  const Icon = typeIcons[notif.type] || Bell;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                        !notif.is_read && "bg-accent/50"
                      )}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm", !notif.is_read && "font-medium")}>
                          {notif.title}
                        </p>
                        {notif.message && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {notif.message}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => {
                  setOpen(false);
                  navigate("/notifications");
                }}
              >
                {t(CHROME_UI.seeAll)}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile → Paramètres */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-white/10 text-white/70 transition-all duration-200 hover:bg-white/20 hover:text-white"
          aria-label={t(CHROME_NAV["/settings"])}
          onClick={() => navigate("/settings")}
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
