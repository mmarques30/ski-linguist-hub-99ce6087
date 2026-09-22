import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Tags } from "lucide-react";
import { usePricingRules, useCreatePricingRule, useDeletePricingRule, type PricingRule } from "@/hooks/useSeasons";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CardList,
  CardListItem,
  StatusPill,
  TableCell,
  TableEmpty,
  TableFrame,
  TableHeadCell,
  TableHeadRow,
  TableRow,
  TableSkeleton,
} from "@/components/ui-kit";

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

  const price = (value: PricingRule["base_price"]) => `${Number(value).toFixed(0)} €`;

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterLang} onValueChange={setFilterLang}>
          <SelectTrigger className="w-full sm:w-[200px]" aria-label={t(translations.language)}>
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
      <div className="fli-sunken flex flex-wrap items-end gap-2 rounded-[var(--radius)] border border-border p-3">
        <Select value={newRule.language} onValueChange={(v) => setNewRule((p) => ({ ...p, language: v }))}>
          <SelectTrigger className="w-[160px]" aria-label={t(translations.language)}><SelectValue /></SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={newRule.level} onValueChange={(v) => setNewRule((p) => ({ ...p, level: v }))}>
          <SelectTrigger className="w-[80px]" aria-label={t(translations.level)}><SelectValue /></SelectTrigger>
          <SelectContent>
            {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          type="number" className="w-[80px] tabular" placeholder="Heures"
          aria-label={t(translations.duration)}
          value={newRule.duration_hours}
          onChange={(e) => setNewRule((p) => ({ ...p, duration_hours: Number(e.target.value) }))}
        />
        <Select value={newRule.modality} onValueChange={(v) => setNewRule((p) => ({ ...p, modality: v }))}>
          <SelectTrigger className="w-[130px]" aria-label={t(translations.modality)}><SelectValue /></SelectTrigger>
          <SelectContent>
            {MODALITIES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          type="number" className="w-[100px] tabular" placeholder="Prix €"
          aria-label={t(translations.basePrice)}
          value={newRule.base_price || ""}
          onChange={(e) => setNewRule((p) => ({ ...p, base_price: Number(e.target.value) }))}
        />
        <Input
          type="number" className="w-[80px] tabular" placeholder="% grp"
          aria-label={t(translations.groupDiscount)}
          value={newRule.group_discount_percent || ""}
          onChange={(e) => setNewRule((p) => ({ ...p, group_discount_percent: Number(e.target.value) }))}
        />
        <Input
          type="number" className="w-[100px] tabular" placeholder="ESF €"
          aria-label={t(translations.esfPrice)}
          value={newRule.esf_partner_price || ""}
          onChange={(e) => setNewRule((p) => ({ ...p, esf_partner_price: Number(e.target.value) }))}
        />
        <Button size="sm" onClick={handleAdd} disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
          {t(translations.addRule)}
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-border">
        {isLoading ? (
          <TableSkeleton rows={4} cols={6} />
        ) : !filtered || filtered.length === 0 ? (
          <TableEmpty title={t(translations.noRules)} icon={Tags} />
        ) : (
          <>
            <TableFrame>
              <table className="hidden w-full md:table">
                <thead>
                  <TableHeadRow>
                    <TableHeadCell>{t(translations.language)}</TableHeadCell>
                    <TableHeadCell>{t(translations.level)}</TableHeadCell>
                    <TableHeadCell>{t(translations.duration)}</TableHeadCell>
                    <TableHeadCell className="hidden lg:table-cell">{t(translations.modality)}</TableHeadCell>
                    <TableHeadCell align="right">{t(translations.basePrice)}</TableHeadCell>
                    <TableHeadCell align="right" className="hidden lg:table-cell">{t(translations.groupDiscount)}</TableHeadCell>
                    <TableHeadCell align="right" className="hidden lg:table-cell">{t(translations.esfPrice)}</TableHeadCell>
                    <TableHeadCell className="hidden xl:table-cell">{t(translations.opco)}</TableHeadCell>
                    <TableHeadCell align="right"><span className="sr-only">Actions</span></TableHeadCell>
                  </TableHeadRow>
                </thead>
                <tbody>
                  {filtered.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>{rule.language}</TableCell>
                      <TableCell>
                        <StatusPill tone="neutral" size="sm">{rule.level}</StatusPill>
                      </TableCell>
                      <TableCell className="tabular">{rule.duration_hours}h</TableCell>
                      <TableCell hideBelow="lg">{rule.modality}</TableCell>
                      <TableCell align="right" className="font-medium tabular">{price(rule.base_price)}</TableCell>
                      <TableCell align="right" hideBelow="lg" className="tabular">
                        {Number(rule.group_discount_percent || 0)}%
                      </TableCell>
                      <TableCell align="right" hideBelow="lg" className="tabular">
                        {rule.esf_partner_price ? price(rule.esf_partner_price) : "—"}
                      </TableCell>
                      <TableCell hideBelow="xl">
                        {rule.opco_eligible ? <StatusPill tone="info" size="sm">Oui</StatusPill> : "—"}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Supprimer la règle ${rule.language} ${rule.level}`}
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            </TableFrame>

            {/* Doublure mobile du tableau — mêmes données, une carte par règle. */}
            <CardList className="md:hidden">
              {filtered.map((rule) => (
                <CardListItem
                  key={rule.id}
                  title={`${rule.language} · ${rule.level}`}
                  subtitle={rule.modality}
                  meta={<StatusPill tone="neutral" size="sm">{rule.duration_hours}h</StatusPill>}
                  fields={[
                    { label: t(translations.basePrice), value: price(rule.base_price) },
                    { label: t(translations.groupDiscount), value: `${Number(rule.group_discount_percent || 0)}%` },
                    {
                      label: t(translations.esfPrice),
                      value: rule.esf_partner_price ? price(rule.esf_partner_price) : "—",
                    },
                    { label: t(translations.opco), value: rule.opco_eligible ? "Oui" : "—" },
                  ]}
                  actions={
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Supprimer
                    </Button>
                  }
                />
              ))}
            </CardList>
          </>
        )}
      </div>
    </div>
  );
}
