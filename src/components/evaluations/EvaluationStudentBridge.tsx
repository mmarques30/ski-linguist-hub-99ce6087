import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui-kit";
import { Link2, UserRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Props = {
  candidateId: string | null | undefined;
  studentId: string | null | undefined;
  candidateName?: string | null;
  candidateEmail?: string | null;
  editable?: boolean;
};

export function EvaluationStudentBridge({
  candidateId,
  studentId,
  candidateName,
  candidateEmail,
  editable = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: linkedInscription } = useQuery({
    queryKey: ["eval-bridge-inscription", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inscriptions")
        .select("id, code, language, status")
        .eq("student_id", studentId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: matches = [], isFetching } = useQuery({
    queryKey: ["eval-bridge-students", q],
    enabled: open && q.trim().length >= 2,
    queryFn: async () => {
      const term = `%${q.trim()}%`;
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, email")
        .or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`)
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  const linkMutation = useMutation({
    mutationFn: async (targetStudentId: string) => {
      if (!candidateId) throw new Error("Candidat introuvable");
      const { error } = await supabase
        .from("test_candidates")
        .update({ student_id: targetStudentId })
        .eq("id", candidateId);
      if (error) throw error;
      return targetStudentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-bookings-to-evaluate"] });
      queryClient.invalidateQueries({ queryKey: ["completed-evaluations"] });
      toast({ title: "Stagiaire lié au test oral" });
      setOpen(false);
      setQ("");
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Liaison impossible", description: err.message });
    },
  });

  if (studentId) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone="success" icon={UserRound} size="sm">
          Stagiaire lié
        </StatusPill>
        <Button asChild variant="link" size="sm" className="h-auto px-0">
          <Link to={`/students/${studentId}`}>Voir la fiche</Link>
        </Button>
        {linkedInscription && (
          <Button asChild variant="link" size="sm" className="h-auto px-0">
            <Link to={`/inscriptions/${linkedInscription.id}`}>
              Inscription {linkedInscription.code || linkedInscription.language}
            </Link>
          </Button>
        )}
      </div>
    );
  }

  if (!editable || !candidateId) {
    return (
      <span className="text-xs text-muted-foreground">Non lié à un stagiaire</span>
    );
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 gap-1 text-xs"
        onClick={() => setOpen(true)}
      >
        <Link2 className="h-3 w-3" />
        Lier à un stagiaire
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rapprocher à un stagiaire</DialogTitle>
            <DialogDescription>
              Associe le candidat {candidateName || "du test"}
              {candidateEmail ? ` (${candidateEmail})` : ""} à une fiche stagiaire
              existante. L&apos;inscription la plus récente sera proposée ensuite.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Nom ou e-mail (2 caractères min.)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {q.trim().length < 2 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Commencez à taper pour chercher
              </p>
            ) : isFetching ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : matches.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Aucun stagiaire</p>
            ) : (
              matches.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-[var(--radius)] border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-[hsl(var(--surface-sunken))]"
                  onClick={() => linkMutation.mutate(s.id)}
                  disabled={linkMutation.isPending}
                >
                  <span>
                    {s.first_name} {s.last_name}
                    <span className="ml-2 text-xs text-muted-foreground">{s.email}</span>
                  </span>
                  {linkMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
