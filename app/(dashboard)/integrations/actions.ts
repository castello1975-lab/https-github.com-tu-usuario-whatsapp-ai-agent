"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createClient } from "@/lib/supabase/server";
import { disconnectGoogle } from "@/lib/db/googleConnection";
import {
  upsertWhatsAppConnection,
  disconnectWhatsApp,
} from "@/lib/db/whatsappConnection";

export async function disconnectGoogleAction() {
  const current = await getCurrentOrgId();
  if (!current) throw new Error("No autenticado");
  const supabase = await createClient();
  await disconnectGoogle(supabase, current.orgId);
  revalidatePath("/integrations");
}

export interface WhatsAppConnectionState {
  error?: string;
}

export async function saveWhatsAppConnectionAction(
  _prevState: WhatsAppConnectionState,
  formData: FormData
): Promise<WhatsAppConnectionState> {
  const current = await getCurrentOrgId();
  if (!current) throw new Error("No autenticado");

  const phoneNumberId = String(formData.get("phoneNumberId") ?? "").trim();
  const businessAccountId = String(formData.get("businessAccountId") ?? "").trim();
  const accessToken = String(formData.get("accessToken") ?? "").trim();
  const appSecret = String(formData.get("appSecret") ?? "").trim();
  const verifyToken = String(formData.get("verifyToken") ?? "").trim();

  if (!phoneNumberId || !accessToken || !appSecret || !verifyToken) {
    return { error: "Rellena todos los campos obligatorios." };
  }

  const supabase = await createClient();
  try {
    await upsertWhatsAppConnection(supabase, current.orgId, {
      phoneNumberId,
      businessAccountId,
      accessToken,
      appSecret,
      verifyToken,
    });
  } catch (err) {
    const message = (err as { message?: string })?.message ?? "";
    if (message.includes("duplicate key") || message.includes("unique")) {
      return { error: "Ese Phone Number ID ya está en uso por otra organización." };
    }
    return { error: "No se pudo guardar la conexión. Revisa los datos." };
  }

  revalidatePath("/integrations");
  return {};
}

export async function disconnectWhatsAppAction() {
  const current = await getCurrentOrgId();
  if (!current) throw new Error("No autenticado");
  const supabase = await createClient();
  await disconnectWhatsApp(supabase, current.orgId);
  revalidatePath("/integrations");
}
