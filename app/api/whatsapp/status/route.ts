import { NextResponse } from "next/server";
import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { checkWhatsAppStatus } from "@/lib/whatsapp/client";

export async function GET() {
  const current = await getCurrentOrgId();
  if (!current) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const status = await checkWhatsAppStatus();
  return NextResponse.json(status);
}
