import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusPill, toneForStatus } from "@/components/ui-kit";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { GitMerge } from "lucide-react";
import {
  preferredKeeperAmong,
  useMergePartners,
} from "@/hooks/usePartnerDedup";
import {
  partnerDedupReasonLabel,
  suggestPartnerDisplayName,
  type PartnerDedupInput,
  type PartnerDedupMatch,
} from "@/lib/partner-dedup";
import { PROSPECTION_MONITEURS_GELEE } from "@/lib/prospection-gel";

interface PartnerDedupPanelProps {
  partner: PartnerDedupInput;
  matches: PartnerDedupMatch[];
  onMerged?: (keeperId: string) => void;
}

export function PartnerDedupPanel({ partner, matches, onMerged }: PartnerDedupPanelProps) {
  const merge = useMergePartners();
  const [pending, setPending] = useState<PartnerDedupMatch | null>(null);

  if (matches.length === 0) return null;

  const suggestedName = suggestPartnerDisplayName(partner);

  const confirmMerge = async () => {
    if (!pending) return;
    const keeper = preferredKeeperAmong(partner, pending.partner);
    const loser = keeper.id === partner.id ? pending.partner : partner;
    const keeperId = keeper.id;
    await merge.mutateAsync({ keeperId, loserId: loser.id, loser });
    setPending(null);
    onMerged?.(keeperId);
  };

  return (
    <>
      <Alert className="border-[hsl(var(--tint-purple-ring))] bg-[hsl(var(--tint-purple-bg))]">
        <GitMerge className="h-4 w-4" />
        <AlertTitle>Doublons détectés (BL-038)</AlertTitle>
        <AlertDescription className="space-y-3">
          <p className="text-sm">
            {matches.length} fiche{matches.length > 1 ? "s" : ""} susceptible
            {matches.length > 1 ? "s" : ""} d’être la même entité.
            {suggestedName ? (
              <>
                {" "}
                Nom suggéré pour cette fiche : <strong>{suggestedName}</strong>.
              </>
            ) : null}
          </p>
          <ul className="space-y-2">
            {matches.map((m) => {
              const keeper = preferredKeeperAmong(partner, m.partner);
              const weAreKeeper = keeper.id === partner.id;
              return (
                <li
                  key={m.partner.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] border border-border bg-card px-3 py-2 text-sm"
                >
                  <div className="min-w-0 space-y-0.5">
                    <Link
                      to={`/gestion/partenaires/${m.partner.id}`}
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {m.partner.name}
                    </Link>
                    <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                      <StatusPill tone={toneForStatus(m.partner.status)} size="sm">
                        {m.partner.status}
                      </StatusPill>
                      <StatusPill tone="neutral" size="sm">
                        {m.partner.type}
                      </StatusPill>
                      <span>{partnerDedupReasonLabel(m.reason)}</span>
                      {m.partner.station ? <span>· {m.partner.station}</span> : null}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={weAreKeeper ? "default" : "outline"}
                    disabled={merge.isPending}
                    onClick={() => setPending(m)}
                  >
                    {weAreKeeper ? "Fusionner ici" : "Fusionner vers l’autre"}
                  </Button>
                </li>
              );
            })}
          </ul>
          {PROSPECTION_MONITEURS_GELEE && (
            <p className="text-xs text-muted-foreground">
              Gel prospection actif : la fusion reprend les liens et crée un contact, puis masque
              la fiche perdante. La suppression définitive attendra la levée du gel.
            </p>
          )}
        </AlertDescription>
      </Alert>

      <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la fusion</DialogTitle>
            <DialogDescription>
              {pending
                ? (() => {
                    const keeper = preferredKeeperAmong(partner, pending.partner);
                    const loser = keeper.id === partner.id ? pending.partner : partner;
                    return (
                      <>
                        Conserver <strong>{keeper.name}</strong> et fusionner{" "}
                        <strong>{loser.name}</strong> dedans. Les inscriptions, contacts et
                        contrats rattachés seront repris.
                      </>
                    );
                  })()
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Annuler
            </Button>
            <Button onClick={() => void confirmMerge()} disabled={merge.isPending}>
              {merge.isPending ? "Fusion…" : "Fusionner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
