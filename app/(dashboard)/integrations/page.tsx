import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createClient } from "@/lib/supabase/server";
import { getGoogleConnection } from "@/lib/db/googleConnection";
import { getWhatsAppConnection } from "@/lib/db/whatsappConnection";
import { GoogleCalendarCard } from "@/components/dashboard/GoogleCalendarCard";
import { WhatsAppConnectionCard } from "@/components/dashboard/WhatsAppConnectionCard";

export default async function IntegrationsPage() {
  const current = await getCurrentOrgId();
  if (!current) return null;
  const supabase = await createClient();
  const [googleConnection, whatsappConnection] = await Promise.all([
    getGoogleConnection(supabase, current.orgId),
    getWhatsAppConnection(supabase, current.orgId),
  ]);

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
          connected={!!googleConnection?.access_token_encrypted}
          accountEmail={googleConnection?.google_account_email ?? null}
          currentCalendarId={googleConnection?.calendar_id ?? null}
        />
        <WhatsAppConnectionCard
          connected={!!whatsappConnection?.access_token_encrypted}
          phoneNumberId={whatsappConnection?.phone_number_id ?? ""}
          businessAccountId={whatsappConnection?.business_account_id ?? ""}
        />
      </div>
    </div>
  );
}
