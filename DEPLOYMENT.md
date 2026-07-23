# دليل النشر الإنتاجي — ثروة كابيتال
## الهيكلية: Frontend على Vercel + Backend + DB على VPS خاص

---

## 1. نظرة عامة على البنية

```
┌─────────────────────────┐         ┌─────────────────────────────────────┐
│   www.yourdomain.com    │         │         api.yourdomain.com          │
│   (Vercel - Frontend)   │◄───────►│  (VPS - Backend + PostgreSQL)       │
│   React + Vite          │  HTTPS  │  Node.js + Express + Socket.io      │
└─────────────────────────┘         └─────────────────────────────────────┘
             ▲                                       ▲
             │                                       │
             └────────── WebSocket ──────────────────┘
                        (Realtime updates)
```

**لا يوجد Supabase نهائياً.** كل شيء يعمل على خادمك الخاص.

---

## 2. المتطلبات

- حساب Vercel
- VPS بمواصفات: Ubuntu 22.04/24.04، 2GB+ RAM، 20GB+ SSD
- دومينين: `www.yourdomain.com` و `api.yourdomain.com`
- صلاحيات SSH على VPS

---

## 3. إعداد الخادم الخلفي (Backend VPS)

### 3.1 نسخ الملفات

انسخ مجلد `backend/` إلى VPS:

```bash
scp -r backend/ root@api.yourdomain.com:/var/www/tharwah-api
```

### 3.2 تشغيل سكربت الإعداد

```bash
ssh root@api.yourdomain.com
cd /var/www/tharwah-api
chmod +x scripts/setup-vps.sh
API_DOMAIN=api.yourdomain.com ADMIN_EMAIL=admin@yourdomain.com ./scripts/setup-vps.sh
```

سيقوم السكربت بتثبيت:
- Node.js 20
- PostgreSQL 16
- Nginx
- PM2
- SSL عبر Let's Encrypt

### 3.3 إعداد متغيرات البيئة

```bash
cd /var/www/tharwah-api
cp .env.example .env
nano .env
```

المتغيرات المطلوبة:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://tharwah_user:YOUR_DB_PASSWORD@localhost:5432/tharwah
JWT_SECRET=your-64-char-random-secret
JWT_REFRESH_SECRET=another-64-char-random-secret
ALLOWED_ORIGINS=https://www.yourdomain.com,https://tharwah.vercel.app
APP_URL=https://www.yourdomain.com
API_URL=https://api.yourdomain.com
SOCKET_URL=https://api.yourdomain.com
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD_HASH=YOUR_BCRYPT_HASH
```

### 3.4 توليد كلمة مرور Super Admin

```bash
cd /var/www/tharwah-api
npm install
npm run hash-password -- "YourStrongPassword123!"
```

انسخ القيمة `Hash` إلى `SUPER_ADMIN_PASSWORD_HASH` في ملف `.env`.

### 3.5 تثبيت القاعدة وتشغيل الخادم

```bash
cd /var/www/tharwah-api
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run build
pm2 start pm2/ecosystem.config.js
pm2 save
pm2 startup systemd
```

### 3.6 التحقق

```bash
curl https://api.yourdomain.com/health
```

يجب أن ترجع:

```json
{ "status": "ok", "message": "Tharwah Capital API is running" }
```

---

## 4. نشر الواجهة الأمامية (Frontend Vercel)

### 4.1 رفع المشروع

ادفع الكود إلى GitHub، ثم اربط المستودع بـ Vercel.

### 4.2 إعداد متغيرات البيئة في Vercel

في إعدادات المشروع على Vercel، أضف:

```env
VITE_APP_URL=https://www.yourdomain.com
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://api.yourdomain.com
VITE_SESSION_SECRET=your-64-char-random-secret
```

**مهم:** `VITE_SESSION_SECRET` يجب أن تكون 64 حرفاً عشوائياً. لا تستخدم نفس `JWT_SECRET`.

### 4.3 إعداد الدومين المخصص

في Vercel:
- أضف دومين `www.yourdomain.com`
- اجعله الدومين الأساسي (Primary)

### 4.4 إعادة البناء

```bash
vercel --prod
```

---

## 5. التحديث اللحظي (Real-time)

يتم التحديث اللحظي عبر WebSocket:

- العميل يفتح اتصال Socket.io مع `VITE_SOCKET_URL`
- الأدمن يسجل الدخول وينضم لغرفة `admin_updates`
- العملاء ينضمون لغرف `user:{clientId}`
- أي تعديل في الباك إند يبث تحديثاً فورياً
- الواجهة الأمامية تستمع للأحداث وتعيد تحميل البيانات عبر TanStack Query

الأحداث المدعومة:
- `admin_update` — تغييرات في العملاء/المحافظ/المعاملات/الرسائل
- `client_update` — تحديثات خاصة بالعميل
- `content_updated` — تغييرات CMS تظهر في الموقع العام فوراً
- `settings_updated` — تغييرات الإعدادات العامة

---

## 6. الخدمات الغير مفعلة (Mock فقط)

حسب طلبك، هذه الخدمات لا تزال وهمية وتحتاج مزود خارجي لاحقاً:

| الخدمة | الحالة |
|---|---|
| بيانات الأسواق المالية | Mock data — يمكن ربط Alpha Vantage / CoinGecko |
| الإشعارات (Email/SMS/Push) | Mock — يمكن ربط Resend / Twilio |
| التحويلات والمدفوعات | Mock — يمكن ربط HyperPay / Stripe |
| خدمة البريد الإلكتروني | Mock — يمكن ربط SendGrid / Resend |

---

## 7. الأمان

- جميع كلمات المرور مشفرة بـ bcrypt
- JWT للمصادقة
- CORS محدود بالدومينات المسموحة
- Rate limiting على API
- Helmet headers
- SSL/TLS عبر Let's Encrypt
- جلسات client-side موقعة بتوقيع HMAC

---

## 8. الصيانة

### تحديث الباك إند

```bash
cd /var/www/tharwah-api
git pull origin main
npm install
npm run prisma:migrate
npm run build
pm2 reload tharwah-api
```

### مراقبة السجلات

```bash
pm2 logs tharwah-api
journalctl -u nginx -f
```

### نسخ احتياطي للقاعدة

```bash
pg_dump -U tharwah_user -h localhost tharwah > tharwah-backup-$(date +%F).sql
```

---

## 9. قائمة التحقق قبل الإطلاق

- [ ] الخادم الخلفي يعمل على `https://api.yourdomain.com`
- [ ] PostgreSQL تعمل والجداول مهاجرة
- [ ] Super Admin تم إنشاؤه وكلمة المرور قوية
- [ ] Vercel ينشر على `https://www.yourdomain.com`
- [ ] متغيرات البيئة مضبوطة في Vercel
- [ ] CORS في الباك إند يسمح لدومين Vercel
- [ ] WebSocket يعمل (تجربة تعديل محتوى من الأدمن)
- [ ] تسجيل دخول العميل يعمل
- [ ] تسجيل دخول الأدمن يعمل
- [ ] تحديث CMS يظهر فوراً في الموقع العام
- [ ] Rate limiting لا يمنع المستخدمين الشرعيين

---

**تاريخ التحديث:** 2026-07-23
**الإصدار:** 2.0.0 Backend-First Production
