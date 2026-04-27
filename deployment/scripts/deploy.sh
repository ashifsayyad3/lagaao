#!/bin/bash
# ============================================================
# LAGAAO.COM — Production Deployment Script
# Run on GoDaddy VPS (Ubuntu 22.04) as: bash deploy.sh
# ============================================================

set -e
APP_DIR="/var/www/lagaao"
REPO_URL="${REPO_URL:-https://github.com/yourusername/lagaao.git}"

echo "🌱 Starting LAGAAO deployment..."

# Pull latest code
cd "$APP_DIR"
git pull origin main

# ─── Backend ────────────────────────────────────────────────
echo "📦 Building backend..."
cd "$APP_DIR/backend"
npm ci --production=false
npm run prisma:generate
npm run prisma:migrate
npm run build

echo "♻️  Restarting backend..."
pm2 reload "$APP_DIR/backend/ecosystem.config.js" --env production
pm2 save

# ─── Frontend ───────────────────────────────────────────────
echo "🖥  Building frontend..."
cd "$APP_DIR/frontend"
npm ci
npm run build

echo "♻️  Restarting frontend..."
pm2 reload "$APP_DIR/frontend/ecosystem.config.js" --env production
pm2 save

echo "✅ Deployment complete! 🌿"
pm2 status
