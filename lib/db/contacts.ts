import type { SupabaseClient } from "@supabase/supabase-js";
import type { Contact } from "./types";

export async function findOrCreateContact(
  supabase: SupabaseClient,
  orgId: string,
  whatsappPhone: string,
  displayName?: string
): Promise<Contact> {
  const { data: existing } = await supabase
    .from("contacts")
    .select("*")
    .eq("org_id", orgId)
    .eq("whatsapp_phone", whatsappPhone)
    .maybeSingle();

  if (existing) return existing as Contact;

  const { data, error } = await supabase
    .from("contacts")
    .insert({ org_id: orgId, whatsapp_phone: whatsappPhone, display_name: displayName })
    .select("*")
    .single();
  if (error) throw error;
  return data as Contact;
}
