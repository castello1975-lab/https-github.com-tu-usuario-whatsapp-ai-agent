import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createClient } from "@/lib/supabase/server";
import { listConversations } from "@/lib/db/conversations";
import { ConversationList } from "@/components/dashboard/ConversationList";

export default async function ConversationsPage() {
  const current = await getCurrentOrgId();
  if (!current) return null;
  const supabase = await createClient();
  const conversations = await listConversations(supabase, current.orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Conversaciones</h1>
        <p className="text-sm text-neutral-500">
          Historial completo de conversaciones por WhatsApp con tus clientes.
        </p>
      </div>
      <ConversationList conversations={conversations} />
    </div>
  );
}
