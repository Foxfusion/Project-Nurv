# Project Nurv

Standalone local LLM chat application built around Ollama, Express, React, and MySQL.

Project Nurv is intentionally separate from **AI_Fox_Project**:

- **AI_Fox_Project** is the AI engineering lab for agents, RAG, prompts, tools, and experiments.
- **Models** contains reusable model training, evaluation, and inference work.
- **Project-Nurv** is a runnable end-user LLM application.

## Architecture

```text
React / Vite
     |
     v
Express API :3001
     |
     +----> Ollama :11434
     |
     +----> MySQL (chat_logs)
```

## Backend setup

```bash
cp .env.example .env
npm install
mysql foxbot < schema.sql
npm run dev
```

Configure the real database password only in your local `.env` or secret-management system.

## Frontend setup

```bash
cd llm-frontend
cp .env.example .env
npm install
npm run dev
```

## API

- `GET /` — service status
- `GET /health` — Ollama/model health
- `GET /health/db` — MySQL health
- `POST /api/chat` — send a prompt to Ollama and store the response
- `GET /api/logs` — latest chat logs

## Security

Do not commit passwords, API keys, tokens, `.env` files, IntelliJ metadata, or generated dependencies.

A database credential existed in an earlier Git revision. It is no longer present in the active source tree, but the database password should be rotated because Git history retains old revisions.
