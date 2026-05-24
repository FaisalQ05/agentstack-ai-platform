# AI Integration

Full-stack MERN-style starter for learning AI integration: **NestJS** backend, **Next.js** frontend, **PostgreSQL** persistence, and a **provider-agnostic** AI layer (OpenAI or Groq).

## Features

- **AI Chat API** — `POST /api/v1/chat` with system prompt injection and **SSE streaming** at `POST /api/v1/chat/stream`
- **Content tools** — `/summarize`, `/rewrite`, `/extract-keywords`, `/generate-description`
- **Conversation memory** — messages stored in PostgreSQL via Prisma
- **Swappable AI providers** — change `AI_PROVIDER` in env (OpenAI ↔ Groq)
- **Chat UI** — Next.js app at `/chat` with conversation sidebar

## Tech stack

| Layer    | Stack                                      |
| -------- | ------------------------------------------ |
| Backend  | NestJS, Prisma, PostgreSQL, OpenAI SDK     |
| Frontend | Next.js 16, React 19, TanStack Query, Tailwind |
| DevOps   | Docker Compose, pnpm                       |

## Project structure

```
ai-integration/
├── client/          # Next.js frontend
├── server/          # NestJS API
├── postgres/        # Local Postgres data (gitignored)
└── docker-compose.dev.yml
```

## Quick start (Docker)

**1. Clone and configure env**

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` and set `AI_API_KEY`.

**2. Start all services**

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

**3. Run database migrations**

```bash
docker compose -f docker-compose.dev.yml exec server pnpm prisma migrate deploy
```

**4. Open the app**

- Frontend: http://localhost:3000
- Chat UI: http://localhost:3000/chat
- API: http://localhost:4000/api/v1

## Quick start (local)

**1. Start Postgres**

```bash
docker compose -f docker-compose.dev.yml up postgres -d
```

**2. Backend**

```bash
cd server
cp .env.example .env   # set AI_API_KEY
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm start:dev
```

**3. Frontend**

```bash
cd client
cp .env.example .env
pnpm install
pnpm dev
```

## Environment variables

### Server (`server/.env`)

| Variable        | Description                          | Default                    |
| --------------- | ------------------------------------ | -------------------------- |
| `API_PORT`      | API port                             | `4000`                     |
| `CLIENT_ORIGIN` | Frontend URL for CORS                | `http://localhost:3000`    |
| `DATABASE_URL`  | Postgres connection string           | see `.env.example`         |
| `AI_PROVIDER`   | `openai` or `groq`                   | `openai`                   |
| `AI_API_KEY`    | Provider API key                     | —                          |
| `AI_MODEL`      | Model name (optional)                | provider default           |

> **Docker note:** When the server runs in Docker, `DATABASE_URL` is overridden to `postgres:5432` in `docker-compose.dev.yml`. Keep `localhost` in `.env` for local (non-Docker) development.

### Client (`client/.env`)

| Variable               | Description   | Default                 |
| ---------------------- | ------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL`  | Backend URL   | `http://localhost:4000` |

## API

### `POST /api/v1/chat`

Send a message and get an AI reply (non-streaming). Creates a new conversation if `conversationId` is omitted.

```json
{
  "message": "Explain JWT in simple terms",
  "conversationId": "optional-uuid",
  "system": "You are a helpful MERN mentor."
}
```

### `POST /api/v1/chat/stream` (SSE)

Same body as `/chat`. Streams tokens as Server-Sent Events:

| Event | Payload |
| ----- | ------- |
| `meta` | `{ conversationId, provider, model }` |
| `token` | `{ delta: "..." }` |
| `done` | Full `ChatResponse` with saved message |
| `error` | `{ code, message }` |

```bash
curl -N -X POST http://localhost:4000/api/v1/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

### `GET /api/v1/chat`

List all conversations.

### `GET /api/v1/chat/:conversationId`

Load a conversation with full message history.

## Content tools (micro-endpoints)

Stateless AI utilities — no database, any frontend can call them. All use `POST` with JSON body.

| Endpoint | Description |
| -------- | ----------- |
| `POST /api/v1/summarize` | Shorten text |
| `POST /api/v1/rewrite` | Rewrite in a given style |
| `POST /api/v1/extract-keywords` | Return keyword array |
| `POST /api/v1/generate-description` | Generate marketing copy |

### `POST /api/v1/summarize`

```json
{
  "content": "Long article text...",
  "maxLength": 150,
  "tone": "professional"
}
```

**Response:** `{ "summary": "...", "provider": "openai", "model": "gpt-4o-mini" }`

### `POST /api/v1/rewrite`

```json
{
  "content": "Text to improve",
  "style": "formal",
  "instructions": "Keep technical terms"
}
```

`style`: `formal` | `casual` | `concise` | `friendly` | `professional`

**Response:** `{ "rewritten": "...", "provider": "...", "model": "..." }`

### `POST /api/v1/extract-keywords`

```json
{
  "content": "Article or product text...",
  "count": 10
}
```

**Response:** `{ "keywords": ["ai", "nestjs", "..."], "provider": "...", "model": "..." }`

### `POST /api/v1/generate-description`

```json
{
  "title": "Wireless Headphones",
  "content": "Noise cancelling, 40h battery",
  "type": "product",
  "maxLength": 300
}
```

`type`: `product` | `article` | `service` | `general` — at least one of `title` or `content` required.

**Response:** `{ "description": "...", "provider": "...", "model": "..." }`

### Frontend usage (TypeScript)

```ts
import { summarize, rewrite, extractKeywords, generateDescription } from '@/features/content-tools/api/content-tools.api';

const { summary } = await summarize({ content: '...' });
const { keywords } = await extractKeywords({ content: '...', count: 5 });
```

## Switch AI provider

**OpenAI**

```env
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
```

**Groq**

```env
AI_PROVIDER=groq
AI_API_KEY=gsk_...
AI_MODEL=llama-3.3-70b-versatile
```

Restart the server after changing env.

## Useful commands

```bash
# Server
cd server
pnpm start:dev
pnpm prisma:studio
pnpm prisma:migrate

# Client
cd client
pnpm dev

# Docker
docker compose -f docker-compose.dev.yml up --build -d
docker compose -f docker-compose.dev.yml logs server -f
docker compose -f docker-compose.dev.yml down
```

## Architecture

```
Browser (Next.js)
    ↓ POST /api/v1/chat
ChatController → ChatService
    ├── PrismaService (PostgreSQL memory)
    └── AiService → OpenAiProvider | GroqProvider
```

## License

UNLICENSED — private project.
