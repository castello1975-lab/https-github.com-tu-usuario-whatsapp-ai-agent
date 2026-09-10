import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message, MessageDirection, MessageSenderType } from "./types";

export async function insertMessage(
  supabase: SupabaseClient,
  params: {
    orgId: string;
    conversationId: string;
    direction: MessageDirection;
    senderType: MessageSenderType;
    content: string;
    whatsappMessageId?: string | null;
  }
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      org_id: params.orgId,
      conversation_id: params.conversationId,
      direction: params.direction,
      sender_type: params.senderType,
      content: params.content,
      whatsapp_message_id: params.whatsappMessageId ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Message;
}

export async function listRecentMessages(
  supabase: SupabaseClient,
  conversationId: string,
  limit = 20
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as Message[]).reverse();
}

export async function updateMessageStatusByWhatsAppId(
  supabase: SupabaseClient,
  whatsappMessageId: string,
  status: Message["status"]
): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .update({ status })
    .eq("whatsapp_message_id", whatsappMessageId);
  if (error) throw error;
}
