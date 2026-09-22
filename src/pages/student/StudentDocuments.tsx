import { StudentLayout } from "@/components/layout/StudentLayout";
import { FileText, Award } from "lucide-react";
import { CertificatePdfButton } from "@/components/certificates/CertificatePdfButton";
import {
  useStudentProfile,
  useStudentDocuments,
  useStudentCertificates,
} from "@/hooks/useStudentPortal";
import { format } from "date-fns";
import {
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
} from "@/components/ui-kit";

const docTypeLabels: Record<string, string> = {
  convention: "Convention de formation",
  attestation: "Attestation de présence",
  certificat: "Certificat de fin de formation",
  CERTIFICAT: "Certificat de fin de formation",
  convocation: "Convocation",
  programme: "Programme de formation",
};

function isCertificateDoc(type: string | null | undefined): boolean {
  return (type ?? "").toUpperCase() === "CERTIFICAT";
}

export default function StudentDocuments() {
  const { data: student } = useStudentProfile();
  const { data: documents, isLoading } = useStudentDocuments(student?.id);
  const { data: certificates } = useStudentCertificates(student?.id);
  const otherDocuments = (documents || []).filter((d) => !isCertificateDoc(d.document_type));

  return (
    <StudentLayout>
      <PageShell>
        <PageHeader
          title="Mes documents"
          description="Retrouvez tous vos documents de formation"
          icon={FileText}
          tone="purple"
        />

        {isLoading ? (
          <SurfaceCard flush>
            <TableSkeleton rows={4} cols={3} />
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            {/* Certificates */}
            {certificates && certificates.length > 0 && (
              <SurfaceCard icon={Award} title="Certificats">
                <ul className="space-y-2">
                  {certificates.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">Certificat de fin de formation</p>
                        <p className="text-xs text-muted-foreground tabular">
                          Délivré le {format(new Date(c.issue_date), "dd/MM/yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Bilan de progression Entrée / Sortie
                        </p>
                      </div>
                      {c.pdf_url && <CertificatePdfButton pathOrUrl={c.pdf_url} />}
                    </li>
                  ))}
                </ul>
              </SurfaceCard>
            )}

            {/* Documents */}
            <SurfaceCard
              icon={FileText}
              title="Documents de formation"
              flush={otherDocuments.length === 0}
            >
              {otherDocuments.length > 0 ? (
                <ul className="space-y-2">
                  {otherDocuments.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-col gap-2 rounded-[var(--radius)] bg-[hsl(var(--surface-sunken))] p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {docTypeLabels[d.document_type] || d.document_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Envoyé le {format(new Date(d.sent_at), "dd/MM/yyyy")} à {d.sent_to}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {d.opened_at && (
                          <StatusPill tone="success" size="sm">
                            Consulté
                          </StatusPill>
                        )}
                        {d.pdf_url && (
                          <CertificatePdfButton pathOrUrl={d.pdf_url} label="PDF" />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <TableEmpty
                  icon={FileText}
                  title="Aucun document disponible pour le moment."
                />
              )}
            </SurfaceCard>
          </div>
        )}
      </PageShell>
    </StudentLayout>
  );
}
