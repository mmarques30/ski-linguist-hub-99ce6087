import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateSkiMonitor, useUpdateSkiMonitor, SkiMonitor } from "@/hooks/useSkiMonitors";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monitor?: SkiMonitor | null;
}

export function SkiMonitorFormDialog({ open, onOpenChange, monitor }: Props) {
  const createMonitor = useCreateSkiMonitor();
  const updateMonitor = useUpdateSkiMonitor();
  const isEdit = !!monitor;

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    partner_id: "",
    ski_school_id: "",
    home_station: "",
    status: "active" as "active" | "unsubscribed",
    notes: "",
  });

  useEffect(() => {
    if (monitor) {
      setForm({
        first_name: monitor.first_name,
        last_name: monitor.last_name,
        email: monitor.email,
        phone: monitor.phone || "",
        partner_id: monitor.partner_id || "",
        ski_school_id: monitor.ski_school_id || "",
        home_station: monitor.home_station || "",
        status: monitor.status,
        notes: monitor.notes || "",
      });
    } else {
      setForm({
        first_name: "", last_name: "", email: "", phone: "",
        partner_id: "", ski_school_id: "", home_station: "",
        status: "active", notes: "",
      });
    }
  }, [monitor, open]);

  const { data: partners = [] } = useQuery({
    queryKey: ["partners-esf-select"],
    queryFn: async () => {
      const { data } = await supabase
        .from("partners")
        .select("id, name, station")
        .eq("type", "esf")
        .in("status", ["actif", "prospect"])
        .order("name");
      return data || [];
    },
  });

  const { data: skiSchools = [] } = useQuery({
    queryKey: ["ski-schools-select"],
    queryFn: async () => {
      const { data } = await supabase.from("ski_schools").select("id, name").order("name");
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      partner_id: form.partner_id || null,
      ski_school_id: form.ski_school_id || null,
      phone: form.phone || null,
      home_station: form.home_station || null,
      notes: form.notes || null,
    };

    try {
      if (isEdit && monitor) {
        await updateMonitor.mutateAsync({ id: monitor.id, ...payload });
        toast.success("Moniteur mis à jour");
      } else {
        await createMonitor.mutateAsync(payload);
        toast.success("Moniteur ajouté");
      }
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le moniteur" : "Nouveau moniteur"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prénom *</Label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>École de ski (partenaire)</Label>
              <Select value={form.partner_id} onValueChange={(v) => setForm({ ...form, partner_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}{p.station ? ` (${p.station})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Station habituelle</Label>
              <Input value={form.home_station} onChange={(e) => setForm({ ...form, home_station: e.target.value })} placeholder="ex. Val d'Isère" />
            </div>
          </div>

          <div>
            <Label>Statut</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "unsubscribed" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="unsubscribed">Désinscrit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={createMonitor.isPending || updateMonitor.isPending}>
              {isEdit ? "Mettre à jour" : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
