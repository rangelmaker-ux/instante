import { Router } from "express";
import { db } from "../db/index.js";
import { sendText } from "../services/evolutionApi.js";
import { emit } from "../services/sseManager.js";
import crypto from "crypto";

const router = Router();

// POST /api/v1/messages
router.post("/", async (req, res) => {
  const { conversation_id, content } = req.body;

  if (!conversation_id || !content) {
    res.status(400).json({ error: "conversation_id e content são obrigatórios" });
    return;
  }

  try {
    const conv = db.prepare(`SELECT whatsapp_chat_id FROM conversations WHERE id = ?`).get(conversation_id) as any;
    if (!conv) {
      res.status(404).json({ error: "Conversa não encontrada" });
      return;
    }

    const number = (conv.whatsapp_chat_id as string).replace(/@.*$/, "");
    
    if (process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY && process.env.EVOLUTION_INSTANCE_NAME) {
      await sendText(
        process.env.EVOLUTION_API_URL,
        process.env.EVOLUTION_INSTANCE_NAME,
        process.env.EVOLUTION_API_KEY,
        number,
        content
      );
    } else {
      console.warn("⚠️ Evolution API vars missing. Saving message to DB but not actually sending via WhatsApp.");
    }

    const msgId = crypto.randomUUID();
    const msg = db.prepare(`
      INSERT INTO messages (id, conversation_id, direction, content)
      VALUES (?, ?, 'out', ?)
      RETURNING *
    `).get(msgId, conversation_id, content) as any;

    db.prepare(`UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?`).run(conversation_id);

    const payload = {
      id: msg.id,
      conversationId: msg.conversation_id,
      whatsappMessageId: null,
      content: msg.content,
      direction: msg.direction,
      createdAt: msg.created_at,
    };

    emit("new_message", { conversation_id, message: payload });
    res.status(201).json(payload);
  } catch (err) {
    console.error("[messages] POST /", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
