import { useMemo, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Calendar, Euro, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
import type { RegistrationData } from "@/pages/register/Index";
import { useRegistrationOfferings } from "@/hooks/useRegistrationOfferings";
import {
  CUSTOM_FORMAT_DURATION,
  filterByLocation,
  formatPriceEUR,
  isCustomFormatDuration,
  matchOffering,
  uniqueDateOptions,
  uniqueDurations,
  uniqueLanguages,
  uniqueLocations,
  uniqueModalities,
} from "@/lib/registration-offerings";
import {
  offeringHasFixedDates,
  REQUESTED_START_DATE_MESSAGES,
  requestedStartDateNotice,
  requestedStartDateProblem,
  todayIso,
} from "@/lib/registration-dates";
import { OptionCard, StepActions, StepCard } from "./StepLayout";

interface CourseSelectionStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

export function CourseSelectionStep({ data, onUpdate, onNext }: CourseSelectionStepProps) {
  const { data: offerings = [], isLoading, isError } = useRegistrationOfferings();

  const locations = useMemo(() => uniqueLocations(offerings), [offerings]);

  const locationOfferings = useMemo(
    () => (data.location ? filterByLocation(offerings, data.location) : []),
    [offerings, data.location]
  );

  const modalities = useMemo(() => uniqueModalities(locationOfferings), [locationOfferings]);

  const modalityOfferings = useMemo(
    () =>
      data.modality
        ? locationOfferings.filter((o) => o.modality_key === data.modality)
        : locationOfferings,
    [locationOfferings, data.modality]
  );

  const languages = useMemo(() => uniqueLanguages(modalityOfferings), [modalityOfferings]);

  const languageOfferings = useMemo(
    () =>
      data.language
        ? modalityOfferings.filter((o) => o.language_key === data.language)
        : modalityOfferings,
    [modalityOfferings, data.language]
  );

  const dateOptions = useMemo(() => uniqueDateOptions(languageOfferings), [languageOfferings]);

  const dateOfferings = useMemo(() => {
    if (!data.dateKey) return languageOfferings;
    return languageOfferings.filter((o) => {
      const key = o.start_date && o.end_date ? `${o.start_date}_${o.end_date}` : o.date_label || "flex";
      return key === data.dateKey;
    });
  }, [languageOfferings, data.dateKey]);

  const durations = useMemo(() => uniqueDurations(dateOfferings), [dateOfferings]);

  const selectedOffering = useMemo(() => {
    if (!data.location || isCustomFormatDuration(data.duration)) return null;
    const durationHours = data.duration ? parseInt(data.duration, 10) : undefined;
    return matchOffering(offerings, {
      locationKey: data.location,
      modalityKey: data.modality || undefined,
      languageKey: data.language || undefined,
      dateKey: data.dateKey || undefined,
      durationHours: Number.isFinite(durationHours) ? durationHours : undefined,
    });
  }, [offerings, data]);

  const isCustomFormat = isCustomFormatDuration(data.duration);

  // BL-029 : les offres « dates flexibles » n'ont pas de session datée, et un
  // devis personnalisé n'en a jamais. Sans date demandée ici, l'inscription
  // héritait des dates de la saison côté serveur.
  const needsRequestedStartDate =
    isCustomFormat || (!!selectedOffering && !offeringHasFixedDates(selectedOffering));
  const today = todayIso();
  const requestedStartDateError = needsRequestedStartDate
    ? requestedStartDateProblem(data.requestedStartDate, today)
    : null;
  const requestedStartDateHint = needsRequestedStartDate
    ? requestedStartDateNotice(data.requestedStartDate, today)
    : null;

  const canContinue =
    !!data.location &&
    !!data.language &&
    !!data.fundingType &&
    !requestedStartDateError &&
    (isCustomFormat
      ? (data.customFormatDetails?.trim().length ?? 0) >= 20
      : !!data.duration && !!selectedOffering);

  useEffect(() => {
    if (!selectedOffering || isCustomFormatDuration(data.duration)) return;
    onUpdate({
      offeringId: selectedOffering.id,
      price: selectedOffering.base_price,
      duration: String(selectedOffering.duration_hours),
      dates: selectedOffering.date_label || data.dates,
      startDate: selectedOffering.start_date || undefined,
      endDate: selectedOffering.end_date || undefined,
      // Une session datée fixe le calendrier : la date souhaitée n'a plus lieu d'être.
      requestedStartDate: offeringHasFixedDates(selectedOffering)
        ? undefined
        : data.requestedStartDate,
      dateLabel: selectedOffering.date_label || undefined,
      modality: selectedOffering.modality_key,
      language: selectedOffering.language_key,
      location: selectedOffering.location_key,
      locationLabel: selectedOffering.location_label,
      isCustomFormat: false,
      customFormatDetails: undefined,
    });
  }, [selectedOffering?.id, data.duration]);

  // Auto-sélection de la modalité quand une seule option existe
  useEffect(() => {
    if (!data.location || data.modality || modalities.length !== 1) return;
    onUpdate({ modality: modalities[0].key });
  }, [data.location, data.modality, modalities]);

  // Auto-sélection de la période quand une seule option (ex. en ligne)
  useEffect(() => {
    if (!data.language || data.dateKey || dateOptions.length !== 1) return;
    onUpdate({ dateKey: dateOptions[0].key, duration: "", offeringId: undefined, price: undefined });
  }, [data.language, data.dateKey, dateOptions]);

  const handleLocationChange = (locationKey: string) => {
    const loc = locations.find((l) => l.key === locationKey);
    onUpdate({
      location: locationKey,
      locationLabel: loc?.label,
      modality: "",
      language: "",
      dateKey: "",
      duration: "",
      offeringId: undefined,
      price: undefined,
      isCustomFormat: false,
      customFormatDetails: undefined,
    });
  };

  const handleDurationChange = (value: string) => {
    if (value === CUSTOM_FORMAT_DURATION) {
      onUpdate({
        duration: value,
        isCustomFormat: true,
        offeringId: undefined,
        price: undefined,
        dates: "Projet personnalisé — devis sur demande",
        dateLabel: "Projet personnalisé — devis sur demande",
        startDate: undefined,
        endDate: undefined,
      });
      return;
    }
    onUpdate({
      duration: value,
      isCustomFormat: false,
      customFormatDetails: undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;
    onNext();
  };

  if (isLoading) {
    return (
      <SurfaceCard title="Lieu et formation" icon={MapPin}>
        <div className="space-y-4" aria-busy="true" aria-live="polite">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-11 w-full rounded-[var(--radius)]" />
          <Skeleton className="h-4 w-40" />
          <div className="grid gap-2 sm:grid-cols-3">
            <Skeleton className="h-14 rounded-[var(--radius-card)]" />
            <Skeleton className="h-14 rounded-[var(--radius-card)]" />
            <Skeleton className="h-14 rounded-[var(--radius-card)]" />
          </div>
          <Skeleton className="h-11 w-full rounded-[var(--radius)]" />
        </div>
      </SurfaceCard>
    );
  }

  if (isError || offerings.length === 0) {
    return (
      <StepCard
        title="Catalogue indisponible"
        description="Le catalogue des formations n'a pas pu être chargé."
        icon={MapPin}
      >
        <Alert variant="destructive">
          <AlertDescription>
            Le catalogue de formations n'est pas disponible pour le moment. Merci de contacter FLI
            directement.
          </AlertDescription>
        </Alert>
      </StepCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StepCard
        title="Lieu et formation"
        description="Commencez par choisir le lieu du cours — les langues, dates et tarifs s'adaptent à votre sélection. Les sessions en station seront publiées dès que le calendrier est confirmé."
        icon={MapPin}
      >
        <div className="space-y-6">
          <Alert className="bg-[hsl(var(--surface-sunken))]">
            <AlertDescription className="text-sm">
              <strong>Présentiel en station :</strong> aucune session n'est programmée pour le moment.
              Choisissez <strong>En ligne</strong> ou l'option <strong>Autres formats — sur devis</strong> pour
              une formation en station ou un projet personnalisé.
            </AlertDescription>
          </Alert>

          {/* 1. Lieu — toujours en premier */}
          <div className="space-y-2">
            <Label>Lieu du cours *</Label>
            <Select value={data.location || ""} onValueChange={handleLocationChange}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Où souhaitez-vous suivre la formation ?" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.key} value={loc.key}>
                    {loc.label}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({loc.count} option{loc.count > 1 ? "s" : ""})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {data.location && (
            <>
              {/* 2. Modalité */}
              {modalities.length > 1 && (
                <div className="animate-in fade-in slide-in-from-top-2 space-y-3">
                  <Label>Modalité</Label>
                  <RadioGroup
                    value={data.modality || ""}
                    onValueChange={(value) =>
                      onUpdate({
                        modality: value,
                        language: "",
                        dateKey: "",
                        duration: "",
                        offeringId: undefined,
                        price: undefined,
                        isCustomFormat: false,
                        customFormatDetails: undefined,
                      })
                    }
                    className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    {modalities.map((m) => (
                      <OptionCard key={m.key} selected={data.modality === m.key}>
                        <Label
                          htmlFor={`mod-${m.key}`}
                          className="flex min-h-12 cursor-pointer items-center gap-2.5 px-3 py-3 font-normal"
                        >
                          <RadioGroupItem value={m.key} id={`mod-${m.key}`} />
                          <span className="min-w-0">{m.label}</span>
                        </Label>
                      </OptionCard>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Auto-select modality if only one */}
              {modalities.length === 1 && data.modality === modalities[0].key && (
                <p className="animate-in fade-in text-sm text-muted-foreground">
                  Modalité : <span className="font-medium text-foreground">{modalities[0].label}</span>
                </p>
              )}

              {/* 3. Langue */}
              {(data.modality || modalities.length === 1) && (
                <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                  <Label>Langue à apprendre *</Label>
                  <Select
                    value={data.language || ""}
                    onValueChange={(value) =>
                      onUpdate({
                        language: value,
                        dateKey: "",
                        duration: "",
                        offeringId: undefined,
                        price: undefined,
                        isCustomFormat: false,
                        customFormatDetails: undefined,
                      })
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Sélectionnez une langue" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueLanguages(
                        modalityOfferings.length ? modalityOfferings : locationOfferings.filter(
                          (o) => o.modality_key === (data.modality || modalities[0]?.key)
                        )
                      ).map((lang) => (
                        <SelectItem key={lang.key} value={lang.key}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 4. Dates / session */}
              {data.language && dateOptions.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Période / dates *
                  </Label>
                  <Select
                    value={data.dateKey || ""}
                    onValueChange={(value) =>
                      onUpdate({
                        dateKey: value,
                        duration: "",
                        offeringId: undefined,
                        price: undefined,
                        isCustomFormat: false,
                        customFormatDetails: undefined,
                      })
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choisissez une session" />
                    </SelectTrigger>
                    <SelectContent>
                      {dateOptions.map((d) => (
                        <SelectItem key={d.key} value={d.key}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 5. Durée + prix */}
              {data.language && (dateOptions.length === 0 || data.dateKey) && (
                <div className="animate-in fade-in slide-in-from-top-2 space-y-3">
                  <Label>Durée de la formation *</Label>
                  <RadioGroup
                    value={data.duration || ""}
                    onValueChange={handleDurationChange}
                    className="grid gap-2 xs:grid-cols-2 lg:grid-cols-3"
                  >
                    {durations.map((d) => {
                      const offering = matchOffering(offerings, {
                        locationKey: data.location!,
                        modalityKey: data.modality || modalities[0]?.key,
                        languageKey: data.language,
                        dateKey: data.dateKey || dateOptions[0]?.key,
                        durationHours: d.hours,
                      });
                      const selected = data.duration === String(d.hours);
                      return (
                        <OptionCard key={d.hours} selected={selected}>
                          <RadioGroupItem
                            value={String(d.hours)}
                            id={`dur-${d.hours}`}
                            className="sr-only"
                          />
                          <Label
                            htmlFor={`dur-${d.hours}`}
                            className="flex min-h-16 w-full cursor-pointer flex-col items-center justify-center gap-0.5 p-3 text-center"
                          >
                            <span className="block font-semibold text-foreground">{d.label}</span>
                            {offering && (
                              <span className="block text-sm tabular text-muted-foreground">
                                {formatPriceEUR(offering.base_price)}
                              </span>
                            )}
                          </Label>
                        </OptionCard>
                      );
                    })}

                    {/* Autres formats — sur devis */}
                    <OptionCard
                      selected={isCustomFormat}
                      dashed
                      className="xs:col-span-2 lg:col-span-3"
                    >
                      <RadioGroupItem
                        value={CUSTOM_FORMAT_DURATION}
                        id="dur-custom"
                        className="sr-only"
                      />
                      <Label
                        htmlFor="dur-custom"
                        className="flex w-full cursor-pointer flex-col gap-0.5 p-4"
                      >
                        <span className="block font-semibold text-foreground">
                          Autres formats — sur devis
                        </span>
                        <span className="block text-sm font-normal text-muted-foreground">
                          Durée, modalité ou calendrier spécifique — nous vous envoyons une proposition
                        </span>
                      </Label>
                    </OptionCard>
                  </RadioGroup>

                  {isCustomFormat && (
                    <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                      <Label htmlFor="custom-format-details" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Décrivez votre projet *
                      </Label>
                      <Textarea
                        id="custom-format-details"
                        placeholder="Ex. : 10h en visio sur 5 semaines, objectif certification, disponibilités le mardi matin, groupe de 3 moniteurs de la même école…"
                        rows={5}
                        value={data.customFormatDetails || ""}
                        onChange={(e) => onUpdate({ customFormatDetails: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum 20 caractères. Notre équipe étudiera votre demande et vous enverra une
                        proposition personnalisée.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 6. Date de début souhaitée — offres sans session datée */}
              {needsRequestedStartDate && (
                <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                  <Label htmlFor="requested-start-date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date de début souhaitée *
                  </Label>
                  <Input
                    id="requested-start-date"
                    type="date"
                    min={today}
                    value={data.requestedStartDate || ""}
                    onChange={(e) => onUpdate({ requestedStartDate: e.target.value })}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cette formule n&apos;a pas de session au calendrier : indiquez quand vous
                    souhaitez commencer. L&apos;équipe FLI fixera les dates définitives avec vous.
                  </p>
                  {data.requestedStartDate && requestedStartDateError && (
                    <p className="text-xs text-destructive">
                      {REQUESTED_START_DATE_MESSAGES[requestedStartDateError]}
                    </p>
                  )}
                  {requestedStartDateHint && (
                    <p className="text-xs text-[hsl(var(--status-warning))]">
                      {requestedStartDateHint}
                    </p>
                  )}
                </div>
              )}

              {/* Financement */}
              {(selectedOffering || isCustomFormat) && (
                <div className="animate-in fade-in slide-in-from-top-2 space-y-3 border-t border-border pt-6">
                  <Label>Mode de financement *</Label>
                  <RadioGroup
                    value={data.fundingType || ""}
                    onValueChange={(value) => onUpdate({ fundingType: value })}
                    className="space-y-2"
                  >
                    <OptionCard selected={data.fundingType === "fifpl"}>
                      <Label
                        htmlFor="fifpl"
                        className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                      >
                        <RadioGroupItem value="fifpl" id="fifpl" />
                        FIFPL
                      </Label>
                    </OptionCard>
                    <OptionCard selected={data.fundingType === "opco"}>
                      <Label
                        htmlFor="opco"
                        className="flex cursor-pointer flex-col gap-1 px-4 py-3 font-normal"
                      >
                        <span className="flex min-h-6 items-center gap-3">
                          <RadioGroupItem value="opco" id="opco" />
                          OPCO
                        </span>
                        <span className="block pl-7 text-xs text-muted-foreground">
                          Financement par votre OPCO — votre dossier sera étudié par FLI. Aucun frais
                          ne sera facturé pour le moment.
                        </span>
                      </Label>
                    </OptionCard>
                    <OptionCard selected={data.fundingType === "company"}>
                      <Label
                        htmlFor="company"
                        className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                      >
                        <RadioGroupItem value="company" id="company" />
                        Entreprise (école de ski)
                      </Label>
                    </OptionCard>
                    <OptionCard selected={data.fundingType === "self"}>
                      <Label
                        htmlFor="self"
                        className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                      >
                        <RadioGroupItem value="self" id="self" />
                        Autofinancement
                      </Label>
                    </OptionCard>
                  </RadioGroup>
                </div>
              )}

              {/* Récap prix */}
              {isCustomFormat && (
                <Alert className="border-[hsl(var(--tint-gold-ring))] bg-[hsl(var(--tint-gold-bg))]">
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-medium">Demande de devis</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Pas de tarif affiché — vous recevrez une proposition de FLI après étude de votre
                      projet.
                    </span>
                  </AlertDescription>
                </Alert>
              )}
              {selectedOffering && !isCustomFormat && (
                <Alert className="border-primary/20 bg-[hsl(var(--surface-sunken))]">
                  <Euro className="h-4 w-4" />
                  <AlertDescription className="flex flex-wrap items-center gap-2">
                    <span>Tarif sélectionné :</span>
                    <StatusPill tone="warning" className="px-3 py-1 text-base">
                      {formatPriceEUR(selectedOffering.base_price)}
                    </StatusPill>
                    <span className="text-sm text-muted-foreground">
                      — {selectedOffering.location_label} · {selectedOffering.language_label} ·{" "}
                      {selectedOffering.duration_hours}h
                      {selectedOffering.date_label ? ` · ${selectedOffering.date_label}` : ""}
                    </span>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
      </StepCard>

      <StepActions>
        <Button type="submit" className="h-12 w-full text-base sm:w-auto" disabled={!canContinue}>
          Continuer
        </Button>
      </StepActions>
    </form>
  );
}
