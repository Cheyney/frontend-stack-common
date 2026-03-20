# --- Base ---
FROM oven/bun:1-slim AS base
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- Build ---
FROM deps AS build
COPY . .
RUN bun run build

# --- Runtime ---
FROM caddy:2-alpine AS runtime
COPY --from=build /app/dist /srv
COPY <<'EOF' /etc/caddy/Caddyfile
:80 {
    root * /srv
    encode gzip
    try_files {path} /index.html
    file_server
}
EOF
EXPOSE 80
