#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Uso: $0 <repo-url> <runner-token> [runner-label] [runner-name]"
  echo "Exemplo: $0 https://github.com/Henricks13/c-star ABCDEF cstar-homolog cstar-ec2-runner"
  exit 1
fi

REPO_URL="$1"
RUNNER_TOKEN="$2"
RUNNER_LABEL="${3:-cstar-homolog}"
RUNNER_NAME="${4:-$(hostname)-cstar-homolog}"
RUNNER_VERSION="2.327.1"
RUNNER_DIR="/opt/actions-runner"

sudo apt-get update
sudo apt-get install -y curl tar jq

sudo mkdir -p "$RUNNER_DIR"
sudo chown -R "$USER":"$USER" "$RUNNER_DIR"
cd "$RUNNER_DIR"

if [ ! -f "config.sh" ]; then
  curl -L -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
  tar xzf actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz
fi

./config.sh --unattended --url "$REPO_URL" --token "$RUNNER_TOKEN" --labels "$RUNNER_LABEL" --name "$RUNNER_NAME" --work "_work" --replace
sudo ./svc.sh install
sudo ./svc.sh start

echo "Runner configurado e iniciado com label: $RUNNER_LABEL"
