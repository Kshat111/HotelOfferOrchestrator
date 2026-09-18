FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim AS runtime

WORKDIR /app

RUN apt-get update \
        && apt-get install --no-install-recommends --yes ca-certificates curl \
        && rm -rf /var/lib/apt/lists/* \
        && groupadd --system app \
        && useradd --system --gid app --create-home app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
    && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh \
    && chown -R app:app /app

ENV NODE_ENV=production
ENV RUN_MODE=api

USER app

ENTRYPOINT ["/app/docker-entrypoint.sh"]
