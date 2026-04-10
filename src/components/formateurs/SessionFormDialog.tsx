import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateInstructorSession, checkScheduleConflict } from "@/hooks/useInstructors";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  instructorName: string;
}

export function SessionFormDialog({ open, onOpenChange, instructorId, instructorName }: Props) {
  const create = useCreateInstructorSession();
  const { toast } = useToast();
  const [form, setForm] = useState({
    session_date: "",
    start_time: "09:00",
    end_time: "12:00",
    location: "",
    notes: "",
  });

  const handleSubmit = async () => {
    const conflict = await checkScheduleConflict(
      instructorId,
      form.session_date,
      form.start_time,
      form.end_time
    );
    if (conflict) {
      toast({
        variant: "destructive",
        title: "Conflit d'horaire",
        description: "Ce formateur a déjà une session sur ce créneau.",
      });
      return;
    }

    const [sh, sm] = form.start_time.split(":").map(Number);
    const [eh, em] = form.end_time.split(":").map(Number);
    const duration = eh + em / 60 - (sh + sm / 60);

    await create.mutateAsync({
      instructor_id: instructorId,
      inscription_id: null,
      session_date: form.session_date,
      start_time: form.start_time,
      end_time: form.end_time,
      duration_hours: Math.round(duration * 100) / 100,
      status: "planifiee",
      location: form.location || null,
      notes: form.notes || null,
    });
    onOpenChange(false);
    setForm({ session_date: "", start_time: "09:00", end_time: "12:00", location: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle session — {instructorName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Date *</Label>
            <Input
              type="date"
              value={form.session_date}
              onChange={(e) => setForm((f) => ({ ...f, session_date: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Début</Label>
              <Input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
              />
            </div>
            <div>
              <Label>Fin</Label>
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Lieu</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={!form.session_date || create.isPending}>
              Créer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
