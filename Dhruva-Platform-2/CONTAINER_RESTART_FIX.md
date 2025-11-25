# Container Restart Policy Fix - Permanent Solution

## Problem Identified

The containers were not restarting after machine reboot because:
1. **Containers had `RestartPolicy: no`** - Even though docker-compose files specified `restart: always`, the containers were created without this policy
2. **No automatic startup mechanism** - There was no systemd service to start docker-compose services on boot
3. **Containers were started manually** - Some containers were likely started with `docker run` instead of `docker-compose up`, bypassing the restart policy

## Root Cause

When containers are created manually or before restart policies are properly configured, Docker doesn't apply the `restart: always` policy from docker-compose files. The containers need to be recreated using docker-compose to apply the restart policies.

## Permanent Solution Implemented

### 1. Systemd Service for Auto-Start on Boot
Created `/etc/systemd/system/dhruva-platform.service` that:
- Automatically starts all docker-compose services on system boot
- Ensures Docker service is running before starting containers
- Handles proper startup order (databases → metering → monitoring → app → client)
- Is enabled to start on boot

**Status:** ✅ Enabled and ready

### 2. Startup Script
Created `start-all-services.sh` that:
- Starts all services in the correct dependency order
- Includes proper wait times for services to become healthy
- Uses `--remove-orphans` to clean up old containers
- Verifies container status after startup

### 3. Container Recreation Script
Created `fix-container-restart-policies.sh` that:
- Recreates all containers with proper restart policies
- Ensures `restart: always` is applied to all containers
- Can be run manually to fix existing containers

### 4. Updated restart-services.sh
Updated the existing restart script to:
- Include client service
- Maintain proper startup order

## How to Apply the Fix

### Option 1: Fix Existing Containers (Recommended)
Run the fix script to recreate all containers with proper restart policies:

```bash
cd /home/ubuntu/dhruva-dpg/Dhruva-Platform-2
./fix-container-restart-policies.sh
```

### Option 2: Manual Recreation
Use the restart script:

```bash
cd /home/ubuntu/dhruva-dpg/Dhruva-Platform-2
./restart-services.sh
```

## Verification

### Check Systemd Service Status
```bash
sudo systemctl status dhruva-platform.service
```

### Check if Service is Enabled
```bash
sudo systemctl is-enabled dhruva-platform.service
# Should output: enabled
```

### Verify Container Restart Policies
```bash
for container in $(docker ps --format "{{.Names}}"); do
    echo "$container: $(docker inspect $container --format '{{.HostConfig.RestartPolicy.Name}}')"
done
```

All containers should show `always` as the restart policy.

### Test Auto-Start (Optional)
To test if containers will restart on boot:
```bash
# Reboot the system
sudo reboot

# After reboot, check if containers are running
docker ps
```

## Files Created/Modified

1. **`/etc/systemd/system/dhruva-platform.service`** - Systemd service for auto-start
2. **`start-all-services.sh`** - Startup script with proper ordering
3. **`fix-container-restart-policies.sh`** - Script to fix existing containers
4. **`restart-services.sh`** - Updated to include client service

## How It Works

1. **On Boot:**
   - Systemd starts Docker service
   - Systemd starts `dhruva-platform.service`
   - Service executes `start-all-services.sh`
   - Script starts all docker-compose services in order
   - All containers are created with `restart: always` policy

2. **If Container Crashes:**
   - Docker automatically restarts containers with `restart: always` policy
   - No manual intervention needed

3. **If Machine Reboots:**
   - Systemd automatically starts the service
   - All containers are started in the correct order
   - All containers have proper restart policies

## Maintenance

### Start Services Manually
```bash
sudo systemctl start dhruva-platform.service
```

### Stop Services
```bash
sudo systemctl stop dhruva-platform.service
```

### Restart Services
```bash
sudo systemctl restart dhruva-platform.service
```

### View Service Logs
```bash
sudo journalctl -u dhruva-platform.service -f
```

## Important Notes

- The systemd service is already **enabled** and will start on boot
- All containers should be managed via docker-compose, not `docker run`
- If you need to add new services, ensure they have `restart: always` in their docker-compose file
- The fix script will stop and remove all existing containers - ensure you have backups if needed

## Troubleshooting

If containers still don't restart:
1. Verify Docker service is enabled: `sudo systemctl is-enabled docker`
2. Check systemd service status: `sudo systemctl status dhruva-platform.service`
3. Verify restart policies: Use the verification command above
4. Check service logs: `sudo journalctl -u dhruva-platform.service`





