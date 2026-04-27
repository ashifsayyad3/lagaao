#!/bin/bash
# ============================================================
# LAGAAO.COM — GoDaddy VPS Initial Setup Script
# Ubuntu 22.04 LTS — Run as root or with sudo
# ============================================================

set -e

echo "🔧 Starting LAGAAO VPS Setup..."

# ─── System update ──────────────────────────────────────────
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git unzip build-essential ufw fail2ban

# ─── Node.js LTS ────────────────────────────────────────────
echo "📦 Installing Node.js LTS..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs
npm install -g pm2
pm2 startup systemd -u root --hp /root
echo "Node: $(node -v), npm: $(npm -v), pm2: $(pm2 -v)"

# ─── MySQL 8 ────────────────────────────────────────────────
echo "🗄  Installing MySQL 8..."
apt-get install -y mysql-server mysql-client
systemctl start mysql
systemctl enable mysql
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD:-SecureRootPass@123}';"
mysql -e "CREATE DATABASE IF NOT EXISTS lagaao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'lagaao_user'@'localhost' IDENTIFIED BY '${MYSQL_APP_PASSWORD:-SecureAppPass@123}';"
mysql -e "GRANT ALL PRIVILEGES ON lagaao.* TO 'lagaao_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
echo "✅ MySQL configured"

# ─── Nginx ──────────────────────────────────────────────────
echo "🌐 Installing Nginx..."
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx

# ─── PHP (for phpMyAdmin) ───────────────────────────────────
echo "🐘 Installing PHP..."
add-apt-repository ppa:ondrej/php -y
apt-get update
apt-get install -y php8.1 php8.1-fpm php8.1-mysql php8.1-mbstring php8.1-zip php8.1-gd php8.1-json php8.1-curl

# ─── phpMyAdmin ─────────────────────────────────────────────
echo "💾 Installing phpMyAdmin..."
apt-get install -y phpmyadmin
ln -sf /usr/share/phpmyadmin /var/www/html/phpmyadmin

# ─── Certbot (SSL) ──────────────────────────────────────────
echo "🔒 Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx
# Run after DNS propagation:
# certbot --nginx -d lagaao.com -d www.lagaao.com --email admin@lagaao.com --agree-tos --non-interactive

# ─── Firewall ───────────────────────────────────────────────
echo "🔥 Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 3306/tcp  # MySQL (restrict to internal only in production)
ufw --force enable
ufw status

# ─── Fail2Ban ───────────────────────────────────────────────
systemctl start fail2ban
systemctl enable fail2ban

# ─── PM2 log directory ──────────────────────────────────────
mkdir -p /var/log/pm2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7

# ─── App directory ──────────────────────────────────────────
mkdir -p /var/www/lagaao
chown -R $SUDO_USER:$SUDO_USER /var/www/lagaao 2>/dev/null || chown -R www-data:www-data /var/www/lagaao

# ─── Nginx config ───────────────────────────────────────────
cp /var/www/lagaao/deployment/nginx/lagaao.conf /etc/nginx/sites-available/lagaao.conf
ln -sf /etc/nginx/sites-available/lagaao.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ─── Backup cron ────────────────────────────────────────────
echo "⏰ Setting up daily database backup..."
cat > /etc/cron.d/lagaao-backup << 'EOF'
0 2 * * * root /var/www/lagaao/deployment/scripts/backup.sh >> /var/log/lagaao-backup.log 2>&1
EOF

echo ""
echo "✅ VPS Setup Complete!"
echo ""
echo "Next steps:"
echo "  1. Clone repo: git clone <REPO_URL> /var/www/lagaao"
echo "  2. Copy .env files to backend/ and frontend/"
echo "  3. Run: cd /var/www/lagaao && bash deployment/scripts/deploy.sh"
echo "  4. Setup SSL: certbot --nginx -d lagaao.com -d www.lagaao.com"
echo "  5. Seed DB: cd backend && npm run prisma:seed"
