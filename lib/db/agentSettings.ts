import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentSettings } from "./types";

const DEFAULT_SYSTEM_PROMPT = `Eres el asistente virtual de este negocio por WhatsApp.
Sé amable, claro y profesional. Saluda cordialmente y entiende bien qué necesita la persona
antes de responder. No inventes información sobre servicios, precios u horarios que no
tengas configurados: si no lo sabes, dilo y ofrece transferir con una persona del equipo.`;

export async function getAgentSettings(
  supabase: SupabaseClient,
  orgId: string
): Promise<AgentSettings | null> {
  const { data, error } = await supabase
    .from("agent_settings")
    .select("*")
    .eq("org_id", orgId)
    .single();
  if (error) return null;
  return data as AgentSettings;
}

export async function createDefaultAgentSettings(
  supabase: SupabaseClient,
  orgId: string
): Promise<void> {
  const { error } = await supabase.from("agent_settings").insert({
    org_id: orgId,
    system_prompt: DEFAULT_SYSTEM_PROMPT,
    tone: "Cercano y profesional",
    ask_new_patient: true,
    greeting_message: "¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte hoy?",
    handoff_message:
      "Ahora mismo te va a atender una persona de nuestro equipo. Un momento, por favor.",
    faqs: [],
    policies: "",
  });
  if (error) throw error;
}

export async function updateAgentSettings(
  supabase: SupabaseClient,
  orgId: string,
  patch: Partial<
    Pick<
      AgentSettings,
      | "system_prompt"
      | "tone"
      | "ask_new_patient"
      | "greeting_message"
      | "handoff_message"
      | "faqs"
      | "policies"
    >
  >
): Promise<void> {
  const { error } = await supabase
    .from("agent_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("org_id", orgId);
  if (error) throw error;
}
