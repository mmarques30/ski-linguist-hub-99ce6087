import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Award } from "lucide-react";
import {
  useStudentProfile,
  useStudentDocuments,
  useStudentCertificates,
} from "@/hooks/useStudentPortal";
import { format } from "date-fns";

const docTypeLabels: Record<string, string> = {
  convention: "Convention de formation",
  attestation: "Attestation de présence",
  certificat: "Certificat de fin de formation",
  convocation: "Convocation",
  programme: "Programme de formation",
};

export default function StudentDocuments() {
  const { data: student } = useStudentProfile();
  const { data: documents, isLoading } = useStudentDocuments(student?.id);
  const { data: certificates } = useStudentCertificates(student?.id);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mes documents</h1>
          <p className="text-muted-foreground text-sm">
            Retrouvez tous vos documents de formation
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Certificates */}
            {certificates && certificates.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    Certificats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {certificates.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">
                          Certificat — Niveau {c.level_achieved}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Délivré le {format(new Date(c.issue_date), "dd/MM/yyyy")}
                        </p>
                        {c.attendance_rate && (
                          <p className="text-xs text-muted-foreground">
                            Taux de présence : {c.attendance_rate}%
                          </p>
                        )}
                      </div>
                      {c.pdf_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={c.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Télécharger
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Documents de formation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents && documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {docTypeLabels[d.document_type] || d.document_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Envoyé le{" "}
                            {format(new Date(d.sent_at), "dd/MM/yyyy")} à{" "}
                            {d.sent_to}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {d.opened_at && (
                            <Badge variant="outline" className="text-[10px]">
                              Consulté
                            </Badge>
                          )}
                          {d.pdf_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a
                                href={d.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                PDF
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Aucun document disponible pour le moment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
