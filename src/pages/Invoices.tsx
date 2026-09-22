import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Filter,
  Download,
  Plus,
  Eye,
  FileText,
  Send,
  CheckCircle,
  Pencil,
  CalendarIcon,
  Euro,
  ChartPie,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { useInvoices, useUpdateInvoice, InvoiceWithInscription } from "@/hooks/useInvoices";
import { ensureInvoicePayment } from "@/hooks/usePayments";
import { canonicalPaymentMethod } from "@/lib/payment-methods";
import { resolveInvoiceClientName } from "@/lib/invoice-client-name";
import { InvoiceTemplate, InvoiceData } from "@/components/invoices/InvoiceTemplate";
import { InvoiceEditDialog } from "@/components/invoices/InvoiceEditDialog";
import { InvoiceCreateDialog } from "@/components/invoices/InvoiceCreateDialog";
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from "date-fns";
import { fr, ptBR, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSeasonFilter } from "@/contexts/SeasonContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import {
  CardList,
  CardListItem,
  DonutChart,
  FilterBar,
  PageHeader,
  PageShell,
  RankedBarList,
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
  TableCell,
  TableEmpty,
  TableFrame,
  TableHeadCell,
  TableHeadRow,
  TableRow,
  TableSkeleton,
  toneForStatus,
  type PillTone,
} from "@/components/ui-kit";
import {
  getCurrentFiscalYear,
  getDebutSaison,
  getFinSaison,
  getPreviousFiscalYear,
} from "@/lib/fiscal-year";

const translations = {
  title: {
    fr: "Factures",
    "pt-BR": "Faturas",
    en: "Invoices",
  },
  subtitle: {
    fr: "Gérer les factures et le suivi des paiements",
    "pt-BR": "Gerenciar faturas e acompanhamento de pagamentos",
    en: "Manage invoices and payment tracking",
  },
  export: {
    fr: "Exporter CSV",
    "pt-BR": "Exportar CSV",
    en: "Export CSV",
  },
  exportSuccess: {
    fr: "Export CSV téléchargé",
    "pt-BR": "CSV exportado com sucesso",
    en: "CSV export downloaded",
  },
  newInvoice: {
    fr: "Nouvelle facture",
    "pt-BR": "Nova Fatura",
    en: "New Invoice",
  },
  searchPlaceholder: {
    fr: "N° facture ou nom client…",
    "pt-BR": "Nº fatura ou nome do cliente…",
    en: "Invoice no. or client name…",
  },
  allStatuses: {
    fr: "Tous les statuts",
    "pt-BR": "Todos os status",
    en: "All statuses",
  },
  statusDraft: {
    fr: "Brouillon",
    "pt-BR": "Rascunho",
    en: "Draft",
  },
  statusSent: {
    fr: "Envoyée",
    "pt-BR": "Enviada",
    en: "Sent",
  },
  statusPending: {
    fr: "En attente",
    "pt-BR": "Em espera",
    en: "Pending",
  },
  statusToChase: {
    fr: "À relancer",
    "pt-BR": "A cobrar",
    en: "Follow up",
  },
  statusPaid: {
    fr: "Payée",
    "pt-BR": "Paga",
    en: "Paid",
  },
  statusCancelled: {
    fr: "Annulée",
    "pt-BR": "Cancelada",
    en: "Cancelled",
  },
  statusToCheck: {
    fr: "À vérifier",
    "pt-BR": "A verificar",
    en: "To review",
  },
  allTypes: {
    fr: "Tous les types",
    "pt-BR": "Todos os tipos",
    en: "All types",
  },
  allClients: {
    fr: "Tous les clients",
    "pt-BR": "Todos os clientes",
    en: "All clients",
  },
  typeFormation: {
    fr: "Formation",
    "pt-BR": "Formação",
    en: "Training",
  },
  typeTest: {
    fr: "Test",
    "pt-BR": "Teste",
    en: "Test",
  },
  typeSubcontracting: {
    fr: "Sous-traitance",
    "pt-BR": "Subcontratação",
    en: "Subcontracting",
  },
  number: {
    fr: "Numéro",
    "pt-BR": "Número",
    en: "Number",
  },
  date: {
    fr: "Date",
    "pt-BR": "Data",
    en: "Date",
  },
  type: {
    fr: "Type",
    "pt-BR": "Tipo",
    en: "Type",
  },
  amountHT: {
    fr: "Montant HT",
    "pt-BR": "Valor sem impostos",
    en: "Amount excl. VAT",
  },
  tva: {
    fr: "TVA",
    "pt-BR": "IVA",
    en: "VAT",
  },
  amountTTC: {
    fr: "Montant TTC",
    "pt-BR": "Valor com impostos",
    en: "Amount incl. VAT",
  },
  dueDate: {
    fr: "Échéance",
    "pt-BR": "Vencimento",
    en: "Due Date",
  },
  status: {
    fr: "Statut",
    "pt-BR": "Status",
    en: "Status",
  },
  actions: {
    fr: "Actions",
    "pt-BR": "Ações",
    en: "Actions",
  },
  loadingError: {
    fr: "Erreur de chargement",
    "pt-BR": "Erro ao carregar",
    en: "Loading error",
  },
  noInvoicesTitle: {
    fr: "Aucune facture",
    "pt-BR": "Nenhuma fatura",
    en: "No invoices",
  },
  noInvoicesDesc: {
    fr: "Les factures apparaîtront ici lorsque vous en créerez.",
    "pt-BR": "As faturas aparecerão aqui quando você criá-las.",
    en: "Invoices will appear here when you create them.",
  },
  createInvoice: {
    fr: "Créer une facture",
    "pt-BR": "Criar fatura",
    en: "Create invoice",
  },
  invoices: {
    fr: "facture(s)",
    "pt-BR": "fatura(s)",
    en: "invoice(s)",
  },
  resultsCount: {
    fr: "résultat(s)",
    "pt-BR": "resultado(s)",
    en: "result(s)",
  },
  activeFilters: {
    fr: "Filtres actifs",
    "pt-BR": "Filtros ativos",
    en: "Active filters",
  },
  previewTitle: {
    fr: "Aperçu de la facture",
    "pt-BR": "Visualização da fatura",
    en: "Invoice Preview",
  },
  markedAsSent: {
    fr: "Facture marquée comme envoyée",
    "pt-BR": "Fatura marcada como enviada",
    en: "Invoice marked as sent",
  },
  markedAsPaid: {
    fr: "Facture marquée comme payée",
    "pt-BR": "Fatura marcada como paga",
    en: "Invoice marked as paid",
  },
  updateError: {
    fr: "Erreur lors de la mise à jour",
    "pt-BR": "Erro ao atualizar",
    en: "Error updating",
  },
  client: {
    fr: "Client",
    "pt-BR": "Cliente",
    en: "Client",
  },
  clientStagiaire: {
    fr: "Stagiaire",
    "pt-BR": "Estagiário",
    en: "Trainee",
  },
  clientEcoleSki: {
    fr: "École de ski",
    "pt-BR": "Escola de esqui",
    en: "Ski School",
  },
  clientDSF: {
    fr: "DSF",
    "pt-BR": "DSF",
    en: "DSF",
  },
  clientAutre: {
    fr: "Autre",
    "pt-BR": "Outro",
    en: "Other",
  },
  allPeriods: {
    fr: "Toutes périodes",
    "pt-BR": "Todos os períodos",
    en: "All periods",
  },
  periodThisMonth: {
    fr: "Ce mois",
    "pt-BR": "Este mês",
    en: "This month",
  },
  periodLastMonth: {
    fr: "Mois dernier",
    "pt-BR": "Mês passado",
    en: "Last month",
  },
  periodThisQuarter: {
    fr: "Ce trimestre",
    "pt-BR": "Este trimestre",
    en: "This quarter",
  },
  periodLastQuarter: {
    fr: "Trimestre dernier",
    "pt-BR": "Trimestre passado",
    en: "Last quarter",
  },
  periodThisYear: {
    fr: "Cette année",
    "pt-BR": "Este ano",
    en: "This year",
  },
  periodLastYear: {
    fr: "Année dernière",
    "pt-BR": "Ano passado",
    en: "Last year",
  },
  periodThisSeason: {
    fr: "Cet exercice",
    "pt-BR": "Esta temporada",
    en: "This fiscal year",
  },
  periodLastSeason: {
    fr: "Exercice précédent",
    "pt-BR": "Temporada passada",
    en: "Previous fiscal year",
  },
  // Bandeau de synthèse — libellés ajoutés par la densification visuelle.
  tileInvoices: {
    fr: "Factures listées",
    "pt-BR": "Faturas listadas",
    en: "Listed invoices",
  },
  tileTotalTTC: {
    fr: "Total TTC listé",
    "pt-BR": "Total com impostos listado",
    en: "Listed total incl. VAT",
  },
  tileCashedIn: {
    fr: "Encaissé",
    "pt-BR": "Recebido",
    en: "Cashed in",
  },
  tileOutstanding: {
    fr: "Reste à encaisser",
    "pt-BR": "A receber",
    en: "Outstanding",
  },
  tileToCheck: {
    fr: "À vérifier",
    "pt-BR": "A verificar",
    en: "To check",
  },
  sentAwaitingPayment: {
    fr: "factures envoyées, non payées",
    "pt-BR": "faturas enviadas, não pagas",
    en: "invoices sent, not paid",
  },
  ofListedTotal: {
    fr: "du total TTC listé",
    "pt-BR": "do total listado",
    en: "of the listed total",
  },
  byStatusTitle: {
    fr: "Répartition par statut",
    "pt-BR": "Distribuição por status",
    en: "Breakdown by status",
  },
  byTypeTitle: {
    fr: "Montant TTC par type",
    "pt-BR": "Valor por tipo",
    en: "Amount incl. VAT by type",
  },
  scopeListed: {
    fr: "Sur les factures listées ci-dessous — les filtres actifs s'appliquent.",
    "pt-BR": "Sobre as faturas listadas abaixo — os filtros ativos se aplicam.",
    en: "Over the invoices listed below — the active filters apply.",
  },
  noData: {
    fr: "Aucune donnée disponible",
    "pt-BR": "Nenhum dado disponível",
    en: "No data available",
  },
};

/** Teintes des types de client — les statuts passent par `toneForStatus`. */
const clientTypeTones: Record<string, PillTone> = {
  stagiaire: "purple",
  ecole_ski: "info",
  dsf: "warning",
  autre: "neutral",
};

export default function Invoices() {
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") || "all"
  );
  const [typeFilter, setTypeFilter] = useState("all");
  const [clientTypeFilter, setClientTypeFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithInscription | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { language, t } = useLanguage();
  const { seasonId, seasonStart, seasonEnd } = useSeasonFilter();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("invoices");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
    const status = searchParams.get("status");
    if (status) setStatusFilter(status);
    // Les répartitions du bandeau pointent ici avec ?type=…
    const type = searchParams.get("type");
    if (type) setTypeFilter(type);
  }, [searchParams]);

  // Bornes d'exercice fiscal FLI (libellé AA-AA)
  const getSeasonDates = (offset: number = 0) => {
    let label = getCurrentFiscalYear();
    if (offset === -1) {
      label = getPreviousFiscalYear(label);
    } else if (offset !== 0) {
      let l = getCurrentFiscalYear();
      for (let i = 0; i < Math.abs(offset); i++) {
        l = getPreviousFiscalYear(l);
      }
      label = l;
    }
    const { start, end } = {
      start: getDebutSaison(label),
      end: getFinSaison(label),
    };
    return { start, end };
  };

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (periodFilter) {
      case "this_month":
        return { from: format(startOfMonth(now), "yyyy-MM-dd"), to: format(endOfMonth(now), "yyyy-MM-dd") };
      case "last_month": {
        const lastMonth = subMonths(now, 1);
        return { from: format(startOfMonth(lastMonth), "yyyy-MM-dd"), to: format(endOfMonth(lastMonth), "yyyy-MM-dd") };
      }
      case "this_quarter":
        return { from: format(startOfQuarter(now), "yyyy-MM-dd"), to: format(endOfQuarter(now), "yyyy-MM-dd") };
      case "last_quarter": {
        const lastQuarter = subQuarters(now, 1);
        return { from: format(startOfQuarter(lastQuarter), "yyyy-MM-dd"), to: format(endOfQuarter(lastQuarter), "yyyy-MM-dd") };
      }
      case "this_year":
        return { from: format(startOfYear(now), "yyyy-MM-dd"), to: format(endOfYear(now), "yyyy-MM-dd") };
      case "last_year": {
        const lastYear = subYears(now, 1);
        return { from: format(startOfYear(lastYear), "yyyy-MM-dd"), to: format(endOfYear(lastYear), "yyyy-MM-dd") };
      }
      case "this_season": {
        const season = getSeasonDates(0);
        return { from: format(season.start, "yyyy-MM-dd"), to: format(season.end, "yyyy-MM-dd") };
      }
      case "last_season": {
        const season = getSeasonDates(-1);
        return { from: format(season.start, "yyyy-MM-dd"), to: format(season.end, "yyyy-MM-dd") };
      }
      default:
        return { from: undefined, to: undefined };
    }
  }, [periodFilter]);

  const periodLabels: Record<string, string> = {
    this_month: t(translations.periodThisMonth),
    last_month: t(translations.periodLastMonth),
    this_quarter: t(translations.periodThisQuarter),
    last_quarter: t(translations.periodLastQuarter),
    this_year: t(translations.periodThisYear),
    last_year: t(translations.periodLastYear),
    this_season: t(translations.periodThisSeason),
    last_season: t(translations.periodLastSeason),
  };

  const { data: invoicesRaw, isLoading, error } = useInvoices({
    status: statusFilter,
    type: typeFilter,
    clientType: clientTypeFilter,
    // Recherche n° + nom client côté client (notes import sans inscription)
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    seasonId,
    seasonStart,
    seasonEnd,
  });

  const invoices = useMemo(() => {
    if (!invoicesRaw) return invoicesRaw;
    const q = search.trim().toLowerCase();
    if (!q) return invoicesRaw;
    return invoicesRaw.filter((invoice) => {
      const number = (invoice.invoice_number || "").toLowerCase();
      const client = resolveInvoiceClientName(invoice).toLowerCase();
      const notes = (invoice.notes || "").toLowerCase();
      return number.includes(q) || client.includes(q) || notes.includes(q);
    });
  }, [invoicesRaw, search]);

  const updateInvoice = useUpdateInvoice();
  const { confirm, dialog: confirmDialog } = useConfirmAction();

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
    const locale = language === "pt-BR" ? "pt-BR" : language === "en" ? "en-US" : "fr-FR";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const statusLabels: Record<string, string> = {
    draft: t(translations.statusDraft),
    sent: t(translations.statusSent),
    en_attente: t(translations.statusPending),
    a_relancer: t(translations.statusToChase),
    paid: t(translations.statusPaid),
    cancelled: t(translations.statusCancelled),
    a_verifier: t(translations.statusToCheck),
  };

  const typeLabels: Record<string, string> = {
    formation: t(translations.typeFormation),
    test: t(translations.typeTest),
    soustraitance: t(translations.typeSubcontracting),
  };

  const clientTypeLabels: Record<string, string> = {
    stagiaire: t(translations.clientStagiaire),
    ecole_ski: t(translations.clientEcoleSki),
    dsf: t(translations.clientDSF),
    autre: t(translations.clientAutre),
  };

  /**
   * Synthèse des factures listées. `useInvoices` ne pagine pas : ces totaux
   * couvrent l'intégralité du résultat des filtres actifs — ni une page
   * partielle, ni la base entière.
   */
  const summary = useMemo(() => {
    const rows = invoices ?? [];
    const statusTotals = new Map<string, { count: number; ttc: number }>();
    const typeTotals = new Map<string, { count: number; ttc: number }>();
    let totalHt = 0;
    let totalTtc = 0;

    for (const invoice of rows) {
      const ttc = invoice.amount_ttc ?? invoice.amount_ht ?? 0;
      totalHt += invoice.amount_ht ?? 0;
      totalTtc += ttc;

      const status = statusTotals.get(invoice.status) ?? { count: 0, ttc: 0 };
      statusTotals.set(invoice.status, { count: status.count + 1, ttc: status.ttc + ttc });

      const type = typeTotals.get(invoice.invoice_type) ?? { count: 0, ttc: 0 };
      typeTotals.set(invoice.invoice_type, { count: type.count + 1, ttc: type.ttc + ttc });
    }

    const forStatus = (code: string) => statusTotals.get(code) ?? { count: 0, ttc: 0 };
    const mergeStatuses = (...codes: string[]) =>
      codes.reduce(
        (acc, code) => {
          const part = forStatus(code);
          return { count: acc.count + part.count, ttc: acc.ttc + part.ttc };
        },
        { count: 0, ttc: 0 }
      );

    return {
      count: rows.length,
      totalHt,
      totalTtc,
      paid: forStatus("paid"),
      sent: forStatus("sent"),
      pending: forStatus("en_attente"),
      toChase: forStatus("a_relancer"),
      outstanding: mergeStatuses("sent", "en_attente", "a_relancer"),
      draft: forStatus("draft"),
      toCheck: forStatus("a_verifier"),
      statusTotals,
      typeTotals,
    };
  }, [invoices]);

  /** Part d'un sous-ensemble réel du total listé — jamais une cible inventée. */
  const shareOfListed = (amount: number) =>
    summary.totalTtc > 0 ? `${Math.round((amount / summary.totalTtc) * 100)}% ` : "";

  const statusSlices = useMemo(
    () =>
      [...summary.statusTotals.entries()]
        .map(([status, value]) => ({
          name: statusLabels[status] || status,
          value: value.count,
          href: `/invoices?status=${status}`,
        }))
        .sort((a, b) => b.value - a.value),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summary, language]
  );

  const typeBars = useMemo(
    () =>
      [...summary.typeTotals.entries()]
        .map(([type, value]) => ({
          key: type,
          label: typeLabels[type] || type,
          value: Math.round(value.ttc),
          display: formatPrice(value.ttc),
          hint: `${value.count} ${t(translations.invoices)}`,
          href: `/invoices?type=${type}`,
        }))
        .sort((a, b) => b.value - a.value),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summary, language]
  );

  const getClientName = (invoice: InvoiceWithInscription) =>
    resolveInvoiceClientName(invoice);

  const handleMarkAsSent = (invoice: InvoiceWithInscription) => {
    confirm({
      title: "Marquer la facture comme envoyée ?",
      description: `Facture ${invoice.invoice_number || invoice.id} : le statut passera à « Envoyée ».`,
      run: async () => {
        try {
          await updateInvoice.mutateAsync({ id: invoice.id, status: "sent" });
          toast.success(t(translations.markedAsSent));
        } catch {
          toast.error(t(translations.updateError));
        }
      },
    });
  };

  const handleMarkAsPaid = (invoice: InvoiceWithInscription) => {
    const method = canonicalPaymentMethod(invoice.payment_method);
    if (!method) {
      toast.error("Saisissez un moyen de paiement dans la fiche facture avant de marquer Payée");
      setSelectedInvoice(invoice);
      setEditOpen(true);
      return;
    }
    const paymentDate = invoice.payment_date || new Date().toISOString().split("T")[0];
    confirm({
      title: "Marquer la facture comme payée ?",
      description: `Facture ${invoice.invoice_number || invoice.id} : statut « Payée » et enregistrement du paiement.`,
      run: async () => {
        try {
          await updateInvoice.mutateAsync({
            id: invoice.id,
            status: "paid",
            payment_date: paymentDate,
            payment_method: method,
          });
          await ensureInvoicePayment({
            invoiceId: invoice.id,
            inscriptionId: invoice.inscription_id,
            amount: invoice.amount_ttc || invoice.amount_ht,
            paymentMethod: method,
            paymentDate,
            payerName: (() => {
              const name = resolveInvoiceClientName(invoice);
              return name !== "-" ? name : null;
            })(),
          });
          toast.success(t(translations.markedAsPaid));
        } catch {
          toast.error(t(translations.updateError));
        }
      },
    });
  };

  const handleExportCSV = () => {
    if (!invoices?.length) return;

    const headers = [
      t(translations.number),
      t(translations.date),
      t(translations.client),
      t(translations.type),
      t(translations.amountHT),
      t(translations.tva),
      t(translations.amountTTC),
      t(translations.dueDate),
      t(translations.status),
    ];

    const rows = invoices.map((invoice) => [
      invoice.invoice_number || "",
      formatDate(invoice.invoice_date),
      getClientName(invoice),
      typeLabels[invoice.invoice_type] || invoice.invoice_type,
      invoice.amount_ht?.toString() || "0",
      `${invoice.tva_rate || 0}%`,
      invoice.amount_ttc?.toString() || invoice.amount_ht?.toString() || "0",
      formatDate(invoice.due_date),
      statusLabels[invoice.status] || invoice.status,
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `factures_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(t(translations.exportSuccess));
  };

  const getPreviewData = (invoice: InvoiceWithInscription): InvoiceData => {
    const inscription = invoice.inscription;
    const clientName = resolveInvoiceClientName(invoice);
    return {
      invoiceNumber: invoice.invoice_number || "",
      invoiceDate: new Date(invoice.invoice_date),
      dueDate: invoice.due_date ? new Date(invoice.due_date) : new Date(),
      invoiceType: invoice.invoice_type,
      status: invoice.status,
      clientName: clientName !== "-" ? clientName : "Client non renseigné",
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


  const activeFilters = [
    ...(statusFilter !== "all"
      ? [{ key: "status", label: statusLabels[statusFilter] ?? statusFilter, onRemove: () => setStatusFilter("all") }]
      : []),
    ...(typeFilter !== "all"
      ? [{ key: "type", label: typeLabels[typeFilter] ?? typeFilter, onRemove: () => setTypeFilter("all") }]
      : []),
    ...(clientTypeFilter !== "all"
      ? [
          {
            key: "clientType",
            label: clientTypeLabels[clientTypeFilter] ?? clientTypeFilter,
            onRemove: () => setClientTypeFilter("all"),
          },
        ]
      : []),
    ...(periodFilter !== "all"
      ? [{ key: "period", label: periodLabels[periodFilter] ?? periodFilter, onRemove: () => setPeriodFilter("all") }]
      : []),
    ...(search ? [{ key: "search", label: `"${search}"`, onRemove: () => setSearch("") }] : []),
  ];

  const resetFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setClientTypeFilter("all");
    setPeriodFilter("all");
    setSearch("");
  };

  const openPreview = (invoice: InvoiceWithInscription) => {
    setSelectedInvoice(invoice);
    setPreviewOpen(true);
  };

  const rowActions = (invoice: InvoiceWithInscription) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label={t(translations.previewTitle)}
        onClick={() => openPreview(invoice)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      {editable && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={t(translations.actions)}
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
              className="h-8 w-8 text-[hsl(var(--tint-blue-fg))]"
              aria-label={t(translations.statusSent)}
              onClick={() => handleMarkAsSent(invoice)}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
          {(invoice.status === "sent" ||
            invoice.status === "en_attente" ||
            invoice.status === "a_relancer") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[hsl(var(--status-good))]"
              aria-label={t(translations.statusPaid)}
              onClick={() => handleMarkAsPaid(invoice)}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
    </div>
  );

  const clientCell = (invoice: InvoiceWithInscription) => (
    <div className="flex flex-col items-start gap-1">
      {invoice.inscription?.student_id ? (
        <Link
          to={`/students/${invoice.inscription.student_id}`}
          className="max-w-[150px] truncate text-sm font-medium text-[hsl(var(--tint-blue-fg))] hover:underline"
        >
          {getClientName(invoice)}
        </Link>
      ) : (
        <span className="max-w-[150px] truncate text-sm font-medium">
          {getClientName(invoice)}
        </span>
      )}
      {invoice.inscription_id && invoice.inscription?.code && (
        <Link
          to={`/inscriptions/${invoice.inscription_id}`}
          className="font-mono text-xs text-muted-foreground hover:text-[hsl(var(--tint-blue-fg))] hover:underline"
        >
          {invoice.inscription.code}
        </Link>
      )}
      <StatusPill tone={clientTypeTones[invoice.client_type] ?? "neutral"} size="sm">
        {clientTypeLabels[invoice.client_type] || invoice.client_type}
      </StatusPill>
    </div>
  );

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title={t(translations.title)}
          description={t(translations.subtitle)}
          icon={FileText}
          tone="gold"
          actions={
            <>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!invoices?.length}>
                <Download className="mr-2 h-4 w-4" />
                {t(translations.export)}
              </Button>
              {editable && (
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t(translations.newInvoice)}
                </Button>
              )}
            </>
          }
        />

        {/*
          Bandeau de synthèse : tout vient des factures déjà chargées, qui
          couvrent l'intégralité des filtres actifs (la requête ne pagine pas).
          Chaque tuile ouvre la liste filtrée sur le statut correspondant.
        */}
        <StatTileGrid cols={5}>
          <StatTile
            label={t(translations.tileInvoices)}
            value={summary.count}
            hint={`${formatPrice(summary.totalHt)} ${t(translations.amountHT)}`}
            icon={FileText}
            tone="gold"
            loading={isLoading}
            onClick={resetFilters}
          />
          <StatTile
            label={t(translations.tileTotalTTC)}
            value={formatPrice(summary.totalTtc)}
            hint={`${summary.count} ${t(translations.invoices)}`}
            icon={Euro}
            tone="navy"
            loading={isLoading}
            onClick={resetFilters}
          />
          <StatTile
            label={t(translations.tileCashedIn)}
            value={formatPrice(summary.paid.ttc)}
            hint={`${summary.paid.count} ${t(translations.invoices)} · ${shareOfListed(
              summary.paid.ttc
            )}${t(translations.ofListedTotal)}`}
            icon={CheckCircle}
            tone="teal"
            loading={isLoading}
            onClick={() => setStatusFilter("paid")}
          />
          <StatTile
            label={t(translations.tileOutstanding)}
            value={formatPrice(summary.outstanding.ttc)}
            hint={`${summary.outstanding.count} ${t(translations.sentAwaitingPayment)}`}
            icon={Send}
            tone="orange"
            loading={isLoading}
            onClick={() => setStatusFilter("en_attente")}
          />
          <StatTile
            label={t(translations.tileToCheck)}
            value={summary.toCheck.count}
            hint={formatPrice(summary.toCheck.ttc)}
            icon={AlertTriangle}
            tone="rose"
            loading={isLoading}
            onClick={() => setStatusFilter("a_verifier")}
          />
        </StatTileGrid>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          <SurfaceCard
            title={t(translations.byStatusTitle)}
            description={t(translations.scopeListed)}
            icon={ChartPie}
          >
            {isLoading ? (
              <div className="h-[190px] animate-shimmer rounded-[var(--radius)]" />
            ) : (
              <DonutChart
                data={statusSlices}
                height={150}
                thickness={18}
                legendPosition="bottom"
                centerLabel={t(translations.invoices)}
                ariaLabel={t(translations.byStatusTitle)}
                emptyMessage={t(translations.noData)}
              />
            )}
          </SurfaceCard>

          <SurfaceCard
            title={t(translations.byTypeTitle)}
            description={t(translations.scopeListed)}
            icon={Layers}
          >
            {isLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="h-8 animate-shimmer rounded-[var(--radius)]" />
                ))}
              </div>
            ) : (
              <RankedBarList
                items={typeBars}
                colorBySeries
                className="tabular"
                emptyMessage={t(translations.noData)}
              />
            )}
          </SurfaceCard>
        </div>

        <SurfaceCard
          title={`${invoices?.length || 0} ${t(translations.resultsCount)}`}
          toolbar={
            <FilterBar
              search={{
                value: search,
                onChange: setSearch,
                placeholder: t(translations.searchPlaceholder),
                ariaLabel: t(translations.searchPlaceholder),
              }}
              activeFilters={activeFilters}
              onClearAll={activeFilters.length > 0 ? resetFilters : undefined}
              filters={
                <>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder={t(translations.status)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t(translations.allStatuses)}</SelectItem>
                      <SelectItem value="draft">{t(translations.statusDraft)}</SelectItem>
                      <SelectItem value="sent">{t(translations.statusSent)}</SelectItem>
                      <SelectItem value="en_attente">{t(translations.statusPending)}</SelectItem>
                      <SelectItem value="a_relancer">{t(translations.statusToChase)}</SelectItem>
                      <SelectItem value="paid">{t(translations.statusPaid)}</SelectItem>
                      <SelectItem value="cancelled">{t(translations.statusCancelled)}</SelectItem>
                      <SelectItem value="a_verifier">{t(translations.statusToCheck)}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder={t(translations.type)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t(translations.allTypes)}</SelectItem>
                      <SelectItem value="formation">{t(translations.typeFormation)}</SelectItem>
                      <SelectItem value="test">{t(translations.typeTest)}</SelectItem>
                      <SelectItem value="soustraitance">{t(translations.typeSubcontracting)}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder={t(translations.client)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t(translations.allClients)}</SelectItem>
                      <SelectItem value="stagiaire">{t(translations.clientStagiaire)}</SelectItem>
                      <SelectItem value="ecole_ski">{t(translations.clientEcoleSki)}</SelectItem>
                      <SelectItem value="dsf">{t(translations.clientDSF)}</SelectItem>
                      <SelectItem value="autre">{t(translations.clientAutre)}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="w-[160px]">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t(translations.allPeriods)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t(translations.allPeriods)}</SelectItem>
                      <SelectItem value="this_month">{t(translations.periodThisMonth)}</SelectItem>
                      <SelectItem value="last_month">{t(translations.periodLastMonth)}</SelectItem>
                      <SelectItem value="this_quarter">{t(translations.periodThisQuarter)}</SelectItem>
                      <SelectItem value="last_quarter">{t(translations.periodLastQuarter)}</SelectItem>
                      <SelectItem value="this_year">{t(translations.periodThisYear)}</SelectItem>
                      <SelectItem value="last_year">{t(translations.periodLastYear)}</SelectItem>
                      <SelectItem value="this_season">{t(translations.periodThisSeason)}</SelectItem>
                      <SelectItem value="last_season">{t(translations.periodLastSeason)}</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              }
              actions={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t(translations.activeFilters)}
                  onClick={resetFilters}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              }
            />
          }
          footer={
            <p className="text-sm text-muted-foreground tabular">
              {invoices?.length || 0} {t(translations.invoices)}
            </p>
          }
          flush
        >
          {isLoading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : error ? (
            <TableEmpty
              title={t(translations.loadingError)}
              description={error.message}
              icon={FileText}
            />
          ) : !invoices || invoices.length === 0 ? (
            <TableEmpty
              title={t(translations.noInvoicesTitle)}
              description={t(translations.noInvoicesDesc)}
              icon={FileText}
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t(translations.createInvoice)}
                </Button>
              }
            />
          ) : (
            <>
              <TableFrame className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <TableHeadRow>
                      <TableHeadCell>{t(translations.number)}</TableHeadCell>
                      <TableHeadCell>{t(translations.date)}</TableHeadCell>
                      <TableHeadCell>{t(translations.type)}</TableHeadCell>
                      <TableHeadCell>{t(translations.client)}</TableHeadCell>
                      <TableHeadCell align="right">{t(translations.amountHT)}</TableHeadCell>
                      <TableHeadCell align="right">{t(translations.tva)}</TableHeadCell>
                      <TableHeadCell align="right">{t(translations.amountTTC)}</TableHeadCell>
                      <TableHeadCell>{t(translations.dueDate)}</TableHeadCell>
                      <TableHeadCell>{t(translations.status)}</TableHeadCell>
                      <TableHeadCell align="right">{t(translations.actions)}</TableHeadCell>
                    </TableHeadRow>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {invoice.invoice_number ? (
                            <button
                              type="button"
                              onClick={() => openPreview(invoice)}
                              className="text-[hsl(var(--tint-blue-fg))] hover:underline"
                            >
                              {invoice.invoice_number}
                            </button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="tabular" hideBelow="lg">
                          {formatDate(invoice.invoice_date)}
                        </TableCell>
                        <TableCell hideBelow="xl">
                          <StatusPill tone="neutral" size="sm">
                            {typeLabels[invoice.invoice_type] || invoice.invoice_type}
                          </StatusPill>
                        </TableCell>
                        <TableCell>{clientCell(invoice)}</TableCell>
                        <TableCell align="right" className="tabular" hideBelow="lg">
                          {formatPrice(invoice.amount_ht)}
                        </TableCell>
                        <TableCell align="right" className="tabular" hideBelow="xl">
                          {invoice.tva_rate}%
                        </TableCell>
                        <TableCell align="right" className="font-medium tabular">
                          {formatPrice(invoice.amount_ttc)}
                        </TableCell>
                        <TableCell className="tabular" hideBelow="lg">
                          {formatDate(invoice.due_date)}
                        </TableCell>
                        <TableCell>
                          <StatusPill tone={toneForStatus(invoice.status)} size="sm">
                            {statusLabels[invoice.status] || invoice.status}
                          </StatusPill>
                        </TableCell>
                        <TableCell align="right">{rowActions(invoice)}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </TableFrame>

              <CardList className="md:hidden">
                {invoices.map((invoice) => (
                  <CardListItem
                    key={invoice.id}
                    title={invoice.invoice_number || "-"}
                    subtitle={getClientName(invoice)}
                    meta={
                      <StatusPill tone={toneForStatus(invoice.status)} size="sm">
                        {statusLabels[invoice.status] || invoice.status}
                      </StatusPill>
                    }
                    fields={[
                      { label: t(translations.date), value: formatDate(invoice.invoice_date) },
                      {
                        label: t(translations.type),
                        value: typeLabels[invoice.invoice_type] || invoice.invoice_type,
                      },
                      { label: t(translations.amountHT), value: formatPrice(invoice.amount_ht) },
                      { label: t(translations.tva), value: `${invoice.tva_rate}%` },
                      { label: t(translations.amountTTC), value: formatPrice(invoice.amount_ttc) },
                      { label: t(translations.dueDate), value: formatDate(invoice.due_date) },
                      { label: t(translations.client), value: clientCell(invoice) },
                    ]}
                    actions={rowActions(invoice)}
                  />
                ))}
              </CardList>
            </>
          )}
        </SurfaceCard>
      </PageShell>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t(translations.previewTitle)}</DialogTitle>
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
      {confirmDialog}
    </MainLayout>
  );
}
