# ==============================================
# Tharwah Capital — DNS Setup Guide (Flexible for Any Provider)
# لا يحتوي أي دومين صلب — كل الإعدادات تعتمد على متغيرات البيئة
# ==============================================

## Overview

هذه الوثيقة توضح إعدادات DNS المطلوبة لأي مزود دومينات (Namecheap، GoDaddy، Cloudflare، Google Domains). كل الإعدادات تعتمد على متغيرات البيئة ولا تحتوي أي قيمة صلبة.

## Required Environment Variables

```env
APP_DOMAIN=www.your-domain.com       # الدومين الرئيسي
API_DOMAIN=api.your-domain.com        # الباك اند
VITE_APP_URL=https://www.your-domain.com
VITE_API_URL=https://api.your-domain.com
VITE_SOCKET_URL=https://api.your-domain.com
```

## DNS Records (General — Any Provider)

| Type | Name / Host | Value / Target | TTL |
|------|-------------|----------------|-----|
| CNAME | `www` | `cname.vercel-dns.com` | Auto |
| A | `api` | `[VPS_IP]` | 300 |
| A (Optional) | `@` (root) | `[VPS_IP]` | 300 |

## Provider-Specific Instructions

### Namecheap
1. تسجيل الدخول إلى Namecheap → Domain List → Manage
2. Advanced DNS → Add New Record
3. CNAME Record: `www` → `cname.vercel-dns.com`
4. A Record: `api` → `YOUR_VPS_IP`

### GoDaddy
1. تسجيل الدخول → My Products → Domains → Manage DNS
2. Add Record → CNAME: Host=`www`, Points to=`cname.vercel-dns.com`
3. A Record: Host=`api`, Points to=`YOUR_VPS_IP`

### Cloudflare
1. تسجيل الدخول → Add Site → Enter domain
2. DNS → Add Record
3. CNAME: Name=`www`, Target=`cname.vercel-dns.com`
4. A: Name=`api`, IPv4=`YOUR_VPS_IP`
5. (Optional) Enable Proxy (Orange Cloud) for SSL

### Google Domains (Squarespace)
1. تسجيل الدخول → My Domains → Manage DNS
2. Custom Resource Records → Add Record
3. CNAME: `www` → `cname.vercel-dns.com`
4. A: `api` → `YOUR_VPS_IP`

## SSL (Let's Encrypt — Any Domain)

```bash
# على الـ VPS (بعد إعداد Nginx)
certbot --nginx -d api.your-domain.com --non-interactive --agree-tos --email admin@your-domain.com
```

## Verification Commands

```bash
# التحقق من إعدادات DNS
dig +short www.your-domain.com
dig +short api.your-domain.com

# التحقق من SSL
curl -I https://api.your-domain.com/health
```

## Flexible Domain Support

المشروع يعمل بأي دومين دون تعديل الكود:

- Development: `http://localhost:3000` / `http://localhost:5173`
- Staging: `https://tharwah.vercel.app`
- Production: `https://www.your-domain.com` + `https://api.your-domain.com`

كل هذه القيم تُقرأ من `.env.local` أو متغيرات البيئة في Vercel Dashboard / VPS.
