#!/bin/bash

# Start every docker-compose stack in one shot so orphans don't
# clobber containers that were started earlier in the script.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

NETWORK_NAME="dhruva-network"

COMPOSE_FILES=(
  -f docker-compose-db.yml
  -f docker-compose-metering.yml
  -f docker-compose-monitoring.yml
  -f docker-compose-app.yml
  -f docker-compose-client.yml
)

if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
  echo "Creating Docker network '$NETWORK_NAME'..."
  docker network create "$NETWORK_NAME"
fi

echo "Starting Dhruva Platform containers (all compose files)..."
docker-compose "${COMPOSE_FILES[@]}" up -d --remove-orphans

echo "All services started successfully!"
echo
echo "Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

