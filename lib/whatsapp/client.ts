import "server-only";
import crypto from "node:crypto";

export interface WhatsAppCredentials {
  accessToken: string;
  phoneNumberId: string;
}

function graphUrl(path: string) {
  return `https://graph.facebook.com/v21.0/${path}`;
}

async function callGraphApi(
  accessToken: string,
  path: string,
  body: Record<string, unknown>
) {
  const res = await fetch(graphUrl(path), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `WhatsApp Graph API error (${res.status}) en ${path}: ${errorBody}`
    );
  }

  return res.json();
}

// Envía un mensaje de texto y devuelve el whatsapp_message_id.
export async function sendText(
  creds: WhatsAppCredentials,
  to: string,
  body: string
): Promise<string> {
  const data = await callGraphApi(
    creds.accessToken,
    `${creds.phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }
  );
  return data.messages?.[0]?.id as string;
}

// Marca el mensaje entrante como leído y muestra el indicador de "escribiendo...".
export async function markReadAndShowTyping(
  creds: WhatsAppCredentials,
  messageId: string
): Promise<void> {
  try {
    await callGraphApi(creds.accessToken, `${creds.phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
      typing_indicator: { type: "text" },
    });
  } catch (err) {
    // No crítico: si falla, seguimos igualmente con la respuesta.
    console.error("No se pudo marcar como leído / mostrar 'escribiendo'", err);
  }
}

// Verifica la firma HMAC-SHA256 que Meta añade en X-Hub-Signature-256,
// usando el app secret de la organización dueña del número receptor.
export function verifySignature(
  appSecret: string,
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Ping simple a la Graph API para comprobar que el token/phone_number_id son válidos.
export async function checkWhatsAppStatus(creds: WhatsAppCredentials): Promise<{
  connected: boolean;
  displayPhoneNumber?: string;
  error?: string;
}> {
  try {
    const res = await fetch(
      graphUrl(`${creds.phoneNumberId}?fields=display_phone_number,verified_name`),
      { headers: { Authorization: `Bearer ${creds.accessToken}` } }
    );
    if (!res.ok) {
      return { connected: false, error: await res.text() };
    }
    const data = await res.json();
    return { connected: true, displayPhoneNumber: data.display_phone_number };
  } catch (err) {
    return { connected: false, error: (err as Error).message };
  }
}
