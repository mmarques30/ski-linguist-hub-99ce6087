import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft, Edit, Plus, Trash2, Mail, Phone, MapPin, Building2, Star, FileText, Snowflake,
  Users, Euro, ScrollText, Wallet,
} from "lucide-react";
import {
  usePartnerDetails,
  usePartnerContracts,
  usePartnerContacts,
  usePartnerInscriptions,
  usePartnerInvoices,
  useDeletePartner,
  useDeletePartnerContract,
  useDeletePartnerContact,
} from "@/hooks/usePartners";
import { PartnerFormDialog } from "@/components/partners/PartnerFormDialog";
import { ContractFormDialog } from "@/components/partners/ContractFormDialog";
import { ContactFormDialog } from "@/components/partners/ContactFormDialog";
import {
  CardList,
  CardListItem,
  DefinitionList,
  PageHeader,
  PageShell,
  SegmentedControl,
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
  toneForStatus,
} from "@/components/ui-kit";
import {
  MESSAGE_GEL_PROSPECTION,
  PROSPECTION_MONITEURS_GELEE,
} from "@/lib/prospection-gel";
import {
  partnerNeedsReview,
  partnerReviewLabel,
  partnerReviewReasons,
} from "@/lib/partner-name-quality";
import { PartnerDedupPanel } from "@/components/partners/PartnerDedupPanel";
import { usePartnerDedupIndex } from "@/hooks/usePartnerDedup";
import { format } from "date-fns";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  esf: "ESF", hotel: "Hôtel", remontees_mecaniques: "Remontées mécaniques",
  office_tourisme: "Office de tourisme", autre: "Autre",
};

type PartnerTab = "profil" | "contrats" | "inscriptions" | "facturation";

const formatEuros = (value: number) => `${Number(value || 0).toLocaleString("fr-FR")} €`;

export default function PartnerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: partner, isLoading } = usePartnerDetails(id);
  const { data: contracts = [] } = usePartnerContracts(id);
  const { data: contacts = [] } = usePartnerContacts(id);
  const { data: inscriptions = [] } = usePartnerInscriptions(id);
  const { data: invoices = [] } = usePartnerInvoices(id);
  const deletePartner = useDeletePartner();
  const deleteContract = useDeletePartnerContract();
  const deleteContact = useDeletePartnerContact();
  const { matchesFor, map: dedupMap } = usePartnerDedupIndex();

  const [editOpen, setEditOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [tab, setTab] = useState<PartnerTab>("profil");

  if (isLoading) {
    return (
      <MainLayout>
        <PageShell>
          <div className="h-20 animate-shimmer rounded-[var(--radius-card)]" />
          <div className="grid gap-4 xs:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="h-28 animate-shimmer rounded-[var(--radius-card)]" />
            ))}
          </div>
          <div className="h-64 animate-shimmer rounded-[var(--radius-card)]" />
        </PageShell>
      </MainLayout>
    );
  }

  if (!partner) {
    return (
      <MainLayout>
        <PageShell>
          <SurfaceCard>
            <TableEmpty
              title="Partenaire introuvable"
              description="Cette fiche n'existe plus ou a été fusionnée."
              icon={Building2}
              action={
                <Button variant="outline" onClick={() => navigate("/gestion/partenaires")}>
                  Retour aux partenaires
                </Button>
              }
            />
          </SurfaceCard>
        </PageShell>
      </MainLayout>
    );
  }

  const totalInvoiced = invoices.reduce((s, i) => s + (i.amount_ttc || i.amount_ht || 0), 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount_ttc || i.amount_ht || 0), 0);
  const reviewReasons = partnerReviewReasons(partner.name);
  const needsReview = partnerNeedsReview(partner.name);
  const dedupMatches = matchesFor(partner.id);
  const supersededBy = dedupMap[partner.id];

  const handleDelete = async () => {
    if (PROSPECTION_MONITEURS_GELEE) {
      toast.error(MESSAGE_GEL_PROSPECTION);
      return;
    }
    if (!confirm("Supprimer ce partenaire ?")) return;
    await deletePartner.mutateAsync(partner.id);
    navigate("/gestion/partenaires");
  };

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title={partner.name}
          icon={Building2}
          tone="blue"
          back={
            <Button variant="ghost" size="sm" onClick={() => navigate("/gestion/partenaires")}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Partenaires
            </Button>
          }
          meta={
            <>
              <StatusPill tone={toneForStatus(partner.status)}>{partner.status}</StatusPill>
              {needsReview && <StatusPill tone="warning">À vérifier</StatusPill>}
              <StatusPill tone="neutral">{TYPE_LABELS[partner.type]}</StatusPill>
              {partner.station && (
                <StatusPill tone="neutral" icon={MapPin}>
                  {partner.station}
                </StatusPill>
              )}
              {PROSPECTION_MONITEURS_GELEE && (
                <StatusPill tone="info" icon={Snowflake}>
                  Prospection gelée
                </StatusPill>
              )}
            </>
          }
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={PROSPECTION_MONITEURS_GELEE}
                onClick={() => setEditOpen(true)}
              >
                <Edit className="mr-1 h-4 w-4" /> Modifier
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={PROSPECTION_MONITEURS_GELEE}
                onClick={handleDelete}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Supprimer
              </Button>
            </>
          }
          tabs={
            <SegmentedControl<PartnerTab>
              value={tab}
              onChange={setTab}
              ariaLabel="Sections de la fiche partenaire"
              options={[
                { value: "profil", label: "Profil" },
                { value: "contrats", label: "Contrats", count: contracts.length },
                { value: "inscriptions", label: "Inscriptions", count: inscriptions.length },
                { value: "facturation", label: "Facturation", count: invoices.length },
              ]}
            />
          }
        />

        {PROSPECTION_MONITEURS_GELEE && (
          <Alert>
            <Snowflake className="h-4 w-4" />
            <AlertTitle>Prospection gelée</AlertTitle>
            <AlertDescription>{MESSAGE_GEL_PROSPECTION}</AlertDescription>
          </Alert>
        )}

        {needsReview && (
          <Alert className="border-[hsl(var(--tint-gold-ring))] bg-[hsl(var(--tint-gold-bg))]">
            <AlertTitle>Fiche à vérifier</AlertTitle>
            <AlertDescription>
              Ce nom de partenaire semble inhabituel ({partnerReviewLabel(reviewReasons)}).
              Pensez à le normaliser ou à fusionner les doublons éventuels.
            </AlertDescription>
          </Alert>
        )}

        {supersededBy && (
          <Alert>
            <AlertTitle>Fiche déjà fusionnée</AlertTitle>
            <AlertDescription>
              Cette fiche a été fusionnée dans une autre.{" "}
              <Link to={`/gestion/partenaires/${supersededBy}`} className="underline">
                Ouvrir la fiche conservée
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <PartnerDedupPanel
          partner={partner}
          matches={dedupMatches}
          onMerged={(keeperId) => {
            if (keeperId !== partner.id) navigate(`/gestion/partenaires/${keeperId}`);
          }}
        />

        {/* KPI — chaque tuile ouvre l'onglet qui détaille le chiffre. */}
        <StatTileGrid cols={4}>
          <StatTile
            label="Stagiaires"
            value={inscriptions.length}
            icon={Users}
            tone="blue"
            onClick={() => setTab("inscriptions")}
          />
          <StatTile
            label="Contrats"
            value={contracts.length}
            icon={ScrollText}
            tone="purple"
            onClick={() => setTab("contrats")}
          />
          <StatTile
            label="CA facturé"
            value={formatEuros(totalInvoiced)}
            icon={Euro}
            tone="teal"
            onClick={() => setTab("facturation")}
          />
          <StatTile
            label="Solde dû"
            value={formatEuros(totalInvoiced - totalPaid)}
            icon={Wallet}
            tone={totalInvoiced - totalPaid > 0 ? "rose" : "neutral"}
            onClick={() => setTab("facturation")}
          />
        </StatTileGrid>

        {/* Profil */}
        {tab === "profil" && (
          <div className="grid gap-4 md:grid-cols-2 lg:gap-5">
            <SurfaceCard title="Informations">
              <DefinitionList
                items={[
                  ...(partner.address
                    ? [{
                        label: "Adresse",
                        value: (
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                            {partner.address}
                          </span>
                        ),
                      }]
                    : []),
                  ...(partner.contact_name
                    ? [{
                        label: "Contact",
                        value: (
                          <span className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                            {partner.contact_name}
                          </span>
                        ),
                      }]
                    : []),
                  ...(partner.contact_email
                    ? [{
                        label: "Email",
                        value: (
                          <span className="flex items-center gap-2 break-all">
                            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                            {partner.contact_email}
                          </span>
                        ),
                      }]
                    : []),
                  ...(partner.contact_phone
                    ? [{
                        label: "Téléphone",
                        value: (
                          <span className="flex items-center gap-2">
                            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                            {partner.contact_phone}
                          </span>
                        ),
                      }]
                    : []),
                ]}
              />
              {partner.notes && <p className="mt-4 text-sm text-muted-foreground">{partner.notes}</p>}
            </SurfaceCard>

            <SurfaceCard
              title="Contacts"
              actions={
                <Button
                  size="sm"
                  variant="outline"
                  disabled={PROSPECTION_MONITEURS_GELEE}
                  onClick={() => setContactOpen(true)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
                </Button>
              }
            >
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun contact</p>
              ) : (
                <div className="space-y-3">
                  {contacts.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{c.name}</span>
                          {c.is_primary && (
                            <Star
                              className="h-3 w-3 fill-primary text-primary"
                              aria-label="Contact principal"
                            />
                          )}
                        </div>
                        {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
                        {c.email && <p className="break-all text-xs text-muted-foreground">{c.email}</p>}
                        {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0"
                        aria-label={`Supprimer le contact ${c.name}`}
                        onClick={() => deleteContact.mutate(c.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>
          </div>
        )}

        {/* Contrats */}
        {tab === "contrats" && (
          <SurfaceCard
            title="Contrats"
            actions={
              <Button
                size="sm"
                disabled={PROSPECTION_MONITEURS_GELEE}
                onClick={() => setContractOpen(true)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Nouveau contrat
              </Button>
            }
            flush
          >
            {contracts.length === 0 ? (
              <TableEmpty title="Aucun contrat" description="Aucun contrat enregistré pour ce partenaire." icon={ScrollText} />
            ) : (
              <>
                <TableFrame>
                  <table className="hidden w-full md:table">
                    <thead>
                      <TableHeadRow>
                        <TableHeadCell>Type</TableHeadCell>
                        <TableHeadCell>Tarif</TableHeadCell>
                        <TableHeadCell>Volume</TableHeadCell>
                        <TableHeadCell>Paiement</TableHeadCell>
                        <TableHeadCell>Signé le</TableHeadCell>
                        <TableHeadCell align="right">Action</TableHeadCell>
                      </TableHeadRow>
                    </thead>
                    <tbody>
                      {contracts.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="capitalize">{c.contract_type}</TableCell>
                          <TableCell>{c.negotiated_rate ? `${c.negotiated_rate} €/h` : "-"}</TableCell>
                          <TableCell>{c.volume_commitment || "-"}</TableCell>
                          <TableCell>{c.payment_terms || "-"}</TableCell>
                          <TableCell>
                            {c.signed_date ? format(new Date(c.signed_date), "dd/MM/yyyy") : "-"}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              aria-label="Supprimer le contrat"
                              onClick={() => deleteContract.mutate(c.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </table>
                </TableFrame>

                <CardList className="md:hidden">
                  {contracts.map((c) => (
                    <CardListItem
                      key={c.id}
                      title={<span className="capitalize">{c.contract_type}</span>}
                      subtitle={
                        c.signed_date
                          ? `Signé le ${format(new Date(c.signed_date), "dd/MM/yyyy")}`
                          : "Non signé"
                      }
                      fields={[
                        { label: "Tarif", value: c.negotiated_rate ? `${c.negotiated_rate} €/h` : "-" },
                        { label: "Volume", value: c.volume_commitment || "-" },
                        { label: "Paiement", value: c.payment_terms || "-" },
                      ]}
                      actions={
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteContract.mutate(c.id)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Supprimer
                        </Button>
                      }
                    />
                  ))}
                </CardList>
              </>
            )}
          </SurfaceCard>
        )}

        {/* Inscriptions */}
        {tab === "inscriptions" && (
          <SurfaceCard title="Stagiaires référés" flush>
            {inscriptions.length === 0 ? (
              <TableEmpty title="Aucune inscription liée" description="Aucun stagiaire n'a encore été référé par ce partenaire." icon={Users} />
            ) : (
              <>
                <TableFrame>
                  <table className="hidden w-full md:table">
                    <thead>
                      <TableHeadRow>
                        <TableHeadCell>Stagiaire</TableHeadCell>
                        <TableHeadCell>Langue</TableHeadCell>
                        <TableHeadCell>Période</TableHeadCell>
                        <TableHeadCell>Statut</TableHeadCell>
                      </TableHeadRow>
                    </thead>
                    <tbody>
                      {inscriptions.map((i: any) => (
                        <TableRow key={i.id} onClick={() => navigate(`/inscriptions/${i.id}`)}>
                          <TableCell>
                            <Link
                              to={`/inscriptions/${i.id}`}
                              className="font-medium text-foreground hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {i.students?.first_name} {i.students?.last_name}
                            </Link>
                          </TableCell>
                          <TableCell>{i.language}</TableCell>
                          <TableCell className="tabular">
                            {format(new Date(i.start_date), "dd/MM/yy")} - {format(new Date(i.end_date), "dd/MM/yy")}
                          </TableCell>
                          <TableCell>
                            <StatusPill tone={toneForStatus(i.status)} size="sm">
                              {i.status}
                            </StatusPill>
                          </TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </table>
                </TableFrame>

                <CardList className="md:hidden">
                  {inscriptions.map((i: any) => (
                    <CardListItem
                      key={i.id}
                      to={`/inscriptions/${i.id}`}
                      title={`${i.students?.first_name ?? ""} ${i.students?.last_name ?? ""}`.trim() || "—"}
                      subtitle={i.language}
                      meta={
                        <StatusPill tone={toneForStatus(i.status)} size="sm">
                          {i.status}
                        </StatusPill>
                      }
                      fields={[
                        {
                          label: "Période",
                          value: `${format(new Date(i.start_date), "dd/MM/yy")} - ${format(new Date(i.end_date), "dd/MM/yy")}`,
                        },
                      ]}
                    />
                  ))}
                </CardList>
              </>
            )}
          </SurfaceCard>
        )}

        {/* Facturation */}
        {tab === "facturation" && (
          <SurfaceCard title="Factures liées" flush>
            {invoices.length === 0 ? (
              <TableEmpty title="Aucune facture" description="Aucune facture n'est rattachée à ce partenaire." icon={FileText} />
            ) : (
              <>
                <TableFrame>
                  <table className="hidden w-full md:table">
                    <thead>
                      <TableHeadRow>
                        <TableHeadCell>N° Facture</TableHeadCell>
                        <TableHeadCell>Date</TableHeadCell>
                        <TableHeadCell align="right">Montant TTC</TableHeadCell>
                        <TableHeadCell>Statut</TableHeadCell>
                      </TableHeadRow>
                    </thead>
                    <tbody>
                      {invoices.map((inv: any) => (
                        <TableRow
                          key={inv.id}
                          onClick={() =>
                            navigate(`/invoices?q=${encodeURIComponent(inv.invoice_number || inv.id)}`)
                          }
                        >
                          <TableCell>
                            <span className="flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <Link
                                to={`/invoices?q=${encodeURIComponent(inv.invoice_number || inv.id)}`}
                                className="font-medium text-[hsl(var(--tint-blue-fg))] hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {inv.invoice_number || "-"}
                              </Link>
                            </span>
                          </TableCell>
                          <TableCell className="tabular">
                            {format(new Date(inv.invoice_date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell align="right" className="tabular">
                            {formatEuros(inv.amount_ttc || inv.amount_ht || 0)}
                          </TableCell>
                          <TableCell>
                            <StatusPill tone={toneForStatus(inv.status)} size="sm">
                              {inv.status}
                            </StatusPill>
                          </TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </table>
                </TableFrame>

                <CardList className="md:hidden">
                  {invoices.map((inv: any) => (
                    <CardListItem
                      key={inv.id}
                      to={`/invoices?q=${encodeURIComponent(inv.invoice_number || inv.id)}`}
                      title={inv.invoice_number || "-"}
                      subtitle={format(new Date(inv.invoice_date), "dd/MM/yyyy")}
                      meta={
                        <StatusPill tone={toneForStatus(inv.status)} size="sm">
                          {inv.status}
                        </StatusPill>
                      }
                      fields={[
                        { label: "Montant TTC", value: formatEuros(inv.amount_ttc || inv.amount_ht || 0) },
                      ]}
                    />
                  ))}
                </CardList>
              </>
            )}
          </SurfaceCard>
        )}
      </PageShell>

      <PartnerFormDialog open={editOpen} onOpenChange={setEditOpen} partner={partner} />
      {id && <ContractFormDialog open={contractOpen} onOpenChange={setContractOpen} partnerId={id} />}
      {id && <ContactFormDialog open={contactOpen} onOpenChange={setContactOpen} partnerId={id} />}
    </MainLayout>
  );
}
