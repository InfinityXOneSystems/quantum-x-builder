# Docker Deployment Guide
**Quantum-X-Builder Multi-Service Docker Deployment**  
**Version**: 1.0  
**Date**: 2026-02-09

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Service Architecture](#service-architecture)
5. [Environment Configuration](#environment-configuration)
6. [Development Deployment](#development-deployment)
7. [Production Deployment](#production-deployment)
8. [Service Details](#service-details)
9. [Networking](#networking)
10. [Volumes & Persistence](#volumes--persistence)
11. [Health Checks](#health-checks)
12. [Troubleshooting](#troubleshooting)
13. [Maintenance](#maintenance)

---

## Overview

Quantum-X-Builder uses Docker Compose to orchestrate multiple services:

- **Backend**: Node.js REST API (Port 8787)
- **Frontend**: React/Vite UI (Port 3000)
- **NATS**: Message broker (Ports 4222, 8222)
- **QXB Chat Gateway**: WebSocket/REST gateway (Port 8090)
- **Additional Microservices**: Narrator, Presence, Proposal Engine, PubSub

---

## Prerequisites

### System Requirements
```bash
# Docker
Docker Engine >= 24.0
Docker Compose >= 2.20

# System Resources (Minimum)
CPU: 4 cores
RAM: 8 GB
Disk: 20 GB free

# System Resources (Recommended)
CPU: 8 cores
RAM: 16 GB
Disk: 50 GB SSD
```

### Software Requirements
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose (if not included)
sudo apt-get install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

---

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/InfinityXOneSystems/quantum-x-builder.git
cd quantum-x-builder
```

### 2. Configure Environment
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit configuration (see Environment Configuration section)
nano backend/.env
```

### 3. Start Services
```bash
# Development mode
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps
```

### 4. Access Services
```
Frontend:  http://localhost:3000
Backend:   http://localhost:8787
NATS:      nats://localhost:4222
NATS Mon:  http://localhost:8222
Gateway:   ws://localhost:8090/ws
```

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet / Users                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │ Gateway │  (Future)
                    │   :80   │
                    └────┬────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
    │Frontend │    │ Backend │    │ Gateway │
    │  :3000  │    │  :8787  │    │  :8090  │
    └─────────┘    └────┬────┘    └────┬────┘
                        │              │
                        └──────┬───────┘
                               │
                          ┌────┴────┐
                          │  NATS   │
                          │  :4222  │
                          └────┬────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    ┌────┴────┐         ┌─────┴─────┐        ┌─────┴─────┐
    │Narrator │         │ Presence  │        │ Proposal  │
    │  :3001  │         │   :3002   │        │   :3003   │
    └─────────┘         └───────────┘        └───────────┘
```

---

## Environment Configuration

### Backend Configuration (`backend/.env`)

#### Required Variables
```bash
# Server
PORT=8787
WORKSPACE_ROOT=/workspace

# AI Providers (at least one required)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash-exp

VERTEX_ACCESS_TOKEN=your_vertex_token
VERTEX_PROJECT_ID=your_gcp_project
VERTEX_LOCATION=us-central1
VERTEX_MODEL=gemini-1.5-pro-002

# Provider Priority
PROVIDER_ORDER=ollama,groq,gemini,vertex

# Messaging
NATS_URL=nats://nats:4222
NATS_VARZ_URL=http://nats:8222/varz
```

#### Optional Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Telephony
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# RAG/Memory
VERTEX_SEARCH_PROJECT_ID=
VERTEX_SEARCH_DATASTORE=
BIGQUERY_PROJECT_ID=
GCS_BUCKET=

# Authentication
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Feature Flags
providers.ollama.enabled=false
providers.twilio.enabled=false
auth.github.enabled=false
```

### Frontend Configuration (`frontend/.env`)
```bash
VITE_API_URL=http://localhost:8787
VITE_AGENT_URL=http://localhost:8787
VITE_WS_URL=ws://localhost:8090
```

---

## Development Deployment

### Using docker-compose.yml

```bash
# Start all services
docker compose up -d

# Start specific services
docker compose up -d backend frontend nats

# View logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nats

# Stop services
docker compose stop

# Remove containers
docker compose down

# Remove containers and volumes
docker compose down -v
```

### Hot Reload (Development)

```bash
# Backend with volume mount for hot reload
docker compose up -d backend

# Frontend with volume mount for hot reload
docker compose up -d frontend

# Changes to source files will trigger automatic reload
```

### Running Individual Services

```bash
# Backend only
docker run -d \
  --name backend \
  --env-file backend/.env \
  -p 8787:8787 \
  -v $(pwd)/backend:/app \
  backend:latest

# Frontend only
docker run -d \
  --name frontend \
  -p 3000:3000 \
  -e VITE_API_URL=http://localhost:8787 \
  frontend:latest

# NATS only
docker run -d \
  --name nats \
  -p 4222:4222 \
  -p 8222:8222 \
  nats:2.10-alpine \
  -js -m 8222
```

---

## Production Deployment

### Production Docker Compose (`docker-compose.prod.yml`)

**⚠️ TO BE CREATED** - See PHASE6_PREFLIGHT_CHECKLIST.md

Planned features:
- Health checks for all services
- Resource limits (CPU, memory)
- Restart policies
- Logging configuration
- Secret management
- Volume backups
- SSL/TLS termination

### Building for Production

```bash
# Build all images
docker compose -f docker-compose.prod.yml build

# Build specific service
docker compose -f docker-compose.prod.yml build backend

# Tag images
docker tag backend:latest registry.example.com/backend:v1.0.0
docker tag frontend:latest registry.example.com/frontend:v1.0.0

# Push to registry
docker push registry.example.com/backend:v1.0.0
docker push registry.example.com/frontend:v1.0.0
```

### Production Startup

```bash
# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Start services
docker compose -f docker-compose.prod.yml up -d

# Verify health
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## Service Details

### Backend Service

**Image**: `node:20-alpine`  
**Port**: 8787  
**Healthcheck**: `/health`  

```bash
# Build backend
cd backend
docker build -t backend:latest .

# Run standalone
docker run -d \
  --name backend \
  --env-file .env \
  -p 8787:8787 \
  backend:latest

# Exec into container
docker exec -it backend sh

# View logs
docker logs -f backend
```

### Frontend Service

**Image**: `node:20-alpine`  
**Port**: 3000  
**Build**: Vite production build  

```bash
# Build frontend
cd frontend
docker build -t frontend:latest .

# Run standalone
docker run -d \
  --name frontend \
  -p 3000:3000 \
  -e VITE_API_URL=http://backend:8787 \
  frontend:latest

# View build
docker exec frontend ls -la /app/dist
```

### NATS Service

**Image**: `nats:2.10-alpine`  
**Ports**: 4222 (client), 8222 (monitoring)  
**Features**: JetStream enabled  

```bash
# Run NATS
docker run -d \
  --name nats \
  -p 4222:4222 \
  -p 8222:8222 \
  nats:2.10-alpine \
  -js -m 8222

# Monitor NATS
curl http://localhost:8222/varz

# Test connection
docker exec nats nats-server -v
```

### QXB Chat Gateway

**Port**: 8090  
**Protocols**: WebSocket, REST  
**Features**: CloudEvents, Distributed Tracing  

```bash
# Build (from template - TO BE CREATED)
cd services/qxb-chat-gateway
docker build -t qxb-chat-gateway:latest .

# Run
docker run -d \
  --name gateway \
  -p 8090:8090 \
  -e NATS_URL=nats://nats:4222 \
  qxb-chat-gateway:latest

# Test WebSocket
wscat -c ws://localhost:8090/ws

# Test REST
curl -X POST http://localhost:8090/chat/send \
  -H "Content-Type: application/json" \
  -d '{"target": "test", "message": "hello"}'
```

---

## Networking

### Default Network (`vizualx`)

```bash
# Inspect network
docker network inspect quantum-x-builder_vizualx

# List services on network
docker network inspect quantum-x-builder_vizualx | jq '.[].Containers'

# Connect service to network
docker network connect quantum-x-builder_vizualx my-service
```

### Service Discovery

Services can reach each other by name:
```bash
# Backend can reach NATS at:
nats://nats:4222

# Frontend can reach Backend at:
http://backend:8787

# All services can reach each other by container name
```

### Port Mapping

| Service | Internal Port | External Port | Protocol |
|---------|--------------|---------------|----------|
| Backend | 8787 | 8787 | HTTP |
| Frontend | 3000 | 3000 | HTTP |
| NATS | 4222 | 4222 | TCP |
| NATS Monitor | 8222 | 8222 | HTTP |
| Gateway | 8090 | 8090 | HTTP/WS |

---

## Volumes & Persistence

### Current Configuration
```yaml
volumes:
  - ./:/workspace  # Workspace volume (backend)
```

### Recommended Production Volumes

**⚠️ TO BE CONFIGURED** - See docker-compose.prod.yml

```yaml
volumes:
  # Database persistence
  postgres_data:

  # NATS JetStream data
  nats_data:

  # Application logs
  app_logs:

  # Configuration backups
  config_backups:
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect quantum-x-builder_postgres_data

# Backup volume
docker run --rm \
  -v quantum-x-builder_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore volume
docker run --rm \
  -v quantum-x-builder_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

---

## Health Checks

### Backend Health Check

```bash
# HTTP health endpoint
curl http://localhost:8787/health

# Expected response
{
  "status": "ok",
  "timestamp": "2026-02-09T12:00:00Z"
}

# Docker health check (TO BE ADDED)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8787/health || exit 1
```

### Frontend Health Check

```bash
# Check if frontend is serving
curl -I http://localhost:3000

# Expected response
HTTP/1.1 200 OK

# Docker health check (TO BE ADDED)
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000 || exit 1
```

### NATS Health Check

```bash
# Check NATS monitoring
curl http://localhost:8222/varz

# Check JetStream
curl http://localhost:8222/jsz

# Docker health check (TO BE ADDED)
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:8222/varz || exit 1
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose logs service_name

# Check if port is in use
netstat -tuln | grep PORT_NUMBER

# Check if service crashed
docker compose ps

# Restart specific service
docker compose restart service_name
```

### Network Issues

```bash
# Ping another service
docker exec backend ping nats

# Check DNS resolution
docker exec backend nslookup nats

# Test port connectivity
docker exec backend telnet nats 4222

# Check network connectivity
docker network inspect quantum-x-builder_vizualx
```

### Volume Issues

```bash
# Check volume mounts
docker inspect backend | jq '.[].Mounts'

# Check volume permissions
docker exec backend ls -la /workspace

# Fix permissions
docker exec backend chown -R node:node /app
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Check specific service
docker stats backend

# View top processes
docker exec backend top

# Check memory
docker exec backend free -h
```

### Container Debugging

```bash
# Enter container
docker exec -it backend sh

# Check environment variables
docker exec backend env

# Check running processes
docker exec backend ps aux

# Check file system
docker exec backend df -h

# Check network interfaces
docker exec backend ip addr show
```

---

## Maintenance

### Updates & Upgrades

```bash
# Pull latest images
docker compose pull

# Rebuild services
docker compose build --no-cache

# Rolling update
docker compose up -d --no-deps --build backend

# Zero-downtime update (TO BE IMPLEMENTED)
# - Start new version alongside old
# - Health check new version
# - Switch traffic
# - Stop old version
```

### Cleanup

```bash
# Remove stopped containers
docker compose rm

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove all unused objects
docker system prune -a --volumes

# Clean build cache
docker builder prune
```

### Backup Procedures

```bash
# Backup script (TO BE CREATED)
./scripts/backup-docker.sh

# Manual backup
docker exec backend tar czf /tmp/backup.tar.gz /app
docker cp backend:/tmp/backup.tar.gz ./backups/

# Database backup (if PostgreSQL added)
docker exec postgres pg_dump -U user database > backup.sql
```

### Monitoring

```bash
# Real-time logs
docker compose logs -f --tail=100

# Service status
watch docker compose ps

# Resource usage
watch docker stats --no-stream

# NATS monitoring
watch curl -s http://localhost:8222/varz
```

---

## Best Practices

### Security
1. Never commit `.env` files
2. Use secrets management (Docker Swarm secrets, Kubernetes secrets)
3. Run containers as non-root user
4. Use official base images only
5. Scan images for vulnerabilities
6. Keep base images updated

### Performance
1. Use multi-stage builds to minimize image size
2. Leverage Docker layer caching
3. Use `.dockerignore` to exclude unnecessary files
4. Set resource limits in production
5. Use health checks for all services
6. Enable restart policies

### Reliability
1. Use specific image tags, not `latest`
2. Implement health checks
3. Configure restart policies
4. Set up monitoring and alerting
5. Test disaster recovery procedures
6. Document all configurations

---

## Next Steps

1. **Create Production Configuration**:
   - Create `docker-compose.prod.yml`
   - Add health checks to all Dockerfiles
   - Configure resource limits
   - Set up logging drivers

2. **Convert Service Templates**:
   - Create `services/qxb-narrator/Dockerfile`
   - Create `services/qxb-presence/Dockerfile`
   - Create `services/proposal-engine/Dockerfile`
   - Create `services/qxb-pubsub/Dockerfile`
   - Create `services/qxb-chat-gateway/Dockerfile`

3. **Implement Monitoring**:
   - Add Prometheus metrics
   - Set up Grafana dashboards
   - Configure alerting
   - Implement log aggregation

4. **Security Hardening**:
   - Implement secret management
   - Add security scanning
   - Configure network policies
   - Set up TLS/SSL

---

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [NATS Documentation](https://docs.nats.io/)

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-09  
**Status**: FOUNDATIONAL (Production config pending)  
**Next Review**: After production deployment
