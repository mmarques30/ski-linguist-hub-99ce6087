import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Plus, Trash2, Mail, Phone, MapPin, Building2, Star, FileText } from "lucide-react";
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TYPE_LABELS: Record<string, string> = {
  esf: "ESF", hotel: "Hôtel", remontees_mecaniques: "Remontées mécaniques",
  office_tourisme: "Office de tourisme", autre: "Autre",
};
const STATUS_COLORS: Record<string, string> = {
  actif: "bg-green-100 text-green-800", prospect: "bg-blue-100 text-blue-800", inactif: "bg-gray-100 text-gray-600",
};

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

  const [editOpen, setEditOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  if (isLoading) return <MainLayout><p className="text-center py-12 text-muted-foreground">Chargement...</p></MainLayout>;
  if (!partner) return <MainLayout><p className="text-center py-12 text-muted-foreground">Partenaire introuvable</p></MainLayout>;

  const totalInvoiced = invoices.reduce((s, i) => s + (i.amount_ttc || i.amount_ht || 0), 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount_ttc || i.amount_ht || 0), 0);

  const handleDelete = async () => {
    if (!confirm("Supprimer ce partenaire ?")) return;
    await deletePartner.mutateAsync(partner.id);
    navigate("/gestion/partenaires");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/gestion/partenaires")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{partner.name}</h1>
              <Badge className={STATUS_COLORS[partner.status] || ""}>{partner.status}</Badge>
              <span className="text-sm text-muted-foreground">{TYPE_LABELS[partner.type]}</span>
            </div>
            {partner.station && (
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" /> {partner.station}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-1" /> Modifier
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> Supprimer
          </Button>
        </div>

        {/* KPIs row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{inscriptions.length}</p>
            <p className="text-xs text-muted-foreground">Stagiaires</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{contracts.length}</p>
            <p className="text-xs text-muted-foreground">Contrats</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalInvoiced.toLocaleString("fr-FR")} €</p>
            <p className="text-xs text-muted-foreground">CA facturé</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{(totalInvoiced - totalPaid).toLocaleString("fr-FR")} €</p>
            <p className="text-xs text-muted-foreground">Solde dû</p>
          </CardContent></Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profil">
          <TabsList>
            <TabsTrigger value="profil">Profil</TabsTrigger>
            <TabsTrigger value="contrats">Contrats ({contracts.length})</TabsTrigger>
            <TabsTrigger value="inscriptions">Inscriptions ({inscriptions.length})</TabsTrigger>
            <TabsTrigger value="facturation">Facturation ({invoices.length})</TabsTrigger>
          </TabsList>

          {/* Profil */}
          <TabsContent value="profil">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {partner.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {partner.address}</div>}
                  {partner.contact_name && <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> {partner.contact_name}</div>}
                  {partner.contact_email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {partner.contact_email}</div>}
                  {partner.contact_phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {partner.contact_phone}</div>}
                  {partner.notes && <p className="text-muted-foreground mt-3">{partner.notes}</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Contacts</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setContactOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
                  </Button>
                </CardHeader>
                <CardContent>
                  {contacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun contact</p>
                  ) : (
                    <div className="space-y-3">
                      {contacts.map((c) => (
                        <div key={c.id} className="flex items-start justify-between border-b border-border pb-2 last:border-0">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{c.name}</span>
                              {c.is_primary && <Star className="h-3 w-3 text-primary fill-primary" />}
                            </div>
                            {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
                            {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                            {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                          </div>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteContact.mutate(c.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contrats */}
          <TabsContent value="contrats">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Contrats</CardTitle>
                <Button size="sm" onClick={() => setContractOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Nouveau contrat
                </Button>
              </CardHeader>
              <CardContent>
                {contracts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucun contrat</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Tarif</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Paiement</TableHead>
                        <TableHead>Signé le</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="capitalize">{c.contract_type}</TableCell>
                          <TableCell>{c.negotiated_rate ? `${c.negotiated_rate} €/h` : "-"}</TableCell>
                          <TableCell>{c.volume_commitment || "-"}</TableCell>
                          <TableCell>{c.payment_terms || "-"}</TableCell>
                          <TableCell>{c.signed_date ? format(new Date(c.signed_date), "dd/MM/yyyy") : "-"}</TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteContract.mutate(c.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inscriptions */}
          <TabsContent value="inscriptions">
            <Card>
              <CardHeader><CardTitle className="text-base">Stagiaires référés</CardTitle></CardHeader>
              <CardContent>
                {inscriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucune inscription liée</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stagiaire</TableHead>
                        <TableHead>Langue</TableHead>
                        <TableHead>Période</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inscriptions.map((i: any) => (
                        <TableRow key={i.id} className="cursor-pointer" onClick={() => navigate(`/inscriptions/${i.id}`)}>
                          <TableCell>{i.students?.first_name} {i.students?.last_name}</TableCell>
                          <TableCell>{i.language}</TableCell>
                          <TableCell>{format(new Date(i.start_date), "dd/MM/yy")} - {format(new Date(i.end_date), "dd/MM/yy")}</TableCell>
                          <TableCell><Badge variant="outline">{i.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Facturation */}
          <TabsContent value="facturation">
            <Card>
              <CardHeader><CardTitle className="text-base">Factures liées</CardTitle></CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucune facture</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Facture</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant TTC</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv: any) => (
                        <TableRow key={inv.id}>
                          <TableCell className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {inv.invoice_number || "-"}</TableCell>
                          <TableCell>{format(new Date(inv.invoice_date), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{(inv.amount_ttc || inv.amount_ht || 0).toLocaleString("fr-FR")} €</TableCell>
                          <TableCell><Badge variant="outline">{inv.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <PartnerFormDialog open={editOpen} onOpenChange={setEditOpen} partner={partner} />
      {id && <ContractFormDialog open={contractOpen} onOpenChange={setContractOpen} partnerId={id} />}
      {id && <ContactFormDialog open={contactOpen} onOpenChange={setContactOpen} partnerId={id} />}
    </MainLayout>
  );
}
