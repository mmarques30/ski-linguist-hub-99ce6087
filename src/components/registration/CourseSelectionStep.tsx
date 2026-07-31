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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Euro } from "lucide-react";
import type { RegistrationData } from "@/pages/register/Index";
import { useRegistrationOfferings } from "@/hooks/useRegistrationOfferings";
import {
  filterByLocation,
  formatPriceEUR,
  matchOffering,
  uniqueDateOptions,
  uniqueDurations,
  uniqueLanguages,
  uniqueLocations,
  uniqueModalities,
} from "@/lib/registration-offerings";

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
    if (!data.location) return null;
    const durationHours = data.duration ? parseInt(data.duration, 10) : undefined;
    return matchOffering(offerings, {
      locationKey: data.location,
      modalityKey: data.modality || undefined,
      languageKey: data.language || undefined,
      dateKey: data.dateKey || undefined,
      durationHours: Number.isFinite(durationHours) ? durationHours : undefined,
    });
  }, [offerings, data]);

  useEffect(() => {
    if (!selectedOffering) return;
    onUpdate({
      offeringId: selectedOffering.id,
      price: selectedOffering.base_price,
      duration: String(selectedOffering.duration_hours),
      dates: selectedOffering.date_label || data.dates,
      startDate: selectedOffering.start_date || undefined,
      endDate: selectedOffering.end_date || undefined,
      dateLabel: selectedOffering.date_label || undefined,
      modality: selectedOffering.modality_key,
      language: selectedOffering.language_key,
      location: selectedOffering.location_key,
      locationLabel: selectedOffering.location_label,
    });
  }, [selectedOffering?.id]);

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
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffering) return;
    onNext();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError || offerings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertDescription>
              Le catalogue de formations n'est pas disponible pour le moment. Merci de contacter FLI
              directement.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Lieu et formation
        </CardTitle>
        <CardDescription>
          Commencez par choisir le lieu du cours — les langues, dates et tarifs s'adaptent à votre
          sélection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Lieu — toujours en premier */}
          <div className="space-y-2">
            <Label>Lieu du cours *</Label>
            <Select value={data.location || ""} onValueChange={handleLocationChange}>
              <SelectTrigger>
                <SelectValue placeholder="Où souhaitez-vous suivre la formation ?" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.key} value={loc.key}>
                    {loc.label}
                    <span className="text-muted-foreground ml-2 text-xs">
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
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
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
                      })
                    }
                    className="grid gap-2 md:grid-cols-3"
                  >
                    {modalities.map((m) => (
                      <div
                        key={m.key}
                        className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50"
                      >
                        <RadioGroupItem value={m.key} id={`mod-${m.key}`} />
                        <Label htmlFor={`mod-${m.key}`} className="font-normal cursor-pointer">
                          {m.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Auto-select modality if only one */}
              {modalities.length === 1 && data.modality === modalities[0].key && (
                <p className="text-sm text-muted-foreground animate-in fade-in">
                  Modalité : <span className="font-medium">{modalities[0].label}</span>
                </p>
              )}

              {/* 3. Langue */}
              {(data.modality || modalities.length === 1) && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
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
                      })
                    }
                  >
                    <SelectTrigger>
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
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Période / dates *
                  </Label>
                  <Select
                    value={data.dateKey || ""}
                    onValueChange={(value) =>
                      onUpdate({ dateKey: value, duration: "", offeringId: undefined, price: undefined })
                    }
                  >
                    <SelectTrigger>
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
              {data.language && (dateOptions.length === 0 || data.dateKey) && durations.length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <Label>Durée de la formation *</Label>
                  <RadioGroup
                    value={data.duration || ""}
                    onValueChange={(value) => onUpdate({ duration: value })}
                    className="grid gap-2 md:grid-cols-2 lg:grid-cols-3"
                  >
                    {durations.map((d) => {
                      const offering = matchOffering(offerings, {
                        locationKey: data.location!,
                        modalityKey: data.modality || modalities[0]?.key,
                        languageKey: data.language,
                        dateKey: data.dateKey || dateOptions[0]?.key,
                        durationHours: d.hours,
                      });
                      return (
                        <div
                          key={d.hours}
                          className="flex flex-col rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                        >
                          <RadioGroupItem
                            value={String(d.hours)}
                            id={`dur-${d.hours}`}
                            className="sr-only"
                          />
                          <Label
                            htmlFor={`dur-${d.hours}`}
                            className={`cursor-pointer text-center w-full p-2 rounded ${
                              data.duration === String(d.hours)
                                ? "bg-primary text-primary-foreground"
                                : ""
                            }`}
                          >
                            <span className="block font-semibold">{d.label}</span>
                            {offering && (
                              <span className="block text-sm opacity-90 mt-1">
                                {formatPriceEUR(offering.base_price)}
                              </span>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              )}

              {/* Financement */}
              {selectedOffering && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 border-t pt-6">
                  <Label>Mode de financement *</Label>
                  <RadioGroup
                    value={data.fundingType || ""}
                    onValueChange={(value) => onUpdate({ fundingType: value })}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50">
                      <RadioGroupItem value="opco" id="opco" />
                      <Label htmlFor="opco" className="font-normal cursor-pointer flex-1">
                        OPCO / FIFPL
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50">
                      <RadioGroupItem value="company" id="company" />
                      <Label htmlFor="company" className="font-normal cursor-pointer flex-1">
                        Entreprise (école de ski)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50">
                      <RadioGroupItem value="self" id="self" />
                      <Label htmlFor="self" className="font-normal cursor-pointer flex-1">
                        Autofinancement
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Récap prix */}
              {selectedOffering && (
                <Alert className="bg-muted/50 border-primary/20">
                  <Euro className="h-4 w-4" />
                  <AlertDescription className="flex flex-wrap items-center gap-2">
                    <span>Tarif sélectionné :</span>
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {formatPriceEUR(selectedOffering.base_price)}
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                      — {selectedOffering.location_label} · {selectedOffering.language_label} ·{" "}
                      {selectedOffering.duration_hours}h
                      {selectedOffering.date_label ? ` · ${selectedOffering.date_label}` : ""}
                    </span>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!data.location || !data.language || !data.duration || !data.fundingType || !selectedOffering}
          >
            Continuer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
