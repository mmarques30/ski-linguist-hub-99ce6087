import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Star,
  Plus,
  Calendar,
  CreditCard,
  User,
  Clock,
} from "lucide-react";
import {
  useInstructorDetails,
  useInstructorSessions,
  useInstructorPayments,
} from "@/hooks/useInstructors";
import { InstructorFormDialog } from "@/components/formateurs/InstructorFormDialog";
import { SessionFormDialog } from "@/components/formateurs/SessionFormDialog";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusColors: Record<string, string> = {
  planifiee: "bg-blue-100 text-blue-800",
  en_cours: "bg-amber-100 text-amber-800",
  realisee: "bg-emerald-100 text-emerald-800",
  annulee: "bg-red-100 text-red-800",
};

const paymentStatusColors: Record<string, string> = {
  a_payer: "bg-amber-100 text-amber-800",
  paye: "bg-emerald-100 text-emerald-800",
};

export default function InstructorDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("formateurs");
  const [showEdit, setShowEdit] = useState(false);
  const [showSession, setShowSession] = useState(false);

  const { data: instructor, isLoading } = useInstructorDetails(id);
  const { data: sessions = [] } = useInstructorSessions(id);
  const { data: payments = [] } = useInstructorPayments(id);

  if (isLoading || !instructor) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      </MainLayout>
    );
  }

  const initials =
    (instructor.first_name?.[0] || "") + (instructor.last_name?.[0] || "");
  const upcomingSessions = sessions.filter(
    (s: any) => s.status === "planifiee" || s.status === "en_cours"
  );
  const pastSessions = sessions.filter((s: any) => s.status === "realisee");

  return (
    <MainLayout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/formateurs")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        {/* Header */}
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={instructor.photo_url || undefined} />
            <AvatarFallback className="text-xl">{initials.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {instructor.first_name} {instructor.last_name}
              </h1>
              <Badge
                className={
                  instructor.availability_status === "disponible"
                    ? "bg-emerald-100 text-emerald-800"
                    : instructor.availability_status === "occupe"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {instructor.availability_status || "disponible"}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {instructor.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {instructor.email}
                </span>
              )}
              {instructor.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {instructor.phone}
                </span>
              )}
              {instructor.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {instructor.city}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(instructor.languages || []).map((l) => (
                <Badge key={l} variant="outline">{l}</Badge>
              ))}
            </div>
          </div>
          {editable && (
            <Button variant="outline" onClick={() => setShowEdit(true)}>
              Modifier
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profil">
          <TabsList>
            <TabsTrigger value="profil">
              <User className="mr-1 h-4 w-4" /> Profil
            </TabsTrigger>
            <TabsTrigger value="planning">
              <Calendar className="mr-1 h-4 w-4" /> Planning
            </TabsTrigger>
            <TabsTrigger value="historique">
              <Clock className="mr-1 h-4 w-4" /> Historique
            </TabsTrigger>
            <TabsTrigger value="paiements">
              <CreditCard className="mr-1 h-4 w-4" /> Paiements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profil">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tarif horaire</span>
                    <span className="font-medium">{instructor.hourly_rate ?? "—"} €/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut fiscal</span>
                    <span className="font-medium">{instructor.tax_status || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SIRET</span>
                    <span className="font-medium">{instructor.siret || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Note moyenne</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {Number(instructor.rating_average || 0).toFixed(1)}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Bio & Certifications</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>{instructor.bio || "Aucune bio renseignée."}</p>
                  {Array.isArray(instructor.certifications) &&
                    instructor.certifications.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Certifications :</span>
                        <ul className="list-disc ml-4 mt-1">
                          {instructor.certifications.map((c: any, i: number) => (
                            <li key={i}>{typeof c === "string" ? c : c.name || JSON.stringify(c)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="planning">
            <div className="space-y-4">
              {editable && (
                <Button size="sm" onClick={() => setShowSession(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Nouvelle session
                </Button>
              )}
              {upcomingSessions.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  Aucune session planifiée.
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingSessions.map((s: any) => (
                    <Card key={s.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {format(new Date(s.session_date), "EEEE d MMMM yyyy", { locale: fr })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                            {s.location && ` • ${s.location}`}
                          </p>
                        </div>
                        <Badge className={statusColors[s.status] || ""}>
                          {s.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="historique">
            {pastSessions.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Aucune session passée.
              </p>
            ) : (
              <div className="space-y-2">
                {pastSessions.map((s: any) => (
                  <Card key={s.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {format(new Date(s.session_date), "d MMM yyyy", { locale: fr })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {s.duration_hours}h • {s.location || "—"}
                        </p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800">Réalisée</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="paiements">
            {payments.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Aucun paiement enregistré.
              </p>
            ) : (
              <div className="space-y-2">
                {payments.map((p: any) => (
                  <Card key={p.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{Number(p.montant).toFixed(2)} €</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(p.periode_debut), "d MMM", { locale: fr })} -{" "}
                          {format(new Date(p.periode_fin), "d MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <Badge className={paymentStatusColors[p.statut] || ""}>
                        {p.statut === "paye" ? "Payé" : "À payer"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <InstructorFormDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        instructor={instructor}
      />
      <SessionFormDialog
        open={showSession}
        onOpenChange={setShowSession}
        instructorId={instructor.id}
        instructorName={`${instructor.first_name || ""} ${instructor.last_name}`}
      />
    </MainLayout>
  );
}
