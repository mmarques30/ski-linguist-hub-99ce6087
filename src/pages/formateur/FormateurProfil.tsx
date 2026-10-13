import { User } from "lucide-react";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { useFormateurProfile } from "@/hooks/useFormateurPortal";
import { displayLanguageLabel } from "@/lib/taught-languages";
import { TAX_STATUSES } from "@/components/formateurs/InstructorFormDialog";
import {
  DefinitionList,
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableSkeleton,
} from "@/components/ui-kit";

function taxLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const found = TAX_STATUSES.find((t) => t.value === value);
  return found?.label ?? value;
}

export default function FormateurProfil() {
  const { data: profile, isLoading } = useFormateurProfile();

  return (
    <FormateurPageShell>
      <PageShell>
        <PageHeader
          title="Mon profil"
          description="Informations professionnelles visibles par FLI"
          icon={User}
          tone="gold"
        />

        {isLoading || !profile ? (
          <SurfaceCard flush>
            <TableSkeleton rows={6} cols={2} />
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            <SurfaceCard title="Identité" icon={User}>
              <DefinitionList
                columns={2}
                items={[
                  {
                    label: "Nom",
                    value: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "—",
                  },
                  { label: "Civilité", value: profile.civilite || "—" },
                  { label: "Email", value: profile.email || "—" },
                  { label: "Téléphone", value: profile.phone || "—" },
                  {
                    label: "Langues",
                    value: (
                      <div className="flex flex-wrap gap-1">
                        {(profile.languages || []).length === 0
                          ? "—"
                          : (profile.languages || []).map((l) => (
                              <StatusPill key={l} tone="neutral" size="sm">
                                {displayLanguageLabel(l)}
                              </StatusPill>
                            ))}
                      </div>
                    ),
                  },
                  {
                    label: "Statut",
                    value: (
                      <StatusPill tone="neutral" size="sm">
                        {profile.status || "—"}
                      </StatusPill>
                    ),
                  },
                ]}
              />
            </SurfaceCard>

            <SurfaceCard title="Coordonnées">
              <DefinitionList
                columns={2}
                items={[
                  { label: "Adresse", value: profile.address || "—" },
                  { label: "Code postal", value: profile.postal_code || "—" },
                  { label: "Ville", value: profile.city || "—" },
                  { label: "Pays", value: profile.pays || "—" },
                ]}
              />
            </SurfaceCard>

            <SurfaceCard title="Administratif">
              <DefinitionList
                columns={2}
                items={[
                  { label: "Statut fiscal", value: taxLabel(profile.tax_status) },
                  { label: "SIRET", value: profile.siret || "—" },
                  {
                    label: "Identifiant étranger",
                    value: profile.identifiant_etranger || "—",
                  },
                  {
                    label: "Assujetti TVA",
                    value:
                      profile.assujetti_tva === true
                        ? "Oui"
                        : profile.assujetti_tva === false
                          ? "Non"
                          : "—",
                  },
                  {
                    label: "Statut administratif",
                    value: profile.statut_administratif || "—",
                  },
                  {
                    label: "Tarif horaire",
                    value:
                      profile.hourly_rate != null
                        ? `${Number(profile.hourly_rate).toLocaleString("fr-FR")} €`
                        : "—",
                  },
                ]}
              />
            </SurfaceCard>

            {(profile.bio || profile.specialty_details) && (
              <SurfaceCard title="Présentation">
                <DefinitionList
                  columns={1}
                  items={[
                    ...(profile.specialty_details
                      ? [{ label: "Spécialités", value: profile.specialty_details }]
                      : []),
                    ...(profile.bio ? [{ label: "Bio", value: profile.bio }] : []),
                  ]}
                />
              </SurfaceCard>
            )}

            <p className="text-xs text-muted-foreground">
              Pour corriger une information, contactez l&apos;équipe FLI
              (info@fli.fr).
            </p>
          </div>
        )}
      </PageShell>
    </FormateurPageShell>
  );
}
