import { emit } from "./sseManager.js";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase URL or Key is missing in backend environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

  // 1. UPSERT Client
  let client;
  const { data: existingClient } = await supabase
    .from('clients')
    .select('*')
    .eq('whatsapp', phone)
    .single();

  if (!existingClient) {
    const { data: newClient, error: clientErr } = await supabase
      .from('clients')
      .insert([{ whatsapp: phone, name: pushName || phone }])
      .select()
      .single();
    if (clientErr) console.error("Error inserting client:", clientErr);
    client = newClient;
  } else {
    if (pushName && existingClient.name !== pushName) {
      const { data: updatedClient } = await supabase
        .from('clients')
        .update({ name: pushName })
        .eq('id', existingClient.id)
        .select()
        .single();
      client = updatedClient;
    } else {
      client = existingClient;
    }
  }

  if (!client) return;

  // 2. UPSERT Conversation
  let conversation;
  const { data: existingConv } = await supabase
    .from('conversations')
    .select('*')
    .eq('whatsapp_chat_id', remoteJid)
    .single();

  if (!existingConv) {
    const { data: newConv, error: convErr } = await supabase
      .from('conversations')
      .insert([{ client_id: client.id, whatsapp_chat_id: remoteJid, unread_count: 1 }])
      .select()
      .single();
    if (convErr) console.error("Error inserting conversation:", convErr);
    conversation = newConv;
  } else {
    const { data: updatedConv, error: updateErr } = await supabase
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        unread_count: existingConv.unread_count + 1 
      })
      .eq('id', existingConv.id)
      .select()
      .single();
    if (updateErr) console.error("Error updating conversation:", updateErr);
    conversation = updatedConv;
  }

  if (!conversation) return;

  // 3. INSERT Message
  const { data: existingMsg } = await supabase
    .from('messages')
    .select('id')
    .eq('whatsapp_message_id', whatsappMessageId)
    .single();

  if (existingMsg) return; // Already processed

  const { data: message, error: msgErr } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversation.id,
      whatsapp_message_id: whatsappMessageId,
      content,
      direction: 'in'
    }])
    .select()
    .single();

  if (msgErr || !message) {
    console.error("Error inserting message:", msgErr);
    return;
  }

  // 4. Emit SSE
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
