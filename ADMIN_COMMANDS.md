# ADMIN COMMAND REFERENCE
## Quick Operations Guide for Quantum-X-Builder

---

## 🚀 QUICK START

```powershell
# One-command full deployment
./ADMIN_STARTUP.ps1 -Mode full

# Or step by step:
./ADMIN_STARTUP.ps1 -Mode build      # Build images only
./ADMIN_STARTUP.ps1 -Mode launch     # Launch pre-built images
./ADMIN_STARTUP.ps1 -Mode check      # Verify everything
```

---

## 📊 SYSTEM STATUS

```powershell
# View all containers
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nats
```

---

## 🔧 MANAGEMENT OPERATIONS

### Build Operations
```powershell
# Build all services
docker-compose build --no-cache

# Build specific service
docker-compose build backend --no-cache
docker-compose build frontend --no-cache

# Build with custom tag
docker build -t myregistry/backend:v1.0 ./backend
```

### Launch Operations
```powershell
# Start system
docker-compose up -d

# Start with logs
docker-compose up

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stop Operations
```powershell
# Stop services (keep data)
docker-compose stop

# Stop specific service
docker-compose stop backend

# Stop and remove (keep volumes)
docker-compose down

# Stop and remove everything (fresh slate)
docker-compose down -v
```

---

## 🛠️ SHELL ACCESS

### Interactive Shells
```powershell
# Backend shell
docker exec -it vizualx-backend /bin/bash

# Frontend shell
docker exec -it vizualx-frontend /bin/bash

# NATS shell
docker exec -it qxb-nats /bin/sh
```

### Execute Commands
```powershell
# Backend: run npm command
docker exec vizualx-backend npm run build

# Backend: check installed packages
docker exec vizualx-backend npm list

# Frontend: build frontend
docker exec vizualx-frontend npm run build

# Backend: check Node version
docker exec vizualx-backend node --version
```

---

## 🔍 HEALTH CHECKS

```powershell
# Backend health
curl http://localhost:8787/health

# Frontend status
curl http://localhost:3000

# NATS cluster info
docker exec qxb-nats nats account info

# View all NATS streams
docker exec qxb-nats nats stream ls
```

### PowerShell Health Check
```powershell
# Check all endpoints
$endpoints = @(
    "http://localhost:8787/health",
    "http://localhost:3000",
    "http://localhost:8222"
)

foreach ($ep in $endpoints) {
    try {
        $r = Invoke-WebRequest $ep -TimeoutSec 2
        Write-Host "✓ $ep - OK"
    } catch {
        Write-Host "✗ $ep - FAIL"
    }
}
```

---

## 💾 DATA MANAGEMENT

### Backups
```powershell
# Backup all volumes
docker run --rm `
  -v vizualx_data:/data `
  -v c:\backup:/backup `
  alpine tar czf /backup/vizualx-backup.tar.gz -C /data .

# Backup database
docker exec qxb-nats nats stream export --system-account

# Backup config
Copy-Item -Path "./backend/.env" -Destination "./backup/.env.backup"
Copy-Item -Path "./frontend/.env" -Destination "./backup/.env.backup"
```

### Reset Data
```powershell
# Remove all volumes (destructive)
docker volume prune -a

# Full system reset
docker-compose down -v
docker system prune -a --volumes
docker-compose up -d --build

# Clear specific service data
docker volume rm $(docker volume ls -q | Select-String vizualx)
```

---

## 🌐 NETWORKING

### View Network
```powershell
# List networks
docker network ls

# Inspect vizualx network
docker network inspect vizualx

# Container connectivity
docker exec vizualx-backend ping nats
docker exec vizualx-frontend ping backend
```

### Port Mapping
```powershell
# View port mappings
docker-compose ps

# Check port usage
netstat -ano | findstr :3000
netstat -ano | findstr :8787
netstat -ano | findstr :4222
```

---

## 📝 ENVIRONMENT VARIABLES

### View Environment
```powershell
# All environment variables
docker exec vizualx-backend env

# Specific variable
docker exec vizualx-backend printenv NODE_ENV
```

### Modify Environment
```powershell
# Edit backend .env
code ./backend/.env

# Rebuild with new env
docker-compose build backend --no-cache
docker-compose restart backend
```

---

## 🚨 TROUBLESHOOTING

### Restart Troublesome Service
```powershell
# Hard restart
docker-compose stop backend
docker-compose rm backend
docker-compose up -d backend

# Full system restart
docker-compose restart
```

### View Detailed Logs
```powershell
# Backend with timestamps
docker-compose logs -f --timestamps backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Since specific time
docker-compose logs --since 5m backend
```

### Port Conflicts
```powershell
# Kill process using port 3000
$pid = (Get-NetTCPConnection -LocalPort 3000).OwningProcess
Stop-Process -Id $pid -Force

# Or use alternate ports in docker-compose.override.yml
```

### Resource Issues
```powershell
# Check Docker resource usage
docker stats --no-stream

# Prune unused resources
docker system prune -a

# Remove specific image
docker rmi <image-id>
```

---

## 👤 ADMIN ACCESS

### Credentials
```powershell
# View admin credentials
Get-Content .\_OPS\ADMIN\ADMIN_CREDENTIALS.json | ConvertFrom-Json | Format-Table

# View vault
Get-Content c:\AI\vault-data\secrets.json | ConvertFrom-Json | Format-Table

# List permissions
docker exec vizualx-backend echo $ADMIN_PERMISSIONS
```

---

## 📦 DEPLOYMENT

### Deploy Changes
```powershell
# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d

# Deploy with rollback capability
docker-compose up -d --build
docker-compose ps
```

### Push to Registry (if needed)
```powershell
# Tag image
docker tag vizualx-backend myregistry/vizualx-backend:latest

# Push
docker push myregistry/vizualx-backend:latest
```

---

## ⚙️ ADVANCED

### Compose Overrides
```powershell
# Create override for local development
@'
version: '3.8'
services:
  backend:
    ports:
      - "8787:8787"
      - "9229:9229"  # Debug port
  frontend:
    environment:
      - DEBUG=true
'@ | Set-Content docker-compose.override.yml

# Compose automatically applies overrides
docker-compose config
```

### Scale Services
```powershell
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Scale frontend
docker-compose up -d --scale frontend=2
```

### Monitoring
```powershell
# Watch resource usage
docker stats

# Follow all logs with color
docker-compose logs -f --timestamps

# Save logs to file
docker-compose logs > system-logs.txt
```

---

## 🎯 TYPICAL WORKFLOWS

### Fresh Deployment
```powershell
docker-compose down -v
docker system prune -a --volumes
./ADMIN_STARTUP.ps1 -Mode full
```

### Code Update
```powershell
# Pull latest code (from git)
git pull origin main

# Rebuild affected services
docker-compose build --no-cache backend frontend

# Restart
docker-compose restart backend frontend

# Verify
docker-compose ps
```

### Emergency Stop
```powershell
docker-compose down
docker volume prune -a
```

### Full System Restore
```powershell
# Stop everything
docker-compose down -v

# Clean system
docker system prune -a --volumes

# Fresh launch
./ADMIN_STARTUP.ps1 -Mode full
```

---

## 📞 SUPPORT

**For issues:**
1. Check logs: `docker-compose logs -f`
2. Verify services: `docker-compose ps`
3. Check health: `curl http://localhost:8787/health`
4. Review this guide

**Admin contact:** You (ROOT access)

---

*All commands require Docker and Docker Compose to be installed and running.*
