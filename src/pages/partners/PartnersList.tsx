import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Building2, MapPin, Mail, Phone, Users, Upload, Snowflake } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePartners, usePartnerStats } from "@/hooks/usePartners";
import { PartnerFormDialog } from "@/components/partners/PartnerFormDialog";
import { EsfDirectorsImportDialog } from "@/components/partners/EsfDirectorsImportDialog";
import {
  CardGrid,
  FilterBar,
  PageHeader,
  PageShell,
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TablePagination,
  toneForStatus,
} from "@/components/ui-kit";
import {
  MESSAGE_GEL_PROSPECTION,
  MESSAGE_GEL_REACTIVATION,
  PROSPECTION_MONITEURS_GELEE,
} from "@/lib/prospection-gel";
import { partnerNeedsReview } from "@/lib/partner-name-quality";
import { usePartnerDedupIndex } from "@/hooks/usePartnerDedup";

const TYPE_LABELS: Record<string, string> = {
  esf: "ESF",
  ecole_ski: "École de ski",
  hotel: "Hôtel",
  remontees_mecaniques: "Remontées méc.",
  office_tourisme: "Office tourisme",
  autre: "Autre",
};

const QUALITY_LABELS: Record<string, string> = {
  a_verifier: "À vérifier",
  doublons: "Doublons",
};

export default function PartnersList() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [qualityFilter, setQualityFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data: partnersResult, isLoading } = usePartners({
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
    needsReview: qualityFilter === "a_verifier" ? true : undefined,
    page: qualityFilter === "doublons" ? 1 : page,
    pageSize: qualityFilter === "doublons" ? 1000 : pageSize,
  });
  const partnersRaw = partnersResult?.rows ?? [];
  const { duplicateIds, map: dedupMap, isLoading: dedupLoading } = usePartnerDedupIndex();

  const partners =
    qualityFilter === "doublons"
      ? partnersRaw.filter((p) => duplicateIds.has(p.id) && !dedupMap[p.id])
      : partnersRaw.filter((p) => !dedupMap[p.id]);
  const partnerTotal =
    qualityFilter === "doublons" ? partners.length : Math.max(0, (partnersResult?.total ?? 0) - Object.keys(dedupMap).length);
  const totalPages = Math.max(1, Math.ceil(partnerTotal / pageSize));
  const { data: stats, isLoading: statsLoading } = usePartnerStats();
  const listLoading = isLoading || (qualityFilter === "doublons" && dedupLoading);

  const activeFilters = [
    typeFilter
      ? {
          key: "type",
          label: TYPE_LABELS[typeFilter] ?? typeFilter,
          onRemove: () => { setTypeFilter(""); setPage(1); },
        }
      : null,
    statusFilter
      ? {
          key: "status",
          label: statusFilter,
          onRemove: () => { setStatusFilter(""); setPage(1); },
        }
      : null,
    qualityFilter !== "all"
      ? {
          key: "quality",
          label: QUALITY_LABELS[qualityFilter] ?? qualityFilter,
          onRemove: () => { setQualityFilter("all"); setPage(1); },
        }
      : null,
    search
      ? { key: "search", label: `Recherche : ${search}`, onRemove: () => { setSearch(""); setPage(1); } }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; onRemove: () => void }>;

  const clearAll = () => {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    setQualityFilter("all");
    setPage(1);
  };

  const visiblePartners =
    qualityFilter === "doublons" ? partners.slice((page - 1) * pageSize, page * pageSize) : partners;

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Partenaires"
          description="Gestion des partenariats ESF et autres"
          icon={Building2}
          tone="blue"
          meta={
            PROSPECTION_MONITEURS_GELEE ? (
              <StatusPill tone="info" icon={Snowflake}>
                Base en lecture seule
              </StatusPill>
            ) : undefined
          }
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => setImportOpen(true)}
                disabled={PROSPECTION_MONITEURS_GELEE}
                title={PROSPECTION_MONITEURS_GELEE ? MESSAGE_GEL_PROSPECTION : undefined}
              >
                <Upload className="mr-2 h-4 w-4" /> BD ESF
              </Button>
              <Button
                onClick={() => setFormOpen(true)}
                disabled={PROSPECTION_MONITEURS_GELEE}
                title={PROSPECTION_MONITEURS_GELEE ? MESSAGE_GEL_PROSPECTION : undefined}
              >
                <Plus className="mr-2 h-4 w-4" /> Nouveau partenaire
              </Button>
            </>
          }
        />

        {PROSPECTION_MONITEURS_GELEE && (
          <Alert>
            <Snowflake className="h-4 w-4" />
            <AlertTitle>Base partenaires en lecture seule</AlertTitle>
            <AlertDescription className="space-y-1 text-sm">
              <p>{MESSAGE_GEL_PROSPECTION}</p>
              <p className="text-muted-foreground">{MESSAGE_GEL_REACTIVATION}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* KPI — « Total » et « Actifs » ouvrent la liste filtrée correspondante. */}
        <StatTileGrid cols={3}>
          <StatTile
            label="Total partenaires"
            value={stats?.totalPartners ?? 0}
            hint={`${stats?.activePartners ?? 0} actifs`}
            icon={Building2}
            tone="blue"
            loading={statsLoading}
            onClick={clearAll}
          />
          <StatTile
            label="Stagiaires référés"
            value={stats?.totalInscriptions ?? 0}
            hint="via partenaires"
            icon={Users}
            tone="teal"
            loading={statsLoading}
          />
          <StatTile
            label="Partenaires actifs"
            value={stats?.activePartners ?? 0}
            hint="en cours"
            icon={Building2}
            tone="gold"
            loading={statsLoading}
            onClick={() => { setStatusFilter("actif"); setPage(1); }}
          />
        </StatTileGrid>

        <FilterBar
          search={{
            value: search,
            onChange: (value) => { setSearch(value); setPage(1); },
            placeholder: "Rechercher un partenaire...",
            ariaLabel: "Rechercher un partenaire",
          }}
          filters={
            <>
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v === "all" ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]" aria-label="Type de partenaire">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="esf">ESF</SelectItem>
                  <SelectItem value="ecole_ski">École de ski</SelectItem>
                  <SelectItem value="hotel">Hôtel</SelectItem>
                  <SelectItem value="remontees_mecaniques">Remontées méc.</SelectItem>
                  <SelectItem value="office_tourisme">Office tourisme</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v === "all" ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]" aria-label="Statut du partenaire">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={qualityFilter}
                onValueChange={(v) => {
                  setQualityFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]" aria-label="Qualité de la fiche">
                  <SelectValue placeholder="Qualité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="a_verifier">À vérifier</SelectItem>
                  <SelectItem value="doublons">Doublons</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
          activeFilters={activeFilters}
          onClearAll={activeFilters.length > 0 ? clearAll : undefined}
        />

        {/* Liste */}
        {listLoading ? (
          <CardGrid cols={3}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="h-44 animate-shimmer rounded-[var(--radius-card)]" />
            ))}
          </CardGrid>
        ) : partners.length === 0 ? (
          <SurfaceCard>
            <TableEmpty
              title="Aucun partenaire trouvé"
              description="Modifiez la recherche ou les filtres pour retrouver une fiche."
              icon={Building2}
            />
          </SurfaceCard>
        ) : (
          <>
            <CardGrid cols={3}>
              {visiblePartners.map((p) => (
                <Link key={p.id} to={`/gestion/partenaires/${p.id}`} className="block h-full">
                  <SurfaceCard interactive className="h-full" bodyClassName="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold text-foreground">{p.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          {TYPE_LABELS[p.type] || p.type}
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusPill tone={toneForStatus(p.status)} size="sm">
                          {p.status}
                        </StatusPill>
                        {partnerNeedsReview(p.name) && (
                          <StatusPill tone="warning" size="sm">
                            À vérifier
                          </StatusPill>
                        )}
                        {duplicateIds.has(p.id) && (
                          <StatusPill tone="purple" size="sm">
                            Doublon
                          </StatusPill>
                        )}
                      </div>
                    </div>
                    {p.station && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{p.station}</span>
                      </div>
                    )}
                    {p.contact_email && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{p.contact_email}</span>
                      </div>
                    )}
                    {p.contact_phone && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{p.contact_phone}</span>
                      </div>
                    )}
                  </SurfaceCard>
                </Link>
              ))}
            </CardGrid>

            {totalPages > 1 && (
              <SurfaceCard flush>
                <TablePagination
                  page={page}
                  pageSize={pageSize}
                  total={partnerTotal}
                  onPageChange={(next) => setPage(Math.min(totalPages, Math.max(1, next)))}
                  className="border-t-0"
                  totalLabel={(total) => `${total.toLocaleString("fr-FR")} partenaires au total`}
                />
              </SurfaceCard>
            )}
          </>
        )}
      </PageShell>

      <PartnerFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <EsfDirectorsImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </MainLayout>
  );
}
