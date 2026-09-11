import type { SupabaseClient } from "@supabase/supabase-js";
import { encrypt, decrypt } from "@/lib/crypto/encryption";
import type { WhatsAppConnection } from "./types";

export async function getWhatsAppConnection(
  supabase: SupabaseClient,
  orgId: string
): Promise<WhatsAppConnection | null> {
  const { data, error } = await supabase
    .from("whatsapp_connection")
    .select("*")
    .eq("org_id", orgId)
    .maybeSingle();
  if (error) return null;
  return data as WhatsAppConnection | null;
}

// Usado por el webhook (admin client) para identificar a qué organización
// pertenece un mensaje entrante, a partir del phone_number_id de Meta.
export async function getWhatsAppConnectionByPhoneNumberId(
  supabase: SupabaseClient,
  phoneNumberId: string
): Promise<WhatsAppConnection | null> {
  const { data, error } = await supabase
    .from("whatsapp_connection")
    .select("*")
    .eq("phone_number_id", phoneNumberId)
    .maybeSingle();
  if (error) return null;
  return data as WhatsAppConnection | null;
}

// Usado por el handshake GET del webhook: acepta si CUALQUIER organización
// tiene guardado ese verify_token (Meta no manda identificador de negocio
// en esta llamada).
export async function verifyTokenExists(
  supabase: SupabaseClient,
  token: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("whatsapp_connection")
    .select("id")
    .eq("verify_token", token)
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function upsertWhatsAppConnection(
  supabase: SupabaseClient,
  orgId: string,
  params: {
    phoneNumberId: string;
    businessAccountId?: string;
    accessToken: string;
    appSecret: string;
    verifyToken: string;
  }
): Promise<void> {
  const existing = await getWhatsAppConnection(supabase, orgId);

  const { error } = await supabase.from("whatsapp_connection").upsert(
    {
      org_id: orgId,
      phone_number_id: params.phoneNumberId,
      business_account_id: params.businessAccountId || null,
      access_token_encrypted: encrypt(params.accessToken),
      app_secret_encrypted: encrypt(params.appSecret),
      verify_token: params.verifyToken,
      connected_at: existing?.connected_at ?? new Date().toISOString(),
    },
    { onConflict: "org_id" }
  );
  if (error) throw error;
}

export function decryptWhatsAppSecrets(connection: WhatsAppConnection): {
  accessToken: string;
  appSecret: string;
} {
  return {
    accessToken: decrypt(connection.access_token_encrypted),
    appSecret: decrypt(connection.app_secret_encrypted),
  };
}

export async function disconnectWhatsApp(
  supabase: SupabaseClient,
  orgId: string
): Promise<void> {
  const { error } = await supabase
    .from("whatsapp_connection")
    .delete()
    .eq("org_id", orgId);
  if (error) throw error;
}
