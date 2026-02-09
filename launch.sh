#!/usr/bin/env bash
#
# Quantum-X-Builder Launch Script
# Launches the entire system with Docker Compose
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.yml"
COMPOSE_PROD_FILE="${PROJECT_ROOT}/docker-compose.prod.yml"
MODE="${1:-dev}"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Quantum-X-Builder Launch System                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print status
print_status() {
  echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
  echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
  echo -e "${BLUE}[i]${NC} $1"
}

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
  print_error "Docker is not installed. Please install Docker first."
  exit 1
fi
print_status "Docker installed"

if ! docker compose version &> /dev/null; then
  print_error "Docker Compose is not installed. Please install Docker Compose first."
  exit 1
fi
print_status "Docker Compose installed"

if ! docker info &> /dev/null; then
  print_error "Docker daemon is not running. Please start Docker."
  exit 1
fi
print_status "Docker daemon running"

# Check environment files
print_info "Checking environment files..."

if [ ! -f "${PROJECT_ROOT}/backend/.env" ]; then
  if [ -f "${PROJECT_ROOT}/backend/.env.example" ]; then
    print_warning "Backend .env not found, copying from .env.example"
    cp "${PROJECT_ROOT}/backend/.env.example" "${PROJECT_ROOT}/backend/.env"
    print_status "Backend .env created (please configure before production use)"
  else
    print_error "Backend .env.example not found"
    exit 1
  fi
else
  print_status "Backend .env exists"
fi

if [ ! -f "${PROJECT_ROOT}/frontend/.env" ]; then
  print_info "Creating frontend .env"
  cat > "${PROJECT_ROOT}/frontend/.env" << EOF
VITE_API_URL=http://localhost:8787
VITE_AGENT_URL=http://localhost:8787
VITE_WS_URL=ws://localhost:8090
EOF
  print_status "Frontend .env created"
else
  print_status "Frontend .env exists"
fi

echo ""

# Determine which compose file to use
if [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
  print_info "Launching in PRODUCTION mode"
  COMPOSE_FILE_TO_USE="$COMPOSE_PROD_FILE"
  PROFILE_FLAG=""
else
  print_info "Launching in DEVELOPMENT mode"
  COMPOSE_FILE_TO_USE="$COMPOSE_FILE"
  PROFILE_FLAG=""
fi

# Check if services are already running
if docker ps | grep -q "qxb-\|vizualx-"; then
  print_warning "Services are already running. Stopping them first..."
  if [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
    docker compose -f "$COMPOSE_FILE_TO_USE" down
  else
    docker compose -f "$COMPOSE_FILE_TO_USE" down
  fi
  print_status "Services stopped"
fi

echo ""
print_info "Building and starting services..."
echo ""

# Build and start services
if [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
  docker compose -f "$COMPOSE_FILE_TO_USE" up --build -d
else
  docker compose -f "$COMPOSE_FILE_TO_USE" up --build -d
fi

# Wait for services to be healthy
print_info "Waiting for services to be healthy..."
sleep 5

# Check service health
print_info "Checking service health..."
echo ""

check_service() {
  local service_name=$1
  local url=$2
  local max_attempts=30
  local attempt=0

  while [ $attempt -lt $max_attempts ]; do
    if curl -sf "$url" > /dev/null 2>&1; then
      print_status "$service_name is healthy"
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 2
  done

  print_error "$service_name failed to start"
  return 1
}

# Check core services
check_service "Backend" "http://localhost:8787/health" || true
check_service "Frontend" "http://localhost:3000" || true
check_service "NATS" "http://localhost:8222/varz" || true
check_service "Gateway" "http://localhost:8090/health" || true

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            System Launched Successfully!              ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
print_info "Services:"
echo -e "  ${BLUE}Frontend:${NC}  http://localhost:3000"
echo -e "  ${BLUE}Backend:${NC}   http://localhost:8787"
echo -e "  ${BLUE}NATS:${NC}      http://localhost:8222"
echo -e "  ${BLUE}Gateway:${NC}   ws://localhost:8090/ws"
echo ""
print_info "Commands:"
echo -e "  ${YELLOW}View logs:${NC}     docker compose logs -f"
echo -e "  ${YELLOW}Stop system:${NC}   docker compose down"
echo -e "  ${YELLOW}Restart:${NC}       ./launch.sh"
echo ""
print_info "Status:"
echo -e "  ${YELLOW}Check status:${NC}  docker compose ps"
echo -e "  ${YELLOW}Pre-flight:${NC}    ./preflight-check.sh"
echo ""
