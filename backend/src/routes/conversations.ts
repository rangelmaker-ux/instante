import { Router } from "express";
import { db } from "../db/index.js";

const router = Router();

// GET /api/v1/conversations
router.get("/", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        c.id, c.client_id, c.whatsapp_chat_id, c.last_message_at, c.unread_count, c.created_at,
        cl.id AS client_id_val, cl.name AS client_name, cl.whatsapp AS client_whatsapp
      FROM conversations c
      LEFT JOIN clients cl ON cl.id = c.client_id
      ORDER BY c.last_message_at DESC
    `).all() as any[];

    res.json(
      rows.map((r) => ({
        id: r.id,
        clientId: r.client_id,
        whatsappChatId: r.whatsapp_chat_id,
        lastMessageAt: r.last_message_at,
        unreadCount: r.unread_count,
        createdAt: r.created_at,
        client: r.client_id_val ? { id: r.client_id_val, name: r.client_name, whatsapp: r.client_whatsapp } : null,
      }))
    );
  } catch (err) {
    console.error("[conversations] GET /", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// GET /api/v1/conversations/:id
router.get("/:id", (req, res) => {
  const { id } = req.params;
  try {
    const conv = db.prepare(`
      SELECT
        c.id, c.client_id, c.whatsapp_chat_id, c.last_message_at, c.unread_count, c.created_at,
        cl.id AS client_id_val, cl.name AS client_name, cl.whatsapp AS client_whatsapp
      FROM conversations c
      LEFT JOIN clients cl ON cl.id = c.client_id
      WHERE c.id = ?
    `).get(id) as any;

    if (!conv) {
      res.status(404).json({ error: "Conversa não encontrada" });
      return;
    }

    const messages = db.prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(id) as any[];

    res.json({
      id: conv.id,
      clientId: conv.client_id,
      whatsappChatId: conv.whatsapp_chat_id,
      lastMessageAt: conv.last_message_at,
      unreadCount: conv.unread_count,
      createdAt: conv.created_at,
      client: conv.client_id_val ? { id: conv.client_id_val, name: conv.client_name, whatsapp: conv.client_whatsapp } : null,
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        whatsappMessageId: m.whatsapp_message_id,
        content: m.content,
        direction: m.direction,
        createdAt: m.created_at,
      })),
    });
  } catch (err) {
    console.error("[conversations] GET /:id", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// POST /api/v1/conversations/:id/read
router.post("/:id/read", (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare(`UPDATE conversations SET unread_count = 0 WHERE id = ?`).run(id);
    if (info.changes === 0) {
      res.status(404).json({ error: "Conversa não encontrada" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("[conversations] POST /:id/read", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
