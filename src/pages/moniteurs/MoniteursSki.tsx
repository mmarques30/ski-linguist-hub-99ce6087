import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Search, Calendar, MapPin, Users, Mail, Send,
  Building2, Globe, Lock, Upload,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  useCourseIntakes, useSendIntakeOutreach, CourseIntake, INTAKE_STATUSES,
} from "@/hooks/useCourseIntakes";
import { useSkiMonitors, useSkiMonitorStats, SkiMonitor } from "@/hooks/useSkiMonitors";
import { CourseIntakeFormDialog } from "@/components/moniteurs/CourseIntakeFormDialog";
import { SkiMonitorFormDialog } from "@/components/moniteurs/SkiMonitorFormDialog";
import { SkiMonitorImportDialog } from "@/components/moniteurs/SkiMonitorImportDialog";
import { StatCard } from "@/components/dashboard/StatCard";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function IntakeCard({
  intake,
  onEdit,
  onSend,
  sending,
}: {
  intake: CourseIntake;
  onEdit: () => void;
  onSend: () => void;
  sending: boolean;
}) {
  const statusMeta = INTAKE_STATUSES.find((s) => s.key === intake.status);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4 pb-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{intake.language} — {intake.location}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(intake.start_date), "dd MMM yyyy", { locale: fr })}
              {" → "}
              {format(new Date(intake.end_date), "dd MMM yyyy", { locale: fr })}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${statusMeta?.color}`} />
            {statusMeta?.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span>{intake.partner?.name || "—"}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {intake.open_to_other_schools ? (
            <Badge variant="outline" className="text-xs gap-1">
              <Globe className="h-3 w-3" /> Toutes écoles
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs gap-1">
              <Lock className="h-3 w-3" /> École hôte uniquement
            </Badge>
          )}
          {(intake.enrollment_count ?? 0) > 0 && (
            <Badge variant="secondary" className="text-xs">
              {intake.enrollment_count} inscrit(s)
            </Badge>
          )}
          {intake.outreach_sent_at && (
            <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
              <Mail className="h-3 w-3 mr-1" />
              Envoyé {format(new Date(intake.outreach_sent_at), "dd/MM/yy", { locale: fr })}
            </Badge>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onEdit}>Modifier</Button>
          {["confirme", "ouvert"].includes(intake.status) && (
            <Button size="sm" onClick={onSend} disabled={sending}>
              <Send className="h-3.5 w-3.5 mr-1" />
              {intake.outreach_sent_at ? "Renvoyer" : "Informer les moniteurs"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MoniteursSki() {
  const [searchMonitors, setSearchMonitors] = useState("");
  const [monitorFormOpen, setMonitorFormOpen] = useState(false);
  const [editMonitor, setEditMonitor] = useState<SkiMonitor | null>(null);
  const [intakeFormOpen, setIntakeFormOpen] = useState(false);
  const [editIntake, setEditIntake] = useState<CourseIntake | null>(null);
  const [sendTarget, setSendTarget] = useState<CourseIntake | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: intakes = [], isLoading: intakesLoading } = useCourseIntakes();
  const { data: monitors = [], isLoading: monitorsLoading } = useSkiMonitors({ search: searchMonitors });
  const { data: stats } = useSkiMonitorStats();
  const sendOutreach = useSendIntakeOutreach();

  const handleSend = async (dryRun = false) => {
    if (!sendTarget) return;
    try {
      const result = await sendOutreach.mutateAsync({ intakeId: sendTarget.id, dryRun });
      toast.success(result.summary || "Envoi effectué");
      setSendTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur d'envoi");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Moniteurs de ski</h1>
          <p className="text-sm text-muted-foreground">
            Base de contacts et dates de formation fermées avec les écoles de ski
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Moniteurs actifs" value={stats?.active || 0} subtitle={`${stats?.total || 0} au total`} icon={Users} />
          <StatCard title="Stations couvertes" value={stats?.stations || 0} subtitle="dans la base" icon={MapPin} />
          <StatCard title="Dates programmées" value={intakes.filter((i) => !["annule", "brouillon"].includes(i.status)).length} subtitle="confirmées ou ouvertes" icon={Calendar} />
        </div>

        <Tabs defaultValue="dates">
          <TabsList>
            <TabsTrigger value="dates">Dates de formation</TabsTrigger>
            <TabsTrigger value="base">Base moniteurs</TabsTrigger>
          </TabsList>

          <TabsContent value="dates" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditIntake(null); setIntakeFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Nouvelle date
              </Button>
            </div>

            {intakesLoading ? (
              <p className="text-muted-foreground text-sm">Chargement...</p>
            ) : intakes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Aucune date de formation. Créez une date fermée avec une école ESF.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {intakes.map((intake) => (
                  <IntakeCard
                    key={intake.id}
                    intake={intake}
                    onEdit={() => { setEditIntake(intake); setIntakeFormOpen(true); }}
                    onSend={() => setSendTarget(intake)}
                    sending={sendOutreach.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="base" className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher nom, email, station..."
                  className="pl-8"
                  value={searchMonitors}
                  onChange={(e) => setSearchMonitors(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" /> Importer CSV
              </Button>
              <Button onClick={() => { setEditMonitor(null); setMonitorFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Ajouter un moniteur
              </Button>
            </div>

            {monitorsLoading ? (
              <p className="text-muted-foreground text-sm">Chargement...</p>
            ) : monitors.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Base vide. Importez vos contacts moniteurs pour l'outreach.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Nom</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell">École</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell">Station</th>
                      <th className="text-left p-3 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitors.map((m) => (
                      <tr
                        key={m.id}
                        className="border-t hover:bg-muted/30 cursor-pointer"
                        onClick={() => { setEditMonitor(m); setMonitorFormOpen(true); }}
                      >
                        <td className="p-3 font-medium">{m.first_name} {m.last_name}</td>
                        <td className="p-3 text-muted-foreground">{m.email}</td>
                        <td className="p-3 hidden md:table-cell">{m.partner?.name || "—"}</td>
                        <td className="p-3 hidden md:table-cell">{m.home_station || "—"}</td>
                        <td className="p-3">
                          <Badge variant={m.status === "active" ? "default" : "secondary"}>
                            {m.status === "active" ? "Actif" : "Désinscrit"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CourseIntakeFormDialog
        open={intakeFormOpen}
        onOpenChange={(o) => { setIntakeFormOpen(o); if (!o) setEditIntake(null); }}
        intake={editIntake}
      />

      <SkiMonitorFormDialog
        open={monitorFormOpen}
        onOpenChange={(o) => { setMonitorFormOpen(o); if (!o) setEditMonitor(null); }}
        monitor={editMonitor}
      />

      <SkiMonitorImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog open={!!sendTarget} onOpenChange={(o) => !o && setSendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Informer les moniteurs ?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                {sendTarget && (
                  <>
                    <p>
                      <strong>{sendTarget.language}</strong> à {sendTarget.location} — {sendTarget.partner?.name}
                    </p>
                    <p>
                      {sendTarget.open_to_other_schools
                        ? "📢 Tous les moniteurs actifs de la base recevront un email."
                        : `🔒 Seuls les moniteurs de ${sendTarget.partner?.name || "l'école hôte"} seront contactés.`}
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSend(false)} disabled={sendOutreach.isPending}>
              Envoyer les emails
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
