import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { fr, ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeleteInscription } from "@/hooks/useInscriptions";
import { toast } from "sonner";
import { useUserPermissions } from "@/hooks/useUserPermissions";

const translations = {
  back: { fr: "Retour", "pt-BR": "Voltar", en: "Back" },
  inscriptionDetails: { fr: "Détails de l'inscription", "pt-BR": "Detalhes da inscrição", en: "Enrollment Details" },
  loading: { fr: "Chargement...", "pt-BR": "Carregando...", en: "Loading..." },
  notFound: { fr: "Inscription non trouvée", "pt-BR": "Inscrição não encontrada", en: "Enrollment not found" },
  generalInfo: { fr: "Informations générales", "pt-BR": "Informações gerais", en: "General Information" },
  training: { fr: "Formation", "pt-BR": "Formação", en: "Training" },
  financial: { fr: "Financier", "pt-BR": "Financeiro", en: "Financial" },
  documents: { fr: "Documents", "pt-BR": "Documentos", en: "Documents" },
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
  endPack: { fr: "End Pack", "pt-BR": "End Pack", en: "End Pack" },
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

const statusStyles: Record<string, string> = {
  brouillon: "bg-gray-100 text-gray-800",
  en_attente: "bg-yellow-100 text-yellow-800",
  confirmee: "bg-blue-100 text-blue-800",
  en_cours: "bg-indigo-100 text-indigo-800",
  terminee: "bg-gray-100 text-gray-800",
  facturee: "bg-emerald-100 text-emerald-800",
  annulee: "bg-red-100 text-red-800",
};

export default function InscriptionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("inscriptions");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteInscription = useDeleteInscription();
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
      return data;
    },
    enabled: !!id,
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">{t(translations.loading)}</span>
        </div>
      </MainLayout>
    );
  }

  if (error || !inscription) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/inscriptions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t(translations.back)}
            </Link>
          </Button>
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">{t(translations.notFound)}</h3>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link to="/inscriptions">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t(translations.back)}
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {inscription.code || t(translations.inscriptionDetails)}
              </h1>
              <Badge className={statusStyles[inscription.status || ""] || "bg-gray-100 text-gray-800"}>
                {statusLabels[inscription.status || ""] || inscription.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {inscription.student_name} • {inscription.language}
            </p>
          </div>
          {editable && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                {t(translations.editInscription)}
              </Button>
              <Button variant="outline" size="sm">
                <Package className="mr-2 h-4 w-4" />
                {t(translations.endPack)}
              </Button>
              <Button size="sm">
                <Receipt className="mr-2 h-4 w-4" />
                {t(translations.createInvoice)}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t(translations.deleteInscription)}
              </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">{t(translations.generalInfo)}</TabsTrigger>
            <TabsTrigger value="training">{t(translations.training)}</TabsTrigger>
            <TabsTrigger value="financial">{t(translations.financial)}</TabsTrigger>
            <TabsTrigger value="documents">{t(translations.documents)}</TabsTrigger>
          </TabsList>

          {/* General Info Tab */}
          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Student Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t(translations.student)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{inscription.student_name}</p>
                  {inscription.student_email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {inscription.student_email}
                    </div>
                  )}
                  {inscription.student_phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {inscription.student_phone}
                    </div>
                  )}
                  {inscription.student_city && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {inscription.student_city}
                    </div>
                  )}
                  {inscription.student_company && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
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
                </CardContent>
              </Card>

              {/* Instructor Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    {t(translations.instructor)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {inscription.instructor_name ? (
                    <>
                      <p className="font-medium">{inscription.instructor_name}</p>
                      {inscription.instructor_email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          {inscription.instructor_email}
                        </div>
                      )}
                      {inscription.instructor_phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {inscription.instructor_phone}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t(translations.notSpecified)}</p>
                  )}
                </CardContent>
              </Card>

              {/* Ski School Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t(translations.skiSchool)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {inscription.ski_school_name ? (
                    <>
                      <p className="font-medium">{inscription.ski_school_name}</p>
                      {inscription.ski_school_director && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          {inscription.ski_school_director}
                        </div>
                      )}
                      {inscription.ski_school_director_phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {inscription.ski_school_director_phone}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t(translations.notSpecified)}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Observations & Expectations */}
            {(inscription.observations || inscription.expectations) && (
              <div className="grid gap-4 md:grid-cols-2">
                {inscription.observations && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{t(translations.observations)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {inscription.observations}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {inscription.expectations && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{t(translations.expectations)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {inscription.expectations}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Meta info */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t(translations.createdAt)}:</span>{" "}
                    <span className="font-medium">{formatDate(inscription.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t(translations.status)}:</span>{" "}
                    <Badge variant="outline" className={statusStyles[inscription.status || ""]}>
                      {statusLabels[inscription.status || ""] || inscription.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t(translations.training)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t(translations.language)}</p>
                      <p className="font-medium">{inscription.language}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t(translations.modality)}</p>
                      <p className="font-medium">{inscription.modality || t(translations.notSpecified)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t(translations.location)}</p>
                      <p className="font-medium">{inscription.course_location || t(translations.notSpecified)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t(translations.duration)}</p>
                      <p className="font-medium">
                        {inscription.duration_hours 
                          ? `${inscription.duration_hours} ${t(translations.hours)}`
                          : t(translations.notSpecified)
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t(translations.period)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Début</p>
                      <p className="font-medium">{formatDate(inscription.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fin</p>
                      <p className="font-medium">{formatDate(inscription.end_date)}</p>
                    </div>
                    {inscription.duration_days && (
                      <div>
                        <p className="text-sm text-muted-foreground">Jours</p>
                        <p className="font-medium">{inscription.duration_days} jours</p>
                      </div>
                    )}
                    {inscription.hours_per_day && (
                      <div>
                        <p className="text-sm text-muted-foreground">Heures/jour</p>
                        <p className="font-medium">{inscription.hours_per_day}h</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Levels */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Niveaux CECRL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">{t(translations.entryLevel)}</p>
                    <p className="text-2xl font-bold">{inscription.entry_level || "-"}</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">{t(translations.exitLevel)}</p>
                    <p className="text-2xl font-bold">{inscription.final_general_level || inscription.final_specific_level || "-"}</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">{t(translations.certification)}</p>
                    <p className="text-2xl font-bold">{inscription.certification_result || "-"}</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Test d'entrée</p>
                    <p className="text-lg font-medium">{inscription.entry_test_score || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    {t(translations.price)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatPrice(inscription.price)}</p>
                  {inscription.pedagogical_cost && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Coût pédagogique: {formatPrice(inscription.pedagogical_cost)}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t(translations.deposit)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatPrice(inscription.deposit_amount)}</p>
                  {inscription.deposit_date && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Reçu le {formatDate(inscription.deposit_date)}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t(translations.balance)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatPrice(inscription.balance_after_deposit)}</p>
                  {inscription.payment_method && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {inscription.payment_method}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Invoices List */}
            {invoices && invoices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Factures associées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {invoices.map((invoice) => (
                      <div 
                        key={invoice.id} 
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(invoice.invoice_date)} • {invoice.payment_type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(invoice.amount_ttc || invoice.amount_ht)}</p>
                          <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                            {invoice.status === "paid" ? "Payée" : invoice.status === "pending" ? "En attente" : invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t(translations.documents)}</CardTitle>
                <CardDescription>Documents envoyés pour cette inscription</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Aucun document envoyé pour le moment.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

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
                  toast.error(error.message || "Error deleting inscription");
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
    </MainLayout>
  );
}
