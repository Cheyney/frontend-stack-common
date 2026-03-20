set dotenv-load

default:
    @just --list

# Development
dev:
    bun run dev

# Code generation
generate:
    bun run generate

generate-watch:
    bun run generate:watch

# Build
build:
    bun run build

# Type check
check:
    bunx tsc -b --noEmit

# Test
test:
    bun test

# Docker
up:
    docker compose up -d

down:
    docker compose down

logs service="app":
    docker compose logs -f {{service}}

status:
    docker compose ps
