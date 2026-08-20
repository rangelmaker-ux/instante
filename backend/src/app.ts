import "dotenv/config";
import express from "express";
import cors from "cors";

import conversationsRouter from "./routes/conversations.js";
import messagesRouter from "./routes/messages.js";
import eventsRouter from "./routes/events.js";
import webhooksRouter from "./routes/webhooks.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1", (req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

app.use("/api/v1/conversations", conversationsRouter);
app.use("/api/v1/messages", messagesRouter);
app.use("/api/events", eventsRouter);
app.use("/webhooks", webhooksRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});

export default app;
