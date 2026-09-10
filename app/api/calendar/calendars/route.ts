import { NextResponse } from "next/server";
import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createAdminClient } from "@/lib/supabase/admin";
import { listCalendars } from "@/lib/google/calendar";
import { setCalendarId } from "@/lib/db/googleConnection";

export async function GET() {
  const current = await getCurrentOrgId();
  if (!current) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  try {
    const calendars = await listCalendars(supabase, current.orgId);
    return NextResponse.json({ calendars });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const current = await getCurrentOrgId();
  if (!current) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { calendarId } = await request.json();
  if (!calendarId) {
    return NextResponse.json({ error: "calendarId requerido" }, { status: 400 });
  }

  const supabase = createAdminClient();
  await setCalendarId(supabase, current.orgId, calendarId);
  return NextResponse.json({ ok: true });
}
