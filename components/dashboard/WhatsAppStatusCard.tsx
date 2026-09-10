"use client";

import { useEffect, useState } from "react";

export function WhatsAppStatusCard() {
  const [status, setStatus] = useState<{
    connected: boolean;
    displayPhoneNumber?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/whatsapp/status")
      .then((res) => res.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false, error: "No se pudo comprobar" }));
  }, []);

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">WhatsApp Business</h3>
        {status === null ? (
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-200 animate-pulse" />
        ) : status.connected ? (
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        )}
      </div>
      {status === null && <p className="text-xs text-neutral-500">Comprobando...</p>}
      {status?.connected && (
        <p className="text-xs text-neutral-500">
          Número conectado: {status.displayPhoneNumber}
        </p>
      )}
      {status && !status.connected && (
        <p className="text-xs text-red-600">
          No conectado. Revisa las variables WHATSAPP_* en .env.local (ver SETUP.md).
        </p>
      )}
    </div>
  );
}
