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
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  cancelled: "Annulée",
};

const typeLabels: Record<string, string> = {
  formation: "Formation",
  test: "Test",
  soustraitance: "Sous-traitance",
};

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithInscription | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: invoices, isLoading, error } = useInvoices({
    status: statusFilter,
    type: typeFilter,
    search: search || undefined,
  });

  const updateInvoice = useUpdateInvoice();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: fr });
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

  const handleMarkAsSent = async (invoice: InvoiceWithInscription) => {
    try {
      await updateInvoice.mutateAsync({ id: invoice.id, status: "sent" });
      toast.success("Facture marquée comme envoyée");
    } catch (err) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleMarkAsPaid = async (invoice: InvoiceWithInscription) => {
    try {
      await updateInvoice.mutateAsync({
        id: invoice.id,
        status: "paid",
        payment_date: new Date().toISOString().split("T")[0],
      });
      toast.success("Facture marquée comme payée");
    } catch (err) {
      toast.error("Erreur lors de la mise à jour");
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
            <h1 className="text-2xl font-bold">Factures</h1>
            <p className="text-muted-foreground">
              Gérer les factures et le suivi des paiements
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Facture
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="sent">Envoyée</SelectItem>
              <SelectItem value="paid">Payée</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="formation">Formation</SelectItem>
              <SelectItem value="test">Test</SelectItem>
              <SelectItem value="soustraitance">Sous-traitance</SelectItem>
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
              <h3 className="text-lg font-medium">Erreur de chargement</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {error.message}
              </p>
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Aucune facture</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                Les factures apparaîtront ici lorsque vous en créerez.
              </p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une facture
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Montant HT</TableHead>
                  <TableHead>TVA</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                        {typeLabels[invoice.invoice_type] || invoice.invoice_type}
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
                        {statusLabels[invoice.status] || invoice.status}
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
            {invoices?.length || 0} facture(s)
          </p>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu de la facture</DialogTitle>
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
