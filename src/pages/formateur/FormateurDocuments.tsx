import { FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { CertificatePdfButton } from "@/components/certificates/CertificatePdfButton";
import {
  useFormateurContracts,
  useFormateurProfile,
} from "@/hooks/useFormateurPortal";
import {
  INSTRUCTOR_CV_BUCKET,
  instructorCvOpenLabel,
  isExternalCvUrl,
} from "@/lib/instructor-cv";
import {
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
} from "@/components/ui-kit";

export default function FormateurDocuments() {
  const { data: profile, isLoading: loadingProfile } = useFormateurProfile();
  const { data: contracts = [], isLoading: loadingContracts } = useFormateurContracts(
    profile?.id
  );

  const cvUrl = profile?.cv_url?.trim() || null;
  const vigilanceUrl = profile?.vigilance_attestation_url?.trim() || null;

  return (
    <FormateurPageShell>
      <PageShell>
        <PageHeader
          title="Documents"
          description="CV, attestation de vigilance et contrats"
          icon={FileText}
          tone="blue"
        />

        {loadingProfile ? (
          <SurfaceCard flush>
            <TableSkeleton rows={3} cols={2} />
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            <SurfaceCard title="Curriculum vitæ" icon={FileText}>
              {cvUrl ? (
                <CertificatePdfButton
                  pathOrUrl={cvUrl}
                  bucket={INSTRUCTOR_CV_BUCKET}
                  label={instructorCvOpenLabel(cvUrl)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Aucun CV renseigné.</p>
              )}
            </SurfaceCard>

            <SurfaceCard title="Attestation de vigilance" icon={FileText}>
              <div className="space-y-2 text-sm">
                {profile?.vigilance_attestation_received_at ? (
                  <p className="text-muted-foreground tabular">
                    Reçue le{" "}
                    {format(
                      new Date(profile.vigilance_attestation_received_at),
                      "d MMM yyyy",
                      { locale: fr }
                    )}
                  </p>
                ) : null}
                {profile?.vigilance_attestation_expires_at ? (
                  <p className="text-muted-foreground tabular">
                    Expire le{" "}
                    {format(
                      new Date(profile.vigilance_attestation_expires_at),
                      "d MMM yyyy",
                      { locale: fr }
                    )}
                  </p>
                ) : null}
                {vigilanceUrl ? (
                  isExternalCvUrl(vigilanceUrl) ? (
                    <a
                      href={vigilanceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Voir l&apos;attestation
                    </a>
                  ) : (
                    <CertificatePdfButton
                      pathOrUrl={vigilanceUrl}
                      bucket={INSTRUCTOR_CV_BUCKET}
                      label="Télécharger l'attestation"
                    />
                  )
                ) : (
                  <p className="text-muted-foreground">Aucun document renseigné.</p>
                )}
              </div>
            </SurfaceCard>

            <SurfaceCard title="Contrats" icon={FileText}>
              {loadingContracts ? (
                <TableSkeleton rows={3} cols={2} />
              ) : contracts.length === 0 ? (
                <TableEmpty title="Aucun contrat enregistré." />
              ) : (
                <ul className="space-y-3">
                  {contracts.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 text-sm">
                        <p className="font-medium">
                          {c.contract_number ||
                            `Contrat du ${format(new Date(c.created_at), "d MMM yyyy", {
                              locale: fr,
                            })}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.student_or_company || "Mission"}
                          {c.start_date && c.end_date
                            ? ` · ${format(new Date(c.start_date), "d MMM yyyy", {
                                locale: fr,
                              })} → ${format(new Date(c.end_date), "d MMM yyyy", {
                                locale: fr,
                              })}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <StatusPill tone={c.signed_at ? "success" : "neutral"} size="sm">
                          {c.signed_at
                            ? `Signé le ${format(new Date(c.signed_at), "d MMM yyyy", {
                                locale: fr,
                              })}`
                            : "Non signé"}
                        </StatusPill>
                        {c.pdf_url ? (
                          isExternalCvUrl(c.pdf_url) ? (
                            <a
                              href={c.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline"
                            >
                              PDF
                            </a>
                          ) : (
                            <CertificatePdfButton
                              pathOrUrl={c.pdf_url}
                              bucket={INSTRUCTOR_CV_BUCKET}
                              label="PDF"
                            />
                          )
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SurfaceCard>
          </div>
        )}
      </PageShell>
    </FormateurPageShell>
  );
}
