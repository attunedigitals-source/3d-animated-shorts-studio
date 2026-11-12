#!/usr/bin/env bash
# ==============================================================================
# Pure AI 3D Animated Video Studio — AWS EC2 Production Deployment Script
# ==============================================================================

set -euo pipefail

TARGET_SHA="${1:-HEAD}"
DEPLOY_DIR="/home/ubuntu/3d-animated-shorts-studio"
SERVICE_NAME="studio-api"

echo "========================================================"
echo " Starting Pure 3D Animated Studio Deployment to AWS EC2"
echo " Timestamp:  $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo " Target SHA: ${TARGET_SHA}"
echo " Deploy Dir: ${DEPLOY_DIR}"
echo " Service:    ${SERVICE_NAME}"
echo "========================================================"

if [ ! -d "${DEPLOY_DIR}" ]; then
  echo "[-] ERROR: Deployment directory '${DEPLOY_DIR}' does not exist on this server."
  exit 1
fi
cd "${DEPLOY_DIR}"

PREV_SHA=$(git rev-parse HEAD 2>/dev/null || echo "")
echo "[+] Current deployed commit: ${PREV_SHA:-unknown}"

BACKUP_DIR="/tmp/studio_api_dist_backup_${PREV_SHA}"
rm -rf "${BACKUP_DIR}"
if [ -d "apps/api/dist" ]; then
  echo "[+] Backing up existing apps/api/dist to ${BACKUP_DIR}..."
  cp -r apps/api/dist "${BACKUP_DIR}"
fi

rollback() {
  local failed_stage="$1"
  echo "[-] DEPLOYMENT FAILED AT STAGE: ${failed_stage}"
  echo "[-] Initiating automated rollback procedure..."

  if [ -n "${PREV_SHA}" ]; then
    git checkout "${PREV_SHA}" || true
    if [ -d "${BACKUP_DIR}" ]; then
      rm -rf apps/api/dist
      cp -r "${BACKUP_DIR}" apps/api/dist || true
    fi
    sudo systemctl restart "${SERVICE_NAME}" || true
  fi
  rm -rf "${BACKUP_DIR}"
  exit 1
}

echo "[+] Fetching latest changes from origin..."
git fetch origin main || rollback "git-fetch"

echo "[+] Checking out commit ${TARGET_SHA}..."
git checkout "${TARGET_SHA}" || rollback "git-checkout"

echo "[+] Installing dependencies..."
pnpm install || rollback "pnpm-install"

echo "[+] Building production application..."
pnpm build || rollback "pnpm-build"

echo "[+] Restarting systemd service: ${SERVICE_NAME}..."
sudo systemctl restart "${SERVICE_NAME}" || rollback "systemctl-restart"

if ! sudo systemctl is-active --quiet "${SERVICE_NAME}"; then
  echo "[-] Error: ${SERVICE_NAME} is not active after restart!"
  rollback "service-not-active"
fi
echo "[+] Service ${SERVICE_NAME} is active."

API_PORT="4000"
if [ -f ".env" ]; then
  ENV_PORT=$(grep -E '^API_PORT=' .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ' || true)
  if [ -n "${ENV_PORT}" ]; then
    API_PORT="${ENV_PORT}"
  fi
fi

HEALTH_URL="http://127.0.0.1:${API_PORT}/health"
echo "[+] Performing health check probe at ${HEALTH_URL}..."

MAX_RETRIES=15
RETRY_COUNT=0
HEALTH_OK=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  HTTP_STATUS=$(curl -s -o /tmp/studio_health_response.json -w "%{http_code}" "${HEALTH_URL}" || true)
  if [ "${HTTP_STATUS}" = "200" ]; then
    echo "[+] Health check passed with HTTP 200!"
    cat /tmp/studio_health_response.json || true
    echo ""
    HEALTH_OK=true
    break
  fi
  echo "    Attempt $((RETRY_COUNT + 1))/${MAX_RETRIES}: received HTTP ${HTTP_STATUS}, retrying in 2s..."
  sleep 2
  RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ "${HEALTH_OK}" != "true" ]; then
  echo "[-] Health check failed to return HTTP 200 within timeout."
  rollback "health-check-failed"
fi

rm -rf "${BACKUP_DIR}"
echo "========================================================"
echo " Pure 3D Animated Studio Deployment SUCCESSFUL!"
echo " Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "========================================================"

