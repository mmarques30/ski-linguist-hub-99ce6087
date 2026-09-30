import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, Euro } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusPill } from "@/components/ui-kit";
import type { RegistrationData } from "@/pages/register/Index";
import { OptionCard, StepActions, StepCard } from "./StepLayout";
import { useSkiSchoolDirectory } from "@/hooks/useSkiSchoolDirectory";
import { useRegistrationOfferings } from "@/hooks/useRegistrationOfferings";
import {
  OTHER_SCHOOL_OPTION,
  SKI_NETWORKS,
  formatSchoolOption,
  isDirectoryNetwork,
  isValidCarteSyndicale,
  resolveSkiSchoolLabel,
} from "@/lib/ski-school-directory";
import {
  formatPriceEUR,
  isPartnerSchool,
  resolveOfferingPrice,
} from "@/lib/registration-offerings";
import { cn } from "@/lib/utils";

interface ProfessionalProfileStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

export function ProfessionalProfileStep({ data, onUpdate, onNext }: ProfessionalProfileStepProps) {
  const [schoolFilter, setSchoolFilter] = useState("");
  const network = data.skiNetwork || "";
  const { data: schools = [], isLoading: loadingSchools } = useSkiSchoolDirectory(
    isDirectoryNetwork(network) ? network : null
  );
  const { data: offerings = [] } = useRegistrationOfferings();
  const selectedOffering = useMemo(
    () => (data.offeringId ? offerings.find((o) => o.id === data.offeringId) : null),
    [offerings, data.offeringId]
  );

  const filteredSchools = useMemo(() => {
    const q = schoolFilter.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(
      (s) =>
        s.nom_affiche.toLowerCase().includes(q) ||
        (s.station || "").toLowerCase().includes(q) ||
        (s.departement || "").includes(q) ||
        s.code.toLowerCase().includes(q)
    );
  }, [schools, schoolFilter]);

  const selectedCode = data.skiSchoolCode || "";
  const isOtherSchool = selectedCode === OTHER_SCHOOL_OPTION;
  const cartePending = Boolean(data.carteSyndicalePending);

  /** École / rattachement assez renseigné pour afficher le tarif. */
  const schoolReadyForPrice = (() => {
    if (data.profession === "other") return true;
    if (data.profession !== "ski_instructor") return false;
    if (!network) return false;
    if (network === "Indépendant.e") return Boolean(data.stationOrValley?.trim());
    if (network === "Autre") return Boolean(data.skiSchoolOther?.trim());
    if (!isDirectoryNetwork(network)) return false;
    if (!selectedCode) return false;
    if (isOtherSchool) return Boolean(data.skiSchoolOther?.trim());
    return true;
  })();

  // Tarif partenaire selon l'école choisie (SESSIONS §3.1) — jamais avant.
  useEffect(() => {
    if (!selectedOffering || data.isCustomFormat) return;
    if (!schoolReadyForPrice) {
      if (data.price != null) onUpdate({ price: undefined });
      return;
    }
    const code =
      data.skiSchoolCode && data.skiSchoolCode !== OTHER_SCHOOL_OPTION
        ? data.skiSchoolCode
        : null;
    const nextPrice = resolveOfferingPrice(selectedOffering, code);
    if (data.price !== nextPrice) {
      onUpdate({ price: nextPrice });
    }
  }, [
    selectedOffering,
    data.skiSchoolCode,
    data.isCustomFormat,
    data.profession,
    network,
    data.stationOrValley,
    data.skiSchoolOther,
    schoolReadyForPrice,
  ]);

  const canContinue = (() => {
    if (!data.profession) return false;
    if (data.profession === "other") return true;
    if (!network) return false;

    if (network === "Indépendant.e") {
      return Boolean(data.stationOrValley?.trim());
    }
    if (network === "Autre") {
      return Boolean(data.skiSchoolOther?.trim());
    }
    if (!isDirectoryNetwork(network)) return false;
    if (!selectedCode) return false;
    if (isOtherSchool && !data.skiSchoolOther?.trim()) return false;
    if (network === "ESF" && !isValidCarteSyndicale(data.carteSyndicale, cartePending)) {
      return false;
    }
    return true;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;

    const label = resolveSkiSchoolLabel({
      skiNetwork: data.skiNetwork,
      skiSchoolCode: isOtherSchool ? null : data.skiSchoolCode,
      skiSchoolName: isOtherSchool
        ? null
        : schools.find((s) => s.code === data.skiSchoolCode)?.nom_affiche,
      skiSchoolOther: data.skiSchoolOther,
      stationOrValley: data.stationOrValley,
    });
    const code = isOtherSchool ? null : data.skiSchoolCode;
    const price =
      selectedOffering && !data.isCustomFormat
        ? resolveOfferingPrice(selectedOffering, code)
        : data.price;
    onUpdate({ skiSchool: label, price });
    onNext();
  };

  const resolvedPrice =
    schoolReadyForPrice && selectedOffering && !data.isCustomFormat
      ? resolveOfferingPrice(
          selectedOffering,
          data.skiSchoolCode === OTHER_SCHOOL_OPTION ? null : data.skiSchoolCode
        )
      : undefined;
  const partnerApplied =
    schoolReadyForPrice &&
    !!selectedOffering &&
    isPartnerSchool(
      selectedOffering,
      data.skiSchoolCode === OTHER_SCHOOL_OPTION ? null : data.skiSchoolCode
    );

  const setNetwork = (value: string) => {
    setSchoolFilter("");
    onUpdate({
      skiNetwork: value as RegistrationData["skiNetwork"],
      skiSchoolCode: undefined,
      skiSchoolOther: undefined,
      stationOrValley: undefined,
      carteSyndicale: undefined,
      carteSyndicalePending: false,
      skiSchool: undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StepCard
        title="Profil professionnel"
        description="Parlez-nous de votre expérience professionnelle"
        icon={Briefcase}
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Quelle est votre profession ?</Label>
            <RadioGroup
              value={data.profession || ""}
              onValueChange={(value) =>
                onUpdate({
                  profession: value as "ski_instructor" | "other",
                  ...(value === "other"
                    ? {
                        skiNetwork: undefined,
                        skiSchoolCode: undefined,
                        skiSchoolOther: undefined,
                        stationOrValley: undefined,
                        carteSyndicale: undefined,
                        carteSyndicalePending: false,
                        skiSchool: undefined,
                      }
                    : {}),
                })
              }
              className="space-y-3"
            >
              <OptionCard selected={data.profession === "ski_instructor"}>
                <Label
                  htmlFor="ski_instructor"
                  className="flex cursor-pointer items-start gap-3 p-4 font-normal"
                >
                  <RadioGroupItem value="ski_instructor" id="ski_instructor" className="mt-0.5" />
                  <span className="min-w-0 space-y-1">
                    <span className="block font-medium text-foreground">Moniteur de ski</span>
                    <span className="block text-sm text-muted-foreground">
                      Je travaille comme moniteur de ski dans une école française
                    </span>
                  </span>
                </Label>
              </OptionCard>
              <OptionCard selected={data.profession === "other"}>
                <Label htmlFor="other" className="flex cursor-pointer items-start gap-3 p-4 font-normal">
                  <RadioGroupItem value="other" id="other" className="mt-0.5" />
                  <span className="min-w-0 space-y-1">
                    <span className="block font-medium text-foreground">Autre profession</span>
                    <span className="block text-sm text-muted-foreground">J&apos;ai une autre profession</span>
                  </span>
                </Label>
              </OptionCard>
            </RadioGroup>
          </div>

          {data.profession === "ski_instructor" && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skiNetwork">Réseau</Label>
                <Select value={network} onValueChange={setNetwork}>
                  <SelectTrigger id="skiNetwork" className="h-11">
                    <SelectValue placeholder="Choisir un réseau" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKI_NETWORKS.map((n) => (
                      <SelectItem key={n.value} value={n.value}>
                        {n.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {network === "ESF" && (
                <div className="space-y-3 rounded-[var(--radius)] border border-border p-3">
                  <div className="space-y-2">
                    <Label htmlFor="carteSyndicale">Carte syndicale (5 chiffres)</Label>
                    <Input
                      id="carteSyndicale"
                      inputMode="numeric"
                      pattern="\d{5}"
                      maxLength={5}
                      disabled={cartePending}
                      value={data.carteSyndicale || ""}
                      onChange={(e) =>
                        onUpdate({
                          carteSyndicale: e.target.value.replace(/\D/g, "").slice(0, 5),
                        })
                      }
                      placeholder="12345"
                      className="h-11 tabular"
                    />
                  </div>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={cartePending}
                      onCheckedChange={(checked) =>
                        onUpdate({
                          carteSyndicalePending: Boolean(checked),
                          carteSyndicale: checked ? "" : data.carteSyndicale,
                        })
                      }
                    />
                    <span>Je n&apos;ai pas encore ma carte syndicale</span>
                  </label>
                </div>
              )}

              {isDirectoryNetwork(network) && (
                <div className="space-y-2">
                  <Label>École</Label>
                  <Input
                    value={schoolFilter}
                    onChange={(e) => setSchoolFilter(e.target.value)}
                    placeholder="Rechercher par station ou nom…"
                    className="h-11"
                  />
                  <div
                    className="max-h-56 overflow-y-auto rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-raised))]"
                    role="listbox"
                    aria-label="Écoles du réseau"
                  >
                    {loadingSchools ? (
                      <p className="p-3 text-sm text-muted-foreground">Chargement du référentiel…</p>
                    ) : (
                      <>
                        {filteredSchools.map((s) => {
                          const active = selectedCode === s.code;
                          return (
                            <button
                              key={s.code}
                              type="button"
                              role="option"
                              aria-selected={active}
                              className={cn(
                                "flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-left text-sm last:border-b-0",
                                active
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-[hsl(var(--surface-sunken))]"
                              )}
                              onClick={() =>
                                onUpdate({
                                  skiSchoolCode: s.code,
                                  skiSchoolOther: undefined,
                                  skiSchool: s.nom_affiche,
                                })
                              }
                            >
                              <span className="font-medium">{formatSchoolOption(s)}</span>
                              {s.station && s.station !== s.nom_affiche.replace(/^ESF\s+/i, "") ? (
                                <span
                                  className={cn(
                                    "text-xs",
                                    active ? "text-primary-foreground/80" : "text-muted-foreground"
                                  )}
                                >
                                  {s.station}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          role="option"
                          aria-selected={isOtherSchool}
                          className={cn(
                            "flex w-full items-center px-3 py-2 text-left text-sm",
                            isOtherSchool
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-[hsl(var(--surface-sunken))]"
                          )}
                          onClick={() =>
                            onUpdate({
                              skiSchoolCode: OTHER_SCHOOL_OPTION,
                              skiSchool: undefined,
                            })
                          }
                        >
                          {network === "ESF" ? "Autre ESF : saisir le nom" : "Autre : saisir le nom"}
                        </button>
                        {!loadingSchools && filteredSchools.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground">
                            Aucune école ne correspond à « {schoolFilter} ».
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              )}

              {(isOtherSchool || network === "Autre") && (
                <div className="space-y-2">
                  <Label htmlFor="skiSchoolOther">
                    {network === "ESF" ? "Nom de l'ESF" : "Nom de l'école"}
                  </Label>
                  <Input
                    id="skiSchoolOther"
                    value={data.skiSchoolOther || ""}
                    onChange={(e) => onUpdate({ skiSchoolOther: e.target.value })}
                    placeholder="Nom de l'école"
                    className="h-11"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Votre saisie sera vérifiée par l&apos;équipe FLI.
                  </p>
                </div>
              )}

              {network === "Indépendant.e" && (
                <div className="space-y-2">
                  <Label htmlFor="stationOrValley">Station ou vallée</Label>
                  <Input
                    id="stationOrValley"
                    value={data.stationOrValley || ""}
                    onChange={(e) => onUpdate({ stationOrValley: e.target.value })}
                    placeholder="ex. : Val d'Isère, Tarentaise…"
                    className="h-11"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {data.profession === "other" && (
            <div className="animate-in fade-in slide-in-from-top-2 rounded-[var(--radius-card)] bg-[hsl(var(--surface-sunken))] p-4">
              <p className="text-sm text-muted-foreground">
                Nos programmes sont principalement conçus pour les moniteurs de ski. Nous avons bien
                noté votre situation : l&apos;équipe FLI prendra contact avec vous pour étudier vos
                besoins.
              </p>
            </div>
          )}
        </div>
      </StepCard>

      {selectedOffering && !data.isCustomFormat && !schoolReadyForPrice && (
        <p className="text-sm text-muted-foreground">
          Indiquez votre école de ski pour afficher le tarif applicable.
        </p>
      )}

      {resolvedPrice != null && selectedOffering && !data.isCustomFormat && (
        <Alert className="border-primary/20 bg-[hsl(var(--surface-sunken))]">
          <Euro className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>Tarif selon votre école :</span>
            <StatusPill tone="warning" className="px-3 py-1 text-base">
              {formatPriceEUR(resolvedPrice)}
            </StatusPill>
            {partnerApplied ? (
              <span className="text-sm text-muted-foreground">— tarif école partenaire</span>
            ) : (selectedOffering.partner_school_codes?.length ?? 0) > 0 ? (
              <span className="text-sm text-muted-foreground">— tarif autres écoles</span>
            ) : null}
          </AlertDescription>
        </Alert>
      )}

      <StepActions>
        <Button type="submit" className="h-12 w-full text-base sm:w-auto" disabled={!canContinue}>
          Continuer vers le test de niveau
        </Button>
      </StepActions>
    </form>
  );
}
