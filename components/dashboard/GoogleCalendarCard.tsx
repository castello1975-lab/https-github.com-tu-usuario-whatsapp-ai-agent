"use client";

import { useEffect, useState, useTransition } from "react";
import { disconnectGoogleAction } from "@/app/(dashboard)/integrations/actions";

interface Calendar {
  id: string;
  summary: string;
  primary: boolean;
}

export function GoogleCalendarCard({
  connected,
  accountEmail,
  currentCalendarId,
}: {
  connected: boolean;
  accountEmail: string | null;
  currentCalendarId: string | null;
}) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selected, setSelected] = useState(currentCalendarId ?? "");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!connected) return;
    fetch("/api/calendar/calendars")
      .then((res) => res.json())
      .then((data) => setCalendars(data.calendars ?? []))
      .catch(() => {});
  }, [connected]);

  async function saveCalendar(calendarId: string) {
    setSelected(calendarId);
    await fetch("/api/calendar/calendars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendarId }),
    });
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Google Calendar</h3>
          <p className="text-xs text-neutral-500">
            {connected ? `Conectado como ${accountEmail}` : "No conectado"}
          </p>
        </div>
        {connected ? (
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
        )}
      </div>

      {connected ? (
        <>
          {calendars.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Calendario a sincronizar
              </label>
              <select
                value={selected}
                onChange={(e) => saveCalendar(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Selecciona un calendario</option>
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.summary} {cal.primary ? "(principal)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => startTransition(() => disconnectGoogleAction())}
            disabled={pending}
            className="text-xs text-red-600 hover:underline"
          >
            Desconectar
          </button>
        </>
      ) : (
        <a
          href="/api/auth/google"
          className="inline-block text-sm bg-neutral-900 text-white rounded-lg px-4 py-2 hover:bg-neutral-800"
        >
          Conectar Google Calendar
        </a>
      )}
    </div>
  );
}
