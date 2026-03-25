#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-/opt/c-star}"
COMPOSE_FILE="infra/docker-compose.server.yml"
ENV_FILE="infra/.env"
HEALTH_URL="http://localhost/actuator/health"

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

required_vars=(
  POSTGRES_DB
  POSTGRES_USER
  POSTGRES_PASSWORD
  JWT_SECRET
  WHATSAPP_PROVIDER
  WHATSAPP_INSTANCE_PREFIX
  WHATSAPP_PUBLIC_BASE_URL
  WHATSAPP_WEBHOOK_SECRET
  EVOLUTION_BASE_URL
  EVOLUTION_API_KEY
  EVOLUTION_POSTGRES_PASSWORD
)

missing_vars=()
for key in "${required_vars[@]}"; do
  value=$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d '=' -f2- || true)
  if [ -z "${value//[[:space:]]/}" ]; then
    missing_vars+=("$key")
  fi
done

if [ "${#missing_vars[@]}" -gt 0 ]; then
  echo "Variáveis obrigatórias ausentes ou vazias em infra/.env.server: ${missing_vars[*]}"
  exit 1
fi

normalize_var() {
  echo "$1" | tr '[:upper:]' '[:lower:]'
}

WHATSAPP_PUBLIC_BASE_URL_VALUE=$(grep -E '^WHATSAPP_PUBLIC_BASE_URL=' "$ENV_FILE" | tail -n 1 | cut -d '=' -f2-)
EVOLUTION_BASE_URL_VALUE=$(grep -E '^EVOLUTION_BASE_URL=' "$ENV_FILE" | tail -n 1 | cut -d '=' -f2-)

WHATSAPP_PUBLIC_BASE_URL_NORMALIZED=$(normalize_var "$WHATSAPP_PUBLIC_BASE_URL_VALUE")
EVOLUTION_BASE_URL_NORMALIZED=$(normalize_var "$EVOLUTION_BASE_URL_VALUE")

if [[ "$WHATSAPP_PUBLIC_BASE_URL_NORMALIZED" == *"localhost"* || "$WHATSAPP_PUBLIC_BASE_URL_NORMALIZED" == *"127.0.0.1"* ]]; then
  echo "WHATSAPP_PUBLIC_BASE_URL inválido para servidor: '$WHATSAPP_PUBLIC_BASE_URL_VALUE'. Use domínio/IP público alcançável."
  exit 1
fi

if [[ "$EVOLUTION_BASE_URL_NORMALIZED" == *"localhost"* || "$EVOLUTION_BASE_URL_NORMALIZED" == *"127.0.0.1"* ]]; then
  echo "EVOLUTION_BASE_URL inválido para backend em Docker: '$EVOLUTION_BASE_URL_VALUE'. Use endereço de serviço interno (ex.: http://evolution:8080)."
  exit 1
fi

if [[ ! "$WHATSAPP_PUBLIC_BASE_URL_NORMALIZED" =~ ^https?:// ]]; then
  echo "WHATSAPP_PUBLIC_BASE_URL deve começar com http:// ou https://. Valor atual: '$WHATSAPP_PUBLIC_BASE_URL_VALUE'"
  exit 1
fi

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

if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl enable docker || true
  sudo systemctl start docker || true
fi

export COMPOSE_PARALLEL_LIMIT=1
export DOCKER_BUILDKIT=1

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull || true
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --pull backend
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --pull frontend
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d postgres evolution-postgres evolution backend frontend

echo "Deploy concluído."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo "[health] aguardando backend responder em ${HEALTH_URL}"
for attempt in $(seq 1 80); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "[health] OK"
    exit 0
  fi

  if [ "$attempt" -eq 1 ] || [ $((attempt % 10)) -eq 0 ]; then
    echo "[health] tentativa ${attempt}/80 ainda sem resposta"
  fi

  sleep 3
done

echo "[health] FALHOU: backend não respondeu em tempo hábil"
echo "[health] status atual dos containers"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps || true

echo "[health] últimas linhas do backend"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail 200 backend || true

exit 1
