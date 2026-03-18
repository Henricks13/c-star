#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-/opt/c-star}"
COMPOSE_FILE="infra/docker-compose.server.yml"
ENV_FILE="infra/.env"

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

echo "[precheck] Uso de disco"
df -h /

echo "[precheck] Memória e swap"
free -h

ensure_swap() {
  local current_swap_mb
  current_swap_mb=$(free -m | awk '/^Swap:/ {print $2}')

  if [ "${current_swap_mb:-0}" -gt 0 ]; then
    return 0
  fi

  if ! sudo -n true 2>/dev/null; then
    echo "[warn] Sem permissão sudo não-interativa para criar swap; seguindo sem swap."
    return 0
  fi

  echo "[precheck] Sem swap detectado, criando swap de 2G em /swapfile-cstar"
  if [ ! -f /swapfile-cstar ]; then
    sudo fallocate -l 2G /swapfile-cstar || sudo dd if=/dev/zero of=/swapfile-cstar bs=1M count=2048
    sudo chmod 600 /swapfile-cstar
    sudo mkswap /swapfile-cstar
  fi

  sudo swapon /swapfile-cstar || true
  if ! grep -q '^/swapfile-cstar ' /etc/fstab; then
    echo '/swapfile-cstar none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  fi
}

ensure_swap

export COMPOSE_PARALLEL_LIMIT=1
export DOCKER_BUILDKIT=1

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull || true
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --pull backend
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --pull frontend
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d postgres evolution-postgres evolution backend frontend

echo "Deploy concluído."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
