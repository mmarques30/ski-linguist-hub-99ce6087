import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useSessions, type Session } from "@/hooks/useSessions";
import { SessionFormDialog } from "@/components/sessions/SessionFormDialog";
import { SessionDetailPanel } from "@/components/sessions/SessionDetailPanel";
import { UnassignedSidebar } from "@/components/sessions/UnassignedSidebar";
import { LANG_BG } from "@/lib/session-utils";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  addWeeks, subWeeks, addMonths, subMonths,
  eachDayOfInterval, format, isSameDay, isToday,
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
  });

  const { data: instructors } = useQuery({
    queryKey: ["instructors-filter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("instructors")
        .select("id, first_name, last_name")
        .eq("is_active", true)
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

  return (
    <MainLayout>
      <div className="flex gap-6">
        {/* Main calendar area */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t(translations.title)}</h1>
              <p className="text-muted-foreground text-sm">{t(translations.subtitle)}</p>
            </div>
            {editable && (
              <Button onClick={() => { setEditSession(null); setClickedSlot(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />{t(translations.newSession)}
              </Button>
            )}
          </div>

          {/* Navigation bar */}
          <div className="flex items-center justify-between rounded-lg border bg-card p-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-sm font-semibold capitalize min-w-[180px] text-center">{headerLabel}</h2>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
                {t(translations.today)}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm" className="rounded-none h-8"
                  onClick={() => setViewMode("week")}
                >
                  {t(translations.week)}
                </Button>
                <Button
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm" className="rounded-none h-8"
                  onClick={() => setViewMode("month")}
                >
                  {t(translations.month)}
                </Button>
              </div>
              <Select value={filterLang} onValueChange={setFilterLang}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t(translations.allLangs)}</SelectItem>
                  {["Anglais", "Portugais brésilien", "Russe", "Néerlandais", "Italien", "Allemand", "Espagnol"].map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterInstructor} onValueChange={setFilterInstructor}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t(translations.allInstructors)}</SelectItem>
                  {instructors?.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.first_name} {i.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calendar */}
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
        </div>

        {/* Right sidebar */}
        <div className="w-72 shrink-0 space-y-4 hidden lg:block">
          {selectedSession ? (
            <SessionDetailPanel
              session={selectedSession}
              onClose={() => setSelectedSession(null)}
              onEdit={handleEditSession}
            />
          ) : null}
          <UnassignedSidebar selectedSessionId={selectedSession?.id} />
        </div>
      </div>

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
    <div className="border rounded-lg bg-card overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
        <div className="p-2" />
        {days.slice(0, 7).map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "p-2 text-center text-xs font-medium border-l",
              isToday(day) && "bg-primary/5"
            )}
          >
            <div className="text-muted-foreground capitalize">{format(day, "EEE", { locale: fr })}</div>
            <div className={cn(
              "text-lg font-semibold",
              isToday(day) && "text-primary"
            )}>{format(day, "d")}</div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] max-h-[600px] overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="contents">
            <div className="p-1.5 text-[10px] text-muted-foreground text-right border-t h-14 flex items-start justify-end pr-2">
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
                    "border-t border-l h-14 relative cursor-pointer hover:bg-muted/30 transition-colors",
                    isToday(day) && "bg-primary/[0.02]"
                  )}
                  onClick={() => onSlotClick(day, hour)}
                >
                  {hourSessions.map((s) => {
                    const startH = new Date(s.start_datetime).getHours();
                    const endH = new Date(s.end_datetime).getHours();
                    const durationBlocks = Math.max(endH - startH, 1);
                    const colorClasses = LANG_BG[s.language] || "bg-muted border-border text-foreground";

                    return (
                      <div
                        key={s.id}
                        className={cn(
                          "absolute inset-x-0.5 rounded border px-1 py-0.5 text-[10px] leading-tight cursor-pointer z-10 overflow-hidden",
                          colorClasses,
                          selectedSessionId === s.id && "ring-2 ring-primary"
                        )}
                        style={{ height: `${durationBlocks * 56 - 4}px`, top: 0 }}
                        onClick={(e) => { e.stopPropagation(); onSessionClick(s); }}
                      >
                        <div className="font-semibold truncate">{s.title}</div>
                        <div className="truncate">
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
    <div className="border rounded-lg bg-card overflow-hidden">
      {/* Day of week headers */}
      <div className="grid grid-cols-7 border-b">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {/* Empty padding cells */}
        {Array.from({ length: paddingBefore }).map((_, i) => (
          <div key={`pad-${i}`} className="border-t border-r min-h-[100px] bg-muted/20" />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const daySessions = sessionsByDay.get(key) || [];
          return (
            <div
              key={key}
              className={cn(
                "border-t border-r min-h-[100px] p-1.5 cursor-pointer hover:bg-muted/30 transition-colors",
                isToday(day) && "bg-primary/5"
              )}
              onClick={() => onDayClick(day)}
            >
              <div className={cn(
                "text-xs font-medium mb-1",
                isToday(day) && "text-primary font-bold"
              )}>
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {daySessions.slice(0, 3).map((s) => {
                  const colorClasses = LANG_BG[s.language] || "bg-muted text-foreground";
                  return (
                    <div
                      key={s.id}
                      className={cn("text-[9px] px-1 py-0.5 rounded truncate border", colorClasses)}
                      onClick={(e) => { e.stopPropagation(); onSessionClick(s); }}
                    >
                      {format(new Date(s.start_datetime), "HH:mm")} {s.title}
                    </div>
                  );
                })}
                {daySessions.length > 3 && (
                  <div className="text-[9px] text-muted-foreground">+{daySessions.length - 3} autres</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
