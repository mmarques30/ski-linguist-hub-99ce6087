import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  buildAttendanceGroupKey,
  canInstructorValidateSlot,
  slotRangeForDayPart,
  slotRangeOnTheFly,
  type AttendanceDayPart,
  type AttendanceRecordStatus,
  type AttendanceSlotStatus,
} from "@/lib/attendance";
import type { FliScheduleSlot } from "@/lib/fli-schedule-slots";

export type AttendanceSlotRow = {
  id: string;
  instructor_id: string;
  session_id: string | null;
  inscription_id: string | null;
  group_key: string | null;
  title: string | null;
  slot_date: string;
  day_part: AttendanceDayPart;
  starts_at: string;
  ends_at: string;
  status: AttendanceSlotStatus;
  opened_at: string | null;
  instructor_validated_at: string | null;
  admin_validated_at: string | null;
  sign_token: string;
  sign_token_expires_at: string | null;
  created_at: string;
};

export type AttendanceRecordRow = {
  id: string;
  slot_id: string;
  student_id: string;
  inscription_id: string;
  status: AttendanceRecordStatus;
  signed_via: string | null;
  signed_at: string | null;
  note: string | null;
  students?: { first_name: string | null; last_name: string | null; email: string | null } | null;
  inscriptions?: { code: string | null } | null;
};

const SLOT_SELECT =
  "id, instructor_id, session_id, inscription_id, group_key, title, slot_date, day_part, starts_at, ends_at, status, opened_at, instructor_validated_at, admin_validated_at, sign_token, sign_token_expires_at, created_at";

const RECORD_SELECT =
  "id, slot_id, student_id, inscription_id, status, signed_via, signed_at, note, students(first_name, last_name, email), inscriptions(code)";

/** Client élargi le temps que le typage généré couvre les jointures émargement. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useAttendanceSlotsForInstructor(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["attendance-slots", instructorId],
    enabled: Boolean(instructorId),
    refetchInterval: 8_000,
    queryFn: async () => {
      const { data, error } = await db
        .from("attendance_slots")
        .select(SLOT_SELECT)
        .eq("instructor_id", instructorId!)
        .order("starts_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as AttendanceSlotRow[];
    },
  });
}

export function useAttendanceSlotsPendingAdmin() {
  return useQuery({
    queryKey: ["attendance-slots-pending-admin"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await db
        .from("attendance_slots")
        .select(SLOT_SELECT)
        .eq("status", "instructor_validated")
        .order("instructor_validated_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AttendanceSlotRow[];
    },
  });
}

export function useAttendanceRecords(slotId: string | undefined) {
  return useQuery({
    queryKey: ["attendance-records", slotId],
    enabled: Boolean(slotId),
    refetchInterval: 5_000,
    queryFn: async () => {
      const { data, error } = await db
        .from("attendance_records")
        .select(RECORD_SELECT)
        .eq("slot_id", slotId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AttendanceRecordRow[];
    },
  });
}

export function useAttendanceRate(inscriptionId: string | undefined) {
  return useQuery({
    queryKey: ["attendance-rate", inscriptionId],
    enabled: Boolean(inscriptionId),
    queryFn: async () => {
      const { data, error } = await db.rpc("compute_attendance_rate", {
        p_inscription_id: inscriptionId!,
      });
      if (error) throw error;
      return data as number | null;
    },
  });
}

export function useAttendanceSlotByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["attendance-slot-token", token],
    enabled: Boolean(token && token.length >= 16),
    queryFn: async () => {
      const { data, error } = await db.rpc("get_attendance_slot_by_token", {
        p_token: token!,
      });
      if (error) throw error;
      return data as {
        id: string;
        title: string | null;
        slot_date: string;
        day_part: AttendanceDayPart;
        starts_at: string;
        ends_at: string;
        status: AttendanceSlotStatus;
        sign_token_expires_at: string | null;
        pending_count: number;
        signed_count: number;
      } | null;
    },
  });
}

export function useSignAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, email }: { token: string; email: string }) => {
      const { data, error } = await db.rpc("sign_attendance_by_token", {
        p_token: token,
        p_email: email,
      });
      if (error) throw error;
      return data as {
        ok: boolean;
        already_signed: boolean;
        signed_at: string;
        student_first_name: string | null;
      };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["attendance-slot-token", vars.token] });
      qc.invalidateQueries({ queryKey: ["attendance-records"] });
      qc.invalidateQueries({ queryKey: ["attendance-slots"] });
    },
  });
}

type OpenIndividualInput = {
  instructorId: string;
  inscriptionId: string;
  studentId: string;
  title: string;
  durationHours?: number;
};

export function useOpenIndividualAttendanceSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OpenIndividualInput) => {
      const range = slotRangeOnTheFly(input.durationHours ?? 3);
      const { data: slot, error } = await db
        .from("attendance_slots")
        .insert({
          instructor_id: input.instructorId,
          inscription_id: input.inscriptionId,
          title: input.title,
          slot_date: range.slotDate,
          day_part: "custom",
          starts_at: range.startsAt.toISOString(),
          ends_at: range.endsAt.toISOString(),
          status: "open",
          opened_at: new Date().toISOString(),
          sign_token_expires_at: new Date(
            range.endsAt.getTime() + 2 * 60 * 60 * 1000
          ).toISOString(),
        })
        .select(SLOT_SELECT)
        .single();
      if (error) throw error;

      const { error: recErr } = await db.from("attendance_records").insert({
        slot_id: slot.id,
        student_id: input.studentId,
        inscription_id: input.inscriptionId,
        status: "pending",
      });
      if (recErr) throw recErr;
      return slot as AttendanceSlotRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-slots"] });
    },
  });
}

type OpenGroupInput = {
  instructorId: string;
  dayPart: FliScheduleSlot;
  slotDate: string;
  title: string;
  groupKey: string;
  members: Array<{ inscriptionId: string; studentId: string }>;
};

export function useOpenGroupAttendanceSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OpenGroupInput) => {
      if (input.members.length === 0) throw new Error("Aucun stagiaire dans le groupe");
      const range = slotRangeForDayPart(input.slotDate, input.dayPart);
      const { data: slot, error } = await db
        .from("attendance_slots")
        .insert({
          instructor_id: input.instructorId,
          group_key: input.groupKey,
          title: input.title,
          slot_date: input.slotDate,
          day_part: input.dayPart,
          starts_at: range.startsAt.toISOString(),
          ends_at: range.endsAt.toISOString(),
          status: "open",
          opened_at: new Date().toISOString(),
          sign_token_expires_at: new Date(
            range.endsAt.getTime() + 2 * 60 * 60 * 1000
          ).toISOString(),
        })
        .select(SLOT_SELECT)
        .single();
      if (error) throw error;

      const { error: recErr } = await db
        .from("attendance_records")
        .insert(
          input.members.map((m) => ({
            slot_id: slot.id,
            student_id: m.studentId,
            inscription_id: m.inscriptionId,
            status: "pending",
          }))
        );
      if (recErr) throw recErr;
      return slot as AttendanceSlotRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-slots"] });
    },
  });
}

export function useMarkAttendanceAbsentExcuse() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recordId,
      status,
      via,
    }: {
      recordId: string;
      status: "absent" | "excuse";
      via: "instructor" | "admin";
    }) => {
      const { error } = await db
        .from("attendance_records")
        .update({
          status,
          signed_via: via,
          signed_at: new Date().toISOString(),
          signed_by: user?.id ?? null,
        })
        .eq("id", recordId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-records"] });
      qc.invalidateQueries({ queryKey: ["attendance-slots"] });
    },
  });
}

export function useValidateAttendanceSlotInstructor() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      slotId,
      records,
    }: {
      slotId: string;
      records: Array<{ status: AttendanceRecordStatus }>;
    }) => {
      if (!canInstructorValidateSlot(records)) {
        throw new Error("Des stagiaires sont encore en attente de signature");
      }
      const { error } = await db
        .from("attendance_slots")
        .update({
          status: "instructor_validated",
          instructor_validated_at: new Date().toISOString(),
          instructor_validated_by: user?.id ?? null,
        })
        .eq("id", slotId)
        .eq("status", "open");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-slots"] });
      qc.invalidateQueries({ queryKey: ["attendance-slots-pending-admin"] });
    },
  });
}

export function useCountersignAttendanceSlot() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await db
        .from("attendance_slots")
        .update({
          status: "admin_validated",
          admin_validated_at: new Date().toISOString(),
          admin_validated_by: user?.id ?? null,
        })
        .eq("id", slotId)
        .eq("status", "instructor_validated");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-slots"] });
      qc.invalidateQueries({ queryKey: ["attendance-slots-pending-admin"] });
      qc.invalidateQueries({ queryKey: ["attendance-rate"] });
    },
  });
}

export { buildAttendanceGroupKey };
