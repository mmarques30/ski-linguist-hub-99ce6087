import { useMemo, useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";
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
import {
  useCreateFundingProposal,
  useDeleteFundingProposal,
  useFundingProposals,
  useUpdateFundingProposal,
  useUpdateInscriptionFunding,
} from "@/hooks/useFundingProposals";

interface InscriptionFundingCardProps {
  inscriptionId: string;
  fundingOrganization: string | null;
  fundingDetails: string | null;
}

export function InscriptionFundingCard({
  inscriptionId,
  fundingOrganization,
  fundingDetails,
}: InscriptionFundingCardProps) {
  const { data: proposals = [] } = useFundingProposals(inscriptionId);
  const updateFunding = useUpdateInscriptionFunding();
  const createProposal = useCreateFundingProposal();
  const updateProposal = useUpdateFundingProposal();
  const deleteProposal = useDeleteFundingProposal();

  const parsed = useMemo(() => parseFundingDetails(fundingDetails), [fundingDetails]);
  const opco = parsed?.opco;

  const [org, setOrg] = useState(fundingOrganization || "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState({
    funding_organization: fundingOrganization || "OPCO",
    payer_type: "opco" as ProposalPayerType,
    payment_formula: "organisme" as ProposalPaymentFormula,
    amount_requested: "",
    amount_granted: "",
    payment_amount: "",
    status: "brouillon" as FundingProposalStatus,
    notes: "",
    reference_number: "",
    contact_name: "",
    contact_email: "",
  });

  const saveOrganization = async () => {
    await updateFunding.mutateAsync({
      id: inscriptionId,
      funding_organization: org || null,
    });
  };

  const saveOpcoDetails = async (next: OpcoQuestionnaire) => {
    await updateFunding.mutateAsync({
      id: inscriptionId,
      funding_organization: org || fundingOrganization || "OPCO",
      funding_details: serializeFundingDetails({
        version: 1,
        source: "admin",
        opco: next,
      }),
    });
  };

  const submitProposal = async () => {
    await createProposal.mutateAsync({
      inscription_id: inscriptionId,
      funding_organization: draft.funding_organization,
      payer_type: draft.payer_type,
      payment_formula: draft.payment_formula,
      amount_requested: draft.amount_requested ? Number(draft.amount_requested) : null,
      amount_granted: draft.amount_granted ? Number(draft.amount_granted) : null,
      payment_amount: draft.payment_amount ? Number(draft.payment_amount) : null,
      status: draft.status,
      notes: draft.notes || null,
      reference_number: draft.reference_number || null,
      contact_name: draft.contact_name || null,
      contact_email: draft.contact_email || null,
    });
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Financement &amp; propositions</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Proposition
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Mode de financement</Label>
          <div className="flex flex-wrap gap-2">
            <Select
              value={org || "__none__"}
              onValueChange={(v) => setOrg(v === "__none__" ? "" : v)}
            >
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
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={updateFunding.isPending || org === (fundingOrganization || "")}
              onClick={() => void saveOrganization()}
            >
              Enregistrer
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Corrigez ici une erreur candidat (ex. OPCO coché à la place de FIFPL).
          </p>
        </div>

        {(org === "OPCO" || fundingOrganization === "OPCO" || opco) && (
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
            onSave={(q) => void saveOpcoDetails(q)}
          />
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Propositions de règlement</h3>
          {proposals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune proposition. Créez-en une selon l’OPCO et l’accord avec le stagiaire / client
              (payeur stagiaire, entreprise ou OPCO — toutes formules possibles).
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
                        <Badge variant="outline">{proposalFormulaLabel(p.payment_formula)}</Badge>
                      </div>
                      <p className="font-medium">{p.funding_organization}</p>
                      <p className="text-muted-foreground text-xs">
                        Demandé {p.amount_requested ?? "—"} € · Accordé {p.amount_granted ?? "—"} € ·
                        À régler {p.payment_amount ?? "—"} €
                      </p>
                      {p.notes && (
                        <p className="text-muted-foreground whitespace-pre-wrap">{p.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Select
                        value={p.status}
                        onValueChange={(status) =>
                          void updateProposal.mutateAsync({
                            id: p.id,
                            inscriptionId: inscriptionId,
                            status: status as FundingProposalStatus,
                          })
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
                        onClick={() => {
                          if (confirm("Supprimer cette proposition ?")) {
                            void deleteProposal.mutateAsync({
                              id: p.id,
                              inscriptionId,
                            });
                          }
                        }}
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
            <DialogTitle>Nouvelle proposition de règlement</DialogTitle>
          </DialogHeader>
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
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, amount_granted: e.target.value }))
                  }
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
            <div className="space-y-1">
              <Label>Référence / convention</Label>
              <Input
                value={draft.reference_number}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, reference_number: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Contact</Label>
                <Input
                  value={draft.contact_name}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, contact_name: e.target.value }))
                  }
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={createProposal.isPending || !draft.funding_organization.trim()}
              onClick={() => void submitProposal()}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
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
