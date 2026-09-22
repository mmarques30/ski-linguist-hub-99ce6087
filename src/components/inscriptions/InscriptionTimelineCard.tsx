import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, CreditCard, FileText, Clock, History, Circle } from "lucide-react";
import {
  ActivityFeed,
  StatusPill,
  SurfaceCard,
  toneForStatus,
  type FeedItem,
} from "@/components/ui-kit";
import type { TileTone } from "@/components/ui-kit";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useInscriptionTimeline,
  type InscriptionTimelineEventType,
} from "@/hooks/useInscriptionTimeline";

const TYPE_ICONS: Record<InscriptionTimelineEventType, typeof History> = {
  created: History,
  email: Mail,
  payment: CreditCard,
  document: FileText,
  schedule: Clock,
  status: Circle,
};

/** Teinte de la puce du fil — une famille d'événement, une couleur stable. */
const TYPE_TONES: Record<InscriptionTimelineEventType, TileTone> = {
  created: "navy",
  email: "blue",
  payment: "teal",
  document: "purple",
  schedule: "gold",
  status: "neutral",
};

interface InscriptionTimelineCardProps {
  inscriptionId: string;
}

export function InscriptionTimelineCard({ inscriptionId }: InscriptionTimelineCardProps) {
  const { data: events = [], isLoading } = useInscriptionTimeline(inscriptionId);

  if (isLoading) {
    return (
      <SurfaceCard
        title="Historique & événements"
        description="Chronologie des actions liées à cette inscription"
        icon={History}
      >
        <div className="space-y-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-pill" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    );
  }

  const items: FeedItem[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description || undefined,
    timestamp: format(new Date(event.at), "dd MMM yyyy à HH:mm", { locale: fr }),
    icon: TYPE_ICONS[event.type],
    tone: TYPE_TONES[event.type],
    trailing: event.status ? (
      <StatusPill tone={toneForStatus(event.status)} size="sm">
        {event.status}
      </StatusPill>
    ) : undefined,
  }));

  return (
    <SurfaceCard
      title="Historique & événements"
      description="Chronologie des actions liées à cette inscription"
      icon={History}
    >
      <ActivityFeed
        items={items}
        connected
        emptyMessage="Aucun événement enregistré pour le moment."
      />
    </SurfaceCard>
  );
}
