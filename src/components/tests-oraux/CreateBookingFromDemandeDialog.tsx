import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { LANGUAGE_LABELS } from "@/lib/evaluation-utils";
import {
  useCreateBookingFromDemande,
  type TestDemandRow,
} from "@/hooks/useTestDemands";

const SPONSOR_OPTIONS = [
  { value: "esf", label: "ESF" },
  { value: "ecole_ski", label: "École de ski (hors ESF)" },
  { value: "dsf", label: "DSF" },
] as const;

const PAYMENT_OPTIONS = [
  { value: "pending", label: "En attente" },
  { value: "school_invoice", label: "Facture école" },
  { value: "stripe", label: "Carte (Stripe)" },
  { value: "bank_transfer", label: "Virement" },
  { value: "invoice", label: "Facture individuelle" },
] as const;

const LANGUAGE_OPTIONS = Object.keys(LANGUAGE_LABELS).filter((k) => k !== "all");

function todayLocalDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toIsoLocal(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

export interface CreateBookingFromDemandeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demand: TestDemandRow | null;
  onCreated: (bookingId: string) => void;
}

export function CreateBookingFromDemandeDialog({
  open,
  onOpenChange,
  demand,
  onCreated,
}: CreateBookingFromDemandeDialogProps) {
  const create = useCreateBookingFromDemande();
  const [language, setLanguage] = useState("anglais");
  const [testDate, setTestDate] = useState(todayLocalDate);
  const [testTime, setTestTime] = useState("10:00");
  const [sponsorType, setSponsorType] = useState<"esf" | "ecole_ski" | "dsf">("esf");
  const [paymentType, setPaymentType] = useState("pending");
  const [instructorId, setInstructorId] = useState("");
  const [previousTest, setPreviousTest] = useState(false);
  const [previousResult, setPreviousResult] = useState("");

  useEffect(() => {
    if (!open || !demand) return;
    setLanguage("anglais");
    setTestDate(todayLocalDate());
    setTestTime("10:00");
    setSponsorType("esf");
    setPaymentType("pending");
    setInstructorId("");
    setPreviousTest(false);
    setPreviousResult("");
  }, [open, demand?.id]);

  const instructorsQuery = useQuery({
    queryKey: ["instructors-for-eval-create"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, first_name, last_name")
        .eq("is_active", true)
        .order("last_name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const canSubmit = useMemo(() => {
    if (!demand) return false;
    if (!language || !testDate || !testTime || !instructorId) return false;
    return true;
  }, [demand, language, testDate, testTime, instructorId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!demand || !canSubmit) return;
    try {
      const bookingId = await create.mutateAsync({
        candidateId: demand.id,
        language,
        datetimeIso: toIsoLocal(testDate, testTime),
        instructorId,
        sponsorType,
        paymentType,
        previousTest,
        previousResult: previousTest ? previousResult.trim() : undefined,
      });
      toast.success("Réservation créée", {
        description: `${demand.name} · créneau enregistré`,
      });
      onOpenChange(false);
      onCreated(bookingId);
    } catch (error) {
      toast.error("Création impossible", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer la réservation</DialogTitle>
          <DialogDescription>
            {demand
              ? `${demand.name} · ${demand.email}${demand.ski_school_name ? ` · ${demand.ski_school_name}` : ""}`
              : "Choisir langue, créneau et formateur."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label>Langue</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((code) => (
                  <SelectItem key={code} value={code}>
                    {LANGUAGE_LABELS[code] || code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="booking-date">Date</Label>
              <Input
                id="booking-date"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-time">Heure</Label>
              <Input
                id="booking-time"
                type="time"
                value={testTime}
                onChange={(e) => setTestTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Formateur</Label>
            <Select value={instructorId} onValueChange={setInstructorId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {(instructorsQuery.data ?? []).map((ins) => (
                  <SelectItem key={ins.id} value={ins.id}>
                    {ins.last_name} {ins.first_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Commanditaire</Label>
            <Select
              value={sponsorType}
              onValueChange={(v) => setSponsorType(v as "esf" | "ecole_ski" | "dsf")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPONSOR_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Paiement</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 rounded-[var(--radius)] border border-border p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={previousTest}
                onChange={(e) => setPreviousTest(e.target.checked)}
                className="h-4 w-4"
              />
              Test précédent
            </label>
            {previousTest && (
              <Input
                placeholder="Résultat précédent (ex. B1)"
                value={previousResult}
                onChange={(e) => setPreviousResult(e.target.value)}
              />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!canSubmit || create.isPending}>
              {create.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création…
                </>
              ) : (
                "Créer la réservation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
