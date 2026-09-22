import "dotenv/config";

import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 3001);
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "llama3";

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "foxbot",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "Project Nurv API",
  });
});

app.get("/health", async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) {
      throw new Error(`Ollama returned HTTP ${response.status}`);
    }

    const data = await response.json();

    res.json({
      status: "ok",
      ollama: "connected",
      models: Array.isArray(data.models) ? data.models.map((model) => model.name) : [],
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

app.get("/health/db", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      message: error.message,
    });
  }
});

app.post("/api/chat", async (req, res) => {
  const { message, model = DEFAULT_MODEL } = req.body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: message,
        stream: false,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      return res.status(502).json({
        error: "ollama request failed",
        details,
      });
    }

    const data = await response.json();
    const reply = data.response || "";

    await db.execute(
      `INSERT INTO chat_logs (model_name, user_message, model_response)
       VALUES (?, ?, ?)`,
      [model, message, reply]
    );

    return res.json({
      success: true,
      model,
      reply,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/logs", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, model_name, user_message, model_response, created_at
       FROM chat_logs
       ORDER BY created_at DESC
       LIMIT 20`
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Project Nurv API running on http://localhost:${PORT}`);
});
