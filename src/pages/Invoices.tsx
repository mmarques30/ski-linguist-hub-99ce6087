import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Filter, Download, Plus, Eye, FileText, Loader2, Send, CheckCircle, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvoices, useUpdateInvoice, InvoiceWithInscription } from "@/hooks/useInvoices";
import { InvoiceTemplate, InvoiceData } from "@/components/invoices/InvoiceTemplate";
import { InvoiceEditDialog } from "@/components/invoices/InvoiceEditDialog";
import { InvoiceCreateDialog } from "@/components/invoices/InvoiceCreateDialog";
import { format } from "date-fns";
import { fr, ptBR, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { useLanguage, Translations } from "@/contexts/LanguageContext";

const translations = {
  title: {
    fr: "Factures",
    "pt-BR": "Faturas",
    en: "Invoices",
  } as Translations,
  subtitle: {
    fr: "Gérer les factures et le suivi des paiements",
    "pt-BR": "Gerenciar faturas e acompanhamento de pagamentos",
    en: "Manage invoices and payment tracking",
  } as Translations,
  export: {
    fr: "Exporter",
    "pt-BR": "Exportar",
    en: "Export",
  } as Translations,
  newInvoice: {
    fr: "Nouvelle Facture",
    "pt-BR": "Nova Fatura",
    en: "New Invoice",
  } as Translations,
  searchPlaceholder: {
    fr: "Rechercher par numéro...",
    "pt-BR": "Pesquisar por número...",
    en: "Search by number...",
  } as Translations,
  allStatuses: {
    fr: "Tous les statuts",
    "pt-BR": "Todos os status",
    en: "All statuses",
  } as Translations,
  draft: {
    fr: "Brouillon",
    "pt-BR": "Rascunho",
    en: "Draft",
  } as Translations,
  sent: {
    fr: "Envoyée",
    "pt-BR": "Enviada",
    en: "Sent",
  } as Translations,
  paid: {
    fr: "Payée",
    "pt-BR": "Paga",
    en: "Paid",
  } as Translations,
  cancelledStatus: {
    fr: "Annulée",
    "pt-BR": "Cancelada",
    en: "Cancelled",
  } as Translations,
  allTypes: {
    fr: "Tous les types",
    "pt-BR": "Todos os tipos",
    en: "All types",
  } as Translations,
  training: {
    fr: "Formation",
    "pt-BR": "Treinamento",
    en: "Training",
  } as Translations,
  test: {
    fr: "Test",
    "pt-BR": "Teste",
    en: "Test",
  } as Translations,
  subcontracting: {
    fr: "Sous-traitance",
    "pt-BR": "Terceirização",
    en: "Subcontracting",
  } as Translations,
  loadingError: {
    fr: "Erreur de chargement",
    "pt-BR": "Erro ao carregar",
    en: "Loading error",
  } as Translations,
  noInvoice: {
    fr: "Aucune facture",
    "pt-BR": "Nenhuma fatura",
    en: "No invoices",
  } as Translations,
  noInvoiceDescription: {
    fr: "Les factures apparaîtront ici lorsque vous en créerez.",
    "pt-BR": "As faturas aparecerão aqui quando você criar.",
    en: "Invoices will appear here when you create them.",
  } as Translations,
  createInvoice: {
    fr: "Créer une facture",
    "pt-BR": "Criar fatura",
    en: "Create invoice",
  } as Translations,
  number: {
    fr: "Numéro",
    "pt-BR": "Número",
    en: "Number",
  } as Translations,
  date: {
    fr: "Date",
    "pt-BR": "Data",
    en: "Date",
  } as Translations,
  type: {
    fr: "Type",
    "pt-BR": "Tipo",
    en: "Type",
  } as Translations,
  amountHT: {
    fr: "Montant HT",
    "pt-BR": "Valor s/ impostos",
    en: "Amount excl. tax",
  } as Translations,
  vat: {
    fr: "TVA",
    "pt-BR": "IVA",
    en: "VAT",
  } as Translations,
  amountTTC: {
    fr: "Montant TTC",
    "pt-BR": "Valor c/ impostos",
    en: "Amount incl. tax",
  } as Translations,
  dueDate: {
    fr: "Échéance",
    "pt-BR": "Vencimento",
    en: "Due date",
  } as Translations,
  status: {
    fr: "Statut",
    "pt-BR": "Status",
    en: "Status",
  } as Translations,
  actions: {
    fr: "Actions",
    "pt-BR": "Ações",
    en: "Actions",
  } as Translations,
  invoiceCount: {
    fr: "facture(s)",
    "pt-BR": "fatura(s)",
    en: "invoice(s)",
  } as Translations,
  invoicePreview: {
    fr: "Aperçu de la facture",
    "pt-BR": "Prévia da fatura",
    en: "Invoice preview",
  } as Translations,
  markedAsSent: {
    fr: "Facture marquée comme envoyée",
    "pt-BR": "Fatura marcada como enviada",
    en: "Invoice marked as sent",
  } as Translations,
  markedAsPaid: {
    fr: "Facture marquée comme payée",
    "pt-BR": "Fatura marcada como paga",
    en: "Invoice marked as paid",
  } as Translations,
  updateError: {
    fr: "Erreur lors de la mise à jour",
    "pt-BR": "Erro ao atualizar",
    en: "Error during update",
  } as Translations,
};

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithInscription | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { language, t } = useLanguage();

  const { data: invoices, isLoading, error } = useInvoices({
    status: statusFilter,
    type: typeFilter,
    search: search || undefined,
  });

  const updateInvoice = useUpdateInvoice();

  const getDateLocale = () => {
    switch (language) {
      case "pt-BR": return ptBR;
      case "en": return enUS;
      default: return fr;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: getDateLocale() });
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, Translations> = {
      draft: translations.draft,
      sent: translations.sent,
      paid: translations.paid,
      cancelled: translations.cancelledStatus,
    };
    return statusMap[status] ? t(statusMap[status]) : status;
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, Translations> = {
      formation: translations.training,
      test: translations.test,
      soustraitance: translations.subcontracting,
    };
    return typeMap[type] ? t(typeMap[type]) : type;
  };

  const handleMarkAsSent = async (invoice: InvoiceWithInscription) => {
    try {
      await updateInvoice.mutateAsync({ id: invoice.id, status: "sent" });
      toast.success(t(translations.markedAsSent));
    } catch (err) {
      toast.error(t(translations.updateError));
    }
  };

  const handleMarkAsPaid = async (invoice: InvoiceWithInscription) => {
    try {
      await updateInvoice.mutateAsync({
        id: invoice.id,
        status: "paid",
        payment_date: new Date().toISOString().split("T")[0],
      });
      toast.success(t(translations.markedAsPaid));
    } catch (err) {
      toast.error(t(translations.updateError));
    }
  };

  const getPreviewData = (invoice: InvoiceWithInscription): InvoiceData => {
    const inscription = invoice.inscription;
    return {
      invoiceNumber: invoice.invoice_number || "",
      invoiceDate: new Date(invoice.invoice_date),
      dueDate: invoice.due_date ? new Date(invoice.due_date) : new Date(),
      invoiceType: invoice.invoice_type,
      status: invoice.status,
      clientName: inscription?.student_name || "Client non renseigné",
      clientAddress: inscription?.student_address || "",
      clientCity: inscription?.student_city || "",
      clientPostalCode: inscription?.student_postal_code || "",
      clientCompany: inscription?.student_company || undefined,
      courseDescription: inscription ? `Formation ${inscription.language}` : undefined,
      courseDateStart: inscription?.start_date ? new Date(inscription.start_date) : undefined,
      courseDateEnd: inscription?.end_date ? new Date(inscription.end_date) : undefined,
      courseDuration: inscription?.duration_hours || undefined,
      courseLocation: inscription?.course_location || undefined,
      amountHT: invoice.amount_ht,
      tvaRate: invoice.tva_rate || 0,
      amountTTC: invoice.amount_ttc || invoice.amount_ht,
      acompteAmount: inscription?.deposit_amount || undefined,
      acompteDate: inscription?.deposit_date ? new Date(inscription.deposit_date) : undefined,
      paymentDate: invoice.payment_date ? new Date(invoice.payment_date) : undefined,
    };
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t(translations.title)}</h1>
            <p className="text-muted-foreground">
              {t(translations.subtitle)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t(translations.export)}
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t(translations.newInvoice)}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t(translations.searchPlaceholder)}
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t(translations.status)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t(translations.allStatuses)}</SelectItem>
              <SelectItem value="draft">{t(translations.draft)}</SelectItem>
              <SelectItem value="sent">{t(translations.sent)}</SelectItem>
              <SelectItem value="paid">{t(translations.paid)}</SelectItem>
              <SelectItem value="cancelled">{t(translations.cancelledStatus)}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t(translations.type)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t(translations.allTypes)}</SelectItem>
              <SelectItem value="formation">{t(translations.training)}</SelectItem>
              <SelectItem value="test">{t(translations.test)}</SelectItem>
              <SelectItem value="soustraitance">{t(translations.subcontracting)}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-destructive/50 mb-4" />
              <h3 className="text-lg font-medium">{t(translations.loadingError)}</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {error.message}
              </p>
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">{t(translations.noInvoice)}</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {t(translations.noInvoiceDescription)}
              </p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t(translations.createInvoice)}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t(translations.number)}</TableHead>
                  <TableHead>{t(translations.date)}</TableHead>
                  <TableHead>{t(translations.type)}</TableHead>
                  <TableHead>{t(translations.amountHT)}</TableHead>
                  <TableHead>{t(translations.vat)}</TableHead>
                  <TableHead>{t(translations.amountTTC)}</TableHead>
                  <TableHead>{t(translations.dueDate)}</TableHead>
                  <TableHead>{t(translations.status)}</TableHead>
                  <TableHead className="text-right">{t(translations.actions)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {invoice.invoice_number || "-"}
                    </TableCell>
                    <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTypeLabel(invoice.invoice_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPrice(invoice.amount_ht)}</TableCell>
                    <TableCell>{invoice.tva_rate}%</TableCell>
                    <TableCell className="font-medium">{formatPrice(invoice.amount_ttc)}</TableCell>
                    <TableCell>{formatDate(invoice.due_date)}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          statusStyles[invoice.status] || "bg-gray-100 text-gray-800",
                          "hover:opacity-80"
                        )}
                      >
                        {getStatusLabel(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setPreviewOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {invoice.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600"
                            onClick={() => handleMarkAsSent(invoice)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        {invoice.status === "sent" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600"
                            onClick={() => handleMarkAsPaid(invoice)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {invoices?.length || 0} {t(translations.invoiceCount)}
          </p>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t(translations.invoicePreview)}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="relative">
              <InvoiceTemplate data={getPreviewData(selectedInvoice)} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <InvoiceEditDialog
        invoice={selectedInvoice}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Create Dialog */}
      <InvoiceCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </MainLayout>
  );
}
