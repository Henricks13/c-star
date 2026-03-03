#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update
sudo apt-get install -y ca-certificates curl git

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi

sudo usermod -aG docker "$USER"

if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl enable docker
  sudo systemctl start docker
fi

echo "Bootstrap concluído. Faça logout/login SSH para aplicar grupo docker."
