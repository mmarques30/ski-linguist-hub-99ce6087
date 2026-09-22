import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  FileDown,
  TrendingUp,
  Users,
  Award,
  BarChart3,
} from "lucide-react";
import {
  useQualiopiIndicators,
  useAutoIndicators,
  useUpsertIndicator,
  type QualiopiIndicator,
} from "@/hooks/useQualiopiAudit";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  BarsChart,
  MeterRow,
  PageHeader,
  PageShell,
  RadialRings,
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
  STATE_COLORS,
} from "@/components/ui-kit";
import type { PillTone, TileTone } from "@/components/ui-kit";

const CRITERIA_LABELS: Record<number, string> = {
  1: "Conditions d'information du public",
  2: "Identification des objectifs et adaptation",
  3: "Adaptation aux publics bénéficiaires",
  4: "Adéquation des moyens pédagogiques",
  5: "Qualification des personnels",
  6: "Inscription dans l'environnement professionnel",
  7: "Recueil et prise en compte des appréciations",
};

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; tone: PillTone }> = {
  conforme: { label: "Conforme", icon: CheckCircle2, tone: "success" },
  non_conforme: { label: "Non conforme", icon: AlertTriangle, tone: "danger" },
  en_cours: { label: "En cours", icon: Clock, tone: "warning" },
};

export default function QualiopiAudit() {
  const { isAdmin } = useUserPermissions();
  const { data: indicators = [], isLoading: loadingIndicators } = useQualiopiIndicators();
  const { data: auto } = useAutoIndicators();
  const upsert = useUpsertIndicator();
  const [showForm, setShowForm] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<QualiopiIndicator | null>(null);

  // Group indicators by criterion
  const grouped = indicators.reduce<Record<number, QualiopiIndicator[]>>((acc, ind) => {
    (acc[ind.criterion_number] ||= []).push(ind);
    return acc;
  }, {});

  // Auto-calculated KPIs — cibles inchangées (80 / 70 / 100 / 90, sans cible pour le compteur).
  const autoKPIs: Array<{
    label: string;
    value: number;
    target: number | null;
    unit: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: TileTone;
    to?: string;
  }> = [
    {
      label: "Taux de satisfaction",
      value: auto?.satisfactionRate ?? 0,
      target: 80,
      unit: "%",
      icon: BarChart3,
      tone: "gold",
      to: "/satisfaction-stats",
    },
    {
      label: "Taux de réussite certifications",
      value: auto?.certRate ?? 0,
      target: 70,
      unit: "%",
      icon: Award,
      tone: "blue",
    },
    {
      label: "PROC-026 progression Entrée/Sortie",
      value: auto?.progressionRate ?? 0,
      target: 100,
      unit: "%",
      icon: TrendingUp,
      tone: "teal",
    },
    {
      label: "Taux de complétion évaluations",
      value: auto?.evalCompletionRate ?? 0,
      target: 90,
      unit: "%",
      icon: Users,
      tone: "purple",
    },
    {
      label: "Actions d'amélioration continue",
      value: auto?.improvementCount ?? 0,
      target: null,
      unit: "",
      icon: TrendingUp,
      tone: "orange",
      to: "/amelioration",
    },
  ];

  /**
   * Vue d'ensemble de la conformité — comptages bruts sur les indicateurs
   * chargés (`useQualiopiIndicators` lit la table entière, sans pagination :
   * les parts portent donc sur tous les indicateurs saisis).
   * Aucune cible n'est inventée ici : seules les cibles déjà saisies par
   * indicateur et celles des KPI automatiques ci-dessus existent.
   */
  const conformity = useMemo(() => {
    const total = indicators.length;
    const count = (status: string) => indicators.filter((ind) => ind.status === status).length;
    const conforme = count("conforme");
    const nonConforme = count("non_conforme");
    const enCours = total - conforme - nonConforme;
    const share = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

    const perCriterion = [1, 2, 3, 4, 5, 6, 7]
      .map((criterion) => {
        const items = grouped[criterion] || [];
        return {
          criterion,
          label: `Critère ${criterion}`,
          conforme: items.filter((i) => i.status === "conforme").length,
          non_conforme: items.filter((i) => i.status === "non_conforme").length,
          en_cours: items.filter(
            (i) => i.status !== "conforme" && i.status !== "non_conforme"
          ).length,
          total: items.length,
        };
      })
      .filter((row) => row.total > 0);

    return {
      total,
      conforme,
      nonConforme,
      enCours,
      rings: [
        { key: "conforme", label: `Conformes — ${conforme}/${total}`, value: share(conforme) },
        {
          key: "non_conforme",
          label: `Non conformes — ${nonConforme}/${total}`,
          value: share(nonConforme),
        },
        { key: "en_cours", label: `En cours — ${enCours}/${total}`, value: share(enCours) },
      ],
      perCriterion,
      criteriaWithout: 7 - perCriterion.length,
    };
  }, [indicators, grouped]);

  const focusCriterion = (criterion: number) => {
    document
      .getElementById(`critere-${criterion}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePrint = () => window.print();

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Audit Qualiopi"
          description="Suivi des 7 critères et indicateurs de conformité"
          icon={Shield}
          tone="navy"
          actions={
            <>
              <Button variant="outline" onClick={handlePrint}>
                <FileDown className="mr-2 h-4 w-4" /> Générer rapport
              </Button>
              {isAdmin && (
                <Button onClick={() => { setEditingIndicator(null); setShowForm(true); }}>
                  <Plus className="mr-2 h-4 w-4" /> Ajouter indicateur
                </Button>
              )}
            </>
          }
        />

        {/* KPI automatiques — valeur face à sa cible. */}
        <StatTileGrid cols={5}>
          {autoKPIs.map((kpi) => {
            const reached = kpi.target !== null && kpi.value >= kpi.target;
            return (
              <StatTile
                key={kpi.label}
                label={kpi.label}
                value={`${kpi.value}${kpi.unit}`}
                icon={kpi.icon}
                tone={kpi.tone}
                to={kpi.to}
              >
                {kpi.target !== null && (
                  <MeterRow
                    label={`Cible : ${kpi.target}${kpi.unit}`}
                    value={kpi.value}
                    max={kpi.target}
                    display={reached ? "✓ Atteint" : "En cours"}
                    color={reached ? STATE_COLORS.good : STATE_COLORS.warning}
                  />
                )}
              </StatTile>
            );
          })}
        </StatTileGrid>

        {/* Conformité — parts globales et détail par critère, sur les
            indicateurs saisis. Une barre ouvre le critère correspondant. */}
        <div className="grid gap-4 lg:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <SurfaceCard
            title="Conformité des indicateurs"
            description={`${conformity.total} indicateur${conformity.total > 1 ? "s" : ""} saisi${
              conformity.total > 1 ? "s" : ""
            } — parts sur l'ensemble`}
            icon={Shield}
          >
            {loadingIndicators ? (
              <div className="h-[180px] animate-shimmer rounded-[var(--radius)]" />
            ) : conformity.total === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun indicateur saisi : rien à mesurer pour l&apos;instant.
              </p>
            ) : (
              <RadialRings items={conformity.rings} size={170} />
            )}
          </SurfaceCard>

          <SurfaceCard
            title="Conformes / non conformes par critère"
            description={
              conformity.criteriaWithout > 0
                ? `${conformity.criteriaWithout} critère${
                    conformity.criteriaWithout > 1 ? "s" : ""
                  } sans indicateur défini — absent${
                    conformity.criteriaWithout > 1 ? "s" : ""
                  } du graphique`
                : "Les 7 critères portent au moins un indicateur"
            }
            icon={BarChart3}
          >
            {loadingIndicators ? (
              <div className="h-[240px] animate-shimmer rounded-[var(--radius)]" />
            ) : conformity.perCriterion.length < 1 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun indicateur saisi : le détail par critère apparaîtra ici.
              </p>
            ) : (
              <BarsChart
                data={conformity.perCriterion}
                xKey="label"
                stacked
                layout="horizontal"
                height={Math.max(180, conformity.perCriterion.length * 44)}
                series={[
                  { key: "conforme", label: "Conforme" },
                  { key: "non_conforme", label: "Non conforme" },
                  { key: "en_cours", label: "En cours" },
                ]}
                yDomain={[0, "auto"]}
                ariaLabel="Indicateurs conformes, non conformes et en cours, par critère"
                onBarClick={(entry) => focusCriterion(entry.criterion)}
                emptyMessage="Aucun indicateur saisi"
              />
            )}
          </SurfaceCard>
        </div>

        {/* Criteria */}
        {[1, 2, 3, 4, 5, 6, 7].map((criterion) => {
          const items = grouped[criterion] || [];
          const conformeCount = items.filter((i) => i.status === "conforme").length;
          return (
            // Ancre de défilement : une barre du graphique ci-dessus ouvre ce critère.
            <div key={criterion} id={`critere-${criterion}`} className="scroll-mt-24">
            <SurfaceCard
              title={`Critère ${criterion} — ${CRITERIA_LABELS[criterion]}`}
              actions={
                items.length > 0 && (
                  <StatusPill tone={conformeCount === items.length ? "success" : "warning"}>
                    {conformeCount}/{items.length} conforme{conformeCount > 1 ? "s" : ""}
                  </StatusPill>
                )
              }
            >
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun indicateur défini.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((ind) => {
                    const sc = statusConfig[ind.status] || statusConfig.en_cours;
                    const Icon = sc.icon;
                    const row = (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {ind.indicator_number} — {ind.label}
                          </p>
                          {ind.evidence_description && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Preuve : {ind.evidence_description}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-3">
                          {ind.current_value != null && ind.target_value != null && (
                            <span className="text-sm font-semibold tabular text-foreground">
                              {ind.current_value}/{ind.target_value}{ind.unit}
                            </span>
                          )}
                          <StatusPill tone={sc.tone} icon={Icon}>
                            {sc.label}
                          </StatusPill>
                        </div>
                      </div>
                    );

                    if (!isAdmin) {
                      return (
                        <div
                          key={ind.id}
                          className="rounded-[var(--radius)] border border-border p-3"
                        >
                          {row}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={ind.id}
                        type="button"
                        onClick={() => {
                          setEditingIndicator(ind);
                          setShowForm(true);
                        }}
                        className="block w-full rounded-[var(--radius)] border border-border p-3 text-left transition-colors hover:bg-[hsl(var(--surface-sunken))]"
                      >
                        {row}
                      </button>
                    );
                  })}
                </div>
              )}
            </SurfaceCard>
            </div>
          );
        })}

        <IndicatorFormDialog
          open={showForm}
          onOpenChange={setShowForm}
          indicator={editingIndicator}
          onSave={upsert.mutateAsync}
          isPending={upsert.isPending}
        />
      </PageShell>
    </MainLayout>
  );
}

function IndicatorFormDialog({
  open,
  onOpenChange,
  indicator,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  indicator: QualiopiIndicator | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (v: any) => Promise<void>;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    criterion_number: indicator?.criterion_number?.toString() || "1",
    indicator_number: indicator?.indicator_number || "",
    label: indicator?.label || "",
    current_value: indicator?.current_value?.toString() || "",
    target_value: indicator?.target_value?.toString() || "",
    unit: indicator?.unit || "%",
    evidence_type: indicator?.evidence_type || "manuel",
    evidence_description: indicator?.evidence_description || "",
    status: indicator?.status || "en_cours",
  });

  useEffect(() => {
    setForm({
      criterion_number: indicator?.criterion_number?.toString() || "1",
      indicator_number: indicator?.indicator_number || "",
      label: indicator?.label || "",
      current_value: indicator?.current_value?.toString() || "",
      target_value: indicator?.target_value?.toString() || "",
      unit: indicator?.unit || "%",
      evidence_type: indicator?.evidence_type || "manuel",
      evidence_description: indicator?.evidence_description || "",
      status: indicator?.status || "en_cours",
    });
  }, [indicator?.id]);

  const handleSubmit = async () => {
    await onSave({
      ...(indicator?.id ? { id: indicator.id } : {}),
      criterion_number: Number(form.criterion_number),
      indicator_number: form.indicator_number,
      label: form.label,
      current_value: form.current_value ? Number(form.current_value) : null,
      target_value: form.target_value ? Number(form.target_value) : null,
      unit: form.unit,
      evidence_type: form.evidence_type,
      evidence_description: form.evidence_description || null,
      status: form.status,
      measurement_date: new Date().toISOString().split("T")[0],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {indicator ? "Modifier l'indicateur" : "Nouvel indicateur"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Critère</Label>
              <Select
                value={form.criterion_number}
                onValueChange={(v) => setForm((f) => ({ ...f, criterion_number: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <SelectItem key={n} value={n.toString()}>Critère {n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>N° indicateur</Label>
              <Input
                value={form.indicator_number}
                onChange={(e) => setForm((f) => ({ ...f, indicator_number: e.target.value }))}
                placeholder="ex: 1.1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Libellé *</Label>
            <Input
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Valeur actuelle</Label>
              <Input
                type="number"
                value={form.current_value}
                onChange={(e) => setForm((f) => ({ ...f, current_value: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cible</Label>
              <Input
                type="number"
                value={form.target_value}
                onChange={(e) => setForm((f) => ({ ...f, target_value: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unité</Label>
              <Input
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type de preuve</Label>
              <Select
                value={form.evidence_type}
                onValueChange={(v) => setForm((f) => ({ ...f, evidence_type: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatique">Automatique</SelectItem>
                  <SelectItem value="manuel">Manuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="conforme">Conforme</SelectItem>
                  <SelectItem value="non_conforme">Non conforme</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description de la preuve</Label>
            <Textarea
              value={form.evidence_description}
              onChange={(e) => setForm((f) => ({ ...f, evidence_description: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={!form.label || isPending}>
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
