import { notFound } from "next/navigation";
import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createClient } from "@/lib/supabase/server";
import { getConversation } from "@/lib/db/conversations";
import { listRecentMessages } from "@/lib/db/messages";
import { MessageThread } from "@/components/dashboard/MessageThread";
import { BotToggle } from "@/components/dashboard/BotToggle";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const current = await getCurrentOrgId();
  if (!current) return null;

  const supabase = await createClient();
  const conversation = await getConversation(supabase, id).catch(() => null);
  if (!conversation || conversation.org_id !== current.orgId) notFound();

  const messages = await listRecentMessages(supabase, id, 100);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {conversation.contact?.display_name || conversation.contact?.whatsapp_phone}
          </h1>
          <p className="text-sm text-neutral-500">{conversation.contact?.whatsapp_phone}</p>
        </div>
        <BotToggle conversationId={id} initialEnabled={conversation.bot_enabled} />
      </div>

      <MessageThread conversationId={id} initialMessages={messages} />
    </div>
  );
}
