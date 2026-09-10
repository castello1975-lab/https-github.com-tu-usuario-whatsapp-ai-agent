import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createClient } from "@/lib/supabase/server";
import { getOrganization } from "@/lib/db/organizations";
import { getAgentSettings } from "@/lib/db/agentSettings";
import { getBusinessHours } from "@/lib/db/businessHours";
import { listServices } from "@/lib/db/services";
import { CustomizationTabs } from "@/components/dashboard/CustomizationTabs";

export default async function CustomizationPage() {
  const current = await getCurrentOrgId();
  if (!current) return null;
  const supabase = await createClient();

  const [org, settings, hours, services] = await Promise.all([
    getOrganization(supabase, current.orgId),
    getAgentSettings(supabase, current.orgId),
    getBusinessHours(supabase, current.orgId),
    listServices(supabase, current.orgId),
  ]);

  if (!org || !settings) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Personalización</h1>
        <p className="text-sm text-neutral-500">
          Configura cómo se comporta tu agente y qué sabe sobre tu negocio.
        </p>
      </div>
      <CustomizationTabs org={org} settings={settings} hours={hours} services={services} />
    </div>
  );
}
