import Link from "next/link";
import { DateTime } from "luxon";

interface ConversationRow {
  id: string;
  bot_enabled: boolean;
  status: string;
  last_message_at: string;
  contact: { display_name: string | null; whatsapp_phone: string } | null;
}

export function ConversationList({
  conversations,
}: {
  conversations: ConversationRow[];
}) {
  if (conversations.length === 0) {
    return (
      <p className="text-sm text-neutral-500 bg-white border border-neutral-200 rounded-2xl p-6 text-center">
        Todavía no hay conversaciones. En cuanto llegue el primer mensaje de WhatsApp
        aparecerá aquí.
      </p>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl divide-y divide-neutral-100 overflow-hidden">
      {conversations.map((c) => (
        <Link
          key={c.id}
          href={`/conversations/${c.id}`}
          className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition"
        >
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {c.contact?.display_name || c.contact?.whatsapp_phone || "Contacto"}
            </p>
            <p className="text-xs text-neutral-500">{c.contact?.whatsapp_phone}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400">
              {DateTime.fromISO(c.last_message_at).toRelative()}
            </span>
            <StatusBadge status={c.status} botEnabled={c.bot_enabled} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function StatusBadge({ status, botEnabled }: { status: string; botEnabled: boolean }) {
  if (!botEnabled) {
    return (
      <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-800">
        Control humano
      </span>
    );
  }
  if (status === "handoff") {
    return (
      <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-800">
        Traspaso
      </span>
    );
  }
  return (
    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
      Bot activo
    </span>
  );
}
