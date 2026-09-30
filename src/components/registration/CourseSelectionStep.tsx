import { useMemo, useEffect, useState } from "react";
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
import { MapPin, Calendar, MessageSquare, Phone, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { RegistrationData } from "@/pages/register/Index";
import { useRegistrationOfferings } from "@/hooks/useRegistrationOfferings";
import {
  CUSTOM_FORMAT_DURATION,
  WAITLIST_MESSAGE,
  filterInPersonSessions,
  filterOnlineGroupSessions,
  filterOnlineIndividual,
  isCustomFormatDuration,
  isOpenOffering,
  isWaitlistOffering,
  uniqueDurations,
  uniqueLanguages,
  type RegistrationOffering,
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

type PathMode = "in_person" | "online";
type OnlineKind = "individual" | "group";

function sessionDateKey(o: RegistrationOffering): string {
  return o.start_date && o.end_date ? `${o.start_date}_${o.end_date}` : o.date_label || "flex";
}

export function CourseSelectionStep({ data, onUpdate, onNext }: CourseSelectionStepProps) {
  const { data: offerings = [], isLoading, isError } = useRegistrationOfferings();
  const [pathMode, setPathMode] = useState<PathMode | "">("");
  const [onlineKind, setOnlineKind] = useState<OnlineKind | "">("");
  const [waitlistForm, setWaitlistForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [waitlistSending, setWaitlistSending] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);

  const inPerson = useMemo(() => filterInPersonSessions(offerings), [offerings]);
  const onlineGroup = useMemo(() => filterOnlineGroupSessions(offerings), [offerings]);
  const onlineIndividual = useMemo(() => filterOnlineIndividual(offerings), [offerings]);

  // Restaure le chemin si l'utilisateur revient sur l'étape
  useEffect(() => {
    if (!data.modality) return;
    if (data.modality === "in_person") {
      setPathMode("in_person");
    } else if (data.modality === "online_group") {
      setPathMode("online");
      setOnlineKind("group");
    } else if (data.modality === "online_individual") {
      setPathMode("online");
      setOnlineKind("individual");
    }
  }, []);

  const selectedOffering = useMemo(() => {
    if (!data.offeringId) return null;
    return offerings.find((o) => o.id === data.offeringId) || null;
  }, [offerings, data.offeringId]);

  const individualLanguages = useMemo(
    () => uniqueLanguages(onlineIndividual),
    [onlineIndividual]
  );

  const individualForLanguage = useMemo(
    () =>
      data.language
        ? onlineIndividual.filter((o) => o.language_key === data.language)
        : [],
    [onlineIndividual, data.language]
  );

  const individualDurations = useMemo(
    () => uniqueDurations(individualForLanguage),
    [individualForLanguage]
  );

  const isCustomFormat = isCustomFormatDuration(data.duration);
  const selectedIsWaitlist = selectedOffering ? isWaitlistOffering(selectedOffering) : false;

  const needsRequestedStartDate =
    isCustomFormat || (!!selectedOffering && !offeringHasFixedDates(selectedOffering));
  const today = todayIso();
  const requestedStartDateError = needsRequestedStartDate
    ? requestedStartDateProblem(data.requestedStartDate, today)
    : null;
  const requestedStartDateHint = needsRequestedStartDate
    ? requestedStartDateNotice(data.requestedStartDate, today)
    : null;

  const canContinue = isCustomFormat
    ? !!data.fundingType &&
      !requestedStartDateError &&
      (data.customFormatDetails?.trim().length ?? 0) >= 20
    : !!selectedOffering &&
      isOpenOffering(selectedOffering) &&
      !!data.fundingType &&
      !requestedStartDateError;

  const applyOffering = (offering: RegistrationOffering) => {
    setWaitlistDone(false);
    // Tarif volontairement non fixé ici : affiché seulement après l'école (étape profil).
    onUpdate({
      offeringId: offering.id,
      price: undefined,
      duration: String(offering.duration_hours),
      dates: offering.date_label || undefined,
      startDate: offering.start_date || undefined,
      endDate: offering.end_date || undefined,
      requestedStartDate: offeringHasFixedDates(offering) ? undefined : data.requestedStartDate,
      dateKey: sessionDateKey(offering),
      dateLabel: offering.date_label || undefined,
      modality: offering.modality_key,
      language: offering.language_key,
      location: offering.location_key,
      locationLabel: offering.location_label,
      isCustomFormat: false,
      customFormatDetails: undefined,
    });
  };

  const resetCourseFields = (extra: Partial<RegistrationData> = {}) => {
    setWaitlistDone(false);
    onUpdate({
      offeringId: undefined,
      price: undefined,
      duration: "",
      dateKey: "",
      dates: undefined,
      dateLabel: undefined,
      startDate: undefined,
      endDate: undefined,
      requestedStartDate: undefined,
      fundingType: undefined,
      isCustomFormat: false,
      customFormatDetails: undefined,
      language: "",
      ...extra,
    });
  };

  const handlePathChange = (mode: PathMode) => {
    setPathMode(mode);
    setOnlineKind("");
    resetCourseFields({
      modality: mode === "in_person" ? "in_person" : "",
      location: mode === "online" ? "online" : "",
      locationLabel: mode === "online" ? "En ligne" : undefined,
    });
  };

  const handleOnlineKindChange = (kind: OnlineKind) => {
    setOnlineKind(kind);
    resetCourseFields({
      modality: kind === "group" ? "online_group" : "online_individual",
      location: "online",
      locationLabel: "En ligne",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;
    onNext();
  };

  const submitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffering) return;
    const { firstName, lastName, email, phone } = waitlistForm;
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error("Nom, prénom et e-mail sont requis.");
      return;
    }
    setWaitlistSending(true);
    try {
      const { error } = await supabase.from("registration_waitlist_requests").insert({
        offering_id: selectedOffering.id,
        session_code: selectedOffering.session_code ?? null,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
      });
      if (error) throw error;
      setWaitlistDone(true);
      toast.success("Merci — nous vous rappellerons dès que la formation est confirmée.");
    } catch (err) {
      console.error(err);
      toast.error("Envoi impossible pour le moment. Réessayez ou contactez FLI.");
    } finally {
      setWaitlistSending(false);
    }
  };

  if (isLoading) {
    return (
      <SurfaceCard title="Choisir une formation" icon={MapPin}>
        <div className="space-y-4" aria-busy="true" aria-live="polite">
          <Skeleton className="h-4 w-40" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-16 rounded-[var(--radius-card)]" />
            <Skeleton className="h-16 rounded-[var(--radius-card)]" />
          </div>
          <Skeleton className="h-24 w-full rounded-[var(--radius)]" />
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
            Le catalogue de formations n&apos;est pas disponible pour le moment. Merci de contacter
            FLI directement.
          </AlertDescription>
        </Alert>
      </StepCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StepCard
        title="Choisir une formation"
        description="Présentiel en station ou formation en ligne — les tarifs s’affichent après le choix de votre école. Les sessions en attente restent visibles pour laisser vos coordonnées."
        icon={MapPin}
      >
        <div className="space-y-6">
          {/* 1. Présentiel / En ligne */}
          <div className="space-y-3">
            <Label>Type de formation *</Label>
            <RadioGroup
              value={pathMode}
              onValueChange={(v) => handlePathChange(v as PathMode)}
              className="grid gap-2 sm:grid-cols-2"
            >
              <OptionCard selected={pathMode === "in_person"}>
                <Label
                  htmlFor="path-in-person"
                  className="flex min-h-14 cursor-pointer flex-col justify-center gap-0.5 px-4 py-3 font-normal"
                >
                  <span className="flex items-center gap-3 font-medium">
                    <RadioGroupItem value="in_person" id="path-in-person" />
                    Présentiel
                  </span>
                  <span className="pl-7 text-xs text-muted-foreground">
                    Stages en station ({inPerson.length} sessions)
                  </span>
                </Label>
              </OptionCard>
              <OptionCard selected={pathMode === "online"}>
                <Label
                  htmlFor="path-online"
                  className="flex min-h-14 cursor-pointer flex-col justify-center gap-0.5 px-4 py-3 font-normal"
                >
                  <span className="flex items-center gap-3 font-medium">
                    <RadioGroupItem value="online" id="path-online" />
                    En ligne
                  </span>
                  <span className="pl-7 text-xs text-muted-foreground">
                    Individuel ou collectif visio
                  </span>
                </Label>
              </OptionCard>
            </RadioGroup>
          </div>

          {/* 2a. Stages présentiel */}
          {pathMode === "in_person" && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Session / stage *
              </Label>
              <RadioGroup
                value={data.offeringId || ""}
                onValueChange={(id) => {
                  const o = inPerson.find((x) => x.id === id);
                  if (o) applyOffering(o);
                }}
                className="space-y-2"
              >
                {inPerson.map((o) => {
                  const waitlist = isWaitlistOffering(o);
                  return (
                    <OptionCard key={o.id} selected={data.offeringId === o.id}>
                      <Label
                        htmlFor={`sess-${o.id}`}
                        className="flex cursor-pointer flex-col gap-1 px-4 py-3 font-normal"
                      >
                        <span className="flex flex-wrap items-start gap-3">
                          <RadioGroupItem value={o.id} id={`sess-${o.id}`} className="mt-1" />
                          <span className="min-w-0 flex-1 space-y-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-foreground">
                                {o.location_label} · {o.language_label}
                              </span>
                              {waitlist ? (
                                <StatusPill tone="warning">En attente de confirmation</StatusPill>
                              ) : (
                                <StatusPill tone="success">Inscriptions ouvertes</StatusPill>
                              )}
                            </span>
                            <span className="block text-sm text-muted-foreground">
                              {o.date_label}
                              {o.format_label ? ` · ${o.format_label}` : ""}
                              {o.instructor_label ? ` · ${o.instructor_label}` : ""}
                            </span>
                          </span>
                        </span>
                      </Label>
                    </OptionCard>
                  );
                })}
              </RadioGroup>
            </div>
          )}

          {/* 2b. En ligne : individuel / collectif */}
          {pathMode === "online" && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-3">
              <Label>Formule en ligne *</Label>
              <RadioGroup
                value={onlineKind}
                onValueChange={(v) => handleOnlineKindChange(v as OnlineKind)}
                className="grid gap-2 sm:grid-cols-2"
              >
                <OptionCard selected={onlineKind === "individual"}>
                  <Label
                    htmlFor="online-individual"
                    className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                  >
                    <RadioGroupItem value="individual" id="online-individual" />
                    Individuel (packs d&apos;heures)
                  </Label>
                </OptionCard>
                <OptionCard selected={onlineKind === "group"}>
                  <Label
                    htmlFor="online-group"
                    className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                  >
                    <RadioGroupItem value="group" id="online-group" />
                    Collectif (visio groupée)
                  </Label>
                </OptionCard>
              </RadioGroup>
            </div>
          )}

          {pathMode === "online" && onlineKind === "group" && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-3">
              <Label>Session collective *</Label>
              <RadioGroup
                value={data.offeringId || ""}
                onValueChange={(id) => {
                  const o = onlineGroup.find((x) => x.id === id);
                  if (o) applyOffering(o);
                }}
                className="space-y-2"
              >
                {onlineGroup.map((o) => {
                  const waitlist = isWaitlistOffering(o);
                  return (
                    <OptionCard key={o.id} selected={data.offeringId === o.id}>
                      <Label
                        htmlFor={`grp-${o.id}`}
                        className="flex cursor-pointer flex-col gap-1 px-4 py-3 font-normal"
                      >
                        <span className="flex flex-wrap items-start gap-3">
                          <RadioGroupItem value={o.id} id={`grp-${o.id}`} className="mt-1" />
                          <span className="min-w-0 flex-1 space-y-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{o.language_label}</span>
                              {waitlist ? (
                                <StatusPill tone="warning">En attente de confirmation</StatusPill>
                              ) : (
                                <StatusPill tone="success">Inscriptions ouvertes</StatusPill>
                              )}
                            </span>
                            <span className="block text-sm text-muted-foreground">
                              {o.date_label}
                              {o.instructor_label ? ` · ${o.instructor_label}` : ""}
                            </span>
                          </span>
                        </span>
                      </Label>
                    </OptionCard>
                  );
                })}
              </RadioGroup>
            </div>
          )}

          {pathMode === "online" && onlineKind === "individual" && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
              <div className="space-y-2">
                <Label>Langue *</Label>
                <Select
                  value={data.language || ""}
                  onValueChange={(value) => {
                    resetCourseFields({
                      modality: "online_individual",
                      location: "online",
                      locationLabel: "En ligne",
                      language: value,
                    });
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Sélectionnez une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    {individualLanguages.map((lang) => (
                      <SelectItem key={lang.key} value={lang.key}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {data.language && (
                <div className="space-y-3">
                  <Label>Durée *</Label>
                  <RadioGroup
                    value={data.duration || ""}
                    onValueChange={(value) => {
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
                          modality: "online_individual",
                          location: "online",
                          locationLabel: "En ligne",
                        });
                        return;
                      }
                      const hours = parseInt(value, 10);
                      const o = individualForLanguage.find((x) => x.duration_hours === hours);
                      if (o) applyOffering(o);
                    }}
                    className="grid gap-2 xs:grid-cols-2 lg:grid-cols-3"
                  >
                    {individualDurations.map((d) => {
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
                            <span className="block font-semibold">{d.label}</span>
                          </Label>
                        </OptionCard>
                      );
                    })}
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
                        <span className="block font-semibold">Autres formats — sur devis</span>
                        <span className="block text-sm font-normal text-muted-foreground">
                          Durée ou calendrier spécifique
                        </span>
                      </Label>
                    </OptionCard>
                  </RadioGroup>

                  {isCustomFormat && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-format-details" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Décrivez votre projet *
                      </Label>
                      <Textarea
                        id="custom-format-details"
                        placeholder="Ex. : 10 h en visio sur 5 semaines…"
                        rows={4}
                        value={data.customFormatDetails || ""}
                        onChange={(e) => onUpdate({ customFormatDetails: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Waitlist : contact sans inscription */}
          {selectedOffering && selectedIsWaitlist && (
            <div className="animate-in fade-in space-y-4 border-t border-border pt-6">
              <Alert className="border-[hsl(var(--status-warning)/0.35)] bg-[hsl(var(--tint-gold-bg))]">
                <Phone className="h-4 w-4" />
                <AlertDescription>{WAITLIST_MESSAGE}</AlertDescription>
              </Alert>

              {waitlistDone ? (
                <p className="text-sm text-muted-foreground">
                  Votre demande est enregistrée. Vous pouvez fermer cette page ou choisir une autre
                  session ouverte pour vous inscrire maintenant.
                </p>
              ) : (
                <div className="space-y-3" onSubmit={submitWaitlist}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="wl-first" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Prénom *
                      </Label>
                      <Input
                        id="wl-first"
                        value={waitlistForm.firstName}
                        onChange={(e) =>
                          setWaitlistForm((p) => ({ ...p, firstName: e.target.value }))
                        }
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wl-last">Nom *</Label>
                      <Input
                        id="wl-last"
                        value={waitlistForm.lastName}
                        onChange={(e) =>
                          setWaitlistForm((p) => ({ ...p, lastName: e.target.value }))
                        }
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="wl-email">E-mail *</Label>
                      <Input
                        id="wl-email"
                        type="email"
                        value={waitlistForm.email}
                        onChange={(e) =>
                          setWaitlistForm((p) => ({ ...p, email: e.target.value }))
                        }
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wl-phone">Téléphone</Label>
                      <Input
                        id="wl-phone"
                        type="tel"
                        value={waitlistForm.phone}
                        onChange={(e) =>
                          setWaitlistForm((p) => ({ ...p, phone: e.target.value }))
                        }
                        className="h-11"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11"
                    disabled={waitlistSending}
                    onClick={(e) => void submitWaitlist(e)}
                  >
                    {waitlistSending ? "Envoi…" : "Laisser mes coordonnées"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Date souhaitée — packs flexibles */}
          {selectedOffering && !selectedIsWaitlist && needsRequestedStartDate && (
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
              {data.requestedStartDate && requestedStartDateError && (
                <p className="text-xs text-destructive">
                  {REQUESTED_START_DATE_MESSAGES[requestedStartDateError]}
                </p>
              )}
              {requestedStartDateHint && (
                <p className="text-xs text-[hsl(var(--status-warning))]">{requestedStartDateHint}</p>
              )}
            </div>
          )}

          {/* Financement — sessions ouvertes uniquement */}
          {selectedOffering && !selectedIsWaitlist && !isCustomFormat && (
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
                    className="flex cursor-pointer flex-col gap-1 px-4 py-3 font-normal"
                  >
                    <span className="flex min-h-6 items-center gap-3">
                      <RadioGroupItem value="fifpl" id="fifpl" />
                      FIFPL
                    </span>
                    <span className="block pl-7 text-xs text-muted-foreground">
                      Prise en charge FIFPL — attestation CFP URSSAF requise.
                    </span>
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

          {isCustomFormat && (
            <div className="space-y-3 border-t border-border pt-6">
              <Label>Mode de financement *</Label>
              <RadioGroup
                value={data.fundingType || ""}
                onValueChange={(value) => onUpdate({ fundingType: value })}
                className="space-y-2"
              >
                {(["fifpl", "opco", "company", "self"] as const).map((key) => (
                  <OptionCard key={key} selected={data.fundingType === key}>
                    <Label
                      htmlFor={`cf-${key}`}
                      className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                    >
                      <RadioGroupItem value={key} id={`cf-${key}`} />
                      {key === "fifpl"
                        ? "FIFPL"
                        : key === "opco"
                          ? "OPCO"
                          : key === "company"
                            ? "Entreprise (école de ski)"
                            : "Autofinancement"}
                    </Label>
                  </OptionCard>
                ))}
              </RadioGroup>
            </div>
          )}

          {selectedOffering && !selectedIsWaitlist && !isCustomFormat && (
            <p className="text-sm text-muted-foreground">
              Tarif selon votre école de ski — affiché à l&apos;étape profil professionnel.
            </p>
          )}
        </div>
      </StepCard>

      {!selectedIsWaitlist && (
        <StepActions>
          <Button type="submit" className="h-12 w-full text-base sm:w-auto" disabled={!canContinue}>
            Continuer
          </Button>
        </StepActions>
      )}
    </form>
  );
}
