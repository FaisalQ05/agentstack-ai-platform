FROM python:3.12-slim

WORKDIR /app

# ONNX runtime only — no PyTorch / scipy / scikit-learn
ENV FASTEMBED_CACHE_PATH=/app/.cache \
    OMP_NUM_THREADS=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Bake model weights into the image (fast cold start, no HF torch stack)
RUN python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='sentence-transformers/all-MiniLM-L6-v2')"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
