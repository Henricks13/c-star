#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-/opt/c-star}"

if [ ! -d "$PROJECT_DIR" ]; then
  echo "Diretório não encontrado: $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR"

if [ ! -f "infra/.env.server" ]; then
  echo "Arquivo infra/.env.server não encontrado."
  echo "Copie de infra/.env.server.example e ajuste valores antes de continuar."
  exit 1
fi

cp infra/.env.server infra/.env

docker compose --env-file infra/.env -f infra/docker-compose.server.yml pull || true
docker compose --env-file infra/.env -f infra/docker-compose.server.yml up -d --build

echo "Deploy concluído."
docker compose --env-file infra/.env -f infra/docker-compose.server.yml ps
