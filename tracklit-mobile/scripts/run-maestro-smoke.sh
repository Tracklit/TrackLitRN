#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
USER_IDENTIFIER="${E2E_USER_USERNAME:-${E2E_USER_EMAIL:-}}"
ADMIN_IDENTIFIER="${E2E_ADMIN_USERNAME:-${E2E_ADMIN_EMAIL:-}}"
USER_TOKEN="${E2E_USER_TOKEN:-}"
ADMIN_TOKEN="${E2E_ADMIN_TOKEN:-}"

cd "$ROOT_DIR"

terminate_simulator_app() {
  if command -v xcrun >/dev/null 2>&1; then
    xcrun simctl terminate booted com.tracklit.app >/dev/null 2>&1 || true
  fi
}

maestro test maestro/auth-gate.yaml

if [[ -z "${USER_TOKEN}" && ( -z "${USER_IDENTIFIER}" || -z "${E2E_USER_PASSWORD:-}" ) ]]; then
  if command -v az >/dev/null 2>&1; then
    eval "$(SMOKE_TOKEN_OUTPUT_FORMAT=env node ./scripts/derive-prod-smoke-tokens.mjs)"
    USER_TOKEN="${E2E_USER_TOKEN:-}"
    ADMIN_TOKEN="${E2E_ADMIN_TOKEN:-}"
  fi
fi

if [[ -n "${USER_TOKEN}" ]]; then
  terminate_simulator_app
  maestro test maestro/user-smoke-token.yaml \
    -e E2E_USER_TOKEN="$USER_TOKEN"
elif [[ -z "${USER_IDENTIFIER}" || -z "${E2E_USER_PASSWORD:-}" ]]; then
  echo "Skipping authenticated Maestro smoke: set E2E_USER_TOKEN or E2E_USER_USERNAME/E2E_USER_EMAIL plus E2E_USER_PASSWORD."
else
  maestro test maestro/user-smoke.yaml \
    -e E2E_USER_IDENTIFIER="$USER_IDENTIFIER" \
    -e E2E_USER_PASSWORD="$E2E_USER_PASSWORD"
fi

if [[ -n "${ADMIN_TOKEN}" ]]; then
  terminate_simulator_app
  maestro test maestro/admin-smoke-token.yaml \
    -e E2E_ADMIN_TOKEN="$ADMIN_TOKEN"
elif [[ -z "${ADMIN_IDENTIFIER}" || -z "${E2E_ADMIN_PASSWORD:-}" ]]; then
  echo "Skipping admin Maestro smoke: set E2E_ADMIN_TOKEN or E2E_ADMIN_USERNAME/E2E_ADMIN_EMAIL plus E2E_ADMIN_PASSWORD."
else
  maestro test maestro/admin-smoke.yaml \
    -e E2E_ADMIN_IDENTIFIER="$ADMIN_IDENTIFIER" \
    -e E2E_ADMIN_PASSWORD="$E2E_ADMIN_PASSWORD"
fi
