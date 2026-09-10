import { redirect } from "next/navigation";
import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createClient } from "@/lib/supabase/server";
import { getOrganization } from "@/lib/db/organizations";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { LogoutButton } from "@/components/dashboard/LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentOrgId();
  if (!current) redirect("/login");

  const supabase = await createClient();
  const org = await getOrganization(supabase, current.orgId);

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <aside className="w-64 shrink-0 border-r border-neutral-200 bg-white flex flex-col p-4">
        <div className="px-2 py-3 mb-2">
          <p className="text-sm font-semibold text-neutral-900 truncate">
            {org?.business_name ?? "Tu negocio"}
          </p>
          <p className="text-xs text-neutral-400">Agente de WhatsApp</p>
        </div>
        <SidebarNav />
        <div className="mt-auto px-2 pt-4 border-t border-neutral-200">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
