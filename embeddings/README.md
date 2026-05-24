# Local Embeddings Service

CPU-friendly **ONNX** embeddings for RAG, built with [FastEmbed](https://github.com/qdrant/fastembed). Uses `sentence-transformers/all-MiniLM-L6-v2` (**384** dimensions) — compatible with pgvector in the main API.

No PyTorch, scipy, or scikit-learn in the dependency tree.

## Stack comparison

| | sentence-transformers | This service (FastEmbed) |
| --- | --- | --- |
| Inference | PyTorch | ONNX Runtime |
| Typical Docker image | Multi-GB, slow build | Slim `python:3.12-slim`, fast build |
| CPU usage | Heavy | Tuned for batch CPU inference |
| Vectors | 384-d MiniLM | 384-d MiniLM (L2-normalized) |

## Requirements

- Python 3.11+
- ~80MB model download on first run (cached under `FASTEMBED_CACHE_PATH` or `embeddings/.cache/`)

## API

| Method | Path | Request | Response |
| ------ | ---- | ------- | -------- |
| `GET` | `/health` | — | `{ status, engine, model, dimensions }` |
| `POST` | `/embed` | `{ "text": "..." }` | `{ embedding, model, dimensions }` |
| `POST` | `/embed/batch` | `{ "texts": ["..."] }` (max 256) | `{ embeddings, model, dimensions }` |

### Examples

```bash
curl -s http://localhost:8000/health | jq

curl -s -X POST http://localhost:8000/embed \
  -H "Content-Type: application/json" \
  -d '{"text":"RAG chunk text"}' | jq '.dimensions'

curl -s -X POST http://localhost:8000/embed/batch \
  -H "Content-Type: application/json" \
  -d '{"texts":["chunk one","chunk two"]}' | jq '.embeddings | length'
```

## Run locally

```bash
cd embeddings
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Optional: set cache dir (default: platform cache)
export FASTEMBED_CACHE_PATH="$(pwd)/.cache"

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Point the NestJS server at `LOCAL_EMBEDDING_URL=http://localhost:8000`.

## Docker

```bash
# From repo root
docker compose -f docker-compose.dev.yml up --build embeddings -d

# Or build this directory only
docker build -t ai-embeddings .
docker run --rm -p 8000:8000 ai-embeddings
```

The Dockerfile pre-downloads ONNX weights at **build** time (`FASTEMBED_CACHE_PATH=/app/.cache`) so containers start quickly.

Environment:

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `FASTEMBED_CACHE_PATH` | `/app/.cache` (Docker) | Model weight cache |
| `OMP_NUM_THREADS` | `1` | ONNX thread cap (stable CPU) |

## Integration with NestJS

The API server calls this service first, then falls back to cloud providers:

1. **Local** (this service) — `LocalEmbeddingService` → `/embed/batch` for RAG ingest
2. **OpenAI** — `text-embedding-3-small` @ 384 dims
3. **Groq** — last resort

See root [`README.md`](../README.md) for full RAG setup.

## Files

| File | Role |
| ---- | ---- |
| `main.py` | FastAPI app, FastEmbed loader |
| `requirements.txt` | `fastapi`, `uvicorn`, `fastembed` |
| `Dockerfile` | Slim production image |
| `.dockerignore` | Keeps venv/cache out of build context |

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| `Connection refused` from API | Start embeddings on :8000 or set `LOCAL_EMBEDDING_URL` |
| Slow first request locally | Normal — model loads once; use Docker image for pre-baked weights |
| Dimension mismatch in RAG | Ensure `AI_EMBEDDING_DIMENSIONS=384` and re-index documents |
