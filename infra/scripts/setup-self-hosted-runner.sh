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
RUNNER_VERSION="${RUNNER_VERSION:-latest}"
RUNNER_DIR="/opt/actions-runner"

sudo apt-get update
sudo apt-get install -y curl tar jq

sudo mkdir -p "$RUNNER_DIR"
sudo chown -R "$USER":"$USER" "$RUNNER_DIR"
cd "$RUNNER_DIR"

resolve_runner_version() {
  if [ "$RUNNER_VERSION" != "latest" ]; then
    echo "$RUNNER_VERSION"
    return 0
  fi

  curl -fsSL "https://api.github.com/repos/actions/runner/releases/latest" | jq -r '.tag_name' | sed 's/^v//'
}

RESOLVED_VERSION="$(resolve_runner_version)"
ARCHIVE="actions-runner-linux-x64-${RESOLVED_VERSION}.tar.gz"

if [ ! -f "config.sh" ] || [ ! -f ".runner-version-${RESOLVED_VERSION}" ]; then
  rm -f actions-runner-linux-x64-*.tar.gz
  curl -L -o "$ARCHIVE" "https://github.com/actions/runner/releases/download/v${RESOLVED_VERSION}/${ARCHIVE}"
  tar xzf "$ARCHIVE"
  rm -f .runner-version-*
  touch ".runner-version-${RESOLVED_VERSION}"
fi

./config.sh --unattended --url "$REPO_URL" --token "$RUNNER_TOKEN" --labels "$RUNNER_LABEL" --name "$RUNNER_NAME" --work "_work" --replace
sudo ./svc.sh install

SERVICE_NAME=$(ls /etc/systemd/system/actions.runner.*.service 2>/dev/null | head -n 1 || true)
if [ -n "$SERVICE_NAME" ]; then
  SERVICE_BASENAME=$(basename "$SERVICE_NAME")
  sudo mkdir -p "/etc/systemd/system/${SERVICE_BASENAME}.d"
  cat <<'EOF' | sudo tee "/etc/systemd/system/${SERVICE_BASENAME}.d/override.conf" >/dev/null
[Service]
Restart=always
RestartSec=5
EOF
  sudo systemctl daemon-reload
fi

sudo ./svc.sh start

echo "Runner configurado e iniciado com label: $RUNNER_LABEL (versão ${RESOLVED_VERSION})"
