from contextlib import asynccontextmanager
from typing import Iterator

import numpy as np
from fastapi import FastAPI, HTTPException
from fastembed import TextEmbedding
from pydantic import BaseModel, Field

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIM = 384

_model: TextEmbedding | None = None


def get_model() -> TextEmbedding:
    global _model
    if _model is None:
        _model = TextEmbedding(model_name=MODEL_NAME)
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Encode texts to L2-normalized vectors (cosine-ready for pgvector)."""
    model = get_model()
    vectors = list(model.embed(texts))
    return [np.asarray(v, dtype=np.float32).tolist() for v in vectors]


@asynccontextmanager
async def lifespan(_app: FastAPI) -> Iterator[None]:
    get_model()
    yield


app = FastAPI(
    title="Local Embeddings",
    version="2.0.0",
    description="ONNX-based embeddings (FastEmbed) — no PyTorch",
    lifespan=lifespan,
)


class EmbedRequest(BaseModel):
    text: str = Field(..., min_length=1)


class EmbedBatchRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, max_length=256)


class EmbedResponse(BaseModel):
    embedding: list[float]
    model: str = MODEL_NAME
    dimensions: int = EMBEDDING_DIM


class EmbedBatchResponse(BaseModel):
    embeddings: list[list[float]]
    model: str = MODEL_NAME
    dimensions: int = EMBEDDING_DIM


@app.get("/health")
def health():
    get_model()
    return {
        "status": "ok",
        "engine": "fastembed-onnx",
        "model": MODEL_NAME,
        "dimensions": EMBEDDING_DIM,
    }


@app.post("/embed", response_model=EmbedResponse)
def embed(body: EmbedRequest):
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text cannot be empty")

    vector = embed_texts([text])[0]
    return EmbedResponse(embedding=vector, dimensions=len(vector))


@app.post("/embed/batch", response_model=EmbedBatchResponse)
def embed_batch(body: EmbedBatchRequest):
    trimmed = [t.strip() for t in body.texts]
    if not trimmed or any(len(t) == 0 for t in trimmed):
        raise HTTPException(
            status_code=400,
            detail="texts must be a non-empty list of non-blank strings",
        )

    vectors = embed_texts(trimmed)
    return EmbedBatchResponse(
        embeddings=vectors,
        dimensions=len(vectors[0]) if vectors else EMBEDDING_DIM,
    )
