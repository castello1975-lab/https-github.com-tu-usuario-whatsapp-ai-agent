import type { Organization, AgentSettings, Service, BusinessHour } from "@/lib/db/types";

const DAY_NAMES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

function formatHours(hours: BusinessHour[]): string {
  const ordered = [1, 2, 3, 4, 5, 6, 0].map((day) =>
    hours.find((h) => h.day_of_week === day)
  );
  return ordered
    .map((h) => {
      if (!h) return "";
      const name = DAY_NAMES[h.day_of_week];
      if (!h.is_open || !h.open_time || !h.close_time) return `- ${name}: cerrado`;
      return `- ${name}: ${h.open_time.slice(0, 5)} a ${h.close_time.slice(0, 5)}`;
    })
    .filter(Boolean)
    .join("\n");
}

function formatServices(services: Service[]): string {
  if (services.length === 0) return "(No hay servicios configurados todavía.)";
  return services
    .map(
      (s) =>
        `- ${s.name} (${s.duration_minutes} min)${s.description ? ": " + s.description : ""}`
    )
    .join("\n");
}

function formatFaqs(settings: AgentSettings): string {
  if (!settings.faqs || settings.faqs.length === 0) return "(Sin FAQs configuradas.)";
  return settings.faqs.map((f) => `P: ${f.question}\nR: ${f.answer}`).join("\n\n");
}

export function buildSystemPrompt(params: {
  org: Organization;
  settings: AgentSettings;
  services: Service[];
  hours: BusinessHour[];
  nowIso: string;
}): string {
  const { org, settings, services, hours, nowIso } = params;

  return `${settings.system_prompt}

${settings.tone ? `Tono: ${settings.tone}` : ""}

## Información del negocio
Nombre: ${org.business_name}
Dirección: ${org.address ?? "(no configurada)"}
Teléfono: ${org.phone ?? "(no configurado)"}
Zona horaria: ${org.timezone}
Fecha y hora actual: ${nowIso}

## Horario comercial
${formatHours(hours)}

## Servicios disponibles
${formatServices(services)}

## Preguntas frecuentes
${formatFaqs(settings)}

## Políticas
${settings.policies || "(Sin políticas adicionales configuradas.)"}

## Reglas estrictas
- No inventes servicios, precios, horarios ni políticas que no estén listados arriba.
- ${settings.ask_new_patient ? "Al agendar, pregunta siempre si es la primera vez del cliente o si ya es cliente habitual." : "No hace falta preguntar si es cliente nuevo."}
- Antes de crear, modificar o cancelar una cita, confirma explícitamente los datos con el cliente y espera su confirmación.
- Si el cliente pide hablar con una persona, o la conversación se sale de lo que puedes resolver, usa la herramienta de traspaso a humano.
- Usa siempre las herramientas disponibles para consultar disponibilidad real y para agendar/modificar/cancelar — nunca confirmes una cita sin haber llamado a la herramienta correspondiente.
- Responde siempre en el mismo idioma que use el cliente (por defecto, español).`;
}
