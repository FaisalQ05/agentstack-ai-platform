# AI Integration

Full-stack starter for AI integration: **NestJS** API, **Next.js** UI, **PostgreSQL** + **pgvector** RAG, swappable chat providers (OpenAI / Groq), and a **lightweight local embedding** service (FastEmbed / ONNX — no PyTorch).

## Features

| Area | Description |
| ---- | ----------- |
| **AI Chat** | `POST /api/v1/chat`, SSE at `/chat/stream`, PostgreSQL memory |
| **Content tools** | Summarize, rewrite, keywords, generate-description |
| **Structured AI tools** | CV parser, job extractor, job matcher (Zod + JSON schema) |
| **RAG** | Chunk → embed → pgvector → grounded answers |
| **Embeddings** | Local FastEmbed ONNX (`all-MiniLM-L6-v2`, 384d), fallback OpenAI → Groq |

## Tech stack

| Layer | Stack |
| ----- | ----- |
| Backend | NestJS, Prisma, PostgreSQL, pgvector |
| Frontend | Next.js 16, React 19, TanStack Query, Tailwind |
| Embeddings | FastAPI, [FastEmbed](https://github.com/qdrant/fastembed), ONNX Runtime |
| DevOps | Docker Compose, pnpm |

## Project structure

```
ai-integration/
├── client/                 # Next.js — /, /chat, /tools, /ai-tools, /rag
├── server/                 # NestJS API (api/v1)
├── embeddings/             # Local ONNX embedding service (:8000)
├── postgres/               # Dev Postgres data (gitignored)
└── docker-compose.dev.yml
```

Docker builds use **per-service** `.dockerignore` files (`client/`, `server/`, `embeddings/`). There is no repo-root `.dockerignore`.

## Quick start (Docker)

**1. Env**

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Set `AI_API_KEY` in `server/.env`. For cloud embedding fallback when local service is down, set `AI_EMBEDDING_API_KEY`.

**2. Start stack**

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

Services: **postgres** (pgvector), **embeddings** (ONNX), **server**, **client**.

**3. Migrations**

```bash
docker compose -f docker-compose.dev.yml exec server pnpm prisma migrate deploy
```

**4. URLs**

| URL | Description |
| --- | ------------- |
| http://localhost:3000 | Frontend home |
| http://localhost:3000/chat | Chat |
| http://localhost:3000/rag | RAG knowledge base |
| http://localhost:3000/ai-tools | Structured tools |
| http://localhost:4000/api/v1 | REST API |
| http://localhost:8000/health | Embedding service health |

## Quick start (local)

**1. Postgres + embeddings**

```bash
docker compose -f docker-compose.dev.yml up postgres -d

cd embeddings
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

First run downloads the ONNX model (~80MB) into `embeddings/.cache/` (gitignored).

**2. API**

```bash
cd server && cp .env.example .env
pnpm install && pnpm prisma:generate && pnpm prisma:migrate
pnpm start:dev
```

**3. UI**

```bash
cd client && cp .env.example .env
pnpm install && pnpm dev
```

## Environment variables

### Server (`server/.env`)

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `API_PORT` | API port | `4000` |
| `CLIENT_ORIGIN` | CORS | `http://localhost:3000` |
| `DATABASE_URL` | Postgres | see `.env.example` |
| `AI_PROVIDER` | `openai` \| `groq` | `openai` |
| `AI_API_KEY` | Chat / structured API key | — |
| `LOCAL_EMBEDDING_URL` | Embedding service | `http://localhost:8000` |
| `LOCAL_EMBEDDING_TIMEOUT_MS` | HTTP timeout (ms) | `30000` |
| `LOCAL_EMBEDDING_MAX_RETRIES` | Retry attempts | `3` |
| `AI_EMBEDDING_DIMENSIONS` | pgvector width | `384` |
| `AI_EMBEDDING_API_KEY` | OpenAI key (embedding fallback) | — |

Docker overrides in `docker-compose.dev.yml`: `DATABASE_URL` → `postgres`, `LOCAL_EMBEDDING_URL` → `http://embeddings:8000`.

### Client (`client/.env`)

| Variable | Default |
| -------- | ------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` |

## Embeddings & RAG

Pipeline: **local ONNX → OpenAI → Groq** via `AiService.generateEmbedding()`.

| Endpoint | Purpose |
| -------- | ------- |
| `POST /embed` | Single text → `embedding[]` |
| `POST /embed/batch` | Up to 256 texts (RAG document ingest) |

```bash
curl -s http://localhost:8000/health | jq
curl -s -X POST http://localhost:8000/embed \
  -H "Content-Type: application/json" \
  -d '{"text":"hello world"}' | jq '.dimensions'
```

Details: [`embeddings/README.md`](embeddings/README.md).

> If you change `AI_EMBEDDING_DIMENSIONS`, run Prisma migrations and **re-index** all RAG documents.

## API overview

### Chat

| Method | Path |
| ------ | ---- |
| `POST` | `/api/v1/chat` |
| `POST` | `/api/v1/chat/stream` |
| `GET` | `/api/v1/chat` |
| `GET` | `/api/v1/chat/:id` |

### Content tools

`POST` `/api/v1/summarize` · `/rewrite` · `/extract-keywords` · `/generate-description`

### Structured AI tools

`POST` `/api/v1/ai-tools/cv/parse` · `/jobs/extract` · `/jobs/match`

### RAG

| Method | Path |
| ------ | ---- |
| `POST` | `/api/v1/rag/documents` |
| `POST` | `/api/v1/rag/ask` |
| `GET` | `/api/v1/rag/documents` |

## Chat provider switch

```env
# OpenAI
AI_PROVIDER=openai
AI_API_KEY=sk-...

# Groq
AI_PROVIDER=groq
AI_API_KEY=gsk_...
AI_MODEL=llama-3.3-70b-versatile
```

Restart the server after changes.

## Commands

```bash
# Embeddings only
docker compose -f docker-compose.dev.yml up --build embeddings -d
docker compose -f docker-compose.dev.yml logs -f embeddings

# Full stack
docker compose -f docker-compose.dev.yml up --build -d
docker compose -f docker-compose.dev.yml logs -f server embeddings

# Prisma
docker compose -f docker-compose.dev.yml exec server pnpm prisma migrate deploy
cd server && pnpm prisma:studio
```

## Architecture

```
Browser (Next.js)
    ↓
NestJS /api/v1
    ├── Chat · Content · AI-tools → AiProvider (OpenAI | Groq)
    └── RAG → EmbeddingGenerator
              ├── 1. embeddings:8000 (FastEmbed ONNX)
              ├── 2. OpenAI embeddings (fallback)
              └── 3. Groq (fallback)
              → pgvector cosine search → LLM answer
```

## Ignore files

| File | Scope |
| ---- | ----- |
| [`.gitignore`](.gitignore) | Repo-wide: Node, Python venv, FastEmbed cache, `postgres/data`, secrets |
| [`client/.dockerignore`](client/.dockerignore) | Client image build context |
| [`server/.dockerignore`](server/.dockerignore) | Server image build context |
| [`embeddings/.dockerignore`](embeddings/.dockerignore) | Embeddings image — excludes venv, model cache, docs |

Do not commit: `.env`, `node_modules/`, `embeddings/venv/`, `embeddings/.cache/`, `postgres/data/`.

## License

UNLICENSED — private project.
