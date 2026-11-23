FROM python:3.15-slim@sha256:65a65fc7b30b06cb6df4930fd4650697cb23f4c2698ab81fc87e4b031bc36928
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir --require-hashes -r requirements.txt
COPY chex_identity ./chex_identity
ENV PYTHONPATH=/app
EXPOSE 8085
CMD ["uvicorn", "chex_identity.main:app", "--host", "0.0.0.0", "--port", "8085"]
