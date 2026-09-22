import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useCostTemplates,
  useFixedCosts,
  useUpdateCostTemplate,
  useGenerateMonthlyCharges,
  useUpdateFixedCost,
} from "@/hooks/useFinancialDashboard";
import { useToast } from "@/hooks/use-toast";
import {
  RefreshCw,
  AlertTriangle,
  CalendarClock,
  PieChart,
  Receipt,
  Repeat,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { format, startOfMonth, subMonths, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { TresorerieSubnav } from "@/components/finance/PilotageSubnav";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import {
  BarsChart,
  CardList,
  CardListItem,
  DonutChart,
  MeterRow,
  PageHeader,
  PageShell,
  SectionHeading,
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
} from "@/components/ui-kit";

const costTypeLabels: Record<string, string> = {
  loyer: 'Loyer',
  telecom: 'Télécom',
  assurance: 'Assurance',
  comptable: 'Comptable',
  banque: 'Frais bancaires',
  logiciels: 'Logiciels',
  maintenance: 'Maintenance',
  qualiopi: 'Qualiopi',
  emprunt: 'Emprunt',
  autre: 'Autre',
};

export default function FinanceChargesFixes() {
  const { toast } = useToast();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("finance.charges_fixes");
  const { confirm, dialog: confirmDialog } = useConfirmAction();
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editedAmount, setEditedAmount] = useState<string>('');

  const { data: templates } = useCostTemplates();
  const { data: fixedCosts } = useFixedCosts(selectedMonth);
  const { data: allFixedCosts } = useFixedCosts();
  const updateTemplate = useUpdateCostTemplate();
  const generateCharges = useGenerateMonthlyCharges();
  const updateFixedCost = useUpdateFixedCost();

  const unpaidStats = useMemo(() => {
    if (!allFixedCosts) return { total: 0, count: 0, byType: [], overdue: [] };

    const today = new Date();
    const currentMonthStart = startOfMonth(today);

    const unpaid = allFixedCosts.filter(c => !c.paye);
    const total = unpaid.reduce((sum, c) => sum + Number(c.montant), 0);

    const byTypeMap = new Map<string, number>();
    unpaid.forEach(c => {
      const current = byTypeMap.get(c.cost_type) || 0;
      byTypeMap.set(c.cost_type, current + Number(c.montant));
    });
    const byType = Array.from(byTypeMap.entries()).map(([name, value]) => ({
      name: costTypeLabels[name] || name,
      value,
    }));

    const overdue = unpaid.filter(c => {
      const costMonth = new Date(c.mois);
      return isBefore(costMonth, currentMonthStart);
    });

    return { total, count: unpaid.length, byType, overdue };
  }, [allFixedCosts]);

  const monthlyTrend = useMemo(() => {
    if (!allFixedCosts) return [];

    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStr = format(startOfMonth(date), 'yyyy-MM-dd');
      const monthCosts = allFixedCosts.filter(c => c.mois === monthStr);
      const total = monthCosts.reduce((sum, c) => sum + Number(c.montant), 0);
      const paid = monthCosts.filter(c => c.paye).reduce((sum, c) => sum + Number(c.montant), 0);

      last6Months.push({
        month: format(date, 'MMM', { locale: fr }),
        total,
        paid,
        unpaid: total - paid,
      });
    }
    return last6Months;
  }, [allFixedCosts]);

  const months = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    d.setDate(1);
    months.push({
      value: format(d, 'yyyy-MM-dd'),
      label: format(d, 'MMMM yyyy', { locale: fr }),
    });
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleToggleTemplate = async (id: string, currentActive: boolean) => {
    try {
      await updateTemplate.mutateAsync({ id, actif: !currentActive });
      toast({ title: "Modèle mis à jour" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleSaveTemplateAmount = async (id: string) => {
    try {
      await updateTemplate.mutateAsync({ id, montant_mensuel: Number(editedAmount) });
      setEditingTemplate(null);
      toast({ title: "Montant mis à jour" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleGenerateCharges = async () => {
    try {
      await generateCharges.mutateAsync(selectedMonth);
      toast({ title: "Charges générées", description: `Charges du mois générées avec succès` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const persistTogglePaid = async (id: string, currentPaid: boolean) => {
    try {
      await updateFixedCost.mutateAsync({
        id,
        paye: !currentPaid,
        date_paiement: !currentPaid ? format(new Date(), 'yyyy-MM-dd') : null,
      });
      toast({ title: currentPaid ? "Marqué comme non payé" : "Marqué comme payé" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleTogglePaid = (id: string, currentPaid: boolean) => {
    confirm({
      title: currentPaid ? "Marquer comme non payé ?" : "Marquer comme payé ?",
      description: currentPaid
        ? "Cette charge sera marquée comme non payée."
        : "Cette charge sera marquée comme payée à la date du jour.",
      actionLabel: "Confirmer",
      run: () => persistTogglePaid(id, currentPaid),
    });
  };

  const totalTemplates = templates?.filter(t => t.actif).reduce((sum, t) => sum + Number(t.montant_mensuel), 0) || 0;
  const totalCharges = fixedCosts?.reduce((sum, c) => sum + Number(c.montant), 0) || 0;
  const totalPaid = fixedCosts?.filter(c => c.paye).reduce((sum, c) => sum + Number(c.montant), 0) || 0;
  const paymentProgress = totalCharges > 0 ? (totalPaid / totalCharges) * 100 : 0;
  const overdueTotal = unpaidStats.overdue.reduce((s, c) => s + Number(c.montant), 0);

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Trésorerie & charges"
          description="Gestion des charges récurrentes mensuelles"
          icon={Receipt}
          tone="navy"
          actions={
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Mois :</span>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[190px]" aria-label="Mois affiché">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="capitalize">{m.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          tabs={<TresorerieSubnav activeTab="charges" />}
        />

        <SectionHeading title="Charges du mois" />

        {/* KPI Cards */}
        <StatTileGrid cols={4}>
          <StatTile
            label="Total impayé"
            value={formatPrice(unpaidStats.total)}
            hint={`${unpaidStats.count} charge(s)`}
            icon={Wallet}
            tone="rose"
          />
          <StatTile
            label="En retard"
            value={unpaidStats.overdue.length}
            hint={formatPrice(overdueTotal)}
            icon={AlertTriangle}
            tone={unpaidStats.overdue.length > 0 ? "rose" : "gold"}
          />
          <StatTile
            label="Ce mois"
            value={formatPrice(totalCharges)}
            icon={CalendarClock}
            tone="gold"
          >
            <MeterRow
              label="Payé"
              value={paymentProgress}
              max={100}
              display={`${Math.round(paymentProgress)}% payé`}
            />
          </StatTile>
          <StatTile
            label="Mensuel prévu"
            value={formatPrice(totalTemplates)}
            hint={`${templates?.filter(t => t.actif).length ?? 0} modèles actifs`}
            icon={Repeat}
            tone="navy"
          />
        </StatTileGrid>

        {/* Section 1: Répartition des impayés + charges en retard */}
        <div className="grid gap-4 md:grid-cols-2 lg:gap-5">
          <SurfaceCard
            title="Répartition des impayés"
            description="Toutes périodes confondues, par type de charge"
            icon={PieChart}
          >
            {unpaidStats.byType.length > 0 ? (
              <DonutChart
                data={unpaidStats.byType}
                height={220}
                legendPosition="bottom"
                centerLabel="Impayé"
                formatValue={formatPrice}
                ariaLabel="Répartition des charges impayées par type"
              />
            ) : (
              <div className="flex h-[250px] flex-col items-center justify-center text-muted-foreground">
                <p>Toutes les charges sont payées</p>
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard
            title="Charges en retard"
            description="Charges impayées dont le mois est déjà passé"
            icon={AlertTriangle}
            actions={
              unpaidStats.overdue.length > 0 ? (
                <StatusPill tone="danger">{unpaidStats.overdue.length}</StatusPill>
              ) : undefined
            }
          >
            {unpaidStats.overdue.length > 0 ? (
              <ul className="max-h-[250px] space-y-3 overflow-auto">
                {unpaidStats.overdue.map((cost) => (
                  <li
                    key={cost.id}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {costTypeLabels[cost.cost_type] || cost.cost_type}
                      </p>
                      <p className="text-sm capitalize text-muted-foreground">
                        {format(new Date(cost.mois), 'MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold tabular">{formatPrice(Number(cost.montant))}</p>
                      {editable && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1 h-7 text-xs"
                          onClick={() => handleTogglePaid(cost.id, false)}
                        >
                          Marquer payé
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex h-[250px] flex-col items-center justify-center text-muted-foreground">
                <p>Aucune charge en retard</p>
              </div>
            )}
          </SurfaceCard>
        </div>

        {/* Section 2: Charges du mois */}
        <SurfaceCard
          title={`Charges de ${format(new Date(selectedMonth), 'MMMM yyyy', { locale: fr })}`}
          description="Charges générées à partir des modèles récurrents"
          icon={Receipt}
          actions={
            editable ? (
              <Button onClick={handleGenerateCharges} disabled={generateCharges.isPending} size="sm">
                <RefreshCw className={`mr-2 h-4 w-4 ${generateCharges.isPending ? 'animate-spin' : ''}`} />
                Générer les charges
              </Button>
            ) : undefined
          }
          flush
        >
          {!fixedCosts || fixedCosts.length === 0 ? (
            <TableEmpty
              title="Aucune charge pour ce mois"
              description={'Cliquez sur "Générer les charges" pour créer les charges à partir des modèles.'}
              icon={Receipt}
            />
          ) : (
            <>
              <TableFrame className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <TableHeadRow>
                      <TableHeadCell>Type</TableHeadCell>
                      <TableHeadCell>Description</TableHeadCell>
                      <TableHeadCell align="right">Montant</TableHeadCell>
                      <TableHeadCell align="center">Statut</TableHeadCell>
                      <TableHeadCell align="right">
                        <span className="sr-only">Actions</span>
                      </TableHeadCell>
                    </TableHeadRow>
                  </thead>
                  <tbody>
                    {fixedCosts.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell className="font-medium">
                          {costTypeLabels[cost.cost_type] || cost.cost_type}
                        </TableCell>
                        <TableCell className="text-muted-foreground" hideBelow="lg">
                          {cost.description}
                        </TableCell>
                        <TableCell align="right" className="font-medium tabular">
                          {formatPrice(Number(cost.montant))}
                        </TableCell>
                        <TableCell align="center">
                          {cost.paye ? (
                            <StatusPill tone="success" size="sm">Payé</StatusPill>
                          ) : (
                            <StatusPill tone="warning" size="sm">À payer</StatusPill>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {editable && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTogglePaid(cost.id, cost.paye)}
                            >
                              {cost.paye ? 'Annuler' : 'Marquer payé'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </TableFrame>

              <CardList className="md:hidden">
                {fixedCosts.map((cost) => (
                  <CardListItem
                    key={cost.id}
                    title={costTypeLabels[cost.cost_type] || cost.cost_type}
                    subtitle={cost.description}
                    meta={
                      cost.paye ? (
                        <StatusPill tone="success" size="sm">Payé</StatusPill>
                      ) : (
                        <StatusPill tone="warning" size="sm">À payer</StatusPill>
                      )
                    }
                    fields={[{ label: "Montant", value: formatPrice(Number(cost.montant)) }]}
                    actions={
                      editable ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePaid(cost.id, cost.paye)}
                        >
                          {cost.paye ? 'Annuler' : 'Marquer payé'}
                        </Button>
                      ) : undefined
                    }
                  />
                ))}
              </CardList>
            </>
          )}
        </SurfaceCard>

        {/* Section 3: Evolution 6 derniers mois */}
        <SurfaceCard
          title="Évolution des 6 derniers mois"
          description="Part payée et part impayée des charges fixes, mois par mois"
          icon={TrendingDown}
        >
          <BarsChart
            data={monthlyTrend}
            xKey="month"
            height={260}
            stacked
            series={[
              { key: "paid", label: "Payé" },
              { key: "unpaid", label: "Impayé" },
            ]}
            formatValue={(value) => formatPrice(Number(value))}
            formatAxisValue={(value) => `${Math.round(value / 1000)}k`}
            ariaLabel="Charges fixes payées et impayées sur 6 mois"
            emptyMessage="Aucune charge sur les 6 derniers mois"
          />
        </SurfaceCard>

        {/* Section 4: Modèles récurrents */}
        <SurfaceCard
          title="Modèles récurrents"
          description={`${templates?.filter(t => t.actif).length ?? 0} / ${templates?.length ?? 0} actifs · ${formatPrice(totalTemplates)}/mois`}
          icon={Repeat}
          flush
        >
          {!templates || templates.length === 0 ? (
            <TableEmpty
              title="Aucun modèle récurrent"
              description="Les modèles alimentent la génération mensuelle des charges."
              icon={Repeat}
            />
          ) : (
            <>
              <TableFrame className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <TableHeadRow>
                      <TableHeadCell>Type</TableHeadCell>
                      <TableHeadCell>Description</TableHeadCell>
                      <TableHeadCell align="right">Montant mensuel</TableHeadCell>
                      <TableHeadCell align="center">Actif</TableHeadCell>
                    </TableHeadRow>
                  </thead>
                  <tbody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          {costTypeLabels[template.cost_type] || template.cost_type}
                        </TableCell>
                        <TableCell className="text-muted-foreground" hideBelow="lg">
                          {template.description}
                        </TableCell>
                        <TableCell align="right" className="tabular">
                          {editable && editingTemplate === template.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={editedAmount}
                                onChange={(e) => setEditedAmount(e.target.value)}
                                className="w-24 text-right"
                              />
                              <Button size="sm" onClick={() => handleSaveTemplateAmount(template.id)}>
                                OK
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingTemplate(null)}>
                                X
                              </Button>
                            </div>
                          ) : editable ? (
                            <Button
                              variant="ghost"
                              className="font-medium tabular"
                              onClick={() => {
                                setEditingTemplate(template.id);
                                setEditedAmount(template.montant_mensuel.toString());
                              }}
                            >
                              {formatPrice(Number(template.montant_mensuel))}
                            </Button>
                          ) : (
                            <span className="font-medium tabular">
                              {formatPrice(Number(template.montant_mensuel))}
                            </span>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={template.actif}
                            onCheckedChange={() => handleToggleTemplate(template.id, template.actif)}
                            disabled={!editable}
                            aria-label={`Modèle ${costTypeLabels[template.cost_type] || template.cost_type} actif`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </TableFrame>

              <CardList className="md:hidden">
                {templates.map((template) => (
                  <CardListItem
                    key={template.id}
                    title={costTypeLabels[template.cost_type] || template.cost_type}
                    subtitle={template.description}
                    meta={
                      <Switch
                        checked={template.actif}
                        onCheckedChange={() => handleToggleTemplate(template.id, template.actif)}
                        disabled={!editable}
                        aria-label={`Modèle ${costTypeLabels[template.cost_type] || template.cost_type} actif`}
                      />
                    }
                    fields={[
                      {
                        label: "Montant mensuel",
                        value: formatPrice(Number(template.montant_mensuel)),
                      },
                    ]}
                    actions={
                      editable ? (
                        editingTemplate === template.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={editedAmount}
                              onChange={(e) => setEditedAmount(e.target.value)}
                              className="w-24 text-right"
                            />
                            <Button size="sm" onClick={() => handleSaveTemplateAmount(template.id)}>
                              OK
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingTemplate(null)}>
                              X
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTemplate(template.id);
                              setEditedAmount(template.montant_mensuel.toString());
                            }}
                          >
                            Modifier le montant
                          </Button>
                        )
                      ) : undefined
                    }
                  />
                ))}
              </CardList>
            </>
          )}
        </SurfaceCard>
      </PageShell>
      {confirmDialog}
    </MainLayout>
  );
}
