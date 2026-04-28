import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, ClipboardList, Receipt, UserCog } from "lucide-react";
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

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
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

  const { data: results } = useQuery({
    queryKey: ["global-search", query],
    enabled: open && query.length >= 2,
    queryFn: async () => {
      const term = `%${query}%`;
      const [students, inscriptions, invoices, instructors] = await Promise.all([
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
      ]);
      return {
        students: students.data ?? [],
        inscriptions: inscriptions.data ?? [],
        invoices: invoices.data ?? [],
        instructors: instructors.data ?? [],
      };
    },
  });

  const go = (path: string) => {
    setOpen(false);
    setQuery("");
    navigate(path);
  };

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
          placeholder="Rechercher stagiaires, inscriptions, factures, formateurs..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.length < 2 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Tapez au moins 2 caractères pour rechercher
            </div>
          ) : (
            <>
              <CommandEmpty>Aucun résultat</CommandEmpty>

              {results?.students && results.students.length > 0 && (
                <CommandGroup heading="Stagiaires">
                  {results.students.map((s: any) => (
                    <CommandItem
                      key={s.id}
                      value={`student-${s.id}`}
                      onSelect={() => go(`/students/${s.id}`)}
                    >
                      <Users className="mr-2 h-4 w-4 text-blue-500" />
                      <div className="flex flex-col">
                        <span>{s.first_name} {s.last_name}</span>
                        <span className="text-xs text-muted-foreground">{s.email}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.inscriptions && results.inscriptions.length > 0 && (
                <CommandGroup heading="Inscriptions">
                  {results.inscriptions.map((i: any) => (
                    <CommandItem
                      key={i.id}
                      value={`insc-${i.id}`}
                      onSelect={() => go(`/inscriptions/${i.id}`)}
                    >
                      <ClipboardList className="mr-2 h-4 w-4 text-emerald-500" />
                      <div className="flex flex-col">
                        <span>{i.code || "Sans code"} — {i.language}</span>
                        {i.students && (
                          <span className="text-xs text-muted-foreground">
                            {i.students.first_name} {i.students.last_name}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.invoices && results.invoices.length > 0 && (
                <CommandGroup heading="Factures">
                  {results.invoices.map((inv: any) => (
                    <CommandItem
                      key={inv.id}
                      value={`inv-${inv.id}`}
                      onSelect={() => go(`/invoices`)}
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

              {results?.instructors && results.instructors.length > 0 && (
                <CommandGroup heading="Formateurs">
                  {results.instructors.map((ins: any) => (
                    <CommandItem
                      key={ins.id}
                      value={`form-${ins.id}`}
                      onSelect={() => go(`/formateurs/${ins.id}`)}
                    >
                      <UserCog className="mr-2 h-4 w-4 text-purple-500" />
                      <div className="flex flex-col">
                        <span>{ins.first_name} {ins.last_name}</span>
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
