import { Fragment, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { PeriodSelector } from "@/components/finance/PeriodSelector";
import { RentabiliteDashboard } from "@/components/finance/RentabiliteDashboard";
import { AddCostDialog } from "@/components/finance/AddCostDialog";
import { PilotageSubnav } from "@/components/finance/PilotageSubnav";
import { useFormationProfitability } from "@/hooks/useFinancialDashboard";
import { Plus, ChevronDown, ChevronRight, LayoutDashboard, Percent, Table2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  CardList,
  CardListItem,
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
  TableSkeleton,
  type PillTone,
} from "@/components/ui-kit";

type RentabiliteView = "dashboard" | "tableaux";

export default function FinanceRentabilite() {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(subMonths(startOfMonth(today), 3), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [addCostOpen, setAddCostOpen] = useState(false);
  const [selectedInscription, setSelectedInscription] = useState<string | undefined>();
  const [view, setView] = useState<RentabiliteView>("dashboard");

  const { data: formations, isLoading } = useFormationProfitability(startDate, endDate);
  const { canEdit } = useUserPermissions();
  const editable = canEdit("finance.rentabilite");

  const handlePeriodChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const handleAddCost = (inscriptionId: string) => {
    setSelectedInscription(inscriptionId);
    setAddCostOpen(true);
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const getMargeColor = (percent: number) => {
    if (percent >= 50) return 'text-[hsl(var(--status-good))]';
    if (percent >= 30) return 'text-foreground';
    return 'text-[hsl(var(--status-critical))]';
  };

  const margeBadge = (percent: number): { tone: PillTone; label: string } => {
    if (percent >= 50) return { tone: "success", label: "Excellent" };
    if (percent >= 30) return { tone: "neutral", label: "Correct" };
    return { tone: "danger", label: "Faible" };
  };

  const getMargeBadge = (percent: number) => {
    const badge = margeBadge(percent);
    return (
      <StatusPill tone={badge.tone} size="sm">
        {badge.label}
      </StatusPill>
    );
  };

  const costBreakdown = (formation: NonNullable<typeof formations>[number]) => [
    { label: "Formateur", value: formatPrice(formation.cout_formateur) },
    { label: "Hébergement", value: formatPrice(formation.cout_hebergement) },
    { label: "Déplacement", value: formatPrice(formation.cout_deplacement) },
    { label: "Salle", value: formatPrice(formation.cout_salle) },
    { label: "Autres", value: formatPrice(formation.cout_autres) },
  ];

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Pilotage financier"
          description="Analyse de la marge par formation"
          icon={Percent}
          tone="purple"
          actions={
            <>
              <PeriodSelector startDate={startDate} endDate={endDate} onPeriodChange={handlePeriodChange} />
              {editable && (
                <Button onClick={() => { setSelectedInscription(undefined); setAddCostOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un coût
                </Button>
              )}
            </>
          }
          tabs={<PilotageSubnav />}
        />

        <SegmentedControl<RentabiliteView>
          value={view}
          onChange={setView}
          ariaLabel="Vue rentabilité"
          options={[
            { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { value: "tableaux", label: "Tableaux", icon: Table2 },
          ]}
        />

        {view === "dashboard" ? (
          <RentabiliteDashboard formations={formations} />
        ) : (
          <SurfaceCard
            title="Détail par formation"
            description="Marge par dossier sur la période sélectionnée"
            icon={Table2}
            flush
          >
            {isLoading ? (
              <TableSkeleton rows={6} cols={6} />
            ) : !formations || formations.length === 0 ? (
              <TableEmpty
                title="Aucune formation avec données financières pour cette période"
                description="Ajustez la période ou ajoutez des coûts sur les dossiers concernés."
                icon={Table2}
              />
            ) : (
              <>
                <TableFrame className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <TableHeadRow>
                        <TableHeadCell className="w-10">
                          <span className="sr-only">Détail</span>
                        </TableHeadCell>
                        <TableHeadCell>Formation</TableHeadCell>
                        <TableHeadCell>Date</TableHeadCell>
                        <TableHeadCell align="right">CA HT</TableHeadCell>
                        <TableHeadCell align="right">Coûts</TableHeadCell>
                        <TableHeadCell align="right">Marge</TableHeadCell>
                        <TableHeadCell align="right">%</TableHeadCell>
                        <TableHeadCell align="right">
                          <span className="sr-only">Actions</span>
                        </TableHeadCell>
                      </TableHeadRow>
                    </thead>
                    <tbody>
                      {formations.map((formation) => {
                        const expanded = expandedRows.has(formation.id!);
                        return (
                          <Fragment key={formation.id}>
                            <TableRow onClick={() => toggleRow(formation.id!)}>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  aria-expanded={expanded}
                                  aria-label={expanded ? "Masquer le détail des coûts" : "Afficher le détail des coûts"}
                                  onClick={(e) => { e.stopPropagation(); toggleRow(formation.id!); }}
                                >
                                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{formation.code || 'Sans code'}</p>
                                  <p className="truncate text-sm text-muted-foreground">{formation.student_name}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm tabular" hideBelow="lg">
                                {formation.start_date && format(new Date(formation.start_date), 'dd/MM/yyyy')}
                              </TableCell>
                              <TableCell align="right" className="font-medium tabular">
                                {formatPrice(formation.ca_ht)}
                              </TableCell>
                              <TableCell align="right" className="tabular" hideBelow="lg">
                                {formatPrice(formation.couts_totaux)}
                              </TableCell>
                              <TableCell
                                align="right"
                                className={cn("font-medium tabular", getMargeColor(formation.marge_pourcent))}
                              >
                                {formatPrice(formation.marge_brute)}
                              </TableCell>
                              <TableCell align="right">{getMargeBadge(formation.marge_pourcent)}</TableCell>
                              <TableCell align="right">
                                {editable && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Ajouter un coût à cette formation"
                                    onClick={(e) => { e.stopPropagation(); handleAddCost(formation.id!); }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                            {expanded && (
                              <tr className="border-b border-border/70 bg-[hsl(var(--surface-sunken))]">
                                <td />
                                <td colSpan={7} className="px-4 py-3">
                                  <DefinitionList items={costBreakdown(formation)} columns={3} />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </TableFrame>

                <CardList className="md:hidden">
                  {formations.map((formation) => (
                    <CardListItem
                      key={formation.id}
                      title={formation.code || 'Sans code'}
                      subtitle={formation.student_name}
                      meta={getMargeBadge(formation.marge_pourcent)}
                      fields={[
                        {
                          label: "Date",
                          value: formation.start_date
                            ? format(new Date(formation.start_date), 'dd/MM/yyyy')
                            : "—",
                        },
                        { label: "CA HT", value: formatPrice(formation.ca_ht) },
                        { label: "Coûts", value: formatPrice(formation.couts_totaux) },
                        {
                          label: "Marge",
                          value: (
                            <span className={getMargeColor(formation.marge_pourcent)}>
                              {formatPrice(formation.marge_brute)}
                            </span>
                          ),
                        },
                        ...costBreakdown(formation),
                      ]}
                      actions={
                        editable ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddCost(formation.id!)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter un coût
                          </Button>
                        ) : undefined
                      }
                    />
                  ))}
                </CardList>
              </>
            )}
          </SurfaceCard>
        )}
      </PageShell>

      <AddCostDialog open={addCostOpen} onOpenChange={setAddCostOpen} inscriptionId={selectedInscription} />
    </MainLayout>
  );
}
