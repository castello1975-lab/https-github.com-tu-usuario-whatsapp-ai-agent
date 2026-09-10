import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySignature, markReadAndShowTyping } from "@/lib/whatsapp/client";
import type { WhatsAppWebhookPayload } from "@/lib/whatsapp/types";
import { findOrCreateContact } from "@/lib/db/contacts";
import {
  findOrCreateOpenConversation,
  touchConversation,
} from "@/lib/db/conversations";
import { insertMessage, updateMessageStatusByWhatsAppId } from "@/lib/db/messages";
import { handleIncomingMessage } from "@/lib/agent/orchestrator";

// Handshake de verificación de Meta.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature)) {
    console.error("Firma de webhook de WhatsApp inválida");
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const payload = JSON.parse(rawBody) as WhatsAppWebhookPayload;
  const supabase = createAdminClient();

  // Hay exactamente una organización por deployment: la buscamos una sola vez.
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .limit(1)
    .single();

  if (!org) {
    console.error("No hay organización creada todavía; ignorando webhook.");
    return new NextResponse("OK", { status: 200 });
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;

      if (value.statuses?.length) {
        for (const status of value.statuses) {
          await updateMessageStatusByWhatsAppId(supabase, status.id, status.status).catch(
            (err) => console.error("Error actualizando estado de mensaje", err)
          );
        }
      }

      if (value.messages?.length) {
        for (const inbound of value.messages) {
          if (inbound.type !== "text" || !inbound.text) continue;

          const contactName = value.contacts?.[0]?.profile?.name;
          const contact = await findOrCreateContact(
            supabase,
            org.id,
            inbound.from,
            contactName
          );
          const conversation = await findOrCreateOpenConversation(
            supabase,
            org.id,
            contact.id
          );

          await insertMessage(supabase, {
            orgId: org.id,
            conversationId: conversation.id,
            direction: "inbound",
            senderType: "contact",
            content: inbound.text.body,
            whatsappMessageId: inbound.id,
          });
          await touchConversation(supabase, conversation.id);

          if (!conversation.bot_enabled) continue;

          await markReadAndShowTyping(inbound.id);

          // No bloqueamos la respuesta 200 a Meta por esto, pero en este runtime
          // serverless simple lo esperamos para asegurar que se completa.
          await handleIncomingMessage({
            orgId: org.id,
            conversationId: conversation.id,
            contactId: contact.id,
            whatsappPhone: inbound.from,
          }).catch((err) => console.error("Error en el orquestador del agente", err));
        }
      }
    }
  }

  return new NextResponse("OK", { status: 200 });
}
