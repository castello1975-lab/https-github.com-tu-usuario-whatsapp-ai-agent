import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createClient } from "@/lib/supabase/server";
import { listAppointmentsInRange } from "@/lib/db/appointments";
import { listCalendarEvents } from "@/lib/google/calendar";

export async function GET(request: NextRequest) {
  const current = await getCurrentOrgId();
  if (!current) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "from/to requeridos (ISO)" }, { status: 400 });
  }

  const supabase = await createClient();
  const [local, googleEvents] = await Promise.all([
    listAppointmentsInRange(supabase, current.orgId, from, to),
    listCalendarEvents(supabase, current.orgId, from, to).catch(() => []),
  ]);

  const byEventId = new Map(local.map((a) => [a.google_event_id, a]));

  const merged = googleEvents.map((event) => {
    const local = event.id ? byEventId.get(event.id) : undefined;
    return {
      id: event.id,
      summary: event.summary,
      start: event.start?.dateTime ?? event.start?.date,
      end: event.end?.dateTime ?? event.end?.date,
      appointment: local ?? null,
    };
  });

  // Citas locales que aún no tienen evento en Google (Calendar no conectado).
  const withoutGoogle = local.filter((a) => !a.google_event_id);

  return NextResponse.json({ events: merged, localOnly: withoutGoogle });
}
