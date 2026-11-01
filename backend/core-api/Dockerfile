FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt requirements-ml.txt ./
ARG ENABLE_ML=true
RUN if [ "$ENABLE_ML" = "true" ]; then pip install --no-cache-dir -r requirements-ml.txt; else pip install --no-cache-dir -r requirements.txt; fi

COPY app ./app
COPY migrations ./migrations
COPY alembic.ini entrypoint.sh ./

RUN useradd --uid 1000 --create-home appuser && mkdir /data && chown appuser /data
USER 1000:1000

EXPOSE 8000

ENV MODEL_STORE=/data/models
CMD ["sh", "entrypoint.sh"]
