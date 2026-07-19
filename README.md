# ثروة كابيتال - Tharwah Capital Platform v2.0

> منصة استثمارية سعودية متكاملة متوافقة مع الشريعة | Sharia-Compliant Investment Platform

[![CI](https://github.com/abukhalid31211-bit/Tharawa-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/abukhalid31211-bit/Tharawa-studio/actions)
[![Security: v2.0 Secure](https://img.shields.io/badge/Security-v2.0%20Secure-green)](./SECURITY.md)
[![License: UNLICENSED](https://img.shields.io/badge/License-UNLICENSED-red)]()

## 🌟 نظرة عامة

ثروة كابيتال منصة استثمارية تجمع بين:
- **إدارة محافظ احترافية** متوافقة مع الشريعة
- **وصول للأسواق العالمية** (40+ سوق)
- **مستشار مالي شخصي** معتمد
- **تحليلات ذكية** مدعومة بالذكاء الاصطناعي

**الأرقام:**
- +2.1B ريال أصول مدارة
- +5,240 عميل نشط
- 98% رضا العملاء
- +18% متوسط عائد سنوي

## 🏗️ المكدس التقني

- **Frontend:** React 19, Vite 8, TanStack Router, TanStack Query, Tailwind v4
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **API:** Vercel Serverless Functions (Node.js)
- **Security:** PBKDF2 hashing, RLS, JWT, CSP headers
- **Language:** TypeScript strict, Arabic RTL + English LTR

## 🚀 البدء السريع

### المتطلبات
- Node.js >= 18
- npm >= 9

### التثبيت

```bash
# 1. Clone
git clone https://github.com/abukhalid31211-bit/Tharawa-studio.git
cd Tharawa-studio

# 2. Install
npm install

# 3. Environment - انسخ المثال
cp .env.example .env.local
# ثم املأ القيم في .env.local

# 4. Generate super admin hash (مهم!)
node scripts/hash-password.js "YourSecurePassword123!"
# انسخ الناتج إلى .env.local

# 5. Run dev server
npm run dev
# -> http://localhost:3000

# 6. Open admin panel
# http://localhost:3000/Akadmin
# Demo: admin@tharwah.com / admin123 (DEV only)
```

### ENV المطلوبة للإنتاج

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VITE_SUPER_ADMIN_EMAIL=your-admin@company.com
VITE_SUPER_ADMIN_PASSWORD_HASH=...
VITE_SUPER_ADMIN_SALT=...
VITE_SESSION_SECRET=random-64-chars
```

## 📁 هيكل المشروع

```
src/
├── components/
│   ├── admin/          # لوحة الأدمن (22 صفحة)
│   │   ├── AdminLogin  # SECURE v2 - لا هاردكود
│   │   ├── AdminLayout # Sidebar + Topbar + Guards
│   │   └── pages/      # Overview, Clients, Portfolios, ...
│   ├── common/         # ErrorBoundary, etc.
│   ├── dashboard/      # لوحة العميل (8 tabs)
│   ├── home/           # أقسام الصفحة الرئيسية (10)
│   ├── site/           # Header, Footer, Ticker
│   └── ui/             # Design System
├── contexts/           # Language, SiteSettings
├── lib/
│   ├── supabase.ts     # Client + Mock fallback
│   ├── env.ts          # Validation
│   ├── crypto.ts       # PBKDF2 hashing
│   ├── security.ts     # Sanitization, rate limit
│   ├── validations.ts  # Zod schemas
│   ├── auth.ts         # Secure sessions
│   ├── store.ts        # Encrypted storage
│   ├── adminData.ts    # Data layer v2 - hashed passwords
│   └── logger.ts       # Structured logging
├── routes/             # TanStack Router file-based
├── styles/             # Tailwind globals
└── types/              # Supabase types

supabase/
├── schema.sql          # Production schema + RLS + Indexes
└── migrations/

api/v1/
└── index.ts            # Secure API with rate limiting
```

## 🔒 الأمان v2.0

**تم إصلاح كل الثغرات الحرجة من v1:**

| الثغرة السابقة | الإصلاح في v2 |
|---|---|
| Hardcoded `haidaralkarar20@gmail.com / 0545` | ENV only, لا fallback في prod |
| Plaintext `admin123` | PBKDF2 + salt + hash |
| localStorage plain JSON | Obfuscated + signed + expiry |
| No RLS | RLS policies على كل الجداول |
| API يكسر rewrites | vercel.json يفصل /api/* |

راجع [SECURITY.md](./SECURITY.md) للتفاصيل الكاملة.

## 📊 لوحة الأدمن

**المسار:** `/Akadmin`

**الصفحات:**
- **الرئيسية:** Overview (KPI, Charts, Heatmap, Alerts)
- **العملاء:** Clients, Portfolios, Transactions, Messages
- **المنصة:** Content Hub, Reports, Team
- **الموقع:** Hero, Services, Markets, FAQ, Testimonials, About, Site Design, Privacy
- **النظام:** Notifications, Settings, Security
- **أدوات:** Calendar, Tasks, Global Search
- **الصلاحيات:** Sub-Admins

**Demo Accounts (DEV only):**
- Super: `admin@tharwah.com / admin123`
- Sub: `ahmed.sub@tharwah.com / admin123`

## 🧪 الاختبار

```bash
npm run typecheck   # TypeScript
npm run build       # Production build
npm run test        # Vitest (to be added)
```

## 🚢 النشر

### Vercel (موصى به)

```bash
# متغيرات البيئة في Vercel Dashboard:
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPER_ADMIN_EMAIL
VITE_SUPER_ADMIN_PASSWORD_HASH
VITE_SUPER_ADMIN_SALT
VITE_SESSION_SECRET
```

الـ CI يتحقق تلقائياً من عدم وجود hardcoded secrets.

### Supabase

1. أنشئ مشروع في supabase.com
2. شغّل `supabase/schema.sql` في SQL Editor
3. انسخ URL و Anon Key إلى `.env`

## 📚 التوثيق

- [تقرير المراجعة الفنية](./TECHNICAL_AUDIT_REPORT.md)
- [السياسة الأمنية](./SECURITY.md)
- [Supabase Schema](./supabase/schema.sql)

## 🤝 المساهمة

هذا مشروع خاص غير مفتوح المصدر (UNLICENSED).

## 📞 التواصل

- الموقع: https://tharwah.com
- البريد: info@tharwah.com
- الأمان: security@tharwah.com

---

**صنع بفخر في الرياض 🇸🇦**
**Built with ❤️ in Riyadh**

Version: 2.0.0 Secure | Last Updated: 2026-07-19
