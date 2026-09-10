import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createClient } from "@/lib/supabase/server";
import { getOrganization } from "@/lib/db/organizations";
import { AppointmentsCalendar } from "@/components/dashboard/AppointmentsCalendar";

export default async function AppointmentsPage() {
  const current = await getCurrentOrgId();
  if (!current) return null;
  const supabase = await createClient();
  const org = await getOrganization(supabase, current.orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Citas</h1>
        <p className="text-sm text-neutral-500">
          Vista combinada con Google Calendar (si está conectado).
        </p>
      </div>
      <AppointmentsCalendar timezone={org?.timezone ?? "Europe/Madrid"} />
    </div>
  );
}
