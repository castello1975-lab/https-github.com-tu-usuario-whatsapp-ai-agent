import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DateTime } from "luxon";
import type Anthropic from "@anthropic-ai/sdk";
import { findServiceByName } from "@/lib/db/services";
import {
  createAppointment,
  updateAppointment,
  listUpcomingAppointmentsForContact,
} from "@/lib/db/appointments";
import { computeAvailableSlots } from "./availability";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google/calendar";
import type { Organization } from "@/lib/db/types";

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "check_availability",
    description:
      "Consulta los huecos disponibles para un servicio en una fecha concreta. Úsalo antes de ofrecer o confirmar cualquier horario.",
    input_schema: {
      type: "object",
      properties: {
        service_name: { type: "string", description: "Nombre exacto del servicio" },
        date: { type: "string", description: "Fecha en formato YYYY-MM-DD" },
      },
      required: ["service_name", "date"],
    },
  },
  {
    name: "book_appointment",
    description:
      "Crea una nueva cita ya confirmada por el cliente. Solo llámala después de que el cliente haya confirmado explícitamente servicio, nombre y horario.",
    input_schema: {
      type: "object",
      properties: {
        service_name: { type: "string" },
        customer_name: { type: "string" },
        is_new_patient: { type: "boolean" },
        starts_at: {
          type: "string",
          description: "Fecha y hora local en formato YYYY-MM-DDTHH:mm (sin zona horaria)",
        },
      },
      required: ["service_name", "customer_name", "starts_at"],
    },
  },
  {
    name: "modify_appointment",
    description:
      "Cambia la fecha/hora de la próxima cita reservada de este cliente a un nuevo horario ya confirmado por el cliente.",
    input_schema: {
      type: "object",
      properties: {
        new_starts_at: {
          type: "string",
          description: "Nueva fecha y hora local en formato YYYY-MM-DDTHH:mm",
        },
      },
      required: ["new_starts_at"],
    },
  },
  {
    name: "cancel_appointment",
    description: "Cancela la próxima cita reservada de este cliente.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "handoff_to_human",
    description:
      "Transfiere la conversación a una persona del equipo. Úsala cuando el cliente lo pida explícitamente o cuando no puedas resolver la solicitud.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Motivo breve del traspaso" },
      },
      required: ["reason"],
    },
  },
];

export interface ToolContext {
  supabase: SupabaseClient;
  org: Organization;
  contactId: string;
  conversationId: string;
}

export interface ToolExecutionResult {
  output: string;
  handoffRequested?: boolean;
  handoffReason?: string;
}

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolExecutionResult> {
  switch (toolName) {
    case "check_availability":
      return checkAvailability(input, ctx);
    case "book_appointment":
      return bookAppointment(input, ctx);
    case "modify_appointment":
      return modifyAppointment(input, ctx);
    case "cancel_appointment":
      return cancelAppointment(ctx);
    case "handoff_to_human":
      return {
        output: "Traspaso a humano registrado.",
        handoffRequested: true,
        handoffReason: String(input.reason ?? ""),
      };
    default:
      return { output: `Herramienta desconocida: ${toolName}` };
  }
}

async function checkAvailability(
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolExecutionResult> {
  const serviceName = String(input.service_name ?? "");
  const date = String(input.date ?? "");

  const service = await findServiceByName(ctx.supabase, ctx.org.id, serviceName);
  if (!service) {
    return {
      output: `No existe un servicio llamado "${serviceName}" configurado. Revisa el nombre exacto.`,
    };
  }

  const slots = await computeAvailableSlots(
    ctx.supabase,
    ctx.org.id,
    ctx.org.timezone,
    date,
    service.duration_minutes
  );

  if (slots.length === 0) {
    return { output: `No hay disponibilidad para "${service.name}" el ${date}.` };
  }

  const formatted = slots.slice(0, 8).map((s) => s.toFormat("HH:mm")).join(", ");
  return { output: `Horarios disponibles para "${service.name}" el ${date}: ${formatted}` };
}

async function bookAppointment(
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolExecutionResult> {
  const serviceName = String(input.service_name ?? "");
  const customerName = String(input.customer_name ?? "");
  const isNewPatient =
    typeof input.is_new_patient === "boolean" ? input.is_new_patient : null;
  const startsAtLocal = String(input.starts_at ?? "");

  const service = await findServiceByName(ctx.supabase, ctx.org.id, serviceName);
  if (!service) {
    return { output: `No existe un servicio llamado "${serviceName}" configurado.` };
  }

  const start = DateTime.fromISO(startsAtLocal, { zone: ctx.org.timezone });
  if (!start.isValid) {
    return { output: `Fecha/hora inválida: ${startsAtLocal}` };
  }
  const end = start.plus({ minutes: service.duration_minutes });

  // Revalida disponibilidad justo antes de reservar (evita condiciones de carrera obvias).
  const dateIso = start.toFormat("yyyy-MM-dd");
  const slots = await computeAvailableSlots(
    ctx.supabase,
    ctx.org.id,
    ctx.org.timezone,
    dateIso,
    service.duration_minutes
  );
  const stillAvailable = slots.some((s) => s.toMillis() === start.toMillis());
  if (!stillAvailable) {
    return {
      output: `El horario ${start.toFormat("HH:mm")} del ${dateIso} ya no está disponible para "${service.name}". Ofrece otra alternativa usando check_availability.`,
    };
  }

  const appointment = await createAppointment(ctx.supabase, {
    orgId: ctx.org.id,
    conversationId: ctx.conversationId,
    contactId: ctx.contactId,
    serviceId: service.id,
    customerName,
    isNewPatient,
    startsAt: start.toUTC().toISO()!,
    endsAt: end.toUTC().toISO()!,
  });

  const googleEventId = await createCalendarEvent(ctx.supabase, ctx.org.id, {
    summary: `${service.name} — ${customerName}`,
    description: `Reservado vía WhatsApp. Servicio: ${service.name}.`,
    startIso: start.toUTC().toISO()!,
    endIso: end.toUTC().toISO()!,
    timezone: ctx.org.timezone,
  }).catch(() => null);

  if (googleEventId) {
    await updateAppointment(ctx.supabase, appointment.id, { google_event_id: googleEventId });
  }

  return {
    output: `Cita confirmada: "${service.name}" el ${start.toFormat("dd/MM/yyyy 'a las' HH:mm")} a nombre de ${customerName}.`,
  };
}

async function modifyAppointment(
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolExecutionResult> {
  const newStartsAtLocal = String(input.new_starts_at ?? "");

  const upcoming = await listUpcomingAppointmentsForContact(
    ctx.supabase,
    ctx.org.id,
    ctx.contactId
  );
  if (upcoming.length === 0) {
    return { output: "Este cliente no tiene ninguna cita próxima que modificar." };
  }
  const appointment = upcoming[0];

  const start = DateTime.fromISO(newStartsAtLocal, { zone: ctx.org.timezone });
  if (!start.isValid) {
    return { output: `Fecha/hora inválida: ${newStartsAtLocal}` };
  }
  const durationMinutes = DateTime.fromISO(appointment.ends_at).diff(
    DateTime.fromISO(appointment.starts_at),
    "minutes"
  ).minutes;
  const end = start.plus({ minutes: durationMinutes });

  await updateAppointment(ctx.supabase, appointment.id, {
    starts_at: start.toUTC().toISO()!,
    ends_at: end.toUTC().toISO()!,
  });

  if (appointment.google_event_id) {
    await updateCalendarEvent(ctx.supabase, ctx.org.id, appointment.google_event_id, {
      startIso: start.toUTC().toISO()!,
      endIso: end.toUTC().toISO()!,
      timezone: ctx.org.timezone,
    }).catch(() => null);
  }

  return {
    output: `Cita reprogramada al ${start.toFormat("dd/MM/yyyy 'a las' HH:mm")}.`,
  };
}

async function cancelAppointment(ctx: ToolContext): Promise<ToolExecutionResult> {
  const upcoming = await listUpcomingAppointmentsForContact(
    ctx.supabase,
    ctx.org.id,
    ctx.contactId
  );
  if (upcoming.length === 0) {
    return { output: "Este cliente no tiene ninguna cita próxima que cancelar." };
  }
  const appointment = upcoming[0];

  await updateAppointment(ctx.supabase, appointment.id, { status: "cancelled" });

  if (appointment.google_event_id) {
    await deleteCalendarEvent(ctx.supabase, ctx.org.id, appointment.google_event_id).catch(
      () => null
    );
  }

  return { output: "Cita cancelada correctamente." };
}
