import { Wallet } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { useFormateurPayments, useFormateurProfile } from "@/hooks/useFormateurPortal";
import {
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
  toneForStatus,
} from "@/components/ui-kit";

function formatEuro(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Number(value).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export default function FormateurPaiements() {
  const { data: profile } = useFormateurProfile();
  const { data: payments = [], isLoading } = useFormateurPayments(profile?.id);

  return (
    <FormateurPageShell>
      <PageShell>
        <PageHeader
          title="Paiements"
          description="Rémunérations enregistrées par FLI"
          icon={Wallet}
          tone="blue"
        />

        {isLoading ? (
          <SurfaceCard flush>
            <TableSkeleton rows={4} cols={3} />
          </SurfaceCard>
        ) : payments.length === 0 ? (
          <SurfaceCard flush>
            <TableEmpty title="Aucun paiement enregistré pour le moment." />
          </SurfaceCard>
        ) : (
          <ul className="space-y-3">
            {payments.map((p) => (
              <li key={p.id}>
                <SurfaceCard>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold tabular">{formatEuro(p.montant)}</p>
                      <p className="text-xs text-muted-foreground tabular">
                        Période{" "}
                        {p.periode_debut
                          ? format(new Date(p.periode_debut), "d MMM yyyy", { locale: fr })
                          : "—"}
                        {" → "}
                        {p.periode_fin
                          ? format(new Date(p.periode_fin), "d MMM yyyy", { locale: fr })
                          : "—"}
                      </p>
                      {p.date_paiement ? (
                        <p className="text-xs text-muted-foreground tabular">
                          Payé le{" "}
                          {format(new Date(p.date_paiement), "d MMM yyyy", { locale: fr })}
                          {p.moyen_paiement ? ` · ${p.moyen_paiement}` : ""}
                          {p.reference_paiement ? ` · réf. ${p.reference_paiement}` : ""}
                        </p>
                      ) : null}
                      {p.notes ? (
                        <p className="text-xs text-muted-foreground">{p.notes}</p>
                      ) : null}
                    </div>
                    <StatusPill
                      tone={toneForStatus(p.statut === "paye" ? "payee" : p.statut)}
                      size="sm"
                    >
                      {p.statut === "paye" ? "Payé" : "À payer"}
                    </StatusPill>
                  </div>
                </SurfaceCard>
              </li>
            ))}
          </ul>
        )}
      </PageShell>
    </FormateurPageShell>
  );
}
