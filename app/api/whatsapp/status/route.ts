import { NextResponse } from "next/server";
import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createClient } from "@/lib/supabase/server";
import { checkWhatsAppStatus } from "@/lib/whatsapp/client";
import {
  getWhatsAppConnection,
  decryptWhatsAppSecrets,
} from "@/lib/db/whatsappConnection";

export async function GET() {
  const current = await getCurrentOrgId();
  if (!current) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const connection = await getWhatsAppConnection(supabase, current.orgId);
  if (!connection?.access_token_encrypted) {
    return NextResponse.json({ connected: false, error: "No hay conexión guardada" });
  }

  const { accessToken } = decryptWhatsAppSecrets(connection);
  const status = await checkWhatsAppStatus({
    accessToken,
    phoneNumberId: connection.phone_number_id,
  });
  return NextResponse.json(status);
}
