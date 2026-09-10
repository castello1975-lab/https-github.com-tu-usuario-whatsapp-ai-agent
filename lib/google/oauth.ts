import "server-only";
import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getGoogleConnection,
  decryptTokens,
  updateAccessToken,
} from "@/lib/db/googleConnection";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function buildAuthUrl(): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

// Devuelve un OAuth2Client autenticado para el org, refrescando el access token si hace falta.
export async function getAuthenticatedClientForOrg(
  supabase: SupabaseClient,
  orgId: string
) {
  const connection = await getGoogleConnection(supabase, orgId);
  if (!connection || !connection.access_token_encrypted) {
    throw new Error("No hay conexión de Google Calendar para esta organización.");
  }

  const { accessToken, refreshToken } = decryptTokens(connection);
  const client = getOAuthClient();
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const expiry = connection.token_expiry ? new Date(connection.token_expiry) : null;
  const isExpired = !expiry || expiry.getTime() - Date.now() < 60_000;

  if (isExpired && refreshToken) {
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);
    if (credentials.access_token) {
      await updateAccessToken(
        supabase,
        orgId,
        credentials.access_token,
        new Date(credentials.expiry_date ?? Date.now() + 3500_000)
      );
    }
  }

  return client;
}
