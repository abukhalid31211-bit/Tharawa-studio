#!/bin/bash
set -euo pipefail

API_DOMAIN="${API_DOMAIN:-api.yourdomain.com}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@yourdomain.com}"
DB_USER="${DB_USER:-tharwah_user}"
DB_NAME="${DB_NAME:-tharwah}"
APP_DIR="${APP_DIR:-/var/www/tharwah-api}"

[[ "$API_DOMAIN" =~ ^[A-Za-z0-9.-]+$ ]] || { echo "Invalid API_DOMAIN"; exit 1; }
[[ "$DB_USER" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || { echo "Invalid DB_USER"; exit 1; }
[[ "$DB_NAME" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || { echo "Invalid DB_NAME"; exit 1; }

apt update
DEBIAN_FRONTEND=noninteractive apt upgrade -y
apt install -y curl ca-certificates git build-essential nginx certbot python3-certbot-nginx ufw postgresql postgresql-contrib libpq-dev

if ! command -v node >/dev/null || [[ "$(node -p 'Number(process.versions.node.split(`.`)[0])')" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
npm install -g pm2
systemctl enable --now postgresql nginx

id -u tharwah >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin tharwah
install -d -o tharwah -g tharwah "$APP_DIR" /var/log/tharwah-api

DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 32)}"
sudo -u postgres psql -v ON_ERROR_STOP=1 --set=db_user="$DB_USER" --set=db_password="$DB_PASSWORD" --set=db_name="$DB_NAME" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'db_user', :'db_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'db_user') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'db_user')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'db_name') \gexec
SQL

# Shared zones and WebSocket connection mapping belong in nginx's http context.
if ! grep -q 'zone=api_limit' /etc/nginx/nginx.conf; then
  sed -i '/http {/a\    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;\n    limit_conn_zone $binary_remote_addr zone=addr:10m;\n    map $http_upgrade $connection_upgrade { default upgrade; "" close; }' /etc/nginx/nginx.conf
fi

# HTTP-only bootstrap must load before a Let's Encrypt certificate exists.
cat > /etc/nginx/sites-available/tharwah-api <<EOF
server {
    listen 80;
    server_name $API_DOMAIN;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
    }
}
EOF
ln -sfn /etc/nginx/sites-available/tharwah-api /etc/nginx/sites-enabled/tharwah-api
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

certbot --nginx -d "$API_DOMAIN" --non-interactive --agree-tos --email "$ADMIN_EMAIL" --redirect
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/../nginx/tharwah.conf" /etc/nginx/sites-available/tharwah-api
sed -i "s/api.yourdomain.com/$API_DOMAIN/g" /etc/nginx/sites-available/tharwah-api
nginx -t
systemctl reload nginx

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

cat <<EOF
VPS preparation completed.
Application directory: $APP_DIR
Database: $DB_NAME
Database user: $DB_USER
Store the following value in $APP_DIR/.env using restricted permissions:
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@127.0.0.1:5432/$DB_NAME
Then install, migrate, build and start pm2/ecosystem.config.cjs as the tharwah service user.
EOF
