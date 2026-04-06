import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Building2, MapPin, Mail, Phone, Users } from "lucide-react";
import { usePartners, usePartnerStats } from "@/hooks/usePartners";
import { PartnerFormDialog } from "@/components/partners/PartnerFormDialog";
import { StatCard } from "@/components/dashboard/StatCard";

const TYPE_LABELS: Record<string, string> = {
  esf: "ESF",
  hotel: "Hôtel",
  remontees_mecaniques: "Remontées méc.",
  office_tourisme: "Office tourisme",
  autre: "Autre",
};

const STATUS_COLORS: Record<string, string> = {
  actif: "bg-green-100 text-green-800",
  prospect: "bg-blue-100 text-blue-800",
  inactif: "bg-gray-100 text-gray-600",
};

export default function PartnersList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);

  const { data: partners = [], isLoading } = usePartners({
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
  });
  const { data: stats } = usePartnerStats();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Partenaires</h1>
            <p className="text-muted-foreground">Gestion des partenariats ESF et autres</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nouveau partenaire
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total partenaires"
            value={stats?.totalPartners || 0}
            subtitle={`${stats?.activePartners || 0} actifs`}
            icon={Building2}
          />
          <StatCard
            title="Stagiaires référés"
            value={stats?.totalInscriptions || 0}
            subtitle="via partenaires"
            icon={Users}
          />
          <StatCard
            title="Partenaires actifs"
            value={stats?.activePartners || 0}
            subtitle="en cours"
            icon={Building2}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un partenaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="esf">ESF</SelectItem>
              <SelectItem value="hotel">Hôtel</SelectItem>
              <SelectItem value="remontees_mecaniques">Remontées méc.</SelectItem>
              <SelectItem value="office_tourisme">Office tourisme</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="inactif">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Chargement...</p>
        ) : partners.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Aucun partenaire trouvé</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/gestion/partenaires/${p.id}`)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{p.name}</h3>
                      <span className="text-sm text-muted-foreground">{TYPE_LABELS[p.type] || p.type}</span>
                    </div>
                    <Badge className={STATUS_COLORS[p.status] || ""}>{p.status}</Badge>
                  </div>
                  {p.station && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mr-1.5" /> {p.station}
                    </div>
                  )}
                  {p.contact_email && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 mr-1.5" /> {p.contact_email}
                    </div>
                  )}
                  {p.contact_phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 mr-1.5" /> {p.contact_phone}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PartnerFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </MainLayout>
  );
}
