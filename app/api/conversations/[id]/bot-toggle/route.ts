import { NextResponse } from "next/server";
import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createClient } from "@/lib/supabase/server";
import { setBotEnabled, setConversationStatus } from "@/lib/db/conversations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentOrgId();
  if (!current) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { enabled } = await request.json();

  const supabase = await createClient();
  await setBotEnabled(supabase, id, current.orgId, !!enabled);
  if (enabled) {
    await setConversationStatus(supabase, id, "open");
  }

  return NextResponse.json({ ok: true });
}
