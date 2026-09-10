import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { exchangeCodeForTokens, getOAuthClient } from "@/lib/google/oauth";
import { upsertGoogleConnection } from "@/lib/db/googleConnection";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrgId } from "@/lib/auth/currentOrg";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/integrations?google_error=1`);
  }

  const current = await getCurrentOrgId();
  if (!current) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const tokens = await exchangeCodeForTokens(code);
  if (!tokens.access_token) {
    return NextResponse.redirect(`${origin}/integrations?google_error=1`);
  }

  const client = getOAuthClient();
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data: userInfo } = await oauth2.userinfo.get();

  const supabase = createAdminClient();
  await upsertGoogleConnection(supabase, current.orgId, {
    googleAccountEmail: userInfo.email ?? "",
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? undefined,
    tokenExpiry: new Date(tokens.expiry_date ?? Date.now() + 3500_000),
    scope: tokens.scope ?? "",
  });

  return NextResponse.redirect(`${origin}/integrations?google_connected=1`);
}
