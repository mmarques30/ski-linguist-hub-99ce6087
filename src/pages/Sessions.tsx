import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Info, CalendarRange, CalendarClock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSeasonFilter } from "@/contexts/SeasonContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useSessions, type Session } from "@/hooks/useSessions";
import { SessionFormDialog } from "@/components/sessions/SessionFormDialog";
import { SessionDetailPanel } from "@/components/sessions/SessionDetailPanel";
import { UnassignedSidebar } from "@/components/sessions/UnassignedSidebar";
import { LANGUAGE_BLOCK_CLASS, toneForLanguage } from "@/components/sessions/session-tints";
import { LANGUAGE_LABELS } from "@/lib/language-catalog";
import {
  FilterBar,
  PageHeader,
  PageShell,
  SegmentedControl,
  SplitLayout,
  SurfaceCard,
} from "@/components/ui-kit";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  addWeeks, subWeeks, addMonths, subMonths,
  eachDayOfInterval, format, isToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const translations = {
  title: { fr: "Planning des sessions", "pt-BR": "Planejamento de sessões", en: "Session Planning" },
  subtitle: { fr: "Gérez les sessions de formation et l'affectation des stagiaires", "pt-BR": "Gerencie as sessões e a alocação de estagiários", en: "Manage training sessions and student assignments" },
  newSession: { fr: "Nouvelle session", "pt-BR": "Nova sessão", en: "New Session" },
  week: { fr: "Semaine", "pt-BR": "Semana", en: "Week" },
  month: { fr: "Mois", "pt-BR": "Mês", en: "Month" },
  allLangs: { fr: "Toutes les langues", "pt-BR": "Todos os idiomas", en: "All languages" },
  allInstructors: { fr: "Tous les formateurs", "pt-BR": "Todos os formadores", en: "All instructors" },
  today: { fr: "Aujourd'hui", "pt-BR": "Hoje", en: "Today" },
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7h-18h

export default function Sessions() {
  const { t } = useLanguage();
  const { seasonId, seasonStart, seasonEnd } = useSeasonFilter();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("classes");

  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterLang, setFilterLang] = useState("all");
  const [filterInstructor, setFilterInstructor] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [clickedSlot, setClickedSlot] = useState<Date | null>(null);

  // Date range
  const rangeStart = viewMode === "week"
    ? startOfWeek(currentDate, { weekStartsOn: 1 })
    : startOfMonth(currentDate);
  const rangeEnd = viewMode === "week"
    ? endOfWeek(currentDate, { weekStartsOn: 1 })
    : endOfMonth(currentDate);

  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  const { data: sessions } = useSessions({
    startDate: rangeStart.toISOString(),
    endDate: rangeEnd.toISOString(),
    language: filterLang,
    instructorId: filterInstructor,
    seasonId,
    seasonStart,
    seasonEnd,
  });

  const { data: instructors } = useQuery({
    queryKey: ["instructors-filter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("instructors")
        .select("id, first_name, last_name")
        .eq("status", "actif")
        .order("last_name");
      return data || [];
    },
  });

  const navigate = (dir: 1 | -1) => {
    if (viewMode === "week") {
      setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  };

  const handleSlotClick = (day: Date, hour: number) => {
    if (!editable) return;
    const slot = new Date(day);
    slot.setHours(hour, 0, 0, 0);
    setClickedSlot(slot);
    setEditSession(null);
    setFormOpen(true);
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
  };

  const handleEditSession = () => {
    if (selectedSession) {
      setEditSession(selectedSession);
      setClickedSlot(null);
      setFormOpen(true);
    }
  };

  // Group sessions by day for week view
  const sessionsByDay = useMemo(() => {
    const map = new Map<string, Session[]>();
    (sessions || []).forEach((s) => {
      const key = format(new Date(s.start_datetime), "yyyy-MM-dd");
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    });
    return map;
  }, [sessions]);

  const headerLabel = viewMode === "week"
    ? `${format(rangeStart, "d MMM", { locale: fr })} — ${format(rangeEnd, "d MMM yyyy", { locale: fr })}`
    : format(currentDate, "MMMM yyyy", { locale: fr });

  const instructorLabel = (id: string) => {
    const hit = instructors?.find((i) => i.id === id);
    return hit ? `${hit.first_name} ${hit.last_name}` : id;
  };

  /** Rappel des filtres actifs, effaçables un à un. */
  const activeFilters = [
    ...(filterLang !== "all"
      ? [{ key: "lang", label: filterLang, onRemove: () => setFilterLang("all") }]
      : []),
    ...(filterInstructor !== "all"
      ? [
          {
            key: "instructor",
            label: instructorLabel(filterInstructor),
            onRemove: () => setFilterInstructor("all"),
          },
        ]
      : []),
  ];

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title={t(translations.title)}
          description={t(translations.subtitle)}
          icon={CalendarDays}
          tone="blue"
          actions={
            editable ? (
              <Button onClick={() => { setEditSession(null); setClickedSlot(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />{t(translations.newSession)}
              </Button>
            ) : undefined
          }
        />

        <SplitLayout
          main={
            <>
              {(sessions?.length ?? 0) === 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Aucune session sur cette période</AlertTitle>
                  <AlertDescription>
                    Le planning est vide pour les dates affichées
                    {filterLang !== "all" || filterInstructor !== "all"
                      ? " (avec les filtres actifs)"
                      : ""}
                    . Ce n&apos;est pas un bug : créez une session ou changez de semaine / mois.
                  </AlertDescription>
                </Alert>
              )}

              <SurfaceCard
                flush
                title={<span className="capitalize">{headerLabel}</span>}
                actions={
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => navigate(-1)}
                      aria-label="Période précédente"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => navigate(1)}
                      aria-label="Période suivante"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
                      {t(translations.today)}
                    </Button>
                  </div>
                }
                toolbar={
                  <FilterBar
                    filters={
                      <>
                        <Select value={filterLang} onValueChange={setFilterLang}>
                          <SelectTrigger className="h-9 w-full text-xs sm:w-[170px]" aria-label={t(translations.allLangs)}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t(translations.allLangs)}</SelectItem>
                            {LANGUAGE_LABELS.map((l) => (
                              <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={filterInstructor} onValueChange={setFilterInstructor}>
                          <SelectTrigger className="h-9 w-full text-xs sm:w-[190px]" aria-label={t(translations.allInstructors)}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t(translations.allInstructors)}</SelectItem>
                            {instructors?.map((i) => (
                              <SelectItem key={i.id} value={i.id}>{i.first_name} {i.last_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    }
                    actions={
                      <SegmentedControl<"week" | "month">
                        value={viewMode}
                        onChange={setViewMode}
                        size="sm"
                        ariaLabel={t(translations.title)}
                        options={[
                          { value: "week", label: t(translations.week), icon: CalendarRange },
                          { value: "month", label: t(translations.month), icon: CalendarClock },
                        ]}
                      />
                    }
                    activeFilters={activeFilters}
                    onClearAll={
                      activeFilters.length > 0
                        ? () => {
                            setFilterLang("all");
                            setFilterInstructor("all");
                          }
                        : undefined
                    }
                  />
                }
              >
                {viewMode === "week" ? (
                  <WeekView
                    days={days}
                    sessionsByDay={sessionsByDay}
                    onSlotClick={handleSlotClick}
                    onSessionClick={handleSessionClick}
                    selectedSessionId={selectedSession?.id}
                  />
                ) : (
                  <MonthView
                    days={days}
                    sessionsByDay={sessionsByDay}
                    onDayClick={(day) => handleSlotClick(day, 9)}
                    onSessionClick={handleSessionClick}
                    currentDate={currentDate}
                  />
                )}
              </SurfaceCard>
            </>
          }
          rail={
            <>
              {selectedSession ? (
                <SessionDetailPanel
                  session={selectedSession}
                  onClose={() => setSelectedSession(null)}
                  onEdit={handleEditSession}
                />
              ) : null}
              <UnassignedSidebar selectedSessionId={selectedSession?.id} />
            </>
          }
        />
      </PageShell>

      <SessionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        session={editSession}
        defaultStart={clickedSlot}
      />
    </MainLayout>
  );
}

// ---- Week View ----
function WeekView({
  days,
  sessionsByDay,
  onSlotClick,
  onSessionClick,
  selectedSessionId,
}: {
  days: Date[];
  sessionsByDay: Map<string, Session[]>;
  onSlotClick: (day: Date, hour: number) => void;
  onSessionClick: (s: Session) => void;
  selectedSessionId?: string;
}) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="min-w-[640px]">
        {/* Day headers */}
        <div className="grid grid-cols-[52px_repeat(7,1fr)] border-y border-border bg-[hsl(var(--surface-sunken))]">
          <div className="p-2" />
          {days.slice(0, 7).map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "border-l border-border p-2 text-center text-xs font-medium",
                isToday(day) && "bg-primary/5"
              )}
            >
              <div className="capitalize text-muted-foreground">{format(day, "EEE", { locale: fr })}</div>
              <div className={cn("text-lg font-semibold tabular", isToday(day) && "text-primary")}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="grid max-h-[600px] grid-cols-[52px_repeat(7,1fr)] overflow-y-auto scrollbar-thin">
          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              <div className="flex h-14 items-start justify-end border-t border-border p-1.5 pr-2 text-2xs tabular text-muted-foreground">
                {hour}:00
              </div>
              {days.slice(0, 7).map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const daySessions = sessionsByDay.get(key) || [];
                const hourSessions = daySessions.filter((s) => {
                  const h = new Date(s.start_datetime).getHours();
                  return h === hour;
                });

                return (
                  <div
                    key={`${key}-${hour}`}
                    className={cn(
                      "relative h-14 cursor-pointer border-l border-t border-border transition-colors hover:bg-[hsl(var(--surface-sunken))]",
                      isToday(day) && "bg-primary/[0.03]"
                    )}
                    onClick={() => onSlotClick(day, hour)}
                  >
                    {hourSessions.map((s) => {
                      const startH = new Date(s.start_datetime).getHours();
                      const endH = new Date(s.end_datetime).getHours();
                      const durationBlocks = Math.max(endH - startH, 1);

                      return (
                        <div
                          key={s.id}
                          className={cn(
                            "absolute inset-x-0.5 z-10 cursor-pointer overflow-hidden rounded-sm border px-1 py-0.5 text-2xs leading-tight shadow-xs",
                            LANGUAGE_BLOCK_CLASS[toneForLanguage(s.language)],
                            selectedSessionId === s.id && "ring-2 ring-primary"
                          )}
                          style={{ height: `${durationBlocks * 56 - 4}px`, top: 0 }}
                          onClick={(e) => { e.stopPropagation(); onSessionClick(s); }}
                        >
                          <div className="truncate font-semibold">{s.title}</div>
                          <div className="truncate tabular">
                            {format(new Date(s.start_datetime), "HH:mm")}–{format(new Date(s.end_datetime), "HH:mm")}
                          </div>
                          {s.instructor_last_name && (
                            <div className="truncate opacity-75">{s.instructor_first_name} {s.instructor_last_name}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Month View ----
function MonthView({
  days,
  sessionsByDay,
  onDayClick,
  onSessionClick,
  currentDate,
}: {
  days: Date[];
  sessionsByDay: Map<string, Session[]>;
  onDayClick: (day: Date) => void;
  onSessionClick: (s: Session) => void;
  currentDate: Date;
}) {
  // Pad to start on Monday
  const firstDay = days[0];
  const dayOfWeek = firstDay.getDay();
  const paddingBefore = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="min-w-[640px]">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 border-y border-border bg-[hsl(var(--surface-sunken))]">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {/* Empty padding cells */}
          {Array.from({ length: paddingBefore }).map((_, i) => (
            <div
              key={`pad-${i}`}
              className="min-h-[100px] border-r border-t border-border bg-[hsl(var(--surface-sunken))]"
            />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const daySessions = sessionsByDay.get(key) || [];
            return (
              <div
                key={key}
                className={cn(
                  "min-h-[100px] cursor-pointer border-r border-t border-border p-1.5 transition-colors hover:bg-[hsl(var(--surface-sunken))]",
                  isToday(day) && "bg-primary/5"
                )}
                onClick={() => onDayClick(day)}
              >
                <div className={cn("mb-1 text-xs font-medium tabular", isToday(day) && "font-bold text-primary")}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {daySessions.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        "truncate rounded-sm border px-1 py-0.5 text-2xs",
                        LANGUAGE_BLOCK_CLASS[toneForLanguage(s.language)]
                      )}
                      onClick={(e) => { e.stopPropagation(); onSessionClick(s); }}
                    >
                      {format(new Date(s.start_datetime), "HH:mm")} {s.title}
                    </div>
                  ))}
                  {daySessions.length > 3 && (
                    <div className="text-2xs text-muted-foreground">+{daySessions.length - 3} autres</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
