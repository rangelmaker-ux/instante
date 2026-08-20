import { Router } from "express";
import { addClient, removeClient } from "../services/sseManager.js";

const router = Router();

// GET /api/events — stream SSE
router.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write("event: connected\ndata: {}\n\n");

  addClient(res);

  const keepAlive = setInterval(() => res.write(": ping\n\n"), 30000);

  req.on("close", () => {
    clearInterval(keepAlive);
    removeClient(res);
  });
});

export default router;
