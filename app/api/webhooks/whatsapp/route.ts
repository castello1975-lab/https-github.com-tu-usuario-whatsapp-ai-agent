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
import {
  getWhatsAppConnectionByPhoneNumberId,
  verifyTokenExists,
  decryptWhatsAppSecrets,
} from "@/lib/db/whatsappConnection";

// Handshake de verificación de Meta. Una sola URL de webhook sirve a todas
// las organizaciones; el token puede ser el elegido por cualquiera de ellas.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const supabase = createAdminClient();
  const matches = await verifyTokenExists(supabase, token);
  if (!matches) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return new NextResponse(challenge, { status: 200 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!signature) {
    return new NextResponse("Missing signature", { status: 403 });
  }

  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WhatsAppWebhookPayload;
  } catch {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  const supabase = createAdminClient();

  const phoneNumberId =
    payload.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
  if (!phoneNumberId) {
    console.error("Webhook sin phone_number_id en el payload; se ignora.");
    return new NextResponse("OK", { status: 200 });
  }

  const connection = await getWhatsAppConnectionByPhoneNumberId(
    supabase,
    phoneNumberId
  );
  if (!connection) {
    console.error(
      "phone_number_id sin ninguna organización conectada:",
      phoneNumberId
    );
    return new NextResponse("OK", { status: 200 });
  }

  const { accessToken, appSecret } = decryptWhatsAppSecrets(connection);

  if (!verifySignature(appSecret, rawBody, signature)) {
    console.error("Firma de webhook de WhatsApp inválida para org", connection.org_id);
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const orgId = connection.org_id;
  const creds = { accessToken, phoneNumberId: connection.phone_number_id };

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
            orgId,
            inbound.from,
            contactName
          );
          const conversation = await findOrCreateOpenConversation(
            supabase,
            orgId,
            contact.id
          );

          await insertMessage(supabase, {
            orgId,
            conversationId: conversation.id,
            direction: "inbound",
            senderType: "contact",
            content: inbound.text.body,
            whatsappMessageId: inbound.id,
          });
          await touchConversation(supabase, conversation.id);

          if (!conversation.bot_enabled) continue;

          await markReadAndShowTyping(creds, inbound.id);

          // No bloqueamos la respuesta 200 a Meta por esto, pero en este runtime
          // serverless simple lo esperamos para asegurar que se completa.
          await handleIncomingMessage({
            orgId,
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
