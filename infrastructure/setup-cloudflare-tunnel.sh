#!/bin/bash

# Cloudflare Tunnel Setup Script
# Sets up secure tunnels for VS Code, Docker, and Ollama

set -e

echo "🌐 Cloudflare Tunnel Setup for Quantum X Builder"
echo "================================================"

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared not found. Installing..."
    
    # Install cloudflared based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared-linux-amd64.deb
        rm cloudflared-linux-amd64.deb
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install cloudflared
    else
        echo "❌ Unsupported OS. Please install cloudflared manually."
        exit 1
    fi
fi

echo "✅ cloudflared installed"

# Authenticate with Cloudflare (only needed once)
if [ ! -f "$HOME/.cloudflared/cert.pem" ]; then
    echo "🔐 Authenticating with Cloudflare..."
    cloudflared tunnel login
fi

# Check if tunnel exists
TUNNEL_NAME="quantum-x-builder-tunnel"
TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}' || echo "")

if [ -z "$TUNNEL_ID" ]; then
    echo "📡 Creating new tunnel: $TUNNEL_NAME"
    cloudflared tunnel create "$TUNNEL_NAME"
    TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
else
    echo "✅ Tunnel already exists: $TUNNEL_NAME ($TUNNEL_ID)"
fi

# Copy config file
CONFIG_DIR="$HOME/.cloudflared"
mkdir -p "$CONFIG_DIR"
cp infrastructure/cloudflare-tunnel-config.yml "$CONFIG_DIR/config.yml"

# Update tunnel ID in config
sed -i "s/tunnel:.*/tunnel: $TUNNEL_ID/" "$CONFIG_DIR/config.yml"

# Configure DNS records
echo "🌐 Configuring DNS records..."
cloudflared tunnel route dns "$TUNNEL_NAME" command.quantum-x-builder.dev
cloudflared tunnel route dns "$TUNNEL_NAME" api.quantum-x-builder.dev
cloudflared tunnel route dns "$TUNNEL_NAME" vscode.quantum-x-builder.dev
cloudflared tunnel route dns "$TUNNEL_NAME" docker.quantum-x-builder.dev
cloudflared tunnel route dns "$TUNNEL_NAME" ollama.quantum-x-builder.dev
cloudflared tunnel route dns "$TUNNEL_NAME" ws.quantum-x-builder.dev

echo ""
echo "✅ Cloudflare Tunnel Setup Complete!"
echo ""
echo "🔗 Your services will be available at:"
echo "   - Command Center: https://command.quantum-x-builder.dev"
echo "   - API Backend:    https://api.quantum-x-builder.dev"
echo "   - VS Code:        https://vscode.quantum-x-builder.dev"
echo "   - Docker:         https://docker.quantum-x-builder.dev"
echo "   - Ollama:         https://ollama.quantum-x-builder.dev"
echo "   - WebSocket:      wss://ws.quantum-x-builder.dev"
echo ""
echo "🚀 To start the tunnel, run:"
echo "   cloudflared tunnel run $TUNNEL_NAME"
echo ""
echo "💡 Or run as a service:"
echo "   cloudflared service install"
echo "   sudo systemctl start cloudflared"
echo ""
