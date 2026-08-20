import { db } from "../db/index.js";
import { emit } from "./sseManager.js";
import crypto from "crypto";

interface WebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: { text: string };
    };
    messageTimestamp: number;
    pushName?: string;
  };
}

function extractPhone(remoteJid: string): string {
  return remoteJid.replace(/@.*$/, "");
}

function extractTextContent(payload: WebhookPayload): string | null {
  const msg = payload.data.message;
  if (!msg) return null;
  return msg.conversation ?? msg.extendedTextMessage?.text ?? null;
}

export async function processIncomingMessage(payload: WebhookPayload): Promise<void> {
  if (payload.data.key.fromMe) return; // Ignore our own messages

  const content = extractTextContent(payload);
  if (!content) return; 

  const whatsappMessageId = payload.data.key.id;
  const remoteJid = payload.data.key.remoteJid;
  const phone = extractPhone(remoteJid);
  const pushName = payload.data.pushName ?? null;

  // UPSERT Client
  const clientQuery = db.prepare(`
    INSERT INTO clients (id, whatsapp, name)
    VALUES (@id, @whatsapp, @name)
    ON CONFLICT (whatsapp) DO UPDATE SET name = excluded.name
    RETURNING *
  `);
  
  let client = db.prepare(`SELECT * FROM clients WHERE whatsapp = ?`).get(phone) as any;
  if (!client) {
    client = clientQuery.get({ id: crypto.randomUUID(), whatsapp: phone, name: pushName });
  } else {
    clientQuery.get({ id: client.id, whatsapp: phone, name: pushName });
  }

  // UPSERT Conversation
  const convQuery = db.prepare(`
    INSERT INTO conversations (id, client_id, whatsapp_chat_id, last_message_at)
    VALUES (@id, @client_id, @whatsapp_chat_id, datetime('now'))
    ON CONFLICT (whatsapp_chat_id) DO UPDATE SET last_message_at = datetime('now'), unread_count = unread_count + 1
    RETURNING *
  `);

  let conversation = db.prepare(`SELECT * FROM conversations WHERE whatsapp_chat_id = ?`).get(remoteJid) as any;
  if (!conversation) {
    conversation = convQuery.get({ id: crypto.randomUUID(), client_id: client.id, whatsapp_chat_id: remoteJid });
  } else {
    conversation = convQuery.get({ id: conversation.id, client_id: client.id, whatsapp_chat_id: remoteJid });
  }

  // INSERT Message
  const msgExists = db.prepare(`SELECT id FROM messages WHERE whatsapp_message_id = ?`).get(whatsappMessageId);
  if (msgExists) return;

  const msgQuery = db.prepare(`
    INSERT INTO messages (id, conversation_id, whatsapp_message_id, content, direction)
    VALUES (@id, @conversation_id, @whatsapp_message_id, @content, 'in')
    RETURNING *
  `);

  const message = msgQuery.get({
    id: crypto.randomUUID(),
    conversation_id: conversation.id,
    whatsapp_message_id: whatsappMessageId,
    content
  }) as any;

  // Emit SSE
  emit("new_message", {
    conversation_id: conversation.id,
    message: {
      id: message.id,
      direction: message.direction,
      content: message.content,
      created_at: message.created_at,
    },
  });

  emit("conversation_updated", {
    conversation_id: conversation.id,
  });
}
