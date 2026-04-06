import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { usePricingRules, useCreatePricingRule, useDeletePricingRule, type PricingRule } from "@/hooks/useSeasons";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Checkbox } from "@/components/ui/checkbox";

const translations = {
  language: { fr: "Langue", "pt-BR": "Idioma", en: "Language" },
  level: { fr: "Niveau", "pt-BR": "Nível", en: "Level" },
  duration: { fr: "Durée (h)", "pt-BR": "Duração (h)", en: "Duration (h)" },
  modality: { fr: "Modalité", "pt-BR": "Modalidade", en: "Modality" },
  basePrice: { fr: "Prix base (€)", "pt-BR": "Preço base (€)", en: "Base Price (€)" },
  groupDiscount: { fr: "Remise grp %", "pt-BR": "Desc. grupo %", en: "Group Disc. %" },
  esfPrice: { fr: "Prix ESF (€)", "pt-BR": "Preço ESF (€)", en: "ESF Price (€)" },
  opco: { fr: "OPCO", "pt-BR": "OPCO", en: "OPCO" },
  addRule: { fr: "Ajouter une règle", "pt-BR": "Adicionar regra", en: "Add Rule" },
  noRules: { fr: "Aucune règle tarifaire", "pt-BR": "Nenhuma regra de preços", en: "No pricing rules" },
  added: { fr: "Règle ajoutée", "pt-BR": "Regra adicionada", en: "Rule added" },
  deleted: { fr: "Règle supprimée", "pt-BR": "Regra excluída", en: "Rule deleted" },
};

const LANGUAGES = ["Anglais", "Portugais brésilien", "Italien", "Allemand", "Espagnol"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const MODALITIES = ["Présentiel", "Distanciel", "Hybride"];

interface Props {
  seasonId: string;
}

export function PricingRulesTable({ seasonId }: Props) {
  const { t } = useLanguage();
  const { data: rules, isLoading } = usePricingRules(seasonId);
  const createMutation = useCreatePricingRule();
  const deleteMutation = useDeletePricingRule();

  // New rule form state
  const [newRule, setNewRule] = useState({
    language: "Anglais",
    level: "A1",
    duration_hours: 20,
    modality: "Présentiel",
    base_price: 0,
    group_discount_percent: 0,
    esf_partner_price: 0,
    opco_eligible: false,
  });

  const [filterLang, setFilterLang] = useState("all");

  const handleAdd = async () => {
    try {
      await createMutation.mutateAsync({
        season_id: seasonId,
        ...newRule,
        esf_partner_price: newRule.esf_partner_price || null,
      });
      toast.success(t(translations.added));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t(translations.deleted));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filtered = filterLang === "all" ? rules : rules?.filter((r) => r.language === filterLang);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filterLang} onValueChange={setFilterLang}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les langues</SelectItem>
            {LANGUAGES.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Add new rule row */}
      <div className="flex flex-wrap items-end gap-2 p-3 border rounded-lg bg-muted/30">
        <Select value={newRule.language} onValueChange={(v) => setNewRule((p) => ({ ...p, language: v }))}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={newRule.level} onValueChange={(v) => setNewRule((p) => ({ ...p, level: v }))}>
          <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          type="number" className="w-[80px]" placeholder="Heures"
          value={newRule.duration_hours}
          onChange={(e) => setNewRule((p) => ({ ...p, duration_hours: Number(e.target.value) }))}
        />
        <Select value={newRule.modality} onValueChange={(v) => setNewRule((p) => ({ ...p, modality: v }))}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MODALITIES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          type="number" className="w-[100px]" placeholder="Prix €"
          value={newRule.base_price || ""}
          onChange={(e) => setNewRule((p) => ({ ...p, base_price: Number(e.target.value) }))}
        />
        <Input
          type="number" className="w-[80px]" placeholder="% grp"
          value={newRule.group_discount_percent || ""}
          onChange={(e) => setNewRule((p) => ({ ...p, group_discount_percent: Number(e.target.value) }))}
        />
        <Input
          type="number" className="w-[100px]" placeholder="ESF €"
          value={newRule.esf_partner_price || ""}
          onChange={(e) => setNewRule((p) => ({ ...p, esf_partner_price: Number(e.target.value) }))}
        />
        <Button size="sm" onClick={handleAdd} disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
          {t(translations.addRule)}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(translations.language)}</TableHead>
              <TableHead>{t(translations.level)}</TableHead>
              <TableHead>{t(translations.duration)}</TableHead>
              <TableHead>{t(translations.modality)}</TableHead>
              <TableHead className="text-right">{t(translations.basePrice)}</TableHead>
              <TableHead className="text-right">{t(translations.groupDiscount)}</TableHead>
              <TableHead className="text-right">{t(translations.esfPrice)}</TableHead>
              <TableHead>{t(translations.opco)}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered?.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.language}</TableCell>
                <TableCell><Badge variant="outline">{rule.level}</Badge></TableCell>
                <TableCell>{rule.duration_hours}h</TableCell>
                <TableCell>{rule.modality}</TableCell>
                <TableCell className="text-right font-medium">{Number(rule.base_price).toFixed(0)} €</TableCell>
                <TableCell className="text-right">{Number(rule.group_discount_percent || 0)}%</TableCell>
                <TableCell className="text-right">{rule.esf_partner_price ? `${Number(rule.esf_partner_price).toFixed(0)} €` : "—"}</TableCell>
                <TableCell>{rule.opco_eligible ? <Badge variant="secondary">Oui</Badge> : "—"}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(rule.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!filtered || filtered.length === 0) && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  {t(translations.noRules)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
