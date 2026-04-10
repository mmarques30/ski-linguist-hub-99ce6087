import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

const CRITERIA_LABELS: Record<number, string> = {
  1: "Conditions d'information du public",
  2: "Identification des objectifs et adaptation",
  3: "Adaptation aux publics bénéficiaires",
  4: "Adéquation des moyens pédagogiques",
  5: "Qualification des personnels",
  6: "Inscription dans l'environnement professionnel",
  7: "Recueil et prise en compte des appréciations",
};

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  conforme: { label: "Conforme", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-800" },
  non_conforme: { label: "Non conforme", icon: AlertTriangle, className: "bg-red-100 text-red-800" },
  en_cours: { label: "En cours", icon: Clock, className: "bg-amber-100 text-amber-800" },
};

export default function QualiopiAudit() {
  const { isAdmin } = useUserPermissions();
  const { data: indicators = [] } = useQualiopiIndicators();
  const { data: auto } = useAutoIndicators();
  const upsert = useUpsertIndicator();
  const [showForm, setShowForm] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<QualiopiIndicator | null>(null);

  // Group indicators by criterion
  const grouped = indicators.reduce<Record<number, QualiopiIndicator[]>>((acc, ind) => {
    (acc[ind.criterion_number] ||= []).push(ind);
    return acc;
  }, {});

  // Auto-calculated KPIs
  const autoKPIs = [
    {
      label: "Taux de satisfaction",
      value: auto?.satisfactionRate ?? 0,
      target: 80,
      unit: "%",
      icon: BarChart3,
    },
    {
      label: "Taux de réussite certifications",
      value: auto?.certRate ?? 0,
      target: 70,
      unit: "%",
      icon: Award,
    },
    {
      label: "Taux de complétion évaluations",
      value: auto?.evalCompletionRate ?? 0,
      target: 90,
      unit: "%",
      icon: Users,
    },
    {
      label: "Actions d'amélioration continue",
      value: auto?.improvementCount ?? 0,
      target: null,
      unit: "",
      icon: TrendingUp,
    },
  ];

  const handlePrint = () => window.print();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" /> Audit Qualiopi
            </h1>
            <p className="text-muted-foreground">
              Suivi des 7 critères et indicateurs de conformité
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <FileDown className="mr-2 h-4 w-4" /> Générer rapport
            </Button>
            {isAdmin && (
              <Button onClick={() => { setEditingIndicator(null); setShowForm(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Ajouter indicateur
              </Button>
            )}
          </div>
        </div>

        {/* Auto KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          {autoKPIs.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  {kpi.value}{kpi.unit}
                </p>
                {kpi.target !== null && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Cible : {kpi.target}{kpi.unit}</span>
                      <span className={kpi.value >= kpi.target ? "text-emerald-600" : "text-amber-600"}>
                        {kpi.value >= kpi.target ? "✓ Atteint" : "En cours"}
                      </span>
                    </div>
                    <Progress value={Math.min((kpi.value / kpi.target) * 100, 100)} className="h-1.5" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Criteria */}
        {[1, 2, 3, 4, 5, 6, 7].map((criterion) => {
          const items = grouped[criterion] || [];
          const conformeCount = items.filter((i) => i.status === "conforme").length;
          return (
            <Card key={criterion}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Critère {criterion} — {CRITERIA_LABELS[criterion]}
                  </CardTitle>
                  {items.length > 0 && (
                    <Badge variant="outline">
                      {conformeCount}/{items.length} conforme{conformeCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun indicateur défini.</p>
                ) : (
                  <div className="space-y-3">
                    {items.map((ind) => {
                      const sc = statusConfig[ind.status] || statusConfig.en_cours;
                      const Icon = sc.icon;
                      return (
                        <div
                          key={ind.id}
                          className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            if (isAdmin) {
                              setEditingIndicator(ind);
                              setShowForm(true);
                            }
                          }}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {ind.indicator_number} — {ind.label}
                            </p>
                            {ind.evidence_description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Preuve : {ind.evidence_description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {ind.current_value != null && ind.target_value != null && (
                              <span className="text-sm font-medium">
                                {ind.current_value}/{ind.target_value}{ind.unit}
                              </span>
                            )}
                            <Badge className={sc.className}>
                              <Icon className="mr-1 h-3 w-3" />
                              {sc.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <IndicatorFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        indicator={editingIndicator}
        onSave={upsert.mutateAsync}
        isPending={upsert.isPending}
      />
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

  // Reset form when indicator changes
  const key = indicator?.id || "new";
  useState(() => {
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
  });

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
    <Dialog open={open} onOpenChange={onOpenChange} key={key}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {indicator ? "Modifier l'indicateur" : "Nouvel indicateur"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
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
            <div>
              <Label>N° indicateur</Label>
              <Input
                value={form.indicator_number}
                onChange={(e) => setForm((f) => ({ ...f, indicator_number: e.target.value }))}
                placeholder="ex: 1.1"
              />
            </div>
          </div>
          <div>
            <Label>Libellé *</Label>
            <Input
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Valeur actuelle</Label>
              <Input
                type="number"
                value={form.current_value}
                onChange={(e) => setForm((f) => ({ ...f, current_value: e.target.value }))}
              />
            </div>
            <div>
              <Label>Cible</Label>
              <Input
                type="number"
                value={form.target_value}
                onChange={(e) => setForm((f) => ({ ...f, target_value: e.target.value }))}
              />
            </div>
            <div>
              <Label>Unité</Label>
              <Input
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
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
            <div>
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
          <div>
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
