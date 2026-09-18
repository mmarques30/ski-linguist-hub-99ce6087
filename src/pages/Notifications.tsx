import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  BookOpen,
  CheckCheck,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  CalendarClock,
} from "lucide-react";
import {
  useAllNotifications,
  useMarkAllAsRead,
  useMarkAsRead,
  useUnreadCount,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { EmptyState } from "@/components/common/EmptyState";

const typeIcons: Record<string, React.ElementType> = {
  inscription: BookOpen,
  paiement: CreditCard,
  test: ClipboardCheck,
  evaluation: GraduationCap,
  schedule_validation: CalendarClock,
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const unreadCount = useUnreadCount();
  const { data: notifications = [], isLoading } = useAllNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const handleClick = (notif: {
    id: string;
    link: string | null;
    is_read: boolean;
  }) => {
    if (!notif.is_read) markAsRead.mutate(notif.id);
    if (notif.link) navigate(notif.link);
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Inscriptions, paiements, tests et évaluations à traiter
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Tout marquer lu
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {unreadCount > 0
                ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                : "Toutes lues"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="Aucune notification"
                description="Les alertes staff (nouvelle inscription, paiement, évaluation à vérifier…) apparaîtront ici."
                className="border-0 bg-transparent py-12"
              />
            ) : (
              <ul className="divide-y">
                {notifications.map((notif) => {
                  const Icon = typeIcons[notif.type] || Bell;
                  return (
                    <li key={notif.id}>
                      <button
                        type="button"
                        onClick={() => handleClick(notif)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                          !notif.is_read && "bg-accent/40"
                        )}
                      >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm", !notif.is_read && "font-medium")}>
                            {notif.title}
                          </p>
                          {notif.message && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{notif.message}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notif.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                            {notif.type ? ` · ${notif.type}` : ""}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
