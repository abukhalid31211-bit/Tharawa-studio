#!/bin/bash
# ==============================================
# Tharwah Capital - VPS Setup Script (Ubuntu 22.04)
# لا يحتوي أي قيمة صلبة — كل الإعدادات من متغيرات البيئة أو تُسأل أثناء التشغيل
# ==============================================
set -euo pipefail

echo "=============================================="
echo "Tharwah Capital - Production VPS Setup"
echo "=============================================="

# =================================================
# 1. تحديث النظام
# =================================================
echo "[1/12] Updating system..."
apt update && apt upgrade -y

# =================================================
# 2. تثبيت المتطلبات الأساسية
# =================================================
echo "[2/12] Installing basic dependencies..."
apt install -y curl wget git build-essential libssl-dev libffi-dev python3 python3-pip nginx certbot python3-certbot-nginx ufw

# =================================================
# 3. تثبيت Node.js 20 LTS
# =================================================
echo "[3/12] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version
npm --version

# =================================================
# 4. تثبيت PM2 عالمياً
# =================================================
echo "[4/12] Installing PM2 globally..."
npm install -g pm2

# =================================================
# 5. تثبيت PostgreSQL 16
# =================================================
echo "[5/12] Installing PostgreSQL 16..."
apt install -y postgresql postgresql-contrib libpq-dev
systemctl start postgresql
systemctl enable postgresql

# =================================================
# 6. إعداد قاعدة البيانات
# =================================================
echo "[6/12] Configuring PostgreSQL database..."
# ملاحظة: غيّر اسم المستخدم وكلمة المرور حسب متغيرات البيئة
DB_USER="${DB_USER:-tharwah_user}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 32)}"
DB_NAME="${DB_NAME:-tharwah}"

echo "Creating database user: $DB_USER"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "DB_CONFIG: DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# =================================================
# 7. إعداد Nginx
# =================================================
echo "[7/12] Configuring Nginx..."
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
cp backend/nginx/tharwah.conf /etc/nginx/sites-available/tharwah-api
# استبدال الدومين الافتراضي بأي دومين من البيئة
sed -i "s/api\.your-domain\.com/${API_DOMAIN:-api.your-domain.com}/g" /etc/nginx/sites-available/tharwah-api
ln -sf /etc/nginx/sites-available/tharwah-api /etc/nginx/sites-enabled/
# إزالة الموقع الافتراضي
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

# =================================================
# 8. إعداد SSL عبر Let's Encrypt
# =================================================
echo "[8/12] Setting up SSL (Let's Encrypt)..."
# يجب تحديد API_DOMAIN قبل تشغيل هذا القسم
if [ -n "${API_DOMAIN:-}" ]; then
  certbot --nginx -d "$API_DOMAIN" --non-interactive --agree-tos --email "${ADMIN_EMAIL:-admin@your-domain.com}" --redirect || echo "SSL setup skipped — set API_DOMAIN to enable"
fi

# =================================================
# 9. إعداد Firewall (UFW)
# =================================================
echo "[9/12] Configuring Firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Backend (مؤقتاً — يُغلق لاحقاً عند تشغيل Nginx فقط)
ufw --force enable

# =================================================
# 10. إعداد PM2
# =================================================
echo "[10/12] Configuring PM2..."
mkdir -p /var/log/tharwah-api
mkdir -p /var/www/tharwah-api

# =================================================
# 11. نشر الكود (مثال)
# =================================================
echo "[11/12] Deploying application..."
# في الإنتاج الفعلي: git clone أو rsync من المستودع
cp -r backend/* /var/www/tharwah-api/
cd /var/www/tharwah-api
npm install --production
npm run prisma:generate
npm run prisma:migrate || true

# =================================================
# 12. تشغيل الباك اند عبر PM2
# =================================================
echo "[12/12] Starting backend with PM2..."
pm run build || true
pm2 start pm2/ecosystem.config.js || pm2 start src/server.ts --name tharwah-api --interpreter="node" -- --loader ts-node/esm
pm2 save
pm2 startup systemd -u "$USER" --hp "$(pwd)"

echo "=============================================="
echo "Setup Complete!"
echo "=============================================="
echo "API Domain: $API_DOMAIN"
echo "DB URL: postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo "SSL: $(test -f /etc/letsencrypt/live/$API_DOMAIN/fullchain.pem && echo 'Configured' || echo 'Not configured')"
echo "Firewall: $(ufw status verbose | head -n 5)"
echo "=============================================="
