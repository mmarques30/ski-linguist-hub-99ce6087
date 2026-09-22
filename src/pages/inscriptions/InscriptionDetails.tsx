import { useMemo, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CardGrid,
  DefinitionList,
  PageHeader,
  PageShell,
  SegmentedControl,
  StatusPill,
  SurfaceCard,
  TableCell,
  TableEmpty,
  TableFrame,
  TableHeadCell,
  TableHeadRow,
  TableRow,
  toneForStatus,
} from "@/components/ui-kit";
import { InscriptionOpsChecklist } from "@/components/inscriptions/InscriptionOpsChecklist";
import { InscriptionFinancialPayments } from "@/components/inscriptions/InscriptionFinancialPayments";
import { InscriptionFundingCard } from "@/components/inscriptions/InscriptionFundingCard";
import { useInscriptionClientAccess } from "@/hooks/useInscriptionClientAccess";
import { useInscriptionDocuments } from "@/hooks/useInscriptionDocuments";
import {
  isEntryFormComplete,
  isExitFormComplete,
  listMissingFormationDocuments,
  OBJECTIF_ATTEINT_LABELS,
  type ObjectifAtteint,
} from "@/lib/certificate-progression";
import {
  useInscriptionCertificates,
  useInscriptionProgression,
} from "@/hooks/useInscriptionProgression";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Euro,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  Building2,
  FileText,
  Edit,
  Package,
  Receipt,
  Trash2,
  ClipboardList,
  Link2,
  History,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { fr, ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeleteInscription } from "@/hooks/useInscriptions";
import { toast } from "sonner";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { InscriptionFormDialog } from "@/components/inscriptions/InscriptionFormDialog";
import { EndPackDialog } from "@/components/endpack/EndPackDialog";
import { InvoiceCreateDialog } from "@/components/invoices/InvoiceCreateDialog";
import { ScheduleApprovalDialog } from "@/components/inscriptions/ScheduleApprovalDialog";
import { InscriptionStatusMenu } from "@/components/inscriptions/InscriptionStatusMenu";
import { PlacementTestSummaryCard } from "@/components/inscriptions/PlacementTestSummaryCard";
import { InscriptionDocumentsCard } from "@/components/inscriptions/InscriptionDocumentsCard";
import { InscriptionClientAccessCard } from "@/components/inscriptions/InscriptionClientAccessCard";
import { InscriptionTimelineCard } from "@/components/inscriptions/InscriptionTimelineCard";
import { FormateurEntryFormDialog } from "@/components/inscriptions/FormateurEntryFormDialog";
import { FormateurExitFormDialog } from "@/components/inscriptions/FormateurExitFormDialog";
import { pisteLabelFromPlacementAnswers } from "@/lib/placement-test-engine";
import { invoiceStatusLabel, paymentTypeLabel } from "@/lib/payment-methods";
import { DATES_A_PLANIFIER_LABEL } from "@/lib/registration-dates";
import { Alert, AlertDescription } from "@/components/ui/alert";

const translations = {
  back: { fr: "Retour", "pt-BR": "Voltar", en: "Back" },
  inscriptionDetails: { fr: "Détails de l'inscription", "pt-BR": "Detalhes da inscrição", en: "Enrollment Details" },
  loading: { fr: "Chargement...", "pt-BR": "Carregando...", en: "Loading..." },
  notFound: { fr: "Inscription non trouvée", "pt-BR": "Inscrição não encontrada", en: "Enrollment not found" },
  generalInfo: { fr: "Informations générales", "pt-BR": "Informações gerais", en: "General Information" },
  training: { fr: "Formation", "pt-BR": "Formação", en: "Training" },
  financial: { fr: "Financier", "pt-BR": "Financeiro", en: "Financial" },
  documents: { fr: "Documents", "pt-BR": "Documentos", en: "Documents" },
  clientAccess: { fr: "Accès client", "pt-BR": "Acesso cliente", en: "Client access" },
  timeline: { fr: "Historique", "pt-BR": "Histórico", en: "Timeline" },
  student: { fr: "Stagiaire", "pt-BR": "Estagiário", en: "Student" },
  instructor: { fr: "Formateur", "pt-BR": "Formador", en: "Instructor" },
  skiSchool: { fr: "École de ski", "pt-BR": "Escola de ski", en: "Ski School" },
  language: { fr: "Langue de formation", "pt-BR": "Idioma de formação", en: "Training Language" },
  modality: { fr: "Modalité", "pt-BR": "Modalidade", en: "Modality" },
  location: { fr: "Lieu", "pt-BR": "Local", en: "Location" },
  period: { fr: "Période", "pt-BR": "Período", en: "Period" },
  duration: { fr: "Durée", "pt-BR": "Duração", en: "Duration" },
  hours: { fr: "heures", "pt-BR": "horas", en: "hours" },
  entryLevel: { fr: "Niveau d'entrée", "pt-BR": "Nível de entrada", en: "Entry Level" },
  exitLevel: { fr: "Niveau de sortie", "pt-BR": "Nível de saída", en: "Exit Level" },
  certification: { fr: "Certification", "pt-BR": "Certificação", en: "Certification" },
  price: { fr: "Prix total", "pt-BR": "Preço total", en: "Total Price" },
  deposit: { fr: "Acompte", "pt-BR": "Sinal", en: "Deposit" },
  balance: { fr: "Solde restant", "pt-BR": "Saldo restante", en: "Remaining Balance" },
  paymentMethod: { fr: "Mode de paiement", "pt-BR": "Método de pagamento", en: "Payment Method" },
  observations: { fr: "Observations", "pt-BR": "Observações", en: "Observations" },
  expectations: { fr: "Attentes du stagiaire", "pt-BR": "Expectativas do estagiário", en: "Student Expectations" },
  status: { fr: "Statut", "pt-BR": "Status", en: "Status" },
  createdAt: { fr: "Date de création", "pt-BR": "Data de criação", en: "Created At" },
  notSpecified: { fr: "Non spécifié", "pt-BR": "Não especificado", en: "Not specified" },
  editInscription: { fr: "Modifier", "pt-BR": "Editar", en: "Edit" },
  endPack: { fr: "Pack fin de formation", "pt-BR": "Pacote de fim de formação", en: "End Pack" },
  createInvoice: { fr: "Créer facture", "pt-BR": "Criar fatura", en: "Create Invoice" },
  deleteInscription: { fr: "Supprimer", "pt-BR": "Excluir", en: "Delete" },
  confirmDelete: { fr: "Confirmer la suppression", "pt-BR": "Confirmar exclusão", en: "Confirm Deletion" },
  confirmDeleteDesc: { fr: "Êtes-vous sûr de vouloir supprimer cette inscription ? Cette action est irréversible.", "pt-BR": "Tem certeza que deseja excluir esta inscrição? Esta ação é irreversível.", en: "Are you sure you want to delete this enrollment? This action cannot be undone." },
  cancel: { fr: "Annuler", "pt-BR": "Cancelar", en: "Cancel" },
  deleted: { fr: "Inscription supprimée", "pt-BR": "Inscrição excluída", en: "Enrollment deleted" },
  statusInProgress: { fr: "En cours", "pt-BR": "Em andamento", en: "In Progress" },
  statusCompleted: { fr: "Terminée", "pt-BR": "Concluída", en: "Completed" },
  statusCancelled: { fr: "Annulée", "pt-BR": "Cancelada", en: "Cancelled" },
  statusBilled: { fr: "Facturée", "pt-BR": "Faturada", en: "Billed" },
};

const VALID_TABS = new Set([
  "general",
  "training",
  "financial",
  "access",
  "timeline",
  "documents",
]);

export default function InscriptionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("inscriptions");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [endPackOpen, setEndPackOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [exitFormOpen, setExitFormOpen] = useState(false);
  const deleteInscription = useDeleteInscription();
  const tabParam = searchParams.get("tab") || "general";
  const activeTab = VALID_TABS.has(tabParam) ? tabParam : "general";
  const setActiveTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "general") next.delete("tab");
    else next.set("tab", value);
    setSearchParams(next, { replace: true });
  };
  const getDateLocale = () => {
    switch (language) {
      case "pt-BR": return ptBR;
      case "en": return enUS;
      default: return fr;
    }
  };

  const { data: inscription, isLoading, error } = useQuery({
    queryKey: ["inscription-details", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inscriptions_complete")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as
        | (Record<string, any> & {
            entry_test_id?: string | null;
            dates_to_confirm?: boolean | null;
          })
        | null;
    },
    enabled: !!id,
  });

  const { data: progression } = useInscriptionProgression(id);
  const { data: certificates = [] } = useInscriptionCertificates(id);
  const { data: clientAccess } = useInscriptionClientAccess(id);
  const { data: documentSendings = [] } = useInscriptionDocuments(id);

  const { data: opsFields } = useQuery({
    queryKey: ["inscription-ops-fields", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inscriptions")
        .select("schedule_status, schedule, documents_sent_at, student_id, funding_organization, funding_details")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const studentIdForPortal = opsFields?.student_id || inscription?.student_id;
  const { data: studentPortal } = useQuery({
    queryKey: ["student-portal-flag", studentIdForPortal],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("auth_user_id")
        .eq("id", studentIdForPortal!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!studentIdForPortal,
  });

  const { data: placementSuggestion } = useQuery({
    queryKey: ["inscription-placement-piste", id, inscription?.entry_test_id],
    queryFn: async () => {
      const testId = (inscription as { entry_test_id?: string | null } | null)?.entry_test_id;
      if (!testId) return null;
      const { data, error } = await supabase
        .from("placement_tests")
        .select("answers, determined_level")
        .eq("id", testId)
        .maybeSingle();
      if (error) throw error;
      return pisteLabelFromPlacementAnswers(data?.answers) || null;
    },
    enabled: !!id && !!(inscription as { entry_test_id?: string | null } | null)?.entry_test_id,
  });

  const { data: invoices } = useQuery({
    queryKey: ["inscription-invoices", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("inscription_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const checklistInput = useMemo(() => {
    if (!id) return null;

    const expectExitDocuments = (() => {
      if (!progression) return false;
      if (["terminee", "facturee"].includes(progression.status)) return true;
      if (progression.end_date) {
        return new Date(progression.end_date) <= new Date();
      }
      return false;
    })();

    const missingDocs = progression
      ? listMissingFormationDocuments({
          entryFormComplete: isEntryFormComplete(progression),
          exitFormComplete: isExitFormComplete(progression),
          hasCertificate: certificates.length > 0,
          expectExitDocuments,
        })
      : [];

    const paymentsReceivedTotal = (clientAccess?.payments || [])
      .filter((p) => p.status === "recu" || p.status === "valide")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const latestSurvey = clientAccess?.surveys?.[0];
    const portalInviteSent = (clientAccess?.emails || []).some(
      (e) => e.template_slug === "student_portal_invite" && e.status === "sent"
    );

    return {
      inscriptionId: id,
      scheduleStatus: opsFields?.schedule_status ?? null,
      schedule: opsFields?.schedule ?? inscription?.schedule ?? null,
      documentsSentAt:
        opsFields?.documents_sent_at || documentSendings[0]?.sent_at || null,
      missingDocsCount: progression ? missingDocs.length : undefined,
      paymentsReceivedTotal,
      invoicesCount: invoices?.length ?? 0,
      hasPortalAccount: Boolean(studentPortal?.auth_user_id),
      portalInviteSent,
      hasSurvey: Boolean(latestSurvey),
      surveyCompleted: Boolean(latestSurvey?.completed_at),
    };
  }, [
    id,
    progression,
    certificates.length,
    clientAccess,
    opsFields,
    inscription?.schedule,
    documentSendings,
    invoices?.length,
    studentPortal?.auth_user_id,
  ]);

  const skiSchoolId = (inscription as { ski_school_id?: string | null } | null)?.ski_school_id;
  const { data: skiSchoolPartnerId } = useQuery({
    queryKey: ["ski-school-partner", skiSchoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ski_schools")
        .select("partner_id")
        .eq("id", skiSchoolId!)
        .maybeSingle();
      if (error) throw error;
      return data?.partner_id ?? null;
    },
    enabled: !!skiSchoolId,
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t(translations.notSpecified);
    try {
      return format(new Date(dateStr), "dd MMMM yyyy", { locale: getDateLocale() });
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return "-";
    const locale = language === "pt-BR" ? "pt-BR" : language === "en" ? "en-US" : "fr-FR";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const statusLabels: Record<string, string> = {
    brouillon: language === "pt-BR" ? "Rascunho" : language === "en" ? "Draft" : "Brouillon",
    en_attente: language === "pt-BR" ? "Pendente" : language === "en" ? "Pending" : "En attente",
    confirmee: language === "pt-BR" ? "Confirmada" : language === "en" ? "Confirmed" : "Confirmée",
    en_cours: t(translations.statusInProgress),
    terminee: t(translations.statusCompleted),
    facturee: t(translations.statusBilled),
    annulee: t(translations.statusCancelled),
  };

  const statusPill = (
    <StatusPill tone={toneForStatus(inscription?.status || "")}>
      {statusLabels[inscription?.status || ""] || inscription?.status}
    </StatusPill>
  );

  if (isLoading) {
    return (
      <MainLayout>
        <PageShell>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t(translations.loading)}</span>
          </div>
          <Skeleton className="h-24 w-full rounded-[var(--radius-card)]" />
          <CardGrid cols={3}>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-48 w-full rounded-[var(--radius-card)]" />
            ))}
          </CardGrid>
        </PageShell>
      </MainLayout>
    );
  }

  if (error || !inscription) {
    return (
      <MainLayout>
        <PageShell>
          <PageHeader
            title={t(translations.inscriptionDetails)}
            icon={ClipboardList}
            back={
              <Button variant="ghost" size="sm" asChild className="-ml-2">
                <Link to="/inscriptions">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t(translations.back)}
                </Link>
              </Button>
            }
          />
          <SurfaceCard flush>
            <TableEmpty title={t(translations.notFound)} icon={FileText} />
          </SurfaceCard>
        </PageShell>
      </MainLayout>
    );
  }

  const tabOptions = [
    { value: "general", label: t(translations.generalInfo), icon: User },
    { value: "training", label: t(translations.training), icon: GraduationCap },
    { value: "financial", label: t(translations.financial), icon: Wallet },
    { value: "access", label: t(translations.clientAccess), icon: Link2 },
    { value: "timeline", label: t(translations.timeline), icon: History },
    { value: "documents", label: t(translations.documents), icon: FileText },
  ];

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          icon={ClipboardList}
          tone="gold"
          back={
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link to="/inscriptions">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t(translations.back)}
              </Link>
            </Button>
          }
          title={inscription.code || t(translations.inscriptionDetails)}
          description={
            <>
              {inscription.student_id ? (
                <Link
                  to={`/students/${inscription.student_id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {inscription.student_name}
                </Link>
              ) : (
                inscription.student_name
              )}
              {" • "}
              {inscription.language}
            </>
          }
          meta={
            <InscriptionStatusMenu
              inscriptionId={inscription.id}
              status={inscription.status || ""}
              startDate={inscription.start_date}
              readOnly={!editable}
            />
          }
          actions={
            editable && (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t(translations.editInscription)}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEndPackOpen(true)}>
                  <Package className="mr-2 h-4 w-4" />
                  {t(translations.endPack)}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setScheduleDialogOpen(true)}>
                  <Clock className="mr-2 h-4 w-4" />
                  Horaire
                </Button>
                {(!invoices || invoices.length === 0) && (
                  <Button size="sm" onClick={() => setInvoiceDialogOpen(true)}>
                    <Receipt className="mr-2 h-4 w-4" />
                    {t(translations.createInvoice)}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t(translations.deleteInscription)}
                </Button>
              </>
            )
          }
          tabs={
            <SegmentedControl<string>
              value={activeTab}
              onChange={setActiveTab}
              options={tabOptions}
              ariaLabel={t(translations.inscriptionDetails)}
            />
          }
        />

        {checklistInput && <InscriptionOpsChecklist input={checklistInput} />}

        {/* General Info Tab */}
        {activeTab === "general" && (
          <div className="space-y-4">
            <CardGrid cols={3}>
              {/* Student Card */}
              <SurfaceCard title={t(translations.student)} icon={User} bodyClassName="space-y-2">
                <p className="font-medium">{inscription.student_name}</p>
                {inscription.student_email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0 truncate">{inscription.student_email}</span>
                  </div>
                )}
                {inscription.student_phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {inscription.student_phone}
                  </div>
                )}
                {inscription.student_city && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {inscription.student_city}
                  </div>
                )}
                {inscription.student_company && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    {inscription.student_company}
                  </div>
                )}
                {inscription.student_id && (
                  <Button variant="link" size="sm" className="px-0 h-auto" asChild>
                    <Link to={`/students/${inscription.student_id}`}>
                      Voir le profil →
                    </Link>
                  </Button>
                )}
              </SurfaceCard>

              {/* Instructor Card */}
              <SurfaceCard
                title={t(translations.instructor)}
                icon={GraduationCap}
                bodyClassName="space-y-2"
              >
                {inscription.instructor_name ? (
                  <>
                    {inscription.instructor_id ? (
                      <Link
                        to={`/formateurs/${inscription.instructor_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {inscription.instructor_name}
                      </Link>
                    ) : (
                      <p className="font-medium">{inscription.instructor_name}</p>
                    )}
                    {inscription.instructor_email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 truncate">{inscription.instructor_email}</span>
                      </div>
                    )}
                    {inscription.instructor_phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {inscription.instructor_phone}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t(translations.notSpecified)}</p>
                )}
              </SurfaceCard>

              {/* Ski School Card */}
              <SurfaceCard
                title={t(translations.skiSchool)}
                icon={Building2}
                bodyClassName="space-y-2"
              >
                {inscription.ski_school_name ? (
                  <>
                    {skiSchoolPartnerId ? (
                      <Link
                        to={`/gestion/partenaires/${skiSchoolPartnerId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {inscription.ski_school_name}
                      </Link>
                    ) : (
                      <p className="font-medium">{inscription.ski_school_name}</p>
                    )}
                    {inscription.ski_school_director && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        {inscription.ski_school_director}
                      </div>
                    )}
                    {inscription.ski_school_director_phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {inscription.ski_school_director_phone}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t(translations.notSpecified)}</p>
                )}
              </SurfaceCard>
            </CardGrid>

            {/* Observations & Expectations */}
            {(inscription.observations || inscription.expectations) && (
              <div className="grid gap-4 md:grid-cols-2">
                {inscription.observations && (
                  <SurfaceCard title={t(translations.observations)}>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {inscription.observations}
                    </p>
                  </SurfaceCard>
                )}
                {inscription.expectations && (
                  <SurfaceCard title={t(translations.expectations)}>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {inscription.expectations}
                    </p>
                  </SurfaceCard>
                )}
              </div>
            )}

            {/* Meta info */}
            <SurfaceCard>
              <DefinitionList
                columns={2}
                items={[
                  {
                    label: t(translations.createdAt),
                    value: (
                      <span className="font-medium tabular">
                        {formatDate(inscription.created_at)}
                      </span>
                    ),
                  },
                  {
                    label: t(translations.status),
                    value: statusPill,
                  },
                ]}
              />
            </SurfaceCard>
          </div>
        )}

        {/* Training Tab */}
        {activeTab === "training" && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <SurfaceCard title={t(translations.training)} icon={GraduationCap}>
                <DefinitionList
                  columns={2}
                  items={[
                    {
                      label: t(translations.language),
                      value: <span className="font-medium">{inscription.language}</span>,
                    },
                    {
                      label: t(translations.modality),
                      value: (
                        <span className="font-medium">
                          {inscription.modality || t(translations.notSpecified)}
                        </span>
                      ),
                    },
                    {
                      label: t(translations.location),
                      value: (
                        <span className="font-medium">
                          {inscription.course_location || t(translations.notSpecified)}
                        </span>
                      ),
                    },
                    {
                      label: t(translations.duration),
                      value: (
                        <span className="font-medium tabular">
                          {inscription.duration_hours
                            ? `${inscription.duration_hours} ${t(translations.hours)}`
                            : t(translations.notSpecified)}
                        </span>
                      ),
                    },
                  ]}
                />
              </SurfaceCard>

              <SurfaceCard
                title={t(translations.period)}
                icon={Calendar}
                bodyClassName="space-y-4"
              >
                {/* BL-029 : sur une offre « dates flexibles », start_date n'est
                    que le début souhaité par le stagiaire. */}
                {inscription.dates_to_confirm && (
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      Dates {DATES_A_PLANIFIER_LABEL.toLowerCase()} : le stagiaire a demandé à
                      commencer le {formatDate(inscription.start_date)}. Fixez les dates
                      définitives avant d&apos;éditer la convention ou la facture.
                    </AlertDescription>
                  </Alert>
                )}
                <DefinitionList
                  columns={2}
                  items={[
                    {
                      label: inscription.dates_to_confirm ? "Début souhaité" : "Début",
                      value: (
                        <span className="font-medium tabular">
                          {formatDate(inscription.start_date)}
                        </span>
                      ),
                    },
                    {
                      label: "Fin",
                      value: (
                        <span className="font-medium tabular">
                          {inscription.dates_to_confirm
                            ? DATES_A_PLANIFIER_LABEL
                            : formatDate(inscription.end_date)}
                        </span>
                      ),
                    },
                    ...(inscription.duration_days
                      ? [
                          {
                            label: "Jours",
                            value: (
                              <span className="font-medium tabular">
                                {inscription.duration_days} jours
                              </span>
                            ),
                          },
                        ]
                      : []),
                    ...(inscription.hours_per_day
                      ? [
                          {
                            label: "Heures/jour",
                            value: (
                              <span className="font-medium tabular">
                                {inscription.hours_per_day}h
                              </span>
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              </SurfaceCard>
            </div>

            {/* Bilan Entrée / Sortie */}
            <SurfaceCard
              title="Bilan de progression"
              icon={GraduationCap}
              description="Entrée = piste / observation formateur · Sortie = CECRL formateur (jamais SNMSF/DSF sur le certificat)"
              bodyClassName="space-y-4"
              actions={
                editable && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEntryFormOpen(true)}>
                      Formulaire entrée
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setExitFormOpen(true)}>
                      Formulaire sortie
                    </Button>
                  </>
                )
              }
            >
              <TableFrame className="rounded-[var(--radius)] border border-border">
                <table className="w-full border-collapse">
                  <thead>
                    <TableHeadRow>
                      <TableHeadCell>Niveau</TableHeadCell>
                      <TableHeadCell>Entrée</TableHeadCell>
                      <TableHeadCell>Sortie</TableHeadCell>
                    </TableHeadRow>
                  </thead>
                  <tbody>
                    <TableRow>
                      <TableCell className="font-medium">Niveau général</TableCell>
                      <TableCell>
                        {progression?.niveau_general_entree ||
                          inscription.entry_level ||
                          "—"}
                      </TableCell>
                      <TableCell>{progression?.niveau_general_sortie || "—"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Niveau technique</TableCell>
                      <TableCell>{progression?.niveau_technique_entree || "—"}</TableCell>
                      <TableCell>{progression?.niveau_technique_sortie || "—"}</TableCell>
                    </TableRow>
                  </tbody>
                </table>
              </TableFrame>
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Objectif atteint : </span>
                  {progression?.objectif_atteint
                    ? OBJECTIF_ATTEINT_LABELS[
                        progression.objectif_atteint as ObjectifAtteint
                      ] || progression.objectif_atteint
                    : "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Formulaires : </span>
                  {progression && isEntryFormComplete(progression)
                    ? "Entrée OK"
                    : "Entrée manquant"}
                  {" · "}
                  {progression && isExitFormComplete(progression)
                    ? "Sortie OK"
                    : "Sortie manquant"}
                </p>
              </div>
              {progression?.commentaire_sortie && (
                <p className="text-sm whitespace-pre-wrap border-l-2 border-primary/30 pl-3">
                  {progression.commentaire_sortie}
                </p>
              )}
            </SurfaceCard>

            <PlacementTestSummaryCard
              testId={(inscription as { entry_test_id?: string | null }).entry_test_id}
              fallbackScore={inscription.entry_test_score}
              editable={editable}
              inscriptionEntryLevel={inscription.entry_level}
            />
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === "financial" && (
          <div className="space-y-4">
            <InscriptionFundingCard
              inscriptionId={id!}
              fundingOrganization={opsFields?.funding_organization ?? null}
              fundingDetails={opsFields?.funding_details ?? null}
              price={inscription.price}
              depositAmount={inscription.deposit_amount}
              depositDate={inscription.deposit_date}
              balanceAfterDeposit={inscription.balance_after_deposit}
              paymentMethod={inscription.payment_method}
            />

            {inscription.pedagogical_cost != null && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Euro className="h-3.5 w-3.5" />
                Coût pédagogique : {formatPrice(inscription.pedagogical_cost)}
              </p>
            )}

            {/* Invoices List */}
            {invoices && invoices.length > 0 && (
              <SurfaceCard title="Factures associées" icon={Receipt} flush>
                <ul className="divide-y divide-border">
                  {invoices.map((invoice) => (
                    <li key={invoice.id}>
                      <Link
                        to={`/invoices?q=${encodeURIComponent(invoice.invoice_number || invoice.id)}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[hsl(var(--surface-sunken))] sm:px-5"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-primary">
                            {invoice.invoice_number}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {formatDate(invoice.invoice_date)} • {paymentTypeLabel(invoice.payment_type)}
                          </p>
                        </div>
                        <div className="shrink-0 space-y-1 text-right">
                          <p className="font-medium tabular">
                            {formatPrice(invoice.amount_ttc || invoice.amount_ht)}
                          </p>
                          <StatusPill tone={toneForStatus(invoice.status)} size="sm">
                            {invoiceStatusLabel(invoice.status)}
                          </StatusPill>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </SurfaceCard>
            )}

            <InscriptionFinancialPayments
              inscriptionId={inscription.id}
              studentName={inscription.student_name}
              editable={editable}
              price={inscription.price}
            />
          </div>
        )}

        {/* Client Access Tab */}
        {activeTab === "access" && (
          <InscriptionClientAccessCard
            inscriptionId={inscription.id}
            studentId={inscription.student_id}
            inscriptionCode={inscription.code}
            language={inscription.language}
            studentEmail={inscription.student_email}
            studentName={inscription.student_name}
            status={inscription.status}
            paymentMethod={inscription.payment_method}
          />
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <InscriptionTimelineCard inscriptionId={inscription.id} />
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <InscriptionDocumentsCard
            inscriptionId={inscription.id}
            modality={inscription.modality}
            courseLocation={inscription.course_location}
            observations={inscription.observations}
            studentEmail={inscription.student_email}
          />
        )}
      </PageShell>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(translations.confirmDelete)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(translations.confirmDeleteDesc)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t(translations.cancel)}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!id) return;
                try {
                  await deleteInscription.mutateAsync(id);
                  toast.success(t(translations.deleted));
                  navigate("/inscriptions");
                } catch (error: any) {
                  toast.error(error.message || "Suppression de l'inscription impossible");
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteInscription.isPending}
            >
              {deleteInscription.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {t(translations.deleteInscription)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {inscription && (
        <>
          <InscriptionFormDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            inscription={{
              id: inscription.id,
              student_id: inscription.student_id,
              instructor_id: inscription.instructor_id,
              ski_school_id: inscription.ski_school_id,
              language: inscription.language,
              start_date: inscription.start_date,
              end_date: inscription.end_date,
              duration_hours: inscription.duration_hours,
              duration_days: inscription.duration_days,
              hours_per_day: inscription.hours_per_day,
              price: inscription.price,
              pedagogical_cost: inscription.pedagogical_cost,
              entry_level: inscription.entry_level,
              exit_level: inscription.exit_level,
              modality: inscription.modality,
              course_type: (inscription as { course_type?: string | null }).course_type ?? null,
              course_location: inscription.course_location,
              observations: inscription.observations,
              expectations: inscription.expectations,
              funding_organization: opsFields?.funding_organization ?? null,
              group_name: inscription.group_name,
              groupe_code: (inscription as { groupe_code?: string | null }).groupe_code ?? null,
              dates_to_confirm: inscription.dates_to_confirm,
              certification_type: inscription.certification_type,
              certification_result: inscription.certification_result,
              certification_date: inscription.certification_date,
            }}
          />

          <EndPackDialog
            open={endPackOpen}
            onOpenChange={setEndPackOpen}
            inscription={{
              id: inscription.id,
              student_id: inscription.student_id || "",
              student_name: inscription.student_name || "",
              language: inscription.language,
              start_date: inscription.start_date,
              end_date: inscription.end_date,
              duration_hours: inscription.duration_hours,
              hours_followed: progression?.hours_followed ?? null,
              price: inscription.price,
              deposit_amount: inscription.deposit_amount,
              balance_after_deposit: inscription.balance_after_deposit,
              code: inscription.code,
              course_location: inscription.course_location,
              modality: inscription.modality,
              formateur:
                (inscription as { formateur?: string | null }).formateur ||
                inscription.instructor_name,
              niveau_general_entree: progression?.niveau_general_entree ?? null,
              niveau_technique_entree: progression?.niveau_technique_entree ?? null,
              niveau_general_sortie: progression?.niveau_general_sortie ?? null,
              niveau_technique_sortie: progression?.niveau_technique_sortie ?? null,
              objectif_atteint: progression?.objectif_atteint ?? null,
              commentaire_sortie: progression?.commentaire_sortie ?? null,
              status: inscription.status,
              end_pack_sent_at: (inscription as { end_pack_sent_at?: string | null })
                .end_pack_sent_at ?? null,
            }}
          />

          <FormateurEntryFormDialog
            open={entryFormOpen}
            onOpenChange={setEntryFormOpen}
            inscriptionId={inscription.id}
            suggestedGeneralEntry={placementSuggestion}
            initial={
              progression
                ? {
                    niveau_general_entree: progression.niveau_general_entree,
                    niveau_technique_entree: progression.niveau_technique_entree,
                    remarques_entree: progression.remarques_entree,
                  }
                : null
            }
          />

          <FormateurExitFormDialog
            open={exitFormOpen}
            onOpenChange={setExitFormOpen}
            inscriptionId={inscription.id}
            durationHours={inscription.duration_hours}
            hoursFollowed={progression?.hours_followed}
            initial={
              progression
                ? {
                    niveau_general_sortie: progression.niveau_general_sortie,
                    niveau_technique_sortie: progression.niveau_technique_sortie,
                    objectif_atteint: progression.objectif_atteint,
                    commentaire_sortie: progression.commentaire_sortie,
                  }
                : null
            }
            existingEntry={
              progression
                ? {
                    niveau_general_entree: progression.niveau_general_entree,
                    niveau_technique_entree: progression.niveau_technique_entree,
                    remarques_entree: progression.remarques_entree,
                  }
                : null
            }
          />

          <InvoiceCreateDialog
            open={invoiceDialogOpen}
            onOpenChange={setInvoiceDialogOpen}
            defaultInscriptionId={inscription.id}
          />

          <ScheduleApprovalDialog
            open={scheduleDialogOpen}
            onOpenChange={setScheduleDialogOpen}
            inscription={{
              id: inscription.id,
              code: inscription.code,
              student_name: inscription.student_name,
              language: inscription.language,
              start_date: inscription.start_date,
              entry_level: inscription.entry_level,
              schedule_status:
                opsFields?.schedule_status ??
                (inscription as { schedule_status?: string }).schedule_status,
              schedule:
                opsFields?.schedule ??
                (inscription as { schedule?: string }).schedule,
            }}
          />
        </>
      )}
    </MainLayout>
  );
}
