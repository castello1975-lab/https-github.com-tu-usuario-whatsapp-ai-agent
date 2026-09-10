import type { SupabaseClient } from "@supabase/supabase-js";
import { encrypt, decrypt } from "@/lib/crypto/encryption";
import type { GoogleCalendarConnection } from "./types";

export async function getGoogleConnection(
  supabase: SupabaseClient,
  orgId: string
): Promise<GoogleCalendarConnection | null> {
  const { data, error } = await supabase
    .from("google_calendar_connection")
    .select("*")
    .eq("org_id", orgId)
    .maybeSingle();
  if (error) return null;
  return data as GoogleCalendarConnection | null;
}

export async function upsertGoogleConnection(
  supabase: SupabaseClient,
  orgId: string,
  params: {
    googleAccountEmail: string;
    calendarId?: string;
    accessToken: string;
    refreshToken?: string; // Google solo lo manda la primera vez (prompt=consent)
    tokenExpiry: Date;
    scope: string;
  }
): Promise<void> {
  const existing = await getGoogleConnection(supabase, orgId);

  const row: Record<string, unknown> = {
    org_id: orgId,
    google_account_email: params.googleAccountEmail,
    access_token_encrypted: encrypt(params.accessToken),
    token_expiry: params.tokenExpiry.toISOString(),
    scope: params.scope,
    connected_at: existing?.connected_at ?? new Date().toISOString(),
  };
  if (params.calendarId) row.calendar_id = params.calendarId;
  if (params.refreshToken) {
    row.refresh_token_encrypted = encrypt(params.refreshToken);
  }

  const { error } = await supabase
    .from("google_calendar_connection")
    .upsert(row, { onConflict: "org_id" });
  if (error) throw error;
}

export async function setCalendarId(
  supabase: SupabaseClient,
  orgId: string,
  calendarId: string
): Promise<void> {
  const { error } = await supabase
    .from("google_calendar_connection")
    .update({ calendar_id: calendarId })
    .eq("org_id", orgId);
  if (error) throw error;
}

export function decryptTokens(connection: GoogleCalendarConnection): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  return {
    accessToken: connection.access_token_encrypted
      ? decrypt(connection.access_token_encrypted)
      : null,
    refreshToken: connection.refresh_token_encrypted
      ? decrypt(connection.refresh_token_encrypted)
      : null,
  };
}

export async function updateAccessToken(
  supabase: SupabaseClient,
  orgId: string,
  accessToken: string,
  tokenExpiry: Date
): Promise<void> {
  const { error } = await supabase
    .from("google_calendar_connection")
    .update({
      access_token_encrypted: encrypt(accessToken),
      token_expiry: tokenExpiry.toISOString(),
    })
    .eq("org_id", orgId);
  if (error) throw error;
}

export async function disconnectGoogle(
  supabase: SupabaseClient,
  orgId: string
): Promise<void> {
  const { error } = await supabase
    .from("google_calendar_connection")
    .delete()
    .eq("org_id", orgId);
  if (error) throw error;
}
