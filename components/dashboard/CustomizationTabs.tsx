"use client";

import { Tabs } from "@/components/ui/Tabs";
import { FaqEditor } from "./FaqEditor";
import { BusinessHoursEditor } from "./BusinessHoursEditor";
import { ServiceList } from "./ServiceForm";
import {
  saveBusinessInfoAction,
  savePersonaAction,
  saveMessagesAction,
} from "@/app/(dashboard)/customization/actions";
import type { Organization, AgentSettings, BusinessHour, Service } from "@/lib/db/types";

export function CustomizationTabs({
  org,
  settings,
  hours,
  services,
}: {
  org: Organization;
  settings: AgentSettings;
  hours: BusinessHour[];
  services: Service[];
}) {
  return (
    <Tabs
      tabs={[
        {
          key: "persona",
          label: "Persona",
          content: (
            <form action={savePersonaAction} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Rol y reglas del agente (system prompt)
                </label>
                <textarea
                  name="system_prompt"
                  defaultValue={settings.system_prompt}
                  rows={8}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Tono
                </label>
                <input
                  name="tone"
                  defaultValue={settings.tone ?? ""}
                  placeholder="Cercano y profesional"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  name="ask_new_patient"
                  defaultChecked={settings.ask_new_patient}
                />
                Preguntar si el cliente es nuevo al agendar una cita
              </label>
              <SaveButton />
            </form>
          ),
        },
        {
          key: "business",
          label: "Info del negocio",
          content: (
            <div className="space-y-8 max-w-2xl">
              <form action={saveBusinessInfoAction} className="space-y-4">
                <Field label="Nombre" name="business_name" defaultValue={org.business_name} />
                <Field label="Dirección" name="address" defaultValue={org.address ?? ""} />
                <Field label="Teléfono" name="phone" defaultValue={org.phone ?? ""} />
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Políticas
                  </label>
                  <textarea
                    name="policies"
                    defaultValue={settings.policies ?? ""}
                    rows={4}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <SaveButton />
              </form>

              <div>
                <h3 className="text-sm font-semibold text-neutral-800 mb-2">
                  Preguntas frecuentes
                </h3>
                <FaqEditor initialFaqs={settings.faqs} />
              </div>
            </div>
          ),
        },
        {
          key: "hours",
          label: "Horarios",
          content: <BusinessHoursEditor initialHours={hours} />,
        },
        {
          key: "services",
          label: "Servicios",
          content: <ServiceList initialServices={services} />,
        },
        {
          key: "messages",
          label: "Mensajes",
          content: (
            <form action={saveMessagesAction} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Mensaje de saludo inicial
                </label>
                <textarea
                  name="greeting_message"
                  defaultValue={settings.greeting_message}
                  rows={2}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Mensaje de traspaso a humano
                </label>
                <textarea
                  name="handoff_message"
                  defaultValue={settings.handoff_message}
                  rows={2}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <SaveButton />
            </form>
          ),
        },
      ]}
    />
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
      />
    </div>
  );
}

function SaveButton() {
  return (
    <button
      type="submit"
      className="text-sm bg-neutral-900 text-white rounded-lg px-4 py-2 hover:bg-neutral-800"
    >
      Guardar cambios
    </button>
  );
}
