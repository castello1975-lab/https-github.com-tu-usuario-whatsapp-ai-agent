"use client";

import { useState, useTransition } from "react";
import type { BusinessHour } from "@/lib/db/types";
import { saveBusinessHourAction } from "@/app/(dashboard)/customization/actions";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function BusinessHoursEditor({ initialHours }: { initialHours: BusinessHour[] }) {
  const ordered = [1, 2, 3, 4, 5, 6, 0];
  const [hours, setHours] = useState(() => {
    const map = new Map(initialHours.map((h) => [h.day_of_week, h]));
    return ordered.map(
      (day) =>
        map.get(day) ?? {
          id: "",
          org_id: "",
          day_of_week: day,
          is_open: false,
          open_time: "09:00:00",
          close_time: "18:00:00",
        }
    );
  });
  const [pending, startTransition] = useTransition();

  function update(day: number, patch: Partial<BusinessHour>) {
    setHours((prev) =>
      prev.map((h) => (h.day_of_week === day ? { ...h, ...patch } : h))
    );
  }

  function save(day: number) {
    const row = hours.find((h) => h.day_of_week === day)!;
    startTransition(() => {
      saveBusinessHourAction(
        day,
        row.is_open,
        row.open_time?.slice(0, 5) ?? "09:00",
        row.close_time?.slice(0, 5) ?? "18:00"
      );
    });
  }

  return (
    <div className="space-y-2">
      {hours.map((h) => (
        <div
          key={h.day_of_week}
          className="flex items-center gap-3 border border-neutral-200 rounded-xl px-4 py-2.5"
        >
          <span className="w-28 text-sm font-medium text-neutral-800">
            {DAY_NAMES[h.day_of_week]}
          </span>
          <label className="flex items-center gap-1.5 text-xs text-neutral-500">
            <input
              type="checkbox"
              checked={h.is_open}
              onChange={(e) => {
                update(h.day_of_week, { is_open: e.target.checked });
              }}
            />
            Abierto
          </label>
          {h.is_open && (
            <>
              <input
                type="time"
                value={h.open_time?.slice(0, 5) ?? "09:00"}
                onChange={(e) => update(h.day_of_week, { open_time: e.target.value })}
                className="rounded-lg border border-neutral-300 px-2 py-1 text-sm"
              />
              <span className="text-neutral-400 text-sm">a</span>
              <input
                type="time"
                value={h.close_time?.slice(0, 5) ?? "18:00"}
                onChange={(e) => update(h.day_of_week, { close_time: e.target.value })}
                className="rounded-lg border border-neutral-300 px-2 py-1 text-sm"
              />
            </>
          )}
          <button
            onClick={() => save(h.day_of_week)}
            disabled={pending}
            className="ml-auto text-xs text-white bg-neutral-900 rounded-lg px-3 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      ))}
    </div>
  );
}
