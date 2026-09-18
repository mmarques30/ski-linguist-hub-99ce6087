import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  ClipboardList,
  Receipt,
  UserCog,
  Building2,
  Target,
  CreditCard,
  CalendarDays,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const DEBOUNCE_MS = 300;

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  const { data: results, isFetching } = useQuery({
    queryKey: ["global-search", debounced],
    enabled: open && debounced.length >= 2,
    queryFn: async () => {
      const term = `%${debounced}%`;
      const [
        students,
        inscriptionsByCode,
        invoices,
        instructors,
        partners,
        leads,
        payments,
        sessions,
      ] = await Promise.all([
        supabase
          .from("students")
          .select("id, first_name, last_name, email")
          .or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`)
          .limit(5),
        supabase
          .from("inscriptions")
          .select("id, code, language, students(first_name, last_name)")
          .ilike("code", term)
          .limit(5),
        supabase
          .from("invoices")
          .select("id, invoice_number, amount_ttc")
          .ilike("invoice_number", term)
          .limit(5),
        supabase
          .from("instructors")
          .select("id, first_name, last_name, email")
          .or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`)
          .limit(5),
        supabase
          .from("partners")
          .select("id, name, station, esf_code")
          .or(`name.ilike.${term},station.ilike.${term},esf_code.ilike.${term}`)
          .limit(5),
        supabase
          .from("leads")
          .select("id, contact_name, company, contact_email, status")
          .or(`contact_name.ilike.${term},company.ilike.${term},contact_email.ilike.${term}`)
          .limit(5),
        supabase
          .from("payments")
          .select("id, amount, payment_date, payer_name, reference, status")
          .or(`payer_name.ilike.${term},reference.ilike.${term}`)
          .limit(5),
        supabase
          .from("sessions")
          .select("id, title, language, start_datetime, location")
          .or(`title.ilike.${term},language.ilike.${term},location.ilike.${term}`)
          .limit(5),
      ]);

      // Inscriptions par nom de stagiaire (en plus du code)
      let inscriptionsByName: typeof inscriptionsByCode.data = [];
      const studentHits = students.data ?? [];
      if (studentHits.length > 0) {
        const ids = studentHits.map((s) => s.id);
        const { data } = await supabase
          .from("inscriptions")
          .select("id, code, language, students(first_name, last_name)")
          .in("student_id", ids)
          .limit(5);
        inscriptionsByName = data ?? [];
      }

      const inscById = new Map<
        string,
        {
          id: string;
          code: string | null;
          language: string;
          students: { first_name: string; last_name: string } | null;
        }
      >();
      for (const row of [...(inscriptionsByCode.data ?? []), ...inscriptionsByName]) {
        inscById.set(row.id, row as (typeof inscById extends Map<string, infer V> ? V : never));
      }

      return {
        students: studentHits,
        inscriptions: Array.from(inscById.values()),
        invoices: invoices.data ?? [],
        instructors: instructors.data ?? [],
        partners: partners.data ?? [],
        leads: leads.data ?? [],
        payments: payments.data ?? [],
        sessions: sessions.data ?? [],
      };
    },
  });

  const go = (path: string) => {
    setOpen(false);
    setQuery("");
    setDebounced("");
    navigate(path);
  };

  const hasAny =
    (results?.students?.length ?? 0) +
      (results?.inscriptions?.length ?? 0) +
      (results?.invoices?.length ?? 0) +
      (results?.instructors?.length ?? 0) +
      (results?.partners?.length ?? 0) +
      (results?.leads?.length ?? 0) +
      (results?.payments?.length ?? 0) +
      (results?.sessions?.length ?? 0) >
    0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-sm text-white/70 transition-all duration-200 hover:bg-white/20 hover:text-white"
        aria-label="Recherche globale"
      >
        <Search className="h-4 w-4" />
        <span>Rechercher...</span>
        <kbd className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>
      <button
        onClick={() => setOpen(true)}
        className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
        aria-label="Recherche globale"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Stagiaires, inscriptions, factures, partenaires, leads…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.length < 2 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Tapez au moins 2 caractères pour rechercher
            </div>
          ) : debounced.length < 2 || (isFetching && !results) ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Recherche…
            </div>
          ) : (
            <>
              {!hasAny && <CommandEmpty>Aucun résultat</CommandEmpty>}

              {results?.students && results.students.length > 0 && (
                <CommandGroup heading="Stagiaires">
                  {results.students.map((s) => (
                    <CommandItem
                      key={s.id}
                      value={`student-${s.id}`}
                      onSelect={() => go(`/students/${s.id}`)}
                    >
                      <Users className="mr-2 h-4 w-4 text-blue-500" />
                      <div className="flex flex-col">
                        <span>
                          {s.first_name} {s.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground">{s.email}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.inscriptions && results.inscriptions.length > 0 && (
                <CommandGroup heading="Inscriptions">
                  {results.inscriptions.map((i) => (
                    <CommandItem
                      key={i.id}
                      value={`insc-${i.id}`}
                      onSelect={() => go(`/inscriptions/${i.id}`)}
                    >
                      <ClipboardList className="mr-2 h-4 w-4 text-emerald-500" />
                      <div className="flex flex-col">
                        <span>
                          {i.code || "Sans code"} — {i.language}
                        </span>
                        {i.students && (
                          <span className="text-xs text-muted-foreground">
                            {(i.students as { first_name?: string; last_name?: string }).first_name}{" "}
                            {(i.students as { first_name?: string; last_name?: string }).last_name}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.invoices && results.invoices.length > 0 && (
                <CommandGroup heading="Factures">
                  {results.invoices.map((inv) => (
                    <CommandItem
                      key={inv.id}
                      value={`inv-${inv.id}`}
                      onSelect={() =>
                        go(`/invoices?q=${encodeURIComponent(inv.invoice_number || "")}`)
                      }
                    >
                      <Receipt className="mr-2 h-4 w-4 text-amber-500" />
                      <div className="flex flex-col">
                        <span>{inv.invoice_number}</span>
                        <span className="text-xs text-muted-foreground">
                          {inv.amount_ttc ? `${inv.amount_ttc} €` : ""}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.partners && results.partners.length > 0 && (
                <CommandGroup heading="Partenaires">
                  {results.partners.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={`partner-${p.id}`}
                      onSelect={() => go(`/gestion/partenaires/${p.id}`)}
                    >
                      <Building2 className="mr-2 h-4 w-4 text-sky-500" />
                      <div className="flex flex-col">
                        <span>{p.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {[p.station, p.esf_code].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.leads && results.leads.length > 0 && (
                <CommandGroup heading="Leads">
                  {results.leads.map((l) => (
                    <CommandItem
                      key={l.id}
                      value={`lead-${l.id}`}
                      onSelect={() => go(`/gestion/commercial`)}
                    >
                      <Target className="mr-2 h-4 w-4 text-orange-500" />
                      <div className="flex flex-col">
                        <span>{l.contact_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {[l.company, l.status].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.payments && results.payments.length > 0 && (
                <CommandGroup heading="Paiements">
                  {results.payments.map((pay) => (
                    <CommandItem
                      key={pay.id}
                      value={`pay-${pay.id}`}
                      onSelect={() => go(`/finance/payments`)}
                    >
                      <CreditCard className="mr-2 h-4 w-4 text-teal-500" />
                      <div className="flex flex-col">
                        <span>
                          {pay.amount} € — {pay.payer_name || pay.reference || "Paiement"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {pay.payment_date} · {pay.status}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.sessions && results.sessions.length > 0 && (
                <CommandGroup heading="Sessions">
                  {results.sessions.map((s) => (
                    <CommandItem
                      key={s.id}
                      value={`session-${s.id}`}
                      onSelect={() => go(`/formation/sessions`)}
                    >
                      <CalendarDays className="mr-2 h-4 w-4 text-indigo-500" />
                      <div className="flex flex-col">
                        <span>{s.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {s.language}
                          {s.location ? ` · ${s.location}` : ""}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.instructors && results.instructors.length > 0 && (
                <CommandGroup heading="Formateurs">
                  {results.instructors.map((ins) => (
                    <CommandItem
                      key={ins.id}
                      value={`form-${ins.id}`}
                      onSelect={() => go(`/formateurs/${ins.id}`)}
                    >
                      <UserCog className="mr-2 h-4 w-4 text-purple-500" />
                      <div className="flex flex-col">
                        <span>
                          {ins.first_name} {ins.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground">{ins.email}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
