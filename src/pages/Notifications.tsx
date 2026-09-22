import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
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
import {
  IconChip,
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
} from "@/components/ui-kit";
import type { TileTone } from "@/components/ui-kit";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  inscription: BookOpen,
  paiement: CreditCard,
  test: ClipboardCheck,
  evaluation: GraduationCap,
  schedule_validation: CalendarClock,
};

/** Teinte de la chip d'icône par type — la couleur double le libellé, jamais seule. */
const typeTones: Record<string, TileTone> = {
  inscription: "gold",
  paiement: "teal",
  test: "blue",
  evaluation: "purple",
  schedule_validation: "orange",
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
      <PageShell width="narrow">
        <PageHeader
          title="Notifications"
          description="Inscriptions, paiements, tests et évaluations à traiter"
          icon={Bell}
          tone="gold"
          meta={
            unreadCount > 0 ? (
              <StatusPill tone="warning" dot>
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </StatusPill>
            ) : (
              <StatusPill tone="success" dot>
                Toutes lues
              </StatusPill>
            )
          }
          actions={
            unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Tout marquer lu
              </Button>
            )
          }
        />

        <SurfaceCard
          title={
            unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
              : "Toutes lues"
          }
          flush
        >
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <TableEmpty
              icon={Bell}
              title="Aucune notification"
              description="Les alertes staff (nouvelle inscription, paiement, évaluation à vérifier…) apparaîtront ici."
            />
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((notif) => {
                const Icon = typeIcons[notif.type] || Bell;
                const tone = typeTones[notif.type] ?? "neutral";
                return (
                  <li key={notif.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(notif)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[hsl(var(--surface-sunken))] sm:px-5",
                        !notif.is_read && "bg-[hsl(var(--surface-sunken))]"
                      )}
                    >
                      <IconChip icon={Icon} tone={tone} size="sm" className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm text-foreground",
                            !notif.is_read && "font-semibold"
                          )}
                        >
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
                        <StatusPill tone="warning" size="sm" dot className="mt-0.5 shrink-0">
                          Non lue
                        </StatusPill>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </SurfaceCard>
      </PageShell>
    </MainLayout>
  );
}
