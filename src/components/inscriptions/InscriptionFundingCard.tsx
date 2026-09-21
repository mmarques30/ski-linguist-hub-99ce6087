import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import {
  FUNDING_ORGANIZATION_OPTIONS,
  FUNDING_PROPOSAL_STATUSES,
  parseFundingDetails,
  PROPOSAL_PAYER_TYPES,
  PROPOSAL_PAYMENT_FORMULAS,
  proposalFormulaLabel,
  proposalPayerLabel,
  proposalStatusLabel,
  serializeFundingDetails,
  type FundingProposalStatus,
  type OpcoQuestionnaire,
  type ProposalPayerType,
  type ProposalPaymentFormula,
} from "@/lib/opco-funding";
import { PAYMENT_METHODS } from "@/lib/payment-methods";
import {
  useCreateFundingProposal,
  useDeleteFundingProposal,
  useFundingProposals,
  useUpdateFundingProposal,
  useUpdateInscriptionFunding,
  type FundingProposal,
} from "@/hooks/useFundingProposals";

interface InscriptionFundingCardProps {
  inscriptionId: string;
  fundingOrganization: string | null;
  fundingDetails: string | null;
  price?: number | null;
  depositAmount?: number | null;
  depositDate?: string | null;
  balanceAfterDeposit?: number | null;
  paymentMethod?: string | null;
}

type ProposalDraft = {
  funding_organization: string;
  payer_type: ProposalPayerType;
  payment_formula: ProposalPaymentFormula;
  amount_requested: string;
  amount_granted: string;
  payment_amount: string;
  status: FundingProposalStatus;
  notes: string;
  reference_number: string;
  convention_number: string;
  contact_name: string;
  contact_email: string;
};

const emptyDraft = (orgHint: string): ProposalDraft => ({
  funding_organization: orgHint || "OPCO",
  payer_type: "opco",
  payment_formula: "organisme",
  amount_requested: "",
  amount_granted: "",
  payment_amount: "",
  status: "brouillon",
  notes: "",
  reference_number: "",
  convention_number: "",
  contact_name: "",
  contact_email: "",
});

function draftFromProposal(p: FundingProposal): ProposalDraft {
  return {
    funding_organization: p.funding_organization || "",
    payer_type: (p.payer_type as ProposalPayerType) || "stagiaire",
    payment_formula: (p.payment_formula as ProposalPaymentFormula) || "custom",
    amount_requested: p.amount_requested != null ? String(p.amount_requested) : "",
    amount_granted: p.amount_granted != null ? String(p.amount_granted) : "",
    payment_amount: p.payment_amount != null ? String(p.payment_amount) : "",
    status: (p.status as FundingProposalStatus) || "brouillon",
    notes: p.notes || "",
    reference_number: p.reference_number || "",
    convention_number: p.convention_number || "",
    contact_name: p.contact_name || "",
    contact_email: p.contact_email || "",
  };
}

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function InscriptionFundingCard({
  inscriptionId,
  fundingOrganization,
  fundingDetails,
  price = null,
  depositAmount = null,
  depositDate = null,
  balanceAfterDeposit = null,
  paymentMethod = null,
}: InscriptionFundingCardProps) {
  const { data: proposals = [] } = useFundingProposals(inscriptionId);
  const updateFunding = useUpdateInscriptionFunding();
  const createProposal = useCreateFundingProposal();
  const updateProposal = useUpdateFundingProposal();
  const deleteProposal = useDeleteFundingProposal();
  const { confirm: requestConfirm, dialog: confirmDialog } = useConfirmAction();

  const parsed = useMemo(() => parseFundingDetails(fundingDetails), [fundingDetails]);
  const opco = parsed?.opco;

  const [orgSelect, setOrgSelect] = useState(() => {
    const known = FUNDING_ORGANIZATION_OPTIONS.some((o) => o.value === fundingOrganization);
    return known ? fundingOrganization! : fundingOrganization ? "__custom__" : "__none__";
  });
  const [orgCustom, setOrgCustom] = useState(() => {
    const known = FUNDING_ORGANIZATION_OPTIONS.some((o) => o.value === fundingOrganization);
    return known ? "" : fundingOrganization || "";
  });

  const [amounts, setAmounts] = useState({
    price: price != null ? String(price) : "",
    deposit_amount: depositAmount != null ? String(depositAmount) : "",
    deposit_date: depositDate ? depositDate.slice(0, 10) : "",
    balance_after_deposit: balanceAfterDeposit != null ? String(balanceAfterDeposit) : "",
    payment_method: paymentMethod || "__none__",
  });

  useEffect(() => {
    setAmounts({
      price: price != null ? String(price) : "",
      deposit_amount: depositAmount != null ? String(depositAmount) : "",
      deposit_date: depositDate ? depositDate.slice(0, 10) : "",
      balance_after_deposit: balanceAfterDeposit != null ? String(balanceAfterDeposit) : "",
      payment_method: paymentMethod || "__none__",
    });
  }, [price, depositAmount, depositDate, balanceAfterDeposit, paymentMethod]);

  useEffect(() => {
    const known = FUNDING_ORGANIZATION_OPTIONS.some((o) => o.value === fundingOrganization);
    setOrgSelect(known ? fundingOrganization! : fundingOrganization ? "__custom__" : "__none__");
    setOrgCustom(known ? "" : fundingOrganization || "");
  }, [fundingOrganization]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProposalDraft>(() => emptyDraft(fundingOrganization || "OPCO"));

  const resolvedOrg = (): string | null => {
    if (orgSelect === "__none__") return null;
    if (orgSelect === "__custom__") return orgCustom.trim() || null;
    return orgSelect;
  };

  const saveOrganization = () => {
    const next = resolvedOrg();
    requestConfirm({
      title: "Enregistrer le mode de financement ?",
      description: next
        ? `Le financement sera défini sur « ${next} ».`
        : "Le mode de financement sera effacé.",
      run: async () => {
        await updateFunding.mutateAsync({
          id: inscriptionId,
          funding_organization: next,
        });
      },
    });
  };

  const saveOpcoDetails = (next: OpcoQuestionnaire) => {
    requestConfirm({
      title: "Enregistrer les infos OPCO ?",
      description: "Les précisions collectées (OPCO, NAF, notes) seront mises à jour.",
      run: async () => {
        await updateFunding.mutateAsync({
          id: inscriptionId,
          funding_organization: resolvedOrg() || fundingOrganization || "OPCO",
          funding_details: serializeFundingDetails({
            version: 1,
            source: "admin",
            opco: next,
          }),
        });
      },
    });
  };

  const saveAmounts = () => {
    requestConfirm({
      title: "Enregistrer les montants ?",
      description: "Prix, acompte, solde et moyen de paiement seront mis à jour sur l’inscription.",
      run: async () => {
        await updateFunding.mutateAsync({
          id: inscriptionId,
          price: parseOptionalNumber(amounts.price),
          deposit_amount: parseOptionalNumber(amounts.deposit_amount),
          deposit_date: amounts.deposit_date || null,
          balance_after_deposit: parseOptionalNumber(amounts.balance_after_deposit),
          payment_method:
            amounts.payment_method === "__none__" ? null : amounts.payment_method,
        });
      },
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft(resolvedOrg() || fundingOrganization || "OPCO"));
    setDialogOpen(true);
  };

  const openEdit = (p: FundingProposal) => {
    setEditingId(p.id);
    setDraft(draftFromProposal(p));
    setDialogOpen(true);
  };

  const submitProposal = () => {
    const payload = {
      funding_organization: draft.funding_organization.trim(),
      payer_type: draft.payer_type,
      payment_formula: draft.payment_formula,
      amount_requested: parseOptionalNumber(draft.amount_requested),
      amount_granted: parseOptionalNumber(draft.amount_granted),
      payment_amount: parseOptionalNumber(draft.payment_amount),
      status: draft.status,
      notes: draft.notes || null,
      reference_number: draft.reference_number || null,
      convention_number: draft.convention_number || null,
      contact_name: draft.contact_name || null,
      contact_email: draft.contact_email || null,
    };

    if (editingId) {
      requestConfirm({
        title: "Mettre à jour cette proposition ?",
        description: "Tous les champs de la proposition (payeur, montants, statut, notes) seront enregistrés.",
        run: async () => {
          await updateProposal.mutateAsync({
            id: editingId,
            inscriptionId,
            ...payload,
          });
          setDialogOpen(false);
          setEditingId(null);
        },
      });
      return;
    }

    requestConfirm({
      title: "Créer cette proposition ?",
      description: "Une nouvelle proposition de règlement sera ajoutée à l’inscription.",
      run: async () => {
        await createProposal.mutateAsync({
          inscription_id: inscriptionId,
          ...payload,
        });
        setDialogOpen(false);
      },
    });
  };

  const changeStatus = (p: FundingProposal, status: FundingProposalStatus) => {
    if (status === p.status) return;
    requestConfirm({
      title: "Changer le statut de la proposition ?",
      description: `Statut : ${proposalStatusLabel(p.status)} → ${proposalStatusLabel(status)}.`,
      run: async () => {
        await updateProposal.mutateAsync({
          id: p.id,
          inscriptionId,
          status,
        });
      },
    });
  };

  const removeProposal = (p: FundingProposal) => {
    requestConfirm({
      title: "Supprimer cette proposition ?",
      description: "La proposition sera définitivement retirée. Cette action est irréversible.",
      actionLabel: "Supprimer",
      destructive: true,
      run: async () => {
        await deleteProposal.mutateAsync({ id: p.id, inscriptionId });
      },
    });
  };

  const orgDirty =
    (resolvedOrg() || "") !== (fundingOrganization || "") ||
    (orgSelect === "__custom__" && orgCustom.trim() !== (fundingOrganization || ""));

  const amountsDirty =
    (parseOptionalNumber(amounts.price) ?? null) !== (price ?? null) ||
    (parseOptionalNumber(amounts.deposit_amount) ?? null) !== (depositAmount ?? null) ||
    (amounts.deposit_date || null) !== (depositDate ? depositDate.slice(0, 10) : null) ||
    (parseOptionalNumber(amounts.balance_after_deposit) ?? null) !==
      (balanceAfterDeposit ?? null) ||
    (amounts.payment_method === "__none__" ? null : amounts.payment_method) !==
      (paymentMethod || null);

  const showOpco =
    orgSelect === "OPCO" ||
    (orgSelect === "__custom__" && /opco/i.test(orgCustom)) ||
    fundingOrganization === "OPCO" ||
    !!opco;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Financement &amp; propositions</CardTitle>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Proposition
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 rounded-lg border border-border p-3">
          <p className="text-sm font-medium">Montants inscription</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label>Prix total €</Label>
              <Input
                type="number"
                value={amounts.price}
                onChange={(e) => setAmounts((a) => ({ ...a, price: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Acompte €</Label>
              <Input
                type="number"
                value={amounts.deposit_amount}
                onChange={(e) =>
                  setAmounts((a) => ({ ...a, deposit_amount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Date acompte</Label>
              <Input
                type="date"
                value={amounts.deposit_date}
                onChange={(e) =>
                  setAmounts((a) => ({ ...a, deposit_date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Solde après acompte €</Label>
              <Input
                type="number"
                value={amounts.balance_after_deposit}
                onChange={(e) =>
                  setAmounts((a) => ({ ...a, balance_after_deposit: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Moyen de paiement</Label>
              <Select
                value={amounts.payment_method}
                onValueChange={(v) => setAmounts((a) => ({ ...a, payment_method: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Non renseigné</SelectItem>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            size="sm"
            disabled={updateFunding.isPending || !amountsDirty}
            onClick={saveAmounts}
          >
            Enregistrer les montants
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Mode de financement</Label>
          <div className="flex flex-wrap gap-2">
            <Select value={orgSelect} onValueChange={setOrgSelect}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Non renseigné</SelectItem>
                {FUNDING_ORGANIZATION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">Autre (saisie libre)</SelectItem>
              </SelectContent>
            </Select>
            {orgSelect === "__custom__" && (
              <Input
                className="w-[240px]"
                value={orgCustom}
                onChange={(e) => setOrgCustom(e.target.value)}
                placeholder="Nom organisme / libellé"
              />
            )}
            <Button
              size="sm"
              disabled={updateFunding.isPending || !orgDirty}
              onClick={saveOrganization}
            >
              Enregistrer
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Corrigez ici une erreur candidat (ex. OPCO coché à la place de FIFPL) ou saisissez
            un libellé libre.
          </p>
        </div>

        {showOpco && (
          <OpcoDetailsEditor
            initial={
              opco || {
                knowsOpco: null,
                opcoName: "",
                nafCode: "",
                caseNotes: "",
              }
            }
            saving={updateFunding.isPending}
            onSave={saveOpcoDetails}
          />
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Propositions de règlement</h3>
          {proposals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune proposition. Créez-en une selon l’OPCO et l’accord avec le stagiaire /
              client (payeur stagiaire, entreprise ou OPCO — toutes formules possibles).
            </p>
          ) : (
            <ul className="space-y-3">
              {proposals.map((p) => (
                <li
                  key={p.id}
                  className="rounded-lg border border-border p-3 text-sm space-y-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">{proposalStatusLabel(p.status)}</Badge>
                        <Badge variant="secondary">{proposalPayerLabel(p.payer_type)}</Badge>
                        <Badge variant="outline">
                          {proposalFormulaLabel(p.payment_formula)}
                        </Badge>
                      </div>
                      <p className="font-medium">{p.funding_organization}</p>
                      <p className="text-muted-foreground text-xs">
                        Demandé {p.amount_requested ?? "—"} € · Accordé{" "}
                        {p.amount_granted ?? "—"} € · À régler {p.payment_amount ?? "—"} €
                      </p>
                      {p.notes && (
                        <p className="text-muted-foreground whitespace-pre-wrap">{p.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Select
                        value={p.status}
                        onValueChange={(status) =>
                          changeStatus(p, status as FundingProposalStatus)
                        }
                      >
                        <SelectTrigger className="w-[150px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FUNDING_PROPOSAL_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Modifier"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Supprimer"
                        onClick={() => removeProposal(p)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Modifier la proposition" : "Nouvelle proposition de règlement"}
            </DialogTitle>
          </DialogHeader>
          <ProposalFormFields draft={draft} setDraft={setDraft} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={
                createProposal.isPending ||
                updateProposal.isPending ||
                !draft.funding_organization.trim()
              }
              onClick={submitProposal}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </Card>
  );
}

function ProposalFormFields({
  draft,
  setDraft,
}: {
  draft: ProposalDraft;
  setDraft: Dispatch<SetStateAction<ProposalDraft>>;
}) {
  return (
    <div className="space-y-3 py-2">
      <div className="space-y-1">
        <Label>Organisme / libellé</Label>
        <Input
          value={draft.funding_organization}
          onChange={(e) =>
            setDraft((d) => ({ ...d, funding_organization: e.target.value }))
          }
          placeholder="OPCO AKTO, Entreprise ESF…"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Payeur</Label>
          <Select
            value={draft.payer_type}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, payer_type: v as ProposalPayerType }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPOSAL_PAYER_TYPES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Formule</Label>
          <Select
            value={draft.payment_formula}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, payment_formula: v as ProposalPaymentFormula }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPOSAL_PAYMENT_FORMULAS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label>Demandé €</Label>
          <Input
            type="number"
            value={draft.amount_requested}
            onChange={(e) =>
              setDraft((d) => ({ ...d, amount_requested: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Accordé €</Label>
          <Input
            type="number"
            value={draft.amount_granted}
            onChange={(e) => setDraft((d) => ({ ...d, amount_granted: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label>À régler €</Label>
          <Input
            type="number"
            value={draft.payment_amount}
            onChange={(e) =>
              setDraft((d) => ({ ...d, payment_amount: e.target.value }))
            }
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Statut</Label>
        <Select
          value={draft.status}
          onValueChange={(v) =>
            setDraft((d) => ({ ...d, status: v as FundingProposalStatus }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FUNDING_PROPOSAL_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Référence</Label>
          <Input
            value={draft.reference_number}
            onChange={(e) =>
              setDraft((d) => ({ ...d, reference_number: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>N° convention</Label>
          <Input
            value={draft.convention_number}
            onChange={(e) =>
              setDraft((d) => ({ ...d, convention_number: e.target.value }))
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Contact</Label>
          <Input
            value={draft.contact_name}
            onChange={(e) => setDraft((d) => ({ ...d, contact_name: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Email contact</Label>
          <Input
            value={draft.contact_email}
            onChange={(e) =>
              setDraft((d) => ({ ...d, contact_email: e.target.value }))
            }
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          rows={3}
        />
      </div>
    </div>
  );
}

function OpcoDetailsEditor({
  initial,
  saving,
  onSave,
}: {
  initial: OpcoQuestionnaire;
  saving: boolean;
  onSave: (q: OpcoQuestionnaire) => void;
}) {
  const [q, setQ] = useState(initial);
  useEffect(() => {
    setQ(initial);
  }, [initial]);

  return (
    <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/30">
      <p className="text-sm font-medium">Infos OPCO (collecte inscription)</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>OPCO connu ?</Label>
          <Select
            value={
              q.knowsOpco === true ? "yes" : q.knowsOpco === false ? "no" : "__unset__"
            }
            onValueChange={(v) =>
              setQ((prev) => ({
                ...prev,
                knowsOpco: v === "yes" ? true : v === "no" ? false : null,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__unset__">—</SelectItem>
              <SelectItem value="yes">Oui</SelectItem>
              <SelectItem value="no">Non</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Nom OPCO</Label>
          <Input
            value={q.opcoName}
            onChange={(e) => setQ((prev) => ({ ...prev, opcoName: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Code NAF</Label>
          <Input
            value={q.nafCode}
            onChange={(e) => setQ((prev) => ({ ...prev, nafCode: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Précisions</Label>
        <Textarea
          value={q.caseNotes}
          onChange={(e) => setQ((prev) => ({ ...prev, caseNotes: e.target.value }))}
          rows={3}
        />
      </div>
      <Button size="sm" variant="secondary" disabled={saving} onClick={() => onSave(q)}>
        Enregistrer les infos OPCO
      </Button>
    </div>
  );
}
