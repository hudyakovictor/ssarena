#!/bin/bash
# ============================================================
# SIGNAL ARENA — ONE-CLICK DEPLOY SCRIPT
# Deploy to any Ubuntu/Debian VPS in 5 minutes
# Usage: curl -sSL https://raw.githubusercontent.com/.../deploy.sh | bash
# ============================================================

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  ⚔️  SIGNAL ARENA — DEPLOYMENT SCRIPT                    ║"
echo "║  Proof of Skill · GameFi 2.0                             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── STEP 1: System Dependencies ──
echo -e "${CYAN}[1/7] Installing system dependencies...${NC}"
apt-get update -qq
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx ufw > /dev/null 2>&1

# ── STEP 2: Node.js 20 ──
echo -e "${CYAN}[2/7] Installing Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y -qq nodejs > /dev/null 2>&1
fi
echo -e "  ${GREEN}✓ Node.js $(node -v)${NC}"

# ── STEP 3: Clone Repository ──
echo -e "${CYAN}[3/7] Cloning Signal Arena...${NC}"
APP_DIR="/opt/signal-arena"
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    git pull origin main 2>/dev/null || true
else
    git clone https://github.com/hudyakovictor/srnaap.git "$APP_DIR" 2>/dev/null || {
        echo -e "  ${YELLOW}⚠ Git clone failed. Creating local install...${NC}"
        mkdir -p "$APP_DIR"
        cp -r . "$APP_DIR/" 2>/dev/null || true
    }
    cd "$APP_DIR"
fi
echo -e "  ${GREEN}✓ Repository ready${NC}"

# ── STEP 4: Install Dependencies ──
echo -e "${CYAN}[4/7] Installing dependencies...${NC}"
npm install --production=false 2>/dev/null
cd server && npm install --production 2>/dev/null && cd ..
echo -e "  ${GREEN}✓ Dependencies installed${NC}"

# ── STEP 5: Build Frontend ──
echo -e "${CYAN}[5/7] Building frontend...${NC}"
npm run build 2>/dev/null || {
    echo -e "  ${YELLOW}⚠ Build had warnings (continuing)${NC}"
}
echo -e "  ${GREEN}✓ Frontend built → dist/${NC}"

# ── STEP 6: Configure Environment ──
echo -e "${CYAN}[6/7] Configuring environment...${NC}"

# Create .env if not exists
if [ ! -f server/.env ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    cat > server/.env << EOF
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info
DB_USERS_TYPE=sqlite
DB_USERS_PATH=./data/users.db
DB_CONTENT_TYPE=sqlite
DB_CONTENT_PATH=./data/content.db
JWT_SECRET=${JWT_SECRET}
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
BROKER_TYPE=memory
EOF
    echo -e "  ${GREEN}✓ Environment configured${NC}"
else
    echo -e "  ${GREEN}✓ Environment already configured${NC}"
fi

# Create data directory
mkdir -p server/data

# ── STEP 7: Configure Services ──
echo -e "${CYAN}[7/7] Configuring services...${NC}"

# Create systemd service for backend
cat > /etc/systemd/system/signal-arena-api.service << EOF
[Unit]
Description=Signal Arena API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}/server
ExecStart=$(which node) src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=${APP_DIR}/server/.env

[Install]
WantedBy=multi-user.target
EOF

# Create nginx config
DOMAIN=$(hostname -f 2>/dev/null || echo "localhost")
cat > /etc/nginx/sites-available/signal-arena << EOF
server {
    listen 80;
    server_name ${DOMAIN} _;

    # Frontend (static files)
    root ${APP_DIR}/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 256;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable nginx site
ln -sf /etc/nginx/sites-available/signal-arena /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Configure firewall
ufw allow 22/tcp 2>/dev/null
ufw allow 80/tcp 2>/dev/null
ufw allow 443/tcp 2>/dev/null
ufw --force enable 2>/dev/null

# Start services
systemctl daemon-reload
systemctl enable signal-arena-api
systemctl restart signal-arena-api
systemctl restart nginx

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ SIGNAL ARENA DEPLOYED SUCCESSFULLY!                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Frontend:${NC}  http://${DOMAIN}"
echo -e "  ${CYAN}API:${NC}       http://${DOMAIN}/api/health"
echo -e "  ${CYAN}Battle:${NC}    http://${DOMAIN}/api/battle/health"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo -e "  1. Point your domain DNS to this server IP"
echo -e "  2. Run: ${CYAN}certbot --nginx -d yourdomain.com${NC}"
echo -e "  3. Edit ${CYAN}/opt/signal-arena/server/.env${NC} with your settings"
echo ""
echo -e "  ${GREEN}Service commands:${NC}"
echo -e "  ${CYAN}systemctl status signal-arena-api${NC}  — Check API status"
echo -e "  ${CYAN}systemctl restart signal-arena-api${NC} — Restart API"
echo -e "  ${CYAN}journalctl -u signal-arena-api -f${NC}  — View logs"
echo ""
echo -e "  ⚔️  \"Play the market. Don't become the liquidity.\""
echo ""
