import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
app.use(cors());
app.use(express.json());

const db = await mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Op3rat0r#88",
    database: "foxbot",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get("/", (req, res) => {
    res.send("LLM backend is running");
});

app.get("/health", async (req, res) => {
    try {
        const response = await fetch("http://localhost:11434/api/tags");
        const data = await response.json();

        res.json({
            status: "ok",
            ollama: "connected",
            models: data.models?.map((m) => m.name) || []
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: err.message
        });
    }
});

app.post("/api/chat", async (req, res) => {
    const { message, model = "llama3" } = req.body;

    if (!message) {
        return res.status(400).json({ error: "message is required" });
    }

    try {
        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model,
                prompt: message,
                stream: false
            })
        });

        if (!response.ok) {
            const text = await response.text();
            return res.status(500).json({
                error: "ollama request failed",
                details: text
            });
        }

        const data = await response.json();
        const reply = data.response;

        await db.execute(
            `INSERT INTO chat_logs (model_name, user_message, model_response)
       VALUES (?, ?, ?)`,
            [model, message, reply]
        );

        res.json({
            success: true,
            model,
            reply
        });
    } catch (err) {
        console.error("Chat error:", err);
        res.status(500).json({
            success: false,
            error: err.message
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
1
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3001, () => {
    console.log("LLM API running on http://localhost:3001");
});