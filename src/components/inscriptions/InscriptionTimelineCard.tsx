import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, CreditCard, FileText, Clock, History, Circle } from "lucide-react";
import {
  useInscriptionTimeline,
  type InscriptionTimelineEvent,
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

interface InscriptionTimelineCardProps {
  inscriptionId: string;
}

export function InscriptionTimelineCard({ inscriptionId }: InscriptionTimelineCardProps) {
  const { data: events = [], isLoading } = useInscriptionTimeline(inscriptionId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Historique & événements</CardTitle>
        <CardDescription>
          Chronologie des actions liées à cette inscription
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun événement enregistré pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <TimelineRow key={event.id} event={event} isLast={index === events.length - 1} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineRow({
  event,
  isLast,
}: {
  event: InscriptionTimelineEvent;
  isLast: boolean;
}) {
  const Icon = TYPE_ICONS[event.type];

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1 min-h-[16px]" />}
      </div>
      <div className="flex-1 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium text-sm">{event.title}</p>
          <span className="text-xs text-muted-foreground">
            {format(new Date(event.at), "dd MMM yyyy à HH:mm", { locale: fr })}
          </span>
        </div>
        {event.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
        )}
        {event.status && (
          <Badge variant="outline" className="mt-1 text-xs">{event.status}</Badge>
        )}
      </div>
    </div>
  );
}
