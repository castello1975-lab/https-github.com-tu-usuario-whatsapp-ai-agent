import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { DateTime } from "luxon";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrganization } from "@/lib/db/organizations";
import { getAgentSettings } from "@/lib/db/agentSettings";
import { listServices } from "@/lib/db/services";
import { getBusinessHours } from "@/lib/db/businessHours";
import { listRecentMessages, insertMessage } from "@/lib/db/messages";
import {
  setBotEnabled,
  setConversationStatus,
  logConversationEvent,
} from "@/lib/db/conversations";
import { buildSystemPrompt } from "./systemPrompt";
import { TOOL_DEFINITIONS, executeTool } from "./tools";
import { sendText } from "@/lib/whatsapp/client";
import {
  getWhatsAppConnection,
  decryptWhatsAppSecrets,
} from "@/lib/db/whatsappConnection";

const MAX_TOOL_ITERATIONS = 5;

function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Punto de entrada: procesa el mensaje entrante ya guardado en `messages` para
// una conversación, genera la respuesta del agente (con tools) y la envía por WhatsApp.
export async function handleIncomingMessage(params: {
  orgId: string;
  conversationId: string;
  contactId: string;
  whatsappPhone: string;
}): Promise<void> {
  const { orgId, conversationId, contactId, whatsappPhone } = params;
  const supabase = createAdminClient();

  const [org, settings, services, hours, history, whatsappConnection] =
    await Promise.all([
      getOrganization(supabase, orgId),
      getAgentSettings(supabase, orgId),
      listServices(supabase, orgId, true),
      getBusinessHours(supabase, orgId),
      listRecentMessages(supabase, conversationId, 20),
      getWhatsAppConnection(supabase, orgId),
    ]);

  if (!org || !settings || !whatsappConnection?.access_token_encrypted) {
    console.error(
      "Falta organización, agent_settings o conexión de WhatsApp para org",
      orgId
    );
    return;
  }

  const { accessToken } = decryptWhatsAppSecrets(whatsappConnection);
  const whatsappCreds = {
    accessToken,
    phoneNumberId: whatsappConnection.phone_number_id,
  };

  const nowIso = DateTime.now().setZone(org.timezone).toFormat("cccc dd/MM/yyyy HH:mm");
  const systemPrompt = buildSystemPrompt({ org, settings, services, hours, nowIso });

  const messages: Anthropic.MessageParam[] = history
    .filter((m) => m.content?.trim())
    .map((m) => ({
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.content,
    }));

  const anthropic = getAnthropicClient();
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  let finalText = "";
  let handoff: { reason: string } | null = null;

  try {
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOL_DEFINITIONS,
        messages,
      });

      const toolUses = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );
      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === "text"
      );

      if (toolUses.length === 0) {
        finalText = textBlocks.map((b) => b.text).join("\n").trim();
        break;
      }

      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUses) {
        const result = await executeTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
          { supabase, org, contactId, conversationId }
        );
        if (result.handoffRequested) {
          handoff = { reason: result.handoffReason || "Solicitado por el cliente" };
        }
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: result.output,
        });
      }

      messages.push({ role: "user", content: toolResults });

      if (handoff) {
        finalText = textBlocks.map((b) => b.text).join("\n").trim();
        break;
      }

      if (i === MAX_TOOL_ITERATIONS - 1) {
        finalText = textBlocks.map((b) => b.text).join("\n").trim();
      }
    }
  } catch (err) {
    console.error("Error llamando a Anthropic", err);
    finalText =
      "Disculpa, ahora mismo tengo un problema técnico. En breve te atenderá una persona de nuestro equipo.";
    handoff = handoff ?? { reason: "Error técnico del agente" };
  }

  if (handoff) {
    await setBotEnabled(supabase, conversationId, orgId, false);
    await setConversationStatus(supabase, conversationId, "handoff");
    await logConversationEvent(supabase, orgId, conversationId, "handoff_triggered", {
      reason: handoff.reason,
    });
    finalText = finalText || settings.handoff_message;
  }

  if (!finalText) {
    finalText = "Disculpa, no he entendido bien tu mensaje. ¿Puedes reformularlo?";
  }

  const whatsappMessageId = await sendText(whatsappCreds, whatsappPhone, finalText).catch(
    (err) => {
      console.error("Error enviando mensaje de WhatsApp", err);
      return null;
    }
  );

  await insertMessage(supabase, {
    orgId,
    conversationId,
    direction: "outbound",
    senderType: "bot",
    content: finalText,
    whatsappMessageId,
  });
}
