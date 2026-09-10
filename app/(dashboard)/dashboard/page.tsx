import { DateTime } from "luxon";
import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { ConversationList } from "@/components/dashboard/ConversationList";
import { listConversations } from "@/lib/db/conversations";

export default async function DashboardPage() {
  const current = await getCurrentOrgId();
  if (!current) return null;
  const supabase = await createClient();

  const now = DateTime.now();
  const startOf30Days = now.minus({ days: 30 }).toUTC().toISO()!;
  const startOfWeek = now.startOf("week").toUTC().toISO()!;
  const endOfWeek = now.endOf("week").toUTC().toISO()!;
  const startOfToday = now.startOf("day").toUTC().toISO()!;
  const endOfToday = now.endOf("day").toUTC().toISO()!;

  const [
    { count: conversations30d },
    { count: appointmentsThisWeek },
    { count: appointmentsToday },
    { count: botPaused },
    conversations,
  ] = await Promise.all([
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("org_id", current.orgId)
      .gte("last_message_at", startOf30Days),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("org_id", current.orgId)
      .neq("status", "cancelled")
      .gte("starts_at", startOfWeek)
      .lte("starts_at", endOfWeek),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("org_id", current.orgId)
      .neq("status", "cancelled")
      .gte("starts_at", startOfToday)
      .lte("starts_at", endOfToday),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("org_id", current.orgId)
      .eq("status", "handoff"),
    listConversations(supabase, current.orgId),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Resumen</h1>
        <p className="text-sm text-neutral-500">
          El estado de tu agente de WhatsApp de un vistazo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Conversaciones (30 días)" value={conversations30d ?? 0} />
        <StatCard label="Citas esta semana" value={appointmentsThisWeek ?? 0} />
        <StatCard label="Citas hoy" value={appointmentsToday ?? 0} />
        <StatCard label="Bot en pausa" value={botPaused ?? 0} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-3">
          Últimas conversaciones
        </h2>
        <ConversationList conversations={conversations.slice(0, 8)} />
      </div>
    </div>
  );
}
