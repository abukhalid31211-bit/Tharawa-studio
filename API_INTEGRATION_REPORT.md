# تقرير المكونات التي تحتاج ربطاً بمزود خارجي API
## مشروع ثروة كابيتال (Tharwah Capital) — مراجعة فنية
**تاريخ التقرير:** 2026-07-23  
**نوع التقرير:** مراجعة مكونات External API Integration Requirements  
**الهدف:** تحديد كل نقطة في المشروع تحتاج اتصالاً بخدمة خارجية، مع درجة الأولوية والحالة الحالية

---

## ملخص تنفيذي

المشروع حالياً يعمل بـ **بيانات وهمية (Mock/Seeds)** مخزنة في `localStorage` ومصفوفات ثابتة داخل الملفات. لا يوجد اتصال حقيقي بأي مزود خارجي في بيئة الإنتاج، رغم أن البنية التحتية تستعد لذلك عبر:

- عميل Supabase موجود لكنه يعمل في Mock Mode إذا لم تُضبط المتغيرات البيئية.
- ملف `api.ts` يستعد للاتصال بـ Backend API لكنه لا يُستخدم فعلياً في أغلب الصفحات.
- `socket.ts` جاهز للاتصال بـ Socket.io server لكن لا يوجد خادم إنتاجي حقيقي.
- بيانات الأسواق والأخبار كلها هاردكود داخل المكونات.

**النتيجة:** كل المكونات الوظيفية تحتاج ربطاً بمصادر خارجية قبل أي إطلاق حقيقي.

---

## 1. Supabase (الأولوية القصوى 🔴)

### مزود الخدمة
**Supabase** (PostgreSQL + Auth + Realtime + Storage)

### المكونات المرتبطة

| الملف / المكون | الاستخدام الحالي | ما يحتاجه من Supabase |
|---|---|---|
| `src/lib/supabase.ts` | عميل Supabase مع Mock Client fallback | تفعيل `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` |
| `src/routes/login.tsx` | محاولة تسجيل دخول العميل عبر `supabase.auth.signInWithPassword` | تفعيل Supabase Auth |
| `src/lib/auth.ts` | إنشاء جلسات محلية للعميل والأدمن | استبدالها بـ Supabase Auth Sessions |
| `src/components/admin/pages/Security.tsx` | تعليقات تشير إلى `supabase.auth.updateUser` | تفعيل تحديث كلمة المرور عبر Supabase |
| `src/lib/api.ts` | قراءة token من `supabase.auth.getSession` | استخدام Supabase JWT للتوثيق |
| `supabase/schema.sql` | مخطط قاعدة البيانات جاهز | نشره في مشروع Supabase حقيقي |
| `supabase/seed.sql` | بيانات تجريبية | حذفها أو تحديثها قبل الإنتاج |

### المتغيرات البيئية المطلوبة
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (للباك إند فقط)
```

### ملاحظة فنية
- المشروع يدخل في Mock Mode تلقائياً إذا لم تُضبط Supabase.
- `schema.sql` يحتوي على 11 جدولاً مع RLS Policies، Indexes، Triggers، لكنها غير مفعلة بعد.
- يجب تفعيل RLS على كل الجداول قبل الإنتاج.

---

## 2. Backend API Server (الأولوية القصوى 🔴)

### مزود الخدمة
خادم Node.js/Express + PostgreSQL (موجود في `backend/`) أو Vercel Serverless Functions (`api/v1/index.ts`)

### المكونات المرتبطة

| الملف / المكون | الاستخدام الحالي | ما يحتاجه من Backend API |
|---|---|---|
| `src/lib/api.ts` | تعريف `request()` و `api` object | وجود Backend API حقيقي |
| `backend/src/server.ts` | خادم Express مع Socket.IO | نشره على VPS أو Railway/Render |
| `backend/src/routes/auth.routes.ts` | تسجيل دخول JWT للعملاء والأدمن | تفعيل Prisma + PostgreSQL |
| `backend/src/routes/clients.routes.ts` | CRUD للعملاء | ربط بقاعدة البيانات |
| `backend/src/routes/content.routes.ts` | إدارة محتوى CMS | ربط بـ `content_sections` |
| `backend/src/routes/markets.routes.ts` | بيانات الأسواق | ربط بـ Market Data Provider |
| `api/v1/index.ts` | Vercel Serverless placeholder | إما حذفه أو تطويره ليكون API كامل |
| `src/components/admin/pages/*.tsx` | معظم صفحات الأدمن تستخدم `useAdminStore` (localStorage) | استبدالها بـ TanStack Query + REST API |
| `src/routes/dashboard.tsx` | لوحة العميل تعتمد على `INITIAL_TRANSACTIONS` الثابتة | جلب البيانات من `/api/transactions` |

### نقاط النهاية (Endpoints) المطلوبة

```
POST   /api/auth/login
POST   /api/auth/admin/login
POST   /api/auth/refresh
GET    /api/auth/profile
GET    /api/clients
POST   /api/clients
GET    /api/clients/:id
PUT    /api/clients/:id
DELETE /api/clients/:id
GET    /api/portfolios
POST   /api/portfolios
GET    /api/portfolios/:id
PUT    /api/portfolios/:id
DELETE /api/portfolios/:id
GET    /api/transactions
POST   /api/transactions
PUT    /api/transactions/:id
GET    /api/messages
POST   /api/messages
GET    /api/content/:key
PUT    /api/content/:key
GET    /api/markets/ticker
GET    /api/health
```

### ملاحظة فنية
- `src/lib/adminData.ts` يعلّق أنه "في الإنتاج يتم جلب البيانات عبر TanStack Query / REST" لكن هذا غير منفذ.
- Backend الحالي يحتوي على Prisma schema لكن لا يوجد ملف `schema.prisma` في `backend/prisma/`.
- `backend/src/routes/markets.routes.ts` يرجع بيانات Mock ويعلّق بأنه يجب الربط بـ API أسواق حقيقي.

---

## 3. بيانات الأسواق المالية (Market Data API) — الأولوية القصوى 🔴

### مزودو الخدمة المحتملون
- **Alpha Vantage** (أسهم عالمية)
- **Yahoo Finance API** (أسهم، عملات رقمية، سلع)
- **CoinGecko / CoinMarketCap** (عملات رقمية)
- **Tadawul API** (السوق السعودي)
- **GoldAPI / Metals API** (ذهب وفضة)
- **Brent/WTI APIs** (طاقة)
- **Twelve Data**
- **Polygon.io**

### المكونات المرتبطة

| الملف / المكون | البيانات المعروضة | ما يحتاجه |
|---|---|---|
| `src/components/site/LiveTicker.tsx` | أسعار بيتكوين، إيثيريوم، أرامكو، سابك، الذهب... | API يزود الأسعار لحظياً |
| `src/components/home/MarketsPreview.tsx` | مؤشرات تاسي، دبي، ناسداك، الذهب، بيتكوين، برنت | API للمؤشرات والسلع |
| `src/components/markets/MarketsPage.tsx` | 22 أصلاً استثمارياً مع بيانات تفصيلية | API يوفر الأسعار والتغيرات والحجم والقيمة السوقية |
| `backend/src/routes/markets.routes.ts` | مسار `/ticker` يعيد Mock data | استبدال المصفوفة الثابتة باستدعاء API خارجي |
| `api/v1/index.ts` | مسار `/markets/ticker` يعيد Mock data | نفس الأمر |

### ملاحظة فنية
- المشروع يعلن في واجهة المستخدم أن البيانات "محدثة كل 30 ثانية من أكثر من 15 مصدر" لكنها في الواقع ثابتة.
- يجب توفير cache (مثلاً Redis أو Upstash) لتقليل استهلاك API والتكلفة.
- يجب عرض إخلاء مسؤولية (disclaimer) حقيقي عن تأخر البيانات.

---

## 4. Socket.io Realtime Server (أولوية عالية 🟠)

### مزود الخدمة
خادم Socket.io خاص (موجود في `backend/src/server.ts`) أو Supabase Realtime

### الملفات المرتبطة

| الملف | الاستخدام الحالي |
|---|---|
| `src/lib/socket.ts` | عميل Socket.io يتصل بـ `VITE_SOCKET_URL` |
| `backend/src/server.ts` | يُنشئ خادم Socket.io ويبث تحديثات `admin_update` و `client_update` |
| `backend/src/routes/clients.routes.ts` | يستدعي `broadcastAdminUpdate` عند إنشاء/تعديل/حذف عميل |

### المتغيرات البيئية المطلوبة
```
VITE_SOCKET_URL=https://api.your-domain.com
```

### ملاحظة فنية
- `socket.ts` يحتوي على fallback لـ `localhost:3000` في التطوير.
- يجب تأمين الاتصال عبر JWT token و CORS محدود.
- في حال استخدام Supabase Realtime، يمكن حذف `socket.ts` واستبداله بـ `supabase.channel()`.

---

## 5. خدمة البريد الإلكتروني والإشعارات (Email / SMS / Push) — أولوية عالية 🟠

### مزودو الخدمة المحتملون
- **Resend** أو **SendGrid** أو **Amazon SES** (Email)
- **Twilio** أو **MessageBird** (SMS)
- **Firebase Cloud Messaging** أو **OneSignal** (Push)
- **Novu** (Notification Infrastructure)

### المكونات المرتبطة

| الملف / المكون | الميزة المعروضة | ما يحتاجه |
|---|---|---|
| `src/components/site/SiteFooter.tsx` | نموذج Newsletter | API لإرسال البريد وإدارة الاشتراكات |
| `src/components/news/NewsPage.tsx` | نموذج اشتراك في النشرة الأسبوعية | خدمة بريد إلكتروني |
| `src/components/markets/MarketsPage.tsx` | تنبيهات الأسعار (Price Alerts) | خدمة إشعارات (Email/SMS/Push) |
| `src/components/dashboard/SupportTab.tsx` | تذاكر الدعم | إشعار للمستشار/الأدمن عند إنشاء تذكرة |
| `src/components/admin/pages/Notifications.tsx` | إرسال إشعارات للعملاء | خدمة إرسال جماعي |
| `backend/src/server.ts` | `broadcastAdminUpdate` | لا يرسل إشعارات فعلية للمستخدم |

### ملاحظة فنية
- كل نماذج الاشتراك حالياً تقوم فقط بتغيير state محلي أو `setTimeout`.
- يجب توفير خدمة إرسال إشعارات مع queue (مثل BullMQ + Redis) للتعامل مع الأحجام الكبيرة.

---

## 6. خدمة المدفوعات والتحويلات البنكية (Payment Gateway) — أولوية قصوى 🔴

### مزودو الخدمة المحتملون
- **HyperPay** (السعودية)
- **PayFort / Amazon Payment Services**
- **Stripe** (عالمي)
- **Tamara / Tabby** (تقسيط)
- **SARIE / RTGS** (تحويلات بنكية سعودية)

### المكونات المرتبطة

| الملف / المكون | الميزة المعروضة | ما يحتاجه |
|---|---|---|
| `src/routes/dashboard.tsx` | طلب إيداع / سحب | ربط بـ Payment Gateway أو نظام تحويلات بنكية |
| `src/components/dashboard/BankingTab.tsx` | تحديث البيانات البنكية | API للتحقق من الحسابات البنكية |
| `src/components/admin/pages/Transactions.tsx` | اعتماد الإيداعات والسحوبات | Webhook من بوابة الدفع |
| `src/lib/adminData.ts` | `TRANSACTIONS_SEED` | استبدالها ببيانات حقيقية من البنك/البوابة |

### ملاحظة فنية
- المعاملات حالياً تُسجل كـ `completed` فوراً دون أي تحقق.
- يجب تنفيذ Webhook لاستلام إشعارات نجاح/فشل الدفع.
- يجب تسجيل كل محاولة دفع في `audit_logs`.

---

## 7. التحقق من الهوية (KYC / Identity Verification) — أولوية عالية 🟠

### مزودو الخدمة المحتملون
- **Onfido**
- **Jumio**
- **Shufti Pro**
- **Absher** (السعودية)
- **Yoti**

### المكونات المرتبطة

| الملف / المكون | الميزة المعروضة | ما يحتاجه |
|---|---|---|
| `src/components/admin/pages/Clients.tsx` | إضافة عميل جديد مع رقم الهوية | API للتحقق من الهوية |
| `src/components/admin/pages/Portfolios.tsx` | قسم KYC والمستندات | رفع وثائق والتحقق منها |
| `supabase/schema.sql` | حقل `kyc_status` | ربطه بخدمة KYC |
| `supabase/schema.sql` | حقل `nationalId` | التحقق من صحة الرقم الوطني |

### ملاحظة فنية
- يجب استخدام Supabase Storage لتخزين المستندات مع سياسات وصول صارمة.
- التحقق من الهوية شرط قانوني في السعودية (CMA / PDPL).

---

## 8. تخزين الملفات (File Storage) — أولوية متوسطة 🟡

### مزودو الخدمة المحتملون
- **Supabase Storage**
- **AWS S3**
- **Cloudflare R2**
- **Uploadcare**

### المكونات المرتبطة

| الملف / المكون | الميزة المعروضة | ما يحتاجه |
|---|---|---|
| `src/components/admin/pages/Portfolios.tsx` | قسم المستندات (6 أنواع) | رفع ملفات حقيقية |
| `src/components/admin/pages/cms/SiteDesign.tsx` | إعدادات الموقع (شعار، ألوان) | رفع صور الشعار |
| `src/lib/supabase.ts` | `storage.from()` موجود في Mock Client | تفعيل Supabase Storage |

### ملاحظة فنية
- حالياً المستندات عبارة عن boolean flags (true/false) فقط.
- يجب توفير signed URLs للوصول للمستندات الحساسة.

---

## 9. المراقبة والتحليلات (Monitoring & Analytics) — أولوية متوسطة 🟡

### مزودو الخدمة المحتملون
- **Sentry** (أخطاء وأداء)
- **PostHog** (تحليلات المنتج)
- **Vercel Analytics**
- **LogRocket**

### الملفات المرتبطة

| الملف | الاستخدام الحالي |
|---|---|
| `src/lib/env.ts` | يقرأ `VITE_SENTRY_DSN` و `VITE_POSTHOG_KEY` |
| `src/lib/logger.ts` | تعليقات تشير إلى Sentry لكنها معطلة |
| `src/components/common/ErrorBoundary.tsx` | تعليقات تشير إلى Sentry لكنها معطلة |
| `src/main.tsx` | Performance monitoring يدوي فقط |

### المتغيرات البيئية المطلوبة
```
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_POSTHOG_KEY=phc_...
```

### ملاحظة فنية
- Sentry و PostHog مذكوران في الكود لكن لا يوجد تثبيت لحزمهما في `package.json`.
- يجب إضافة الحزم وتفعيل التهيئة في `main.tsx`.

---

## 10. خدمة الذكاء الاصطناعي (AI / Gemini) — أولوية منخفضة 🟢

### مزود الخدمة المحتمل
- **Google Gemini API**

### الملفات المرتبطة

| الملف | الاستخدام الحالي |
|---|---|
| `.env.example` | يذكر `VITE_GEMINI_API_KEY` |

### ملاحظة فنية
- لا يوجد استخدام فعلي لـ Gemini في الكود حالياً.
- يمكن استخدامه مستقبلاً لتحليل المحافظ أو توليد توصيات استثمارية.

---

## 11. خريطة التكاملات المطلوبة

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React/Vite)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Supabase    │  │ Backend API │  │ Socket.io / Realtime    │  │
│  │ Auth + DB   │  │ REST        │  │                         │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         External Providers                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Supabase │ │ Market    │ │ Payment  │ │ KYC      │          │
│  │          │ │ Data API  │ │ Gateway  │ │ Provider │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Email    │ │ SMS       │ │ Push     │ │ Storage  │          │
│  │ Service  │ │ Service   │ │ Service  │ │ (S3/Supa)│          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. ملخص المكونات حسب الأولوية

| الأولوية | المكون | الجهة الموفرة | الحالة الحالية |
|---|---|---|---|
| 🔴 قصوى | Supabase Auth + Database | Supabase | موجود عميل، غير مفعل |
| 🔴 قصوى | Backend API | Node.js/Express + Prisma | بنية موجودة، Routes جزئية |
| 🔴 قصوى | Market Data API | Alpha Vantage / CoinGecko / Tadawul | Mock data |
| 🔴 قصوى | Payment Gateway | HyperPay / Stripe / Amazon Payment Services | غير موجود |
| 🟠 عالية | Socket.io / Realtime | Backend Server أو Supabase Realtime | بنية موجودة |
| 🟠 عالية | Email / SMS / Push | Resend / Twilio / Firebase FCM | غير موجود |
| 🟠 عالية | KYC / Identity | Onfido / Jumio / Shufti Pro | غير موجود |
| 🟡 متوسطة | File Storage | Supabase Storage / S3 | Mock في Supabase client |
| 🟡 متوسطة | Monitoring (Sentry/PostHog) | Sentry / PostHog | متغيرات فقط |
| 🟢 منخفضة | AI / Gemini | Google Gemini | متغير فقط |

---

## 13. التوصيات الفورية

1. **لا تنشر المشروع قبل تفعيل Supabase Auth + Database + RLS.**
2. **استبدل كل بيانات `localStorage` في `src/lib/adminData.ts` بـ TanStack Query + Supabase أو Backend API.**
3. **اختر مزود بيانات أسواق مناسب للميزانية** واستخدم cache لتقليل التكلفة.
4. **لا تستخدم بيانات الأسواق كأساس لقرارات استثمارية حقيقية** دون تحقق من مصدر موثوق.
5. **استخدم Supabase Storage** بدلاً من boolean flags للمستندات.
6. **فعل Sentry على الأقل** لتتبع الأخطاء في الإنتاج.
7. **لا تخزن أسرار API Keys في الكود** — استخدم متغيرات بيئية فقط.
8. **للمدفوعات، استخدم Webhook** ولا تعتمد على state محلي.
9. **للإشعارات، استخدم queue** مثل BullMQ مع Redis.
10. **نفذ KYC قبل السماح بأي إيداع** — هذا شرط قانوني وتنظيمي.

---

## 14. الخلاصة

المشروع يحتاج إلى **7 تكاملات خارجية أساسية** قبل أن يكون صالحاً للإنتاج:

1. Supabase (Auth + Database + Storage + Realtime)
2. Backend API (Express/Prisma)
3. Market Data Provider
4. Payment Gateway
5. Email/SMS/Push Notifications
6. KYC Provider
7. Monitoring (Sentry/PostHog)

بدون هذه التكاملات، يبقى المشروع **عارضاً واجهات فقط (Frontend Prototype)** وغير صالح لمعالجة بيانات أو أموال حقيقية.

---

**تم إعداد هذا التقرير بواسطة مراجعة يدوية للملفات المصدرية دون كتابة أي كود.**
