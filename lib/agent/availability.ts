import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DateTime } from "luxon";
import { getBusinessHours } from "@/lib/db/businessHours";
import { listAppointmentsInRange } from "@/lib/db/appointments";
import { getBusyIntervals } from "@/lib/google/calendar";
import { computeSlots, type BusyInterval } from "@/lib/utils/time";

// Calcula los huecos disponibles para un servicio en una fecha concreta,
// combinando horario del negocio, citas locales y Google Calendar (si está conectado).
export async function computeAvailableSlots(
  supabase: SupabaseClient,
  orgId: string,
  timezone: string,
  dateIso: string, // "yyyy-MM-dd"
  durationMinutes: number
): Promise<DateTime[]> {
  const date = DateTime.fromISO(dateIso, { zone: timezone }).startOf("day");
  const dayStart = date.toUTC().toISO()!;
  const dayEnd = date.endOf("day").toUTC().toISO()!;

  const [hours, localAppointments, googleBusy] = await Promise.all([
    getBusinessHours(supabase, orgId),
    listAppointmentsInRange(supabase, orgId, dayStart, dayEnd),
    getBusyIntervals(supabase, orgId, dayStart, dayEnd).catch(() => [] as BusyInterval[]),
  ]);

  const localBusy: BusyInterval[] = localAppointments.map((a) => ({
    start: DateTime.fromISO(a.starts_at).setZone(timezone),
    end: DateTime.fromISO(a.ends_at).setZone(timezone),
  }));

  const busy = [
    ...localBusy,
    ...googleBusy.map((b) => ({
      start: b.start.setZone(timezone),
      end: b.end.setZone(timezone),
    })),
  ];

  return computeSlots({
    date,
    hours,
    durationMinutes,
    busy,
    now: DateTime.now().setZone(timezone),
  });
}
