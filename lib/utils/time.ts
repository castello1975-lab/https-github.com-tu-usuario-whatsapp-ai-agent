import { DateTime, Interval } from "luxon";

export interface BusinessHourRow {
  day_of_week: number; // 0 = domingo ... 6 = sábado
  is_open: boolean;
  open_time: string | null; // "HH:mm:ss"
  close_time: string | null;
}

export interface BusyInterval {
  start: DateTime;
  end: DateTime;
}

// Devuelve las ventanas horarias abiertas del negocio para un día concreto, en su timezone.
export function openWindowsForDate(
  date: DateTime,
  hours: BusinessHourRow[]
): Interval[] {
  const row = hours.find((h) => h.day_of_week === date.weekday % 7);
  if (!row || !row.is_open || !row.open_time || !row.close_time) return [];

  const [openH, openM] = row.open_time.split(":").map(Number);
  const [closeH, closeM] = row.close_time.split(":").map(Number);

  const start = date.set({
    hour: openH,
    minute: openM,
    second: 0,
    millisecond: 0,
  });
  const end = date.set({
    hour: closeH,
    minute: closeM,
    second: 0,
    millisecond: 0,
  });

  if (end <= start) return [];
  return [Interval.fromDateTimes(start, end)];
}

// Genera slots de `durationMinutes` dentro de las ventanas abiertas, quitando los ocupados.
export function computeSlots(params: {
  date: DateTime;
  hours: BusinessHourRow[];
  durationMinutes: number;
  busy: BusyInterval[];
  now: DateTime;
  stepMinutes?: number;
}): DateTime[] {
  const { date, hours, durationMinutes, busy, now, stepMinutes = 30 } = params;
  const windows = openWindowsForDate(date, hours);
  const slots: DateTime[] = [];

  for (const window of windows) {
    const windowEnd = window.end!;
    let cursor = window.start!;
    while (cursor.plus({ minutes: durationMinutes }) <= windowEnd) {
      const slotEnd = cursor.plus({ minutes: durationMinutes });
      const slotInterval = Interval.fromDateTimes(cursor, slotEnd);
      const overlapsBusy = busy.some((b) =>
        slotInterval.overlaps(Interval.fromDateTimes(b.start, b.end))
      );
      const isPast = cursor < now;
      if (!overlapsBusy && !isPast) {
        slots.push(cursor);
      }
      cursor = cursor.plus({ minutes: stepMinutes });
    }
  }

  return slots;
}
