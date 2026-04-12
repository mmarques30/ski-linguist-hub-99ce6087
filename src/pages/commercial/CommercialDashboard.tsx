import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, TrendingUp, Euro, Clock, Target } from "lucide-react";
import { useLeads, useLeadKPIs, useUpdateLead, LEAD_STATUSES, LEAD_SOURCES, Lead } from "@/hooks/useLeads";
import { LeadCard } from "@/components/commercial/LeadCard";
import { LeadFormDialog } from "@/components/commercial/LeadFormDialog";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const KANBAN_COLUMNS = LEAD_STATUSES.filter((s) => s.key !== "perdu");
const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function CommercialDashboard() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);

  const { data: leads = [], isLoading } = useLeads({ search });
  const { data: kpis } = useLeadKPIs();
  const updateLead = useUpdateLead();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("commercial");

  // Drag & drop
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (!leadId) return;
    try {
      await updateLead.mutateAsync({ id: leadId, status: newStatus } as any);
      toast.success("Statut mis à jour");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const openEdit = (lead: Lead) => {
    setEditLead(lead);
    setFormOpen(true);
  };

  // Source chart data
  const sourceChartData = kpis
    ? Object.entries(kpis.sourceCount).map(([key, count]) => ({
        name: LEAD_SOURCES.find((s) => s.key === key)?.label || key,
        value: count as number,
      }))
    : [];

  // Pipeline chart
  const pipelineChartData = kpis
    ? LEAD_STATUSES.map((s) => ({
        name: s.label,
        revenue: kpis.pipelineByStatus[s.key] || 0,
      }))
    : [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pipeline Commercial</h1>
            <p className="text-sm text-muted-foreground">Suivi de la prospection et des conversions</p>
          </div>
          {editable && (
            <Button onClick={() => { setEditLead(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Nouveau lead
            </Button>
          )}
        </div>

        {/* KPIs */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Target className="h-3.5 w-3.5" /> Taux de conversion
                </div>
                <p className="text-2xl font-bold">{kpis.conversionRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">{kpis.convertedCount} convertis / {kpis.lostCount} perdus</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Euro className="h-3.5 w-3.5" /> Pipeline actif
                </div>
                <p className="text-2xl font-bold">{kpis.totalPipelineRevenue.toLocaleString("fr-FR")} €</p>
                <p className="text-xs text-muted-foreground">{kpis.total - kpis.convertedCount - kpis.lostCount} leads en cours</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Clock className="h-3.5 w-3.5" /> Délai moyen
                </div>
                <p className="text-2xl font-bold">{kpis.avgConversionDays.toFixed(0)}j</p>
                <p className="text-xs text-muted-foreground">de la création à la conversion</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Total leads
                </div>
                <p className="text-2xl font-bold">{kpis.total}</p>
                <p className="text-xs text-muted-foreground">toutes sources confondues</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="kanban">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <TabsList>
              <TabsTrigger value="kanban">Pipeline</TabsTrigger>
              <TabsTrigger value="analytics">Analyses</TabsTrigger>
            </TabsList>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un lead..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* KANBAN */}
          <TabsContent value="kanban" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {KANBAN_COLUMNS.map((col) => {
                const colLeads = leads.filter((l) => l.status === col.key);
                const colRevenue = colLeads.reduce((s, l) => s + Number(l.estimated_revenue || 0), 0);

                return (
                  <div
                    key={col.key}
                    className="rounded-xl border bg-muted/30 p-3 min-h-[300px]"
                    onDrop={(e) => handleDrop(e, col.key)}
                    onDragOver={handleDragOver}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                        <span className="font-medium text-sm">{col.label}</span>
                        <Badge variant="secondary" className="text-xs">{colLeads.length}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{colRevenue.toLocaleString("fr-FR")} €</span>
                    </div>
                    <div className="space-y-2">
                      {colLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onClick={() => openEdit(lead)}
                          draggable={editable}
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                        />
                      ))}
                      {colLeads.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">Aucun lead</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lost leads section */}
            {leads.filter((l) => l.status === "perdu").length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Leads perdus ({leads.filter((l) => l.status === "perdu").length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  {leads.filter((l) => l.status === "perdu").slice(0, 8).map((lead) => (
                    <LeadCard key={lead.id} lead={lead} onClick={() => openEdit(lead)} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ANALYTICS */}
          <TabsContent value="analytics" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">CA par statut</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={pipelineChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => `${v.toLocaleString("fr-FR")} €`} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sources d'acquisition</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={sourceChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {sourceChartData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <LeadFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditLead(null); }}
        lead={editLead}
      />
    </MainLayout>
  );
}
