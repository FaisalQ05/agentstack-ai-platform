# Client (Next.js)

Frontend for the AI Integration monorepo.

## Routes

| Path | Feature |
| ---- | ------- |
| `/` | Home — links to all tools |
| `/chat` | Streaming chat with conversation history |
| `/tools` | Content tools (summarize, rewrite, keywords, descriptions) |
| `/ai-tools` | Structured AI (CV parse, job extract, match) |
| `/rag` | RAG knowledge base (ingest + ask) |

## Setup

```bash
cp .env.example .env
pnpm install
pnpm dev
```

| Variable | Description |
| -------- | ----------- |
| `NEXT_PUBLIC_API_URL` | NestJS API base (default `http://localhost:4000`) |

## Scripts

```bash
pnpm dev      # development server (:3000)
pnpm build    # production build
pnpm start    # run production build
pnpm lint     # ESLint
```

## Docker

Built from this directory via `docker/dev.Dockerfile`. Source is volume-mounted in dev compose — see root [`README.md`](../README.md).

## Ignore

- **Git:** `node_modules/`, `.next/`, `.env` — see root [`.gitignore`](../.gitignore)
- **Docker:** [`.dockerignore`](.dockerignore) excludes `node_modules`, `.next`, env files from build context
