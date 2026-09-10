"use client";

import { useState } from "react";

export function BotToggle({
  conversationId,
  initialEnabled,
}: {
  conversationId: string;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    const next = !enabled;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/bot-toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (res.ok) setEnabled(next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
        enabled
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${enabled ? "bg-emerald-600" : "bg-amber-600"}`}
      />
      {enabled ? "Bot activo" : "Control humano"}
    </button>
  );
}
