import { NextResponse } from "next/server";
import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createClient } from "@/lib/supabase/server";
import { getConversation, touchConversation } from "@/lib/db/conversations";
import { insertMessage } from "@/lib/db/messages";
import { sendText } from "@/lib/whatsapp/client";
import {
  getWhatsAppConnection,
  decryptWhatsAppSecrets,
} from "@/lib/db/whatsappConnection";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentOrgId();
  if (!current) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { content } = await request.json();
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "content requerido" }, { status: 400 });
  }

  const supabase = await createClient();
  const conversation = await getConversation(supabase, id);
  if (!conversation || conversation.org_id !== current.orgId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const whatsappConnection = await getWhatsAppConnection(supabase, current.orgId);
  let whatsappMessageId: string | null = null;
  if (whatsappConnection?.access_token_encrypted) {
    const { accessToken } = decryptWhatsAppSecrets(whatsappConnection);
    whatsappMessageId = await sendText(
      { accessToken, phoneNumberId: whatsappConnection.phone_number_id },
      conversation.contact.whatsapp_phone,
      content
    ).catch((err) => {
      console.error("Error enviando mensaje manual de WhatsApp", err);
      return null;
    });
  }

  const message = await insertMessage(supabase, {
    orgId: current.orgId,
    conversationId: id,
    direction: "outbound",
    senderType: "staff",
    content,
    whatsappMessageId,
  });
  await touchConversation(supabase, id);

  return NextResponse.json({ message });
}
