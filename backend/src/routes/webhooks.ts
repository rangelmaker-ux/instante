import { Router } from "express";
import { processIncomingMessage } from "../services/webhookProcessor.js";

const router = Router();

router.post("/evolution", async (req, res) => {
  const secret = req.headers["x-evolution-secret"];
  if (!secret || secret !== process.env.EVOLUTION_WEBHOOK_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.status(200).json({ ok: true });

  const { event } = req.body;
  if (event !== "messages.upsert") return;

  try {
    await processIncomingMessage(req.body);
  } catch (err) {
    console.error("[webhook] error processing message:", err);
  }
});

export default router;
