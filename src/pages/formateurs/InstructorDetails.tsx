import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Calendar,
  CreditCard,
  User,
  Clock,
  Eye,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useInstructorDetails,
  useInstructorInscriptions,
  useInstructorPayments,
  useInstructorContracts,
  useUpdateInstructor,
} from "@/hooks/useInstructors";
import { InstructorFormDialog, TAX_STATUSES } from "@/components/formateurs/InstructorFormDialog";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { displayLanguageLabel } from "@/lib/taught-languages";
import { formateurAssistPath } from "@/lib/client-links";
import { getStatusLabel, getStatusStyle } from "@/lib/inscription-status";
import {
  activationConfirmDescription,
  candidatActivationGaps,
  STATUT_ADMINISTRATIF_PRESETS,
} from "@/lib/instructor-candidat";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const paymentStatusColors: Record<string, string> = {
  a_payer: "bg-amber-100 text-amber-800",
  paye: "bg-emerald-100 text-emerald-800",
};

const instructorStatusStyles: Record<string, string> = {
  actif: "bg-emerald-100 text-emerald-800",
  inactif: "bg-slate-100 text-slate-700",
  candidat: "bg-sky-100 text-sky-800",
};

const instructorStatusLabels: Record<string, string> = {
  actif: "Actif·ve",
  inactif: "Inactif·ve",
  candidat: "Candidat·e",
};

function adminStatutLabel(value: string | null | undefined): string {
  if (!value) return "Non renseigné";
  const found = STATUT_ADMINISTRATIF_PRESETS.find((option) => option.value === value);
  return found?.label ?? value;
}

type InstructorInscription = {
  id: string;
  code: string | null;
  language: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  student_name: string | null;
  course_location: string | null;
};

function formatInscriptionDates(startDate: string | null, endDate: string | null): string {
  if (!startDate && !endDate) return "—";
  const start = startDate
    ? format(new Date(startDate), "d MMM yyyy", { locale: fr })
    : "—";
  const end = endDate ? format(new Date(endDate), "d MMM yyyy", { locale: fr }) : "—";
  return `${start} – ${end}`;
}

function isUpcomingInscription(inscription: InstructorInscription, today: string): boolean {
  if (inscription.end_date) return inscription.end_date >= today;
  if (inscription.start_date) return inscription.start_date >= today;
  return false;
}

function isPastInscription(inscription: InstructorInscription, today: string): boolean {
  return !!inscription.end_date && inscription.end_date < today;
}

export default function InstructorDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("formateurs");
  const [showEdit, setShowEdit] = useState(false);
  const { confirm, dialog: confirmDialog } = useConfirmAction();

  const { data: instructor, isLoading } = useInstructorDetails(id);
  const { data: inscriptions = [] } = useInstructorInscriptions(id);
  const { data: payments = [] } = useInstructorPayments(id);
  const { data: contracts = [] } = useInstructorContracts(id);
  const updateInstructor = useUpdateInstructor();
  const [adminStatut, setAdminStatut] = useState("");
  const [vigilanceUrl, setVigilanceUrl] = useState("");
  const [vigilanceReceived, setVigilanceReceived] = useState("");
  const [vigilanceExpires, setVigilanceExpires] = useState("");

  useEffect(() => {
    setAdminStatut(instructor?.statut_administratif || "");
  }, [instructor?.statut_administratif]);

  useEffect(() => {
    setVigilanceUrl(instructor?.vigilance_attestation_url || "");
    setVigilanceReceived(instructor?.vigilance_attestation_received_at || "");
    setVigilanceExpires(instructor?.vigilance_attestation_expires_at || "");
  }, [
    instructor?.vigilance_attestation_url,
    instructor?.vigilance_attestation_received_at,
    instructor?.vigilance_attestation_expires_at,
  ]);

  const saveVigilance = () => {
    if (!id) return;
    updateInstructor.mutate({
      id,
      vigilance_attestation_url: vigilanceUrl || null,
      vigilance_attestation_received_at: vigilanceReceived || null,
      vigilance_attestation_expires_at: vigilanceExpires || null,
    });
  };

  const adminStatutOptions = useMemo(() => {
    const options = STATUT_ADMINISTRATIF_PRESETS.map((option) => ({
      value: option.value,
      label: option.label,
    }));
    if (
      instructor?.statut_administratif &&
      !options.some((option) => option.value === instructor.statut_administratif)
    ) {
      options.push({
        value: instructor.statut_administratif,
        label: instructor.statut_administratif,
      });
    }
    return options;
  }, [instructor?.statut_administratif]);

  if (isLoading || !instructor) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      </MainLayout>
    );
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const initials =
    (instructor.first_name?.[0] || "") + (instructor.last_name?.[0] || "");
  const upcomingInscriptions = inscriptions.filter((i) => isUpcomingInscription(i, today));
  const pastInscriptions = inscriptions.filter((i) => isPastInscription(i, today));
  const activationGaps =
    instructor.status === "candidat" ? candidatActivationGaps(instructor) : [];

  const activateCandidat = () => {
    if (!id) return;
    confirm({
      title: "Passer en actif·ve ?",
      description: activationConfirmDescription(activationGaps),
      actionLabel: "Confirmer",
      run: () =>
        updateInstructor.mutateAsync({
          id,
          status: "actif",
          is_active: true,
        }),
    });
  };

  const deactivateInstructor = () => {
    if (!id) return;
    confirm({
      title: "Passer en inactif·ve ?",
      description:
        "La personne ne pourra plus être affectée aux nouvelles inscriptions. Les missions en cours ne sont pas annulées.",
      actionLabel: "Confirmer",
      run: () =>
        updateInstructor.mutateAsync({
          id,
          status: "inactif",
          is_active: false,
        }),
    });
  };

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
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">
                {instructor.first_name} {instructor.last_name}
              </h1>
              {instructor.status && (
                <Badge className={instructorStatusStyles[instructor.status] || ""}>
                  {instructorStatusLabels[instructor.status] || instructor.status}
                </Badge>
              )}
              {instructor.status === "actif" && (
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
              )}
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
                <Badge key={l} variant="outline">{displayLanguageLabel(l)}</Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {id && (
              <Button variant="secondary" asChild>
                <Link to={formateurAssistPath(id, "evaluations")}>
                  <Eye className="mr-2 h-4 w-4" />
                  Voir comme le formateur
                </Link>
              </Button>
            )}
            {editable && instructor.status === "candidat" && (
              <Button onClick={activateCandidat} disabled={updateInstructor.isPending}>
                Passer en actif·ve
              </Button>
            )}
            {editable && instructor.status === "actif" && (
              <Button
                variant="outline"
                onClick={deactivateInstructor}
                disabled={updateInstructor.isPending}
              >
                Passer en inactif·ve
              </Button>
            )}
            {editable && (
              <Button variant="outline" onClick={() => setShowEdit(true)}>
                Modifier
              </Button>
            )}
          </div>
        </div>

        {instructor.status === "candidat" && (
          <Alert className="border-sky-200 bg-sky-50 text-sky-950">
            <AlertTitle>Candidat·e — pas encore affectable aux inscriptions</AlertTitle>
            <AlertDescription>
              {activationGaps.length === 0 ? (
                <p>
                  Dossier prêt. Vous pouvez passer la personne en actif·ve pour
                  l&apos;affecter aux formations.
                </p>
              ) : (
                <>
                  <p className="mb-2">
                    Points encore à compléter (n&apos;empêchent pas l&apos;activation) :
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {activationGaps.map((gap) => (
                      <li key={gap}>{gap}</li>
                    ))}
                  </ul>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

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
            <TabsTrigger value="administratif">
              <FileText className="mr-1 h-4 w-4" /> Administratif
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profil">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut</span>
                    <span className="font-medium">
                      {instructorStatusLabels[instructor.status || ""] || instructor.status || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disponibilité</span>
                    <span className="font-medium">{instructor.availability_status || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tarif horaire</span>
                    <span className="font-medium">{instructor.hourly_rate ?? "—"} €/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut fiscal</span>
                    <span className="font-medium">
                      {TAX_STATUSES.find((s) => s.value === instructor.tax_status)?.label ||
                        instructor.tax_status ||
                        "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SIRET</span>
                    <span className="font-medium">{instructor.siret || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Note moyenne</span>
                    <span className="flex items-center gap-1 font-medium">
                      {instructor.rating_average != null ? (
                        <>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {Number(instructor.rating_average).toFixed(1)}
                        </>
                      ) : (
                        "—"
                      )}
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
            {upcomingInscriptions.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Aucune formation à venir
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingInscriptions.map((inscription) => (
                  <Card key={inscription.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">
                          <Link
                            to={`/inscriptions/${inscription.id}`}
                            className="text-primary hover:underline"
                          >
                            {inscription.code || "—"}
                          </Link>
                          {inscription.language && (
                            <Badge variant="outline" className="ml-2">
                              {displayLanguageLabel(inscription.language)}
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {inscription.student_name || "—"}
                          {inscription.course_location && ` • ${inscription.course_location}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatInscriptionDates(inscription.start_date, inscription.end_date)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={getStatusStyle(inscription.status || "")}
                      >
                        {getStatusLabel(inscription.status || "", "fr")}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="historique">
            {pastInscriptions.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Aucune formation passée
              </p>
            ) : (
              <div className="space-y-2">
                {pastInscriptions.map((inscription) => (
                  <Card key={inscription.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">
                          <Link
                            to={`/inscriptions/${inscription.id}`}
                            className="text-primary hover:underline"
                          >
                            {inscription.code || "—"}
                          </Link>
                          {inscription.language && (
                            <Badge variant="outline" className="ml-2">
                              {displayLanguageLabel(inscription.language)}
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {inscription.student_name || "—"}
                          {inscription.course_location && ` • ${inscription.course_location}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatInscriptionDates(inscription.start_date, inscription.end_date)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={getStatusStyle(inscription.status || "")}
                      >
                        {getStatusLabel(inscription.status || "", "fr")}
                      </Badge>
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

          <TabsContent value="administratif">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Statut administratif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {editable ? (
                    <Select
                      value={adminStatut || "unset"}
                      onValueChange={(value) => {
                        const nextValue = value === "unset" ? "" : value;
                        setAdminStatut(nextValue);
                        if (!id) return;
                        updateInstructor.mutate({
                          id,
                          statut_administratif: nextValue || null,
                        });
                      }}
                      disabled={updateInstructor.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">Non renseigné</SelectItem>
                        {adminStatutOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{adminStatutLabel(instructor.statut_administratif)}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Attestation de vigilance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {editable ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="vigilance-url">URL du document</Label>
                        <Input
                          id="vigilance-url"
                          type="url"
                          placeholder="https://…"
                          value={vigilanceUrl}
                          onChange={(e) => setVigilanceUrl(e.target.value)}
                          onBlur={saveVigilance}
                          disabled={updateInstructor.isPending}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vigilance-received">Reçue le</Label>
                          <Input
                            id="vigilance-received"
                            type="date"
                            value={vigilanceReceived}
                            onChange={(e) => setVigilanceReceived(e.target.value)}
                            onBlur={saveVigilance}
                            disabled={updateInstructor.isPending}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vigilance-expires">Expire le</Label>
                          <Input
                            id="vigilance-expires"
                            type="date"
                            value={vigilanceExpires}
                            onChange={(e) => setVigilanceExpires(e.target.value)}
                            onBlur={saveVigilance}
                            disabled={updateInstructor.isPending}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Reçue le</span>
                        <span className="font-medium">
                          {instructor.vigilance_attestation_received_at
                            ? format(
                                new Date(instructor.vigilance_attestation_received_at),
                                "d MMM yyyy",
                                { locale: fr },
                              )
                            : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Expire le</span>
                        <span className="font-medium">
                          {instructor.vigilance_attestation_expires_at
                            ? format(
                                new Date(instructor.vigilance_attestation_expires_at),
                                "d MMM yyyy",
                                { locale: fr },
                              )
                            : "—"}
                        </span>
                      </div>
                      {instructor.vigilance_attestation_url ? (
                        <a
                          href={instructor.vigilance_attestation_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Voir l&apos;attestation
                        </a>
                      ) : (
                        <p className="text-muted-foreground">Aucun document renseigné.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contrats</CardTitle>
                </CardHeader>
                <CardContent>
                  {contracts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun contrat enregistré.</p>
                  ) : (
                    <div className="space-y-2">
                      {contracts.map((contract) => (
                        <div
                          key={contract.id}
                          className="rounded-lg border p-3 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {contract.contract_number ||
                                `Contrat du ${format(new Date(contract.created_at), "d MMM yyyy", { locale: fr })}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {contract.student_or_company || "Mission non renseignée"}
                              {contract.start_date && contract.end_date && (
                                <>
                                  {" "}
                                  · {format(new Date(contract.start_date), "d MMM yyyy", { locale: fr })}
                                  {" — "}
                                  {format(new Date(contract.end_date), "d MMM yyyy", { locale: fr })}
                                </>
                              )}
                            </p>
                            {contract.pdf_url && (
                              <a
                                href={contract.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Voir le PDF
                              </a>
                            )}
                          </div>
                          <Badge variant={contract.signed_at ? "default" : "secondary"}>
                            {contract.signed_at
                              ? `Signé le ${format(new Date(contract.signed_at), "d MMM yyyy", { locale: fr })}`
                              : "Non signé"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <InstructorFormDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        instructor={instructor}
      />
      {confirmDialog}
    </MainLayout>
  );
}
