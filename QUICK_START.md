# Quick Start Guide - Quantum-X-Builder
**Launch the complete system in Docker or VS Code**  
**Date**: 2026-02-09

---

## 🚀 Fastest Start (Docker)

```bash
# 1. Launch the entire system
./launch.sh

# 2. Access services
# Frontend: http://localhost:3000
# Backend:  http://localhost:8787
# NATS:     http://localhost:8222
# Gateway:  ws://localhost:8090/ws
```

That's it! The system is running.

---

## 📋 Prerequisites

### Required
- **Docker** (>= 24.0)
- **Docker Compose** (>= 2.20)
- **Git**

### Optional
- **Node.js** (>= 20) - for local development
- **npm** - for local development
- **VS Code** - for IDE integration

---

## 🐳 Docker Launch Options

### Development Mode (Default)
```bash
./launch.sh
# or
./launch.sh dev
```

- Hot reload enabled
- Volume mounts for live code changes
- Debug logging
- Services: Backend, Frontend, NATS, Gateway

### Production Mode
```bash
./launch.sh prod
```

- Optimized builds
- Health checks enabled
- Resource limits configured
- Auto-restart policies
- Persistent volumes
- All microservices available (optional)

### With All Microservices
```bash
docker compose --profile full up -d
```

Includes: Narrator, Presence, Proposal Engine, PubSub

---

## 💻 VS Code Launch

### Method 1: Run Task
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Tasks: Run Task"
3. Select "Docker: Start All Services"

### Method 2: Debug Panel
1. Open Debug panel (`Ctrl+Shift+D`)
2. Select "Docker: Launch All Services"
3. Press `F5` or click green play button

### Method 3: Launch Configurations
Available configurations:
- **Launch Backend** - Start backend server locally
- **Launch Frontend (Dev)** - Start frontend dev server
- **Launch Gateway** - Start WebSocket gateway
- **Docker: Launch All Services** - Start all services in Docker
- **Docker: Launch Production** - Start production mode
- **Full Stack (Local)** - Start backend + frontend + gateway locally

---

## 🔧 Manual Setup (Local Development)

### 1. Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install

# Services
cd services/qxb-chat-gateway && npm install
```

### 2. Configure Environment
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cat > frontend/.env << EOF
VITE_API_URL=http://localhost:8787
VITE_AGENT_URL=http://localhost:8787
VITE_WS_URL=ws://localhost:8090
EOF
```

### 3. Start NATS
```bash
docker run -d \
  --name nats \
  -p 4222:4222 \
  -p 8222:8222 \
  nats:2.10-alpine \
  -js -m 8222
```

### 4. Start Services
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Gateway
cd services/qxb-chat-gateway && node src/index.js
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  Users/Clients                   │
└────────────────┬────────────────────────────────┘
                 │
       ┌─────────┴────────┐
       │                  │
   ┌───▼───┐         ┌───▼───┐
   │Frontend│         │Gateway│
   │  :3000 │         │ :8090 │
   └───┬───┘         └───┬───┘
       │                 │
       │    ┌────────────┘
       │    │
   ┌───▼────▼───┐    ┌─────┐
   │  Backend   │◄───│NATS │
   │   :8787    │    │:4222│
   └────────────┘    └──┬──┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    ┌───▼───┐      ┌───▼───┐      ┌───▼───┐
    │Narrator│      │Presence│      │Proposal│
    │  :3001 │      │ :3002  │      │ :3003  │
    └────────┘      └────────┘      └────────┘
```

---

## 🧪 Testing the System

### Quick Health Check
```bash
# Check all services
./preflight-check.sh

# Check specific services
curl http://localhost:8787/health    # Backend
curl http://localhost:8090/health    # Gateway
curl http://localhost:8222/varz      # NATS
curl http://localhost:3000           # Frontend
```

### API Testing
```bash
# Get AI services status
curl http://localhost:8787/api/ai/services/status

# Test backend health
curl http://localhost:8787/health
```

### WebSocket Testing
```bash
# Install wscat if needed
npm install -g wscat

# Connect to gateway
wscat -c ws://localhost:8090/ws
```

---

## 📊 Monitoring & Logs

### View All Logs
```bash
docker compose logs -f
```

### View Specific Service Logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nats
docker compose logs -f gateway
```

### Check Service Status
```bash
docker compose ps
```

### View Resource Usage
```bash
docker stats
```

---

## 🛠️ Common Commands

### Stop All Services
```bash
docker compose down
```

### Restart Services
```bash
docker compose restart
```

### Rebuild Services
```bash
docker compose up --build -d
```

### Clean Everything
```bash
docker compose down -v  # Removes volumes too
```

### View Networks
```bash
docker network ls
docker network inspect quantum-x-builder_qxb-network
```

---

## 🔍 Troubleshooting

### Services Won't Start

1. Check Docker is running:
   ```bash
   docker info
   ```

2. Check port conflicts:
   ```bash
   lsof -i :3000  # Frontend
   lsof -i :8787  # Backend
   lsof -i :8090  # Gateway
   lsof -i :4222  # NATS
   ```

3. View service logs:
   ```bash
   docker compose logs service-name
   ```

### Frontend Can't Connect to Backend

1. Check backend is running:
   ```bash
   curl http://localhost:8787/health
   ```

2. Check CORS configuration in backend

3. Verify frontend environment:
   ```bash
   cat frontend/.env
   ```

### NATS Connection Issues

1. Check NATS is running:
   ```bash
   curl http://localhost:8222/varz
   ```

2. Check NATS logs:
   ```bash
   docker compose logs nats
   ```

### Performance Issues

1. Check resource usage:
   ```bash
   docker stats
   ```

2. Increase Docker resources (Docker Desktop settings)

3. Disable unnecessary services:
   ```bash
   # Start only core services
   docker compose up -d backend frontend nats gateway
   ```

---

## 🎯 Next Steps

### Development Workflow

1. **Make Changes**: Edit code in your editor
2. **Test Locally**: Services auto-reload in dev mode
3. **Run Pre-Flight**: `./preflight-check.sh`
4. **Commit Changes**: Standard git workflow
5. **Test in Docker**: `./launch.sh prod`

### Production Deployment

1. Review production configuration:
   ```bash
   cat docker-compose.prod.yml
   ```

2. Configure environment variables:
   ```bash
   vi backend/.env
   ```

3. Launch in production mode:
   ```bash
   ./launch.sh prod
   ```

4. Monitor services:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   docker compose -f docker-compose.prod.yml logs -f
   ```

---

## 📚 Additional Resources

### Documentation
- **Forensic Analysis**: `PHASE6_FORENSIC_ANALYSIS.md`
- **Pre-Flight Checklist**: `PHASE6_PREFLIGHT_CHECKLIST.md`
- **Docker Guide**: `DOCKER_DEPLOYMENT_GUIDE.md`
- **API Reference**: `REST_API_REFERENCE.md`
- **Readiness Report**: `PHASE6_READINESS_REPORT.md`

### Tools
- **Pre-Flight Validation**: `./preflight-check.sh`
- **Launch Script**: `./launch.sh`

### Endpoints
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8787
- **Backend Health**: http://localhost:8787/health
- **NATS Monitoring**: http://localhost:8222
- **Gateway WebSocket**: ws://localhost:8090/ws
- **Gateway Health**: http://localhost:8090/health

---

## ⚡ Pro Tips

1. **Use VS Code Tasks**: Quick access to common operations
2. **Enable Watch Mode**: Auto-reload on code changes
3. **Use Docker Profiles**: `--profile full` for all services
4. **Monitor Logs**: Keep a terminal with `logs -f` open
5. **Pre-Flight Often**: Run before commits and deployments
6. **Use Health Checks**: Verify services before testing

---

## 🆘 Getting Help

### Common Issues
1. Port already in use → Stop conflicting services
2. Permission denied → Check Docker permissions
3. Out of memory → Increase Docker memory limit
4. Service crash loop → Check logs for errors

### Support
- **GitHub Issues**: https://github.com/InfinityXOneSystems/quantum-x-builder/issues
- **Documentation**: `/docs` directory
- **Pre-Flight Tool**: `./preflight-check.sh --verbose`

---

**Last Updated**: 2026-02-09  
**Version**: 1.0  
**Status**: PRODUCTION READY 🚀
