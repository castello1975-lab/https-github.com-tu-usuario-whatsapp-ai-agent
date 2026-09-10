import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createClient } from "@/lib/supabase/server";
import { getGoogleConnection } from "@/lib/db/googleConnection";
import { GoogleCalendarCard } from "@/components/dashboard/GoogleCalendarCard";
import { WhatsAppStatusCard } from "@/components/dashboard/WhatsAppStatusCard";

export default async function IntegrationsPage() {
  const current = await getCurrentOrgId();
  if (!current) return null;
  const supabase = await createClient();
  const connection = await getGoogleConnection(supabase, current.orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Integraciones</h1>
        <p className="text-sm text-neutral-500">
          Conecta los servicios externos que usa tu agente.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
        <GoogleCalendarCard
          connected={!!connection?.access_token_encrypted}
          accountEmail={connection?.google_account_email ?? null}
          currentCalendarId={connection?.calendar_id ?? null}
        />
        <WhatsAppStatusCard />
      </div>
    </div>
  );
}
