"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";

interface EventItem {
  id?: string;
  summary?: string;
  start?: string;
  end?: string;
  appointment?: { customer_name: string; status: string } | null;
}

export function AppointmentsCalendar({ timezone }: { timezone: string }) {
  const [weekStart, setWeekStart] = useState(() => DateTime.now().startOf("week"));
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      const from = weekStart.toUTC().toISO()!;
      const to = weekStart.endOf("week").toUTC().toISO()!;
      try {
        const res = await fetch(
          `/api/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        );
        const data = await res.json();
        if (!ignore) setEvents(data.events ?? []);
      } catch {
        if (!ignore) setEvents([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [weekStart]);

  const days = Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekStart((w) => w.minus({ weeks: 1 }))}
          className="text-sm text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg px-3 py-1.5"
        >
          ← Semana anterior
        </button>
        <p className="text-sm font-medium text-neutral-800">
          {weekStart.setLocale("es").toFormat("d LLL")} –{" "}
          {weekStart.endOf("week").setLocale("es").toFormat("d LLL yyyy")}
        </p>
        <button
          onClick={() => setWeekStart((w) => w.plus({ weeks: 1 }))}
          className="text-sm text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg px-3 py-1.5"
        >
          Semana siguiente →
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {days.map((day) => {
            const dayEvents = events.filter((e) =>
              e.start
                ? DateTime.fromISO(e.start).setZone(timezone).hasSame(day, "day")
                : false
            );
            return (
              <div key={day.toISODate()} className="bg-white border border-neutral-200 rounded-xl p-3 min-h-[140px]">
                <p className="text-xs font-semibold text-neutral-500 mb-2">
                  {day.setLocale("es").toFormat("ccc d")}
                </p>
                <div className="space-y-1.5">
                  {dayEvents.map((e, i) => (
                    <div
                      key={e.id ?? i}
                      className="text-xs bg-neutral-100 rounded-lg px-2 py-1.5"
                    >
                      <p className="font-medium text-neutral-800">
                        {e.start
                          ? DateTime.fromISO(e.start).setZone(timezone).toFormat("HH:mm")
                          : ""}{" "}
                        {e.appointment?.customer_name ?? e.summary}
                      </p>
                    </div>
                  ))}
                  {dayEvents.length === 0 && (
                    <p className="text-xs text-neutral-300">Sin citas</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
