"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  saveWhatsAppConnectionAction,
  disconnectWhatsAppAction,
  type WhatsAppConnectionState,
} from "@/app/(dashboard)/integrations/actions";

const initialState: WhatsAppConnectionState = {};

export function WhatsAppConnectionCard({
  connected,
  phoneNumberId,
  businessAccountId,
}: {
  connected: boolean;
  phoneNumberId: string;
  businessAccountId: string;
}) {
  const [editing, setEditing] = useState(!connected);
  const [state, formAction, pending] = useActionState(
    saveWhatsAppConnectionAction,
    initialState
  );
  const [disconnecting, startDisconnect] = useTransition();
  const [liveStatus, setLiveStatus] = useState<{
    connected: boolean;
    displayPhoneNumber?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (!connected || editing) return;
    fetch("/api/whatsapp/status")
      .then((res) => res.json())
      .then(setLiveStatus)
      .catch(() => setLiveStatus({ connected: false, error: "No se pudo comprobar" }));
  }, [connected, editing]);

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">WhatsApp Business</h3>
        {connected && !editing ? (
          liveStatus === null ? (
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-200 animate-pulse" />
          ) : liveStatus.connected ? (
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          )
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
        )}
      </div>

      {connected && !editing && (
        <>
          {liveStatus === null && (
            <p className="text-xs text-neutral-500">Comprobando...</p>
          )}
          {liveStatus?.connected && (
            <p className="text-xs text-neutral-500">
              Número conectado: {liveStatus.displayPhoneNumber}
            </p>
          )}
          {liveStatus && !liveStatus.connected && (
            <p className="text-xs text-red-600">
              No responde. Revisa el Access Token (puede haber caducado).
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-neutral-700 hover:underline"
            >
              Editar credenciales
            </button>
            <button
              onClick={() => startDisconnect(() => disconnectWhatsAppAction())}
              disabled={disconnecting}
              className="text-xs text-red-600 hover:underline"
            >
              Desconectar
            </button>
          </div>
        </>
      )}

      {editing && (
        <form action={formAction} className="space-y-2">
          <Field
            label="Phone Number ID"
            name="phoneNumberId"
            defaultValue={phoneNumberId}
            required
          />
          <Field
            label="WhatsApp Business Account ID"
            name="businessAccountId"
            defaultValue={businessAccountId}
          />
          <Field label="Access Token" name="accessToken" type="password" required />
          <Field label="App Secret" name="appSecret" type="password" required />
          <Field label="Verify Token" name="verifyToken" required />

          {state.error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
              {state.error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="text-xs bg-neutral-900 text-white rounded-lg px-3 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
            >
              {pending ? "Guardando..." : "Guardar"}
            </button>
            {connected && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-xs text-neutral-500 hover:underline"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-600 mb-0.5">
        {label}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
      />
    </div>
  );
}
