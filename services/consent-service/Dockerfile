FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml ./
COPY chex_consent ./chex_consent
RUN pip install --no-cache-dir .
EXPOSE 8084
CMD ["uvicorn", "chex_consent.main:app", "--host", "0.0.0.0", "--port", "8084"]
