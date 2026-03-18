#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${2:-/opt/c-star}"

if [ ! -d "$PROJECT_DIR/.git" ]; then
  echo "Repositório não encontrado em: $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR"

TARGET_SHA="${1:-}"
if [ -z "$TARGET_SHA" ]; then
  TARGET_SHA="$(git rev-list --max-count=2 HEAD | tail -n 1 || true)"
fi

if [ -z "$TARGET_SHA" ]; then
  echo "Não foi possível determinar commit para rollback."
  exit 1
fi

echo "Executando rollback para commit: $TARGET_SHA"
git reset --hard "$TARGET_SHA"

bash infra/scripts/deploy-ec2.sh "$PROJECT_DIR"

echo "Rollback concluído com sucesso."
