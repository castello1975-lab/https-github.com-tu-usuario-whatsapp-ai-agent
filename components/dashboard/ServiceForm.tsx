"use client";

import { useTransition } from "react";
import type { Service } from "@/lib/db/types";
import {
  createServiceAction,
  updateServiceAction,
  deleteServiceAction,
} from "@/app/(dashboard)/customization/actions";

export function ServiceList({ initialServices }: { initialServices: Service[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {initialServices.map((service) => (
        <form
          key={service.id}
          action={(formData) =>
            startTransition(() => updateServiceAction(service.id, formData))
          }
          className="border border-neutral-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_auto_auto] gap-2 items-center"
        >
          <input
            name="name"
            defaultValue={service.name}
            placeholder="Nombre del servicio"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="description"
            defaultValue={service.description ?? ""}
            placeholder="Descripción"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="duration_minutes"
            type="number"
            min={5}
            step={5}
            defaultValue={service.duration_minutes}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-1.5 text-xs text-neutral-500">
            <input type="checkbox" name="active" defaultChecked={service.active} />
            Activo
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="text-xs bg-neutral-900 text-white rounded-lg px-3 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => startTransition(() => deleteServiceAction(service.id))}
              disabled={pending}
              className="text-xs text-red-600 hover:underline"
            >
              Eliminar
            </button>
          </div>
        </form>
      ))}

      <form
        action={(formData) => startTransition(() => createServiceAction(formData))}
        className="border border-dashed border-neutral-300 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_auto] gap-2 items-center"
      >
        <input
          name="name"
          placeholder="Nuevo servicio"
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          name="description"
          placeholder="Descripción"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          name="duration_minutes"
          type="number"
          min={5}
          step={5}
          defaultValue={30}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-xs bg-neutral-900 text-white rounded-lg px-3 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
        >
          + Añadir servicio
        </button>
      </form>
    </div>
  );
}
