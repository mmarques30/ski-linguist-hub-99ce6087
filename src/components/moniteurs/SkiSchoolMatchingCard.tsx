import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Link2, Building2, Wand2 } from "lucide-react";
import { useSkiSchoolPartnerMatching } from "@/hooks/useSkiSchoolPartnerMatching";
import { toast } from "sonner";

const KIND_LABELS: Record<string, string> = {
  esf: "ESF",
  ecole_ski: "École de ski",
  autre: "Autre",
};

export function SkiSchoolMatchingCard() {
  const { previews, unmatched, linked, runAutoMatching, linkSchool, createAndLink, schoolsQuery } =
    useSkiSchoolPartnerMatching();

  const handleAuto = async () => {
    try {
      const result = await runAutoMatching.mutateAsync();
      toast.success(
        `Matching terminé: ${result.linked} liées, ${result.created} partenaires créés, ${result.skipped} déjà liées`
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur de matching");
    }
  };

  if (schoolsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Matching écoles de ski ↔ partenaires
            </CardTitle>
            <CardDescription>
              ESF et autres écoles — lie chaque <code>ski_school</code> à un partenaire organisationnel pour les dates de stage et l&apos;outreach.
            </CardDescription>
          </div>
          <Button onClick={handleAuto} disabled={runAutoMatching.isPending || unmatched.length === 0}>
            {runAutoMatching.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Matcher automatiquement
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="default">{linked.length} liées</Badge>
          <Badge variant="secondary">{unmatched.length} à traiter</Badge>
          <Badge variant="outline">{previews.filter((p) => p.school_kind === "esf").length} ESF</Badge>
          <Badge variant="outline">
            {previews.filter((p) => p.school_kind !== "esf").length} non-ESF
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>École</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Station</TableHead>
                <TableHead>Suggestion</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previews.map((preview) => (
                <TableRow key={preview.school.id}>
                  <TableCell className="font-medium">{preview.school.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{KIND_LABELS[preview.school_kind] || preview.school_kind}</Badge>
                  </TableCell>
                  <TableCell>{preview.station || "—"}</TableCell>
                  <TableCell>
                    {preview.school.partner_id ? (
                      <span className="text-green-700 text-sm">Déjà liée</span>
                    ) : preview.best_match ? (
                      <div className="text-sm">
                        <div>{preview.best_match.partner.name}</div>
                        <div className="text-muted-foreground">
                          score {preview.best_match.score} — {preview.best_match.reason}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Aucune suggestion — créer partenaire</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {preview.school.partner_id ? null : preview.best_match ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={linkSchool.isPending}
                        onClick={async () => {
                          try {
                            await linkSchool.mutateAsync({
                              schoolId: preview.school.id,
                              partnerId: preview.best_match!.partner.id,
                              schoolKind: preview.school_kind,
                              station: preview.station,
                            });
                            toast.success(`${preview.school.name} liée`);
                          } catch (err: unknown) {
                            toast.error(err instanceof Error ? err.message : "Erreur");
                          }
                        }}
                      >
                        <Link2 className="h-3 w-3 mr-1" />
                        Lier
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={createAndLink.isPending}
                        onClick={async () => {
                          try {
                            await createAndLink.mutateAsync(preview);
                            toast.success(`Partenaire créé pour ${preview.school.name}`);
                          } catch (err: unknown) {
                            toast.error(err instanceof Error ? err.message : "Erreur");
                          }
                        }}
                      >
                        Créer
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
