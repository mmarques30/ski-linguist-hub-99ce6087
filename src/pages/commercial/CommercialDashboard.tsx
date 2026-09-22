import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Plus, TrendingUp, Euro, Clock, Target, AlertTriangle, Link2, KanbanSquare, BarChart3,
} from "lucide-react";
import {
  useLeads, useLeadKPIs, useUpdateLead,
  LEAD_STATUSES, LEAD_SOURCES, EXPANSION_CHANNELS,
  Lead, ExpansionChannel,
} from "@/hooks/useLeads";
import { LeadCard } from "@/components/commercial/LeadCard";
import { LeadFormDialog } from "@/components/commercial/LeadFormDialog";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useSeasonFilter } from "@/contexts/SeasonContext";
import { toast } from "sonner";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import {
  BarsChart,
  DonutChart,
  FilterBar,
  PageHeader,
  PageShell,
  SectionHeading,
  SegmentedControl,
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
  type PillTone,
} from "@/components/ui-kit";

const KANBAN_COLUMNS = LEAD_STATUSES.filter((s) => s.key !== "perdu");

/** Teinte de chaque statut commercial — le libellé reste celui de `LEAD_STATUSES`. */
const LEAD_STATUS_TONES: Record<string, PillTone> = {
  nouveau: "info",
  contacte: "warning",
  en_negociation: "purple",
  converti: "success",
  perdu: "danger",
};

type PipelineView = "kanban" | "analytics";

const formatEuros = (value: number) => `${Number(value || 0).toLocaleString("fr-FR")} €`;

function ChannelKPIs({
  channel,
  onOpenPipeline,
  onOpenAnalytics,
}: {
  channel: ExpansionChannel;
  onOpenPipeline: () => void;
  onOpenAnalytics: () => void;
}) {
  const { data: kpis, isLoading } = useLeadKPIs(channel);
  const channelMeta = EXPANSION_CHANNELS.find((c) => c.key === channel)!;

  return (
    <StatTileGrid cols={5}>
      <StatTile
        label="Taux de conversion"
        value={`${(kpis?.conversionRate ?? 0).toFixed(0)}%`}
        hint={`${kpis?.convertedCount ?? 0} convertis / ${kpis?.lostCount ?? 0} perdus`}
        icon={Target}
        tone="teal"
        loading={isLoading}
        onClick={onOpenAnalytics}
      />
      <StatTile
        label="Pipeline actif"
        value={formatEuros(kpis?.totalPipelineRevenue ?? 0)}
        hint={`${(kpis?.total ?? 0) - (kpis?.convertedCount ?? 0) - (kpis?.lostCount ?? 0)} leads en cours`}
        icon={Euro}
        tone="gold"
        loading={isLoading}
        onClick={onOpenAnalytics}
      />
      <StatTile
        label="Délai moyen"
        value={`${(kpis?.avgConversionDays ?? 0).toFixed(0)}j`}
        hint="création → conversion"
        icon={Clock}
        tone="blue"
        loading={isLoading}
      />
      <StatTile
        label="Total leads"
        value={kpis?.total ?? 0}
        hint={`canal ${channelMeta.label}`}
        icon={TrendingUp}
        tone="purple"
        loading={isLoading}
        onClick={onOpenPipeline}
      />
      <StatTile
        label="Actions en retard"
        value={kpis?.overdueActions ?? 0}
        hint="à relancer"
        icon={AlertTriangle}
        tone={(kpis?.overdueActions ?? 0) > 0 ? "rose" : "neutral"}
        loading={isLoading}
      />
    </StatTileGrid>
  );
}

function ChannelPipeline({
  channel,
  search,
  editable,
  view,
  onEdit,
}: {
  channel: ExpansionChannel;
  search: string;
  editable: boolean;
  view: PipelineView;
  onEdit: (lead: Lead) => void;
}) {
  const { seasonId, seasonStart, seasonEnd } = useSeasonFilter();
  const { data: leads = [], isLoading } = useLeads({
    search,
    expansion_channel: channel,
    seasonId,
    seasonStart,
    seasonEnd,
  });
  const { data: kpis } = useLeadKPIs(channel);
  const updateLead = useUpdateLead();
  const { confirm, dialog: confirmDialog } = useConfirmAction();

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (!leadId) return;
    const statusLabel =
      LEAD_STATUSES.find((s) => s.key === newStatus)?.label || newStatus;
    confirm({
      title: `Passer le lead en « ${statusLabel} » ?`,
      description: "Le statut commercial du lead sera mis à jour.",
      run: async () => {
        try {
          await updateLead.mutateAsync({
            id: leadId,
            status: newStatus,
          } as Partial<Lead> & { id: string });
          toast.success("Statut mis à jour");
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : "Erreur");
        }
      },
    });
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleMarkLost = (lead: Lead) => {
    const reason = window.prompt("Motif de perte (obligatoire) :");
    if (!reason?.trim()) {
      if (reason !== null) toast.error("Motif de perte requis");
      return;
    }
    confirm({
      title: "Marquer ce lead comme perdu ?",
      description: `Motif : ${reason.trim()}`,
      destructive: true,
      actionLabel: "Marquer perdu",
      run: async () => {
        try {
          await updateLead.mutateAsync({
            id: lead.id,
            status: "perdu",
            loss_reason: reason.trim(),
          });
          toast.success("Lead marqué comme perdu");
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : "Erreur");
        }
      },
    });
  };

  const sourceChartData = kpis
    ? Object.entries(kpis.sourceCount).map(([key, count]) => ({
        name: LEAD_SOURCES.find((s) => s.key === key)?.label || key,
        value: count as number,
      }))
    : [];

  const pipelineChartData = kpis
    ? LEAD_STATUSES.map((s) => ({
        name: s.label,
        revenue: kpis.pipelineByStatus[s.key] || 0,
      }))
    : [];

  const lostLeads = leads.filter((l) => l.status === "perdu");

  /** Lien « Moniteur lié » — la fiche moniteur vit dans l'écran moniteurs. */
  const monitorLink = (lead: Lead) =>
    lead.ski_monitor_id ? (
      <Link
        to="/gestion/moniteurs"
        className="flex items-center gap-1 px-1 text-2xs font-medium text-[hsl(var(--tint-blue-fg))] hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        <Link2 className="h-3 w-3" />
        Moniteur lié
      </Link>
    ) : null;

  return (
    <>
      {view === "kanban" ? (
        <div className="space-y-6">
          {/* Kanban — défile horizontalement sur téléphone plutôt que de se comprimer. */}
          <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 scrollbar-thin md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-4">
            {KANBAN_COLUMNS.map((col) => {
              const colLeads = leads.filter((l) => l.status === col.key);
              const colRevenue = colLeads.reduce((s, l) => s + Number(l.estimated_revenue || 0), 0);

              return (
                <div
                  key={col.key}
                  className="w-[280px] shrink-0 snap-start md:w-auto"
                  onDrop={(e) => handleDrop(e, col.key)}
                  onDragOver={handleDragOver}
                >
                  <SurfaceCard
                    className="h-full min-h-[300px]"
                    title={
                      <span className="flex items-center gap-2">
                        <StatusPill tone={LEAD_STATUS_TONES[col.key] ?? "neutral"} size="sm" dot>
                          {col.label}
                        </StatusPill>
                        <span className="rounded-pill bg-muted px-1.5 text-2xs tabular text-muted-foreground">
                          {colLeads.length}
                        </span>
                      </span>
                    }
                    actions={
                      <span className="text-xs text-muted-foreground tabular">
                        {formatEuros(colRevenue)}
                      </span>
                    }
                    bodyClassName="space-y-2"
                  >
                    {isLoading ? (
                      <div className="space-y-2">
                        {[0, 1, 2].map((index) => (
                          <div key={index} className="h-24 animate-shimmer rounded-[var(--radius)]" />
                        ))}
                      </div>
                    ) : colLeads.length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground">Aucun lead</p>
                    ) : (
                      colLeads.map((lead) => (
                        <div key={lead.id} className="space-y-1">
                          <LeadCard
                            lead={lead}
                            onClick={() => onEdit(lead)}
                            draggable={editable}
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                          />
                          {monitorLink(lead)}
                          {editable && !["converti", "perdu"].includes(lead.status) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-full text-2xs text-muted-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkLost(lead);
                              }}
                            >
                              Marquer perdu
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </SurfaceCard>
                </div>
              );
            })}
          </div>

          {lostLeads.length > 0 && (
            <div className="space-y-3">
              <SectionHeading
                title={`Leads perdus (${lostLeads.length})`}
                description="Les 8 dernières fiches perdues de ce canal, avec leur motif."
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {lostLeads.slice(0, 8).map((lead) => (
                  <div key={lead.id} className="space-y-1">
                    <LeadCard lead={lead} onClick={() => onEdit(lead)} />
                    {lead.loss_reason && (
                      <p className="line-clamp-2 px-1 text-2xs text-muted-foreground">
                        Motif : {lead.loss_reason}
                      </p>
                    )}
                    {monitorLink(lead)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <SurfaceCard
            title="CA par statut"
            description="CA estimé cumulé des leads de ce canal, par statut commercial."
            icon={BarChart3}
          >
            <BarsChart
              data={pipelineChartData}
              series={[{ key: "revenue", label: "CA estimé" }]}
              xKey="name"
              height={250}
              ariaLabel="CA estimé par statut commercial"
              formatValue={(value) => formatEuros(Number(value))}
              formatAxisValue={(value) => Number(value).toLocaleString("fr-FR")}
              emptyMessage="Aucun lead sur ce canal"
            />
          </SurfaceCard>

          <SurfaceCard
            title="Sources d'acquisition"
            description="Répartition des leads par origine ; au-delà de 6 sources, le reste est replié sur « Autre »."
            icon={Target}
          >
            <DonutChart
              data={sourceChartData}
              height={220}
              centerLabel="leads"
              ariaLabel="Répartition des leads par source d'acquisition"
              emptyMessage="Aucun lead sur ce canal"
            />
          </SurfaceCard>
        </div>
      )}

      {confirmDialog}
    </>
  );
}

export default function CommercialDashboard() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [activeChannel, setActiveChannel] = useState<ExpansionChannel>("cpf");
  const [view, setView] = useState<PipelineView>("kanban");

  const { canEdit } = useUserPermissions();
  const editable = canEdit("commercial");

  const openEdit = (lead: Lead) => {
    setEditLead(lead);
    setFormOpen(true);
  };

  const channelMeta = EXPANSION_CHANNELS.find((c) => c.key === activeChannel)!;

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Pipeline Commercial"
          description="CPF · B2B Alpespace · DSF — prospection et conversions"
          icon={TrendingUp}
          tone="gold"
          meta={<StatusPill tone="info">{channelMeta.description}</StatusPill>}
          actions={
            editable ? (
              <Button onClick={() => { setEditLead(null); setFormOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Nouveau lead
              </Button>
            ) : undefined
          }
          tabs={
            <SegmentedControl<ExpansionChannel>
              value={activeChannel}
              onChange={setActiveChannel}
              ariaLabel="Canal d'expansion"
              options={EXPANSION_CHANNELS.map((ch) => ({ value: ch.key, label: ch.label }))}
            />
          }
        />

        <ChannelKPIs
          channel={activeChannel}
          onOpenPipeline={() => setView("kanban")}
          onOpenAnalytics={() => setView("analytics")}
        />

        <FilterBar
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "Rechercher un lead...",
            ariaLabel: "Rechercher un lead",
          }}
          actions={
            <SegmentedControl<PipelineView>
              value={view}
              onChange={setView}
              size="sm"
              ariaLabel="Vue du pipeline"
              options={[
                { value: "kanban", label: "Pipeline", icon: KanbanSquare },
                { value: "analytics", label: "Analyses", icon: BarChart3 },
              ]}
            />
          }
          activeFilters={
            search
              ? [{ key: "search", label: `Recherche : ${search}`, onRemove: () => setSearch("") }]
              : undefined
          }
        />

        <ChannelPipeline
          channel={activeChannel}
          search={search}
          editable={editable}
          view={view}
          onEdit={openEdit}
        />
      </PageShell>

      <LeadFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditLead(null); }}
        lead={editLead}
        defaultChannel={activeChannel}
      />
    </MainLayout>
  );
}
