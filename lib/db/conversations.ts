import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation, ConversationEventType } from "./types";

export async function findOrCreateOpenConversation(
  supabase: SupabaseClient,
  orgId: string,
  contactId: string
): Promise<Conversation> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("org_id", orgId)
    .eq("contact_id", contactId)
    .neq("status", "closed")
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing as Conversation;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ org_id: orgId, contact_id: contactId })
    .select("*")
    .single();
  if (error) throw error;
  return data as Conversation;
}

export async function touchConversation(
  supabase: SupabaseClient,
  conversationId: string
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
  if (error) throw error;
}

export async function setBotEnabled(
  supabase: SupabaseClient,
  conversationId: string,
  orgId: string,
  enabled: boolean
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ bot_enabled: enabled })
    .eq("id", conversationId);
  if (error) throw error;

  await logConversationEvent(
    supabase,
    orgId,
    conversationId,
    enabled ? "bot_enabled" : "bot_disabled"
  );
}

export async function setConversationStatus(
  supabase: SupabaseClient,
  conversationId: string,
  status: Conversation["status"]
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ status })
    .eq("id", conversationId);
  if (error) throw error;
}

export async function logConversationEvent(
  supabase: SupabaseClient,
  orgId: string,
  conversationId: string,
  eventType: ConversationEventType,
  meta?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from("conversation_events").insert({
    org_id: orgId,
    conversation_id: conversationId,
    event_type: eventType,
    meta: meta ?? null,
  });
  if (error) throw error;
}

export async function listConversations(
  supabase: SupabaseClient,
  orgId: string
) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, contact:contacts(*)")
    .eq("org_id", orgId)
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getConversation(
  supabase: SupabaseClient,
  conversationId: string
) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, contact:contacts(*)")
    .eq("id", conversationId)
    .single();
  if (error) throw error;
  return data;
}
