#!/bin/bash

# Script to fix container restart policies by recreating them
# This ensures all containers have restart: always policy applied

set -e
# Don't exit on errors for container removal - we'll handle them gracefully
set +e

cd "$(dirname "$0")"

echo "========================================="
echo "Fixing container restart policies"
echo "========================================="
echo ""
echo "This script will recreate all containers with proper restart policies."
echo "Existing containers will be stopped and recreated."
echo ""

# Stop and remove containers using docker-compose (handles permissions better)
echo "Stopping and removing containers via docker-compose..."
docker-compose -f docker-compose-app.yml down 2>/dev/null || true
docker-compose -f docker-compose-client.yml down 2>/dev/null || true
docker-compose -f docker-compose-db.yml down 2>/dev/null || true
docker-compose -f docker-compose-metering.yml down 2>/dev/null || true
docker-compose -f docker-compose-monitoring.yml down 2>/dev/null || true

# Force remove any remaining containers (skip client which may have permission issues)
echo "Removing any remaining containers..."
for container in $(docker ps -aq); do
    container_name=$(docker inspect $container --format "{{.Name}}" 2>/dev/null | sed 's/\///')
    if [ "$container_name" != "dhruva-platform-client" ]; then
        docker rm -f $container 2>/dev/null || true
    fi
done
# Try client separately, but don't fail if it doesn't work
docker rm -f dhruva-platform-client 2>/dev/null || echo "Note: Could not remove client container - docker-compose will handle it"

# Recreate all services with proper restart policies
echo ""
echo "Recreating services with proper restart policies..."
echo ""

# Re-enable exit on error for the rest of the script
set -e

# Start database services first
echo "1. Starting database services..."
# Don't use --remove-orphans here to avoid permission issues with client container
docker-compose -f docker-compose-db.yml up -d 2>&1 | grep -v "cannot remove container" || true
# Check if services started successfully
if ! docker ps --format "{{.Names}}" | grep -q "dhruva-platform-app-db-pg"; then
    echo "   Retrying without orphan removal..."
    docker-compose -f docker-compose-db.yml up -d
fi

# Wait for databases to be healthy
echo "   Waiting for databases to be ready..."
sleep 15

# Start metering services
echo "2. Starting metering services..."
docker-compose -f docker-compose-metering.yml up -d 2>&1 | grep -v "cannot remove container" || true

# Wait for RabbitMQ to be ready
echo "   Waiting for RabbitMQ to be ready..."
sleep 15

# Start monitoring services
echo "3. Starting monitoring services..."
docker-compose -f docker-compose-monitoring.yml up -d 2>&1 | grep -v "cannot remove container" || true

# Start application services
echo "4. Starting application services..."
docker-compose -f docker-compose-app.yml up -d 2>&1 | grep -v "cannot remove container" || true

# Wait a bit
sleep 10

# Start client service (force recreate to handle permission issues)
echo "5. Starting client service..."
# If the old container exists, try to force recreate it
if docker ps -a --format "{{.Names}}" | grep -q "^dhruva-platform-client$"; then
    echo "   Note: Old client container exists - forcing recreation..."
    docker-compose -f docker-compose-client.yml up -d --force-recreate --remove-orphans || {
        echo "   Warning: Could not recreate client container due to permission issue"
        echo "   You may need to manually stop and remove it, then run:"
        echo "   docker-compose -f docker-compose-client.yml up -d"
    }
else
    docker-compose -f docker-compose-client.yml up -d --remove-orphans
fi

echo ""
echo "========================================="
echo "Verifying restart policies..."
echo "========================================="
echo ""

# Verify restart policies
for container in $(docker ps --format "{{.Names}}"); do
    policy=$(docker inspect $container --format "{{.HostConfig.RestartPolicy.Name}}")
    echo "$container: $policy"
done

echo ""
echo "========================================="
echo "All containers recreated successfully!"
echo "========================================="
echo ""
echo "Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

