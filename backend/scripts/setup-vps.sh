#!/bin/bash
# ==============================================
# Tharwah Capital - VPS Setup Script (Ubuntu 22.04/24.04)
# Backend + PostgreSQL on private VPS
# ==============================================
set -euo pipefail

echo "=============================================="
echo "Tharwah Capital - Production VPS Setup"
echo "=============================================="

API_DOMAIN="${API_DOMAIN:-api.yourdomain.com}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@yourdomain.com}"
DB_USER="${DB_USER:-tharwah_user}"
DB_NAME="${DB_NAME:-tharwah}"

# 1. Update system
echo "[1/12] Updating system..."
apt update && apt upgrade -y

# 2. Install dependencies
echo "[2/12] Installing dependencies..."
apt install -y curl wget git build-essential libssl-dev libffi-dev python3 python3-pip nginx certbot python3-certbot-nginx ufw

# 3. Install Node.js 20 LTS
echo "[3/12] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version
npm --version

# 4. Install PM2
echo "[4/12] Installing PM2 globally..."
npm install -g pm2

# 5. Install PostgreSQL 16
echo "[5/12] Installing PostgreSQL 16..."
apt install -y postgresql postgresql-contrib libpq-dev
systemctl start postgresql
systemctl enable postgresql

# 6. Setup database
echo "[6/12] Configuring PostgreSQL database..."
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 32)}"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Allow local connections with password
sudo sed -i "s/^#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/16/main/postgresql.conf
sudo sed -i 's/^local\s\+all\s\+all\s\+peer/local   all             all                                     scram-sha-256/' /etc/postgresql/16/main/pg_hba.conf
systemctl restart postgresql

echo ""
echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo ""

# 7. Configure Nginx
echo "[7/12] Configuring Nginx..."
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

# Add rate limit zone
grep -q "limit_req_zone" /etc/nginx/nginx.conf || \
  sed -i '/http {/a \    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;' /etc/nginx/nginx.conf

cp backend/nginx/tharwah.conf /etc/nginx/sites-available/tharwah-api
sed -i "s/api.yourdomain.com/$API_DOMAIN/g" /etc/nginx/sites-available/tharwah-api
ln -sf /etc/nginx/sites-available/tharwah-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

# 8. SSL via Let's Encrypt
echo "[8/12] Setting up SSL (Let's Encrypt)..."
certbot --nginx -d "$API_DOMAIN" --non-interactive --agree-tos --email "$ADMIN_EMAIL" --redirect || true

# 9. Firewall
echo "[9/12] Configuring Firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 10. Setup directories
echo "[10/12] Setting up directories..."
mkdir -p /var/log/tharwah-api
mkdir -p /var/www/tharwah-api

# 11. Build instructions
echo "[11/12] Ready for deployment."
echo "Next steps:"
echo "  1. Copy backend/ contents to /var/www/tharwah-api/"
echo "  2. Create /var/www/tharwah-api/.env with DATABASE_URL and JWT secrets"
echo "  3. cd /var/www/tharwah-api && npm install"
echo "  4. npm run prisma:generate && npm run prisma:migrate"
echo "  5. npm run prisma:seed (creates super admin + demo client)"
echo "  6. npm run build"
echo "  7. pm2 start pm2/ecosystem.config.js"
echo "  8. pm2 save && pm2 startup systemd"
echo ""
echo "=============================================="
echo "Setup Complete!"
echo "API Domain: https://$API_DOMAIN"
echo "Database: postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo "=============================================="
