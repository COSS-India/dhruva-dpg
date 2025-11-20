#!/bin/bash

echo "=========================================="
echo "Backend Connection Diagnostics"
echo "=========================================="
echo ""

echo "1. Checking if database containers are running..."
echo "----------------------------------------"
sudo docker ps | grep -E "dhruva-platform-log-db-pg|dhruva-platform-app-db-pg|dhruva-platform-server" || echo "Some containers not found"
echo ""

echo "2. Checking if containers are on the same network..."
echo "----------------------------------------"
echo "Server network:"
sudo docker inspect dhruva-platform-server --format='{{range $net, $conf := .NetworkSettings.Networks}}{{$net}} {{end}}' 2>/dev/null || echo "Server container not found"
echo ""
echo "Log DB network:"
sudo docker inspect dhruva-platform-log-db-pg --format='{{range $net, $conf := .NetworkSettings.Networks}}{{$net}} {{end}}' 2>/dev/null || echo "Log DB container not found"
echo ""

echo "3. Checking DNS resolution from server container..."
echo "----------------------------------------"
sudo docker exec dhruva-platform-server nslookup dhruva-platform-log-db-pg 2>/dev/null || echo "nslookup failed or container not running"
echo ""

echo "4. Checking connection strings in server environment..."
echo "----------------------------------------"
echo "LOG_DB_CONNECTION_STRING:"
sudo docker exec dhruva-platform-server env | grep LOG_DB_CONNECTION_STRING || echo "Not set"
echo ""
echo "APP_DB_CONNECTION_STRING:"
sudo docker exec dhruva-platform-server env | grep APP_DB_CONNECTION_STRING || echo "Not set"
echo ""

echo "5. Testing network connectivity from server to log DB..."
echo "----------------------------------------"
sudo docker exec dhruva-platform-server ping -c 2 dhruva-platform-log-db-pg 2>/dev/null || echo "Ping failed"
echo ""

echo "6. Checking if log DB is listening on port 5432..."
echo "----------------------------------------"
sudo docker exec dhruva-platform-log-db-pg pg_isready -U dhruvalogadmin -d dhruva_log 2>/dev/null || echo "Database not ready"
echo ""

echo "7. Checking server logs for connection errors..."
echo "----------------------------------------"
sudo docker logs dhruva-platform-server --tail 20 | grep -i "error\|connection\|failed" || echo "No recent errors in logs"
echo ""

echo "=========================================="
echo "Diagnostics Complete"
echo "=========================================="

