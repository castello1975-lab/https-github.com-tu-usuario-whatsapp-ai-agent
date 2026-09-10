"use client";

import { useEffect, useRef, useState } from "react";
import { DateTime } from "luxon";
import { createClient } from "@/lib/supabase/client";

interface MessageRow {
  id: string;
  direction: "inbound" | "outbound";
  sender_type: "contact" | "bot" | "staff";
  content: string;
  created_at: string;
}

export function MessageThread({
  conversationId,
  initialMessages,
}: {
  conversationId: string;
  initialMessages: MessageRow[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as MessageRow]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      if (res.ok) {
        const { message } = await res.json();
        setMessages((prev) => [...prev, message]);
        setDraft("");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-white border border-neutral-200 rounded-2xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="border-t border-neutral-200 p-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje manual..."
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded-lg bg-neutral-900 text-white text-sm font-medium px-4 py-2 hover:bg-neutral-800 disabled:opacity-50 transition"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

function Bubble({ message }: { message: MessageRow }) {
  const isOutbound = message.direction === "outbound";
  const label =
    message.sender_type === "bot"
      ? "Bot"
      : message.sender_type === "staff"
      ? "Tú"
      : null;

  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
          isOutbound
            ? "bg-neutral-900 text-white rounded-br-sm"
            : "bg-neutral-100 text-neutral-900 rounded-bl-sm"
        }`}
      >
        {label && (
          <p
            className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${
              isOutbound ? "text-neutral-300" : "text-neutral-400"
            }`}
          >
            {label}
          </p>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p
          className={`text-[10px] mt-1 ${
            isOutbound ? "text-neutral-400" : "text-neutral-400"
          }`}
        >
          {DateTime.fromISO(message.created_at).toFormat("HH:mm")}
        </p>
      </div>
    </div>
  );
}
