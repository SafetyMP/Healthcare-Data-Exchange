FROM python:3.14-slim
WORKDIR /app
COPY pyproject.toml ./
COPY chex_ai_governance ./chex_ai_governance
RUN pip install --no-cache-dir ".[dev]"
EXPOSE 8082
CMD ["uvicorn", "chex_ai_governance.main:app", "--host", "0.0.0.0", "--port", "8082"]
