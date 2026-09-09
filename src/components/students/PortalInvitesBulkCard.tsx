import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInviteStudentPortal } from "@/hooks/useInviteStudentPortal";

export function PortalInvitesBulkCard() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const invitePortal = useInviteStudentPortal();

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["portal-invite-candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, email, auth_user_id")
        .not("email", "is", null)
        .is("auth_user_id", null)
        .order("last_name", { ascending: true })
        .limit(200);

      if (error) throw error;
      return data;
    },
  });

  const allSelected = candidates.length > 0 && selectedIds.size === candidates.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map((s) => s.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selectedIds.size;

  const handleInvite = async () => {
    if (!selectedCount) {
      toast.error("Sélectionnez au moins un stagiaire");
      return;
    }

    try {
      const result = await invitePortal.mutateAsync({
        studentIds: Array.from(selectedIds),
        sendEmail: true,
      });
      toast.success(
        `${result.succeeded} invitation(s) envoyée(s)${
          result.failed ? `, ${result.failed} échec(s)` : ""
        }`
      );
      setSelectedIds(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invitations portail stagiaire
        </CardTitle>
        <CardDescription>
          Envoi en masse d&apos;un lien de connexion magic link vers l&apos;espace /student/*
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription className="text-sm">
            Chaque stagiaire reçoit un email avec un lien sécurisé. Un compte est créé automatiquement
            s&apos;il n&apos;existe pas encore.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tous les stagiaires avec email ont déjà un compte portail lié.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} id="select-all-portal" />
                <label htmlFor="select-all-portal" className="text-sm cursor-pointer">
                  Tout sélectionner ({candidates.length})
                </label>
              </div>
              <Badge variant="outline">{selectedCount} sélectionné(s)</Badge>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
              {candidates.map((student) => (
                <label
                  key={student.id}
                  className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedIds.has(student.id)}
                    onCheckedChange={() => toggleOne(student.id)}
                  />
                  <span className="flex-1">
                    {student.first_name} {student.last_name}
                  </span>
                  <span className="text-muted-foreground text-xs truncate max-w-[180px]">
                    {student.email}
                  </span>
                </label>
              ))}
            </div>

            <Button
              type="button"
              disabled={!selectedCount || invitePortal.isPending}
              onClick={handleInvite}
              className="w-full sm:w-auto"
            >
              {invitePortal.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Envoyer {selectedCount || ""} invitation{selectedCount > 1 ? "s" : ""}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
