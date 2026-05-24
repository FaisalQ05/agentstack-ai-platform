# Server (NestJS)

REST API for chat, content tools, structured AI, and RAG. Global prefix: `/api/v1`.

## Setup

```bash
cp .env.example .env
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm start:dev
```

Requires **PostgreSQL** (pgvector) and the **embeddings** service for RAG — see root [`README.md`](../README.md).

## Key modules

| Module | Path prefix | Notes |
| ------ | ----------- | ----- |
| Chat | `/chat` | SSE stream, Prisma memory |
| Content tools | `/summarize`, etc. | Stateless |
| AI tools | `/ai-tools` | Zod + structured JSON |
| RAG | `/rag` | pgvector via raw SQL |

## AI configuration

| Variable | Purpose |
| -------- | ------- |
| `AI_PROVIDER` | Chat: `openai` \| `groq` |
| `AI_API_KEY` | Primary provider key |
| `LOCAL_EMBEDDING_URL` | RAG embeddings (default `http://localhost:8000`) |
| `AI_EMBEDDING_API_KEY` | OpenAI fallback for vectors |

Embedding pipeline: `EmbeddingGeneratorService` → local → OpenAI → Groq.

## Prisma

```bash
pnpm prisma:generate    # client → server/generated/prisma
pnpm prisma:migrate     # dev migrations
pnpm prisma:studio      # DB GUI (:5555)
```

Use `pgvector/pgvector` Postgres image for RAG similarity search.

## Scripts

```bash
pnpm start:dev    # watch mode (:4000)
pnpm build        # compile
pnpm test         # unit tests
```

## Docker

`docker/dev.Dockerfile` — installs deps; source mounted in `docker-compose.dev.yml`.

## Ignore

- **Git:** `dist/`, `generated/`, `.env` — root [`.gitignore`](../.gitignore)
- **Docker:** [`.dockerignore`](.dockerignore) excludes `node_modules`, `dist`, `generated`
