import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { getStatusLabel } from "@/lib/inscription-status";
import {
  activationConfirmDescription,
  candidatActivationGaps,
  STATUT_ADMINISTRATIF_PRESETS,
} from "@/lib/instructor-candidat";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CardGrid,
  CardList,
  CardListItem,
  PageHeader,
  PageShell,
  SegmentedControl,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  toneForStatus,
} from "@/components/ui-kit";
import type { PillTone } from "@/components/ui-kit";

const instructorStatusTones: Record<string, PillTone> = {
  actif: "success",
  inactif: "neutral",
  candidat: "info",
};

type InstructorTab = "profil" | "planning" | "historique" | "paiements" | "administratif";

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

/** Une ligne de mission — même grammaire pour le planning et l'historique. */
function InscriptionRow({ inscription }: { inscription: InstructorInscription }) {
  return (
    <CardListItem
      title={
        <span className="flex flex-wrap items-center gap-2">
          <Link to={`/inscriptions/${inscription.id}`} className="text-primary hover:underline">
            {inscription.code || "—"}
          </Link>
          {inscription.language && (
            <StatusPill tone="neutral" size="sm">
              {displayLanguageLabel(inscription.language)}
            </StatusPill>
          )}
        </span>
      }
      subtitle={
        <>
          {inscription.student_name || "—"}
          {inscription.course_location && ` • ${inscription.course_location}`}
        </>
      }
      meta={
        <StatusPill tone={toneForStatus(inscription.status || "")}>
          {getStatusLabel(inscription.status || "", "fr")}
        </StatusPill>
      }
      fields={[
        {
          label: "Dates",
          value: formatInscriptionDates(inscription.start_date, inscription.end_date),
        },
      ]}
    />
  );
}

export default function InstructorDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("formateurs");
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<InstructorTab>("profil");
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
        <PageShell>
          <SurfaceCard flush>
            <div className="py-12 text-center text-muted-foreground">Chargement...</div>
          </SurfaceCard>
        </PageShell>
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
      <PageShell>
        <PageHeader
          back={
            <Button variant="ghost" size="sm" onClick={() => navigate("/formateurs")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          }
          title={
            <span className="flex min-w-0 items-center gap-3">
              <Avatar className="h-12 w-12 shrink-0 sm:h-16 sm:w-16">
                <AvatarImage src={instructor.photo_url || undefined} />
                <AvatarFallback className="text-lg">{initials.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                {instructor.first_name} {instructor.last_name}
              </span>
            </span>
          }
          description={
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {instructor.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {instructor.email}
                </span>
              )}
              {instructor.phone && (
                <span className="flex items-center gap-1 tabular">
                  <Phone className="h-3 w-3" /> {instructor.phone}
                </span>
              )}
              {instructor.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {instructor.city}
                </span>
              )}
            </span>
          }
          meta={
            <>
              {instructor.status && (
                <StatusPill tone={instructorStatusTones[instructor.status] ?? "neutral"}>
                  {instructorStatusLabels[instructor.status] || instructor.status}
                </StatusPill>
              )}
              {instructor.status === "actif" && (
                <StatusPill
                  tone={
                    instructor.availability_status === "disponible"
                      ? "success"
                      : instructor.availability_status === "occupe"
                        ? "warning"
                        : "danger"
                  }
                >
                  {instructor.availability_status || "disponible"}
                </StatusPill>
              )}
              {(instructor.languages || []).map((l) => (
                <StatusPill key={l} tone="neutral" size="sm">
                  {displayLanguageLabel(l)}
                </StatusPill>
              ))}
            </>
          }
          actions={
            <>
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
            </>
          }
          tabs={
            <SegmentedControl<InstructorTab>
              value={activeTab}
              onChange={setActiveTab}
              ariaLabel="Fiche formateur·rice"
              options={[
                { value: "profil", label: "Profil", icon: User },
                { value: "planning", label: "Planning", icon: Calendar, count: upcomingInscriptions.length || undefined },
                { value: "historique", label: "Historique", icon: Clock, count: pastInscriptions.length || undefined },
                { value: "paiements", label: "Paiements", icon: CreditCard, count: payments.length || undefined },
                { value: "administratif", label: "Administratif", icon: FileText },
              ]}
            />
          }
        />

        {instructor.status === "candidat" && (
          <Alert className="border-[hsl(var(--tint-blue-ring))] bg-[hsl(var(--tint-blue-bg))] text-[hsl(var(--tint-blue-fg))]">
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
                  <ul className="list-disc space-y-0.5 pl-5">
                    {activationGaps.map((gap) => (
                      <li key={gap}>{gap}</li>
                    ))}
                  </ul>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {activeTab === "profil" && (
          <CardGrid cols={2}>
            <SurfaceCard title="Informations" icon={User}>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Statut</dt>
                  <dd className="font-medium">
                    {instructorStatusLabels[instructor.status || ""] || instructor.status || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Disponibilité</dt>
                  <dd className="font-medium">{instructor.availability_status || "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Tarif horaire</dt>
                  <dd className="font-medium tabular">{instructor.hourly_rate ?? "—"} €/h</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Statut fiscal</dt>
                  <dd className="font-medium">
                    {TAX_STATUSES.find((s) => s.value === instructor.tax_status)?.label ||
                      instructor.tax_status ||
                      "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">SIRET</dt>
                  <dd className="font-medium tabular">{instructor.siret || "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Note moyenne</dt>
                  <dd className="flex items-center gap-1 font-medium tabular">
                    {instructor.rating_average != null ? (
                      <>
                        <Star className="h-3 w-3 fill-[hsl(var(--tint-gold-fg))] text-[hsl(var(--tint-gold-fg))]" />
                        {Number(instructor.rating_average).toFixed(1)}
                      </>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>
            </SurfaceCard>

            <SurfaceCard title="Bio & Certifications" icon={FileText}>
              <div className="space-y-3 text-sm">
                <p>{instructor.bio || "Aucune bio renseignée."}</p>
                {Array.isArray(instructor.certifications) &&
                  instructor.certifications.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Certifications :</span>
                      <ul className="ml-4 mt-1 list-disc">
                        {instructor.certifications.map((c: any, i: number) => (
                          <li key={i}>{typeof c === "string" ? c : c.name || JSON.stringify(c)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </SurfaceCard>
          </CardGrid>
        )}

        {activeTab === "planning" && (
          <SurfaceCard flush title="Formations à venir" icon={Calendar}>
            {upcomingInscriptions.length === 0 ? (
              <TableEmpty
                icon={Calendar}
                title="Aucune formation à venir"
                description="Les inscriptions affectées à cette personne apparaîtront ici."
              />
            ) : (
              <CardList>
                {upcomingInscriptions.map((inscription) => (
                  <InscriptionRow key={inscription.id} inscription={inscription} />
                ))}
              </CardList>
            )}
          </SurfaceCard>
        )}

        {activeTab === "historique" && (
          <SurfaceCard flush title="Formations passées" icon={Clock}>
            {pastInscriptions.length === 0 ? (
              <TableEmpty
                icon={Clock}
                title="Aucune formation passée"
                description="L'historique des missions terminées apparaîtra ici."
              />
            ) : (
              <CardList>
                {pastInscriptions.map((inscription) => (
                  <InscriptionRow key={inscription.id} inscription={inscription} />
                ))}
              </CardList>
            )}
          </SurfaceCard>
        )}

        {activeTab === "paiements" && (
          <SurfaceCard flush title="Paiements" icon={CreditCard}>
            {payments.length === 0 ? (
              <TableEmpty
                icon={CreditCard}
                title="Aucun paiement enregistré."
                description="Les périodes de paie créées pour cette personne apparaîtront ici."
              />
            ) : (
              <CardList>
                {payments.map((p: any) => (
                  <CardListItem
                    key={p.id}
                    title={<span className="tabular">{Number(p.montant).toFixed(2)} €</span>}
                    subtitle={
                      <span className="tabular">
                        {format(new Date(p.periode_debut), "d MMM", { locale: fr })} -{" "}
                        {format(new Date(p.periode_fin), "d MMM yyyy", { locale: fr })}
                      </span>
                    }
                    meta={
                      <StatusPill tone={p.statut === "paye" ? "success" : "warning"}>
                        {p.statut === "paye" ? "Payé" : "À payer"}
                      </StatusPill>
                    }
                  />
                ))}
              </CardList>
            )}
          </SurfaceCard>
        )}

        {activeTab === "administratif" && (
          <CardGrid cols={2}>
            <SurfaceCard title="Statut administratif" icon={FileText}>
              <div className="space-y-4 text-sm">
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
                    <SelectTrigger aria-label="Statut administratif">
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
              </div>
            </SurfaceCard>

            <SurfaceCard title="Attestation de vigilance" icon={FileText}>
              <div className="space-y-4 text-sm">
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      <span className="font-medium tabular">
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
                      <span className="font-medium tabular">
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
              </div>
            </SurfaceCard>

            <SurfaceCard title="Contrats" icon={FileText}>
              {contracts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun contrat enregistré.</p>
              ) : (
                <div className="space-y-2">
                  {contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-start justify-between gap-3 rounded-[var(--radius)] border border-border p-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium">
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
                      <StatusPill tone={contract.signed_at ? "success" : "neutral"} size="sm">
                        {contract.signed_at
                          ? `Signé le ${format(new Date(contract.signed_at), "d MMM yyyy", { locale: fr })}`
                          : "Non signé"}
                      </StatusPill>
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>
          </CardGrid>
        )}
      </PageShell>

      <InstructorFormDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        instructor={instructor}
      />
      {confirmDialog}
    </MainLayout>
  );
}
