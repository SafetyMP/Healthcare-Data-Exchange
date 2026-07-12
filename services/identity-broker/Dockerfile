FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml ./
COPY chex_identity ./chex_identity
RUN pip install --no-cache-dir .
EXPOSE 8085
CMD ["uvicorn", "chex_identity.main:app", "--host", "0.0.0.0", "--port", "8085"]
