# ADMIN SETUP GUIDE - QUANTUM-X-BUILDER
## Full Admin Access & Docker Deployment

**Status:** Ready for Admin Takeover  
**Generated:** February 8, 2026  
**Authority:** System Root

---

## PART 1: ADMIN CREDENTIALS & ACCESS

### 1.1 Admin Root Access

Your admin credentials are stored in vault:
```
Vault Location: c:\AI\vault-data\secrets.json
Admin Level: ROOT
Access: Full system read/write
```

**Your Admin Privileges:**
- ✅ Full Docker system control
- ✅ All environment variables and secrets
- ✅ Backend API administrative access (port 8787)
- ✅ Frontend deployment control (port 3000)
- ✅ NATS cluster management (port 4222)
- ✅ Policy and governance override (when needed)
- ✅ Autonomy system control (enable/disable/configure)
- ✅ GitHub App management

### 1.2 System Access Commands

```powershell
# View all admin credentials
Get-Content c:\AI\vault-data\secrets.json | ConvertFrom-Json | Format-Table -AutoSize

# Verify admin access
./admin-check.ps1

# Initialize admin shell
./admin-shell.ps1
```

---

## PART 2: DOCKER DEPLOYMENT SETUP

### 2.1 Prerequisites Check

```powershell
# Check Docker installation
docker --version
docker-compose --version

# Verify workspace
Get-ChildItem c:\AI\quantum-x-builder -Include Dockerfile -Recurse | Format-Table FullName

# Check all .env files
Get-ChildItem c:\AI\quantum-x-builder -Filter ".env*" -Recurse | Format-Table FullName
```

### 2.2 Environment Configuration

**Backend Configuration** (`backend/.env`):
```
PORT=8787
NODE_ENV=production
WORKSPACE_ROOT=/workspace
NATS_URL=nats://nats:4222
LOG_LEVEL=debug
ADMIN_MODE=enabled
```

**Frontend Configuration** (`frontend/.env`):
```
VITE_API_URL=http://backend:8787
VITE_AGENT_URL=http://backend:8787
VITE_ENV=production
```

---

## PART 3: BUILD & DEPLOYMENT COMMANDS

### 3.1 Full Docker Build

```powershell
# Build all services
docker-compose build --no-cache

# Or individual services:
docker-compose build backend
docker-compose build frontend
```

### 3.2 Start System

```powershell
# Launch entire stack
docker-compose up -d

# Launch with logs
docker-compose up

# Verify services are running
docker-compose ps
```

### 3.3 Service Verification

```powershell
# Check backend health
Invoke-WebRequest http://localhost:8787/health

# Check frontend accessibility
Invoke-WebRequest http://localhost:3000

# Check NATS cluster
docker exec qxb-nats nats-top -s localhost:8222
```

---

## PART 4: QUICK START WORKFLOW

### Step 1: Verify Prerequisites
```powershell
cd c:\AI\quantum-x-builder
docker --version
docker-compose --version
```

### Step 2: Build Docker Images
```powershell
docker-compose build --no-cache
```

### Step 3: Launch Services
```powershell
docker-compose up -d
```

### Step 4: Verify All Running
```powershell
docker-compose ps
# Should show:
# - vizualx-backend (running)
# - vizualx-frontend (running)
# - qxb-nats (running)
```

### Step 5: Access System

| Component | URL | Purpose |
|-----------|-----|---------|
| Backend API | http://localhost:8787 | Server API |
| Frontend | http://localhost:3000 | Web UI |
| NATS Admin | http://localhost:8222 | Message broker UI |

---

## PART 5: ADMIN OPERATIONS

### 5.1 View Logs

```powershell
# All services
docker-compose logs -f

# Single service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nats
```

### 5.2 Execute Commands

```powershell
# Backend shell
docker exec -it vizualx-backend /bin/bash

# Frontend build/dev
docker exec -it vizualx-frontend npm run build

# NATS management
docker exec -it qxb-nats nats-top
```

### 5.3 Manage Data & State

```powershell
# Backup volumes
docker run --rm -v vizualx_data:/data -v c:\backup:/backup alpine tar czf /backup/vizualx-backup.tar.gz -C /data .

# Clean slate
docker-compose down -v
docker-compose up -d
```

---

## PART 6: SYSTEM ARCHITECTURE

### Container Network
```
┌─────────────────────────────────────────────┐
│          Docker Network: vizualx             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────┐                      │
│  │ vizualx-frontend │                      │
│  │  (React/Vite)    │                      │
│  │  Port: 3000      │                      │
│  └────────┬─────────┘                      │
│           │                                │
│           ├─────────────────────┐          │
│           ▼                     ▼          │
│  ┌──────────────────┐  ┌──────────────┐   │
│  │ vizualx-backend  │  │   qxb-nats   │   │
│  │  (Express.js)    │  │  (JetStream) │   │
│  │  Port: 8787      │  │  Port: 4222  │   │
│  │  Volume: /work   │  │   Admin: 8222│   │
│  └──────────────────┘  └──────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### Port Mapping
- **Frontend**: 3000 → React application
- **Backend**: 8787 → Express API server
- **NATS**: 4222 → Message broker (internal)
- **NATS Admin**: 8222 → Web management console

---

## PART 7: TROUBLESHOOTING

### Issue: Ports Already in Use

```powershell
# Find process using port
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Or use alternate ports in docker-compose.override.yml
```

### Issue: Build Failures

```powershell
# Clear cache and rebuild
docker-compose down
docker system prune -a
docker-compose build --no-cache
```

### Issue: Container Won't Start

```powershell
# Check logs
docker-compose logs -f [service_name]

# Verify environment variables
docker exec [container_name] env

# Test connectivity
docker exec [container_name] curl http://localhost:8787/health
```

---

## PART 8: NEXT STEPS

Once Docker is running:

1. **Access Frontend**: http://localhost:3000
2. **Test Backend**: http://localhost:8787/health
3. **Review Architecture**: See `docs/SYSTEM_INTEGRATION_ARCHITECTURE.md`
4. **Check Operations**: Review `_OPS/` for governance and policy
5. **Deploy Changes**: Use Git + GitHub Actions for CI/CD

---

## PART 9: FULL ADMIN CONTROLS

### Emergency Stop
```powershell
docker-compose down
```

### Full System Reset
```powershell
docker-compose down -v
docker system prune -a --volumes
docker-compose up -d --build
```

### Scaling (if needed)
```powershell
docker-compose up -d --scale backend=3
```

---

## ADMIN CONTACT & SUPPORT

- **System**: Quantum-X-Builder
- **Root**: Admin (YOU)
- **Status**: Ready to operate
- **Authority**: Full

**You now have complete control. Build with full system autonomy.**

---

*Generated for ADMIN takeover. All systems ready.*
