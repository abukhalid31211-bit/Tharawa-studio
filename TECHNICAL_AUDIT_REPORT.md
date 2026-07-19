# تقرير المراجعة الفنية الشامل — ثروة كابيتال (Tharwa Studio)
**التاريخ:** 2026-07-19  
**الفرع المراجع:** `arena/019f7b67-tharawa-studio`  
**فريق المراجعة:** Frontend Architecture • Backend/Supabase • Security • QA • DevOps  
**حالة المشروع العامة:** 65% مكتمل UI/UX — 15% مكتمل Backend/Production — غير جاهز للإطلاق

---

## 1) الملخص التنفيذي

المشروع عبارة عن منصة استثمارية عربية (RTL/LTR) بواجهتين رئيسيتين:
- **الموقع العام (Public):** Hero, Markets Ticker, Services, Testimonials, News, Markets, About, Contact, FAQ, Service Details.
- **لوحة العميل (Dashboard):** محفظة، معاملات، تقارير PDF/Excel، دعم، مستشار، إعدادات.
- **لوحة الأدمن (Akadmin):** 20+ صفحة إدارة عملاء ومحافظ ومعاملات ورسائل ومحتوى CMS كامل.

**الانطباع التقني:**
- واجهات مصممة بعناية، نظام تصميم ذهبي موحد، RTL ممتاز، Tailwind v4 + Cairo/Inter.
- المنطق بالكامل يعتمد على `localStorage` كـ **قاعدة بيانات وهمية**. لا يوجد تكامل فعلي مع Supabase رغم وجود `schema.sql` و `seed.sql`.
- الأمان في حالة حرجة: كلمة مرور Super Admin ثابتة `0545` وهاردكود لـ `haidaralkarar20@gmail.com` في الكود، كلمات مرور المشرفين الفرعيين plaintext `admin123`.
- الـ API الوحيد `/api/v1/index.ts` يرجع رسالة ترحيبية فقط، و `vercel.json` يعيد كتابة كل شيء إلى `index.html` مما سيكسر الـ API في الإنتاج.
- لا يوجد نظام اختبار، لا CI/CD حقيقي، لا حماية RLS، لا JWT، لا تشفير، لا مراقبة.

**الخلاصة:** مشروع واجهات قوي لكنه **Prototype** وليس **Production System**. يحتاج إعادة هيكلة طبقة البيانات والأمان قبل أي إطلاق.

---

## 2) المكدس التقني والهيكل

### 2.1 package.json
- **Framework:** React 19.2.7, Vite 8.1.5, TanStack Router 1.170.18, TanStack Query 5.101.2
- **UI:** lucide-react, recharts 3.9.2, @dnd-kit, Tailwind v4, clsx/tw-merge
- **Data/Export:** xlsx, jspdf, html2canvas, @supabase/supabase-js (مثبت لكن غير مستخدم)
- **Scripts:** `dev`, `build`, `preview` فقط — لا `lint`, `test`, `typecheck`
- **مخاطر:** React 19 ما زال حديث جداً، بعض المكتبات قد لا تدعمه كلياً. لا قفل نسخة Node محدد.

### 2.2 ملفات الجذر
- `vite.config.ts`: صحيح، alias `@` → `./src`, plugins: TanStackRouter + React + Tailwind. HMR قابل للتعطيل عبر ENV.
- `tsconfig.json`: `strict:true` جيد، لكن `noUnusedLocals:false` يسمح بكود ميت. paths صحيحة.
- `vercel.json`: `rewrites: / (.*) → /index.html` — **قاتل** للـ API Routes. يجب استثناء `/api/*`.
- `index.html`: lang=ar dir=rtl, خطوط Cairo/Inter/JetBrains, favicons متعددة. لا يوجد meta description, og tags, CSP.
- `.env.example`: فقط GEMINI_API_KEY و APP_URL — لا يوجد `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` رغم الاعتماد على Supabase.
- `metadata.json`: فارغ.
- `api/v1/index.ts`: Handler واحد `res.status(200).json({message...})` — لا middleware, لا auth, لا validation.

---

## 3) قراءة ملف ملف — التفكيك المعماري

### 3.1 نقطة الدخول
- `src/main.tsx`: إنشاء router + QueryClient + LanguageProvider + SiteSettingsProvider. صحيح لكن لا يوجد ErrorBoundary ولا Suspense global.
- `src/App.tsx`: ملف ميت `return <div></div>` — بقايا من AI Studio.
- `src/routeTree.gen.ts`: مولد تلقائي (818 سطر) — يرسم شجرة `/`, `/Akadmin/*`, `/dashboard`, `/about`, `/service/$id`, `/article/$slug`. لا مشكلة لكن حجمه كبير ويلزم استبعاده من lint.
- `src/routes/__root.tsx`: ذكي — يفصل isAppArea (dashboard / Akadmin) عن الموقع العام لمنع تداخل header/footer. منطق جيد.
- `src/routes/index.tsx`: يركب 10 أقسام بالترتيب. لا يوجد lazy loading — كل الصفحة تحمل مرة واحدة.
- `src/styles/globals.css`: نظام ألوان احترافي (primary/secondary/gold/success/error...) + دارك مود عبر CSS variables. Animations `ticker-scroll-ar/en`, `pulse-whatsapp`, `float`. ممتاز.

### 3.2 الطبقات المشتركة `lib/` و `contexts/`
- `lib/store.ts`: `getStorage/setStorage/removeStorage` — JSON.stringify/parse مباشر. لا try/catch إلا في adminData. لا انتهاء صلاحية. مفتاح في localStorage = كل شيء متاح للقراءة.
- `lib/auth.ts`: 
  - `saveAdminSession / getAdminSession` + `saveClientSession` — تخزين جلسة في localStorage بدون توقيع أو انتهاء. `isAdminAuthed = !!getAdminSession()` — قابل للتزوير بـ DevTools.
  - لا تجديد token، لا refresh، لا httpOnly cookie.
- `lib/api.ts`: 
  - `BASE_URL = VITE_API_URL || '/api/v1'` — جيد، لكن `token = localStorage.getItem('token')` مفتاح مختلف عن `KEYS.CLIENT_SESSION`. تناقض.
  - لا معالجة 401، لا retry، لا zod validation.
  - `api` يصدّر `getHomeData`, `getServices` فقط — غير مستخدمة في أي مكان.
- `lib/adminData.ts` (641 سطر — قلب المشروع):
  - **Hook `useAdminStore<T>`**: reactive localStorage + custom event `tharwah_admin_data_changed` + `storage` event — فكرة ذكية لتحديث كل الصفحات. لكنه يعيد تحميل كامل الكولكشن عند أي تغيير (غير فعال).
  - **Types:** Client, Portfolio, Holding, AdminTransaction, SupportMessage, AdminNotification, SubAdmin, AdminTask, CalendarEvent, TeamMember, AuditLog, LoginAttempt, PlatformSettings — كلها مطابقة لـ Supabase لكن بدون علاقة.
  - **Seeds:** `CLIENTS_SEED` (9 عملاء), `PORTFOLIOS_SEED` (5), `TRANSACTIONS_SEED` (10), `MESSAGES_SEED` (5), `NOTIFICATIONS_SEED` (6), `SUB_ADMINS_SEED` (3 بحساب admin123), `TASKS_SEED`, `EVENTS_SEED`, `TEAM_SEED`, `AUDIT_SEED`, `LOGIN_ATTEMPTS_SEED`, `SETTINGS_SEED` + CMS seeds: Hero, Services (6), Markets (7), FAQ (5), Testimonials (4), About, SiteDesign, Privacy (4 أقسام).
  - **Helpers:** `nextCode`, `unreadMessagesCount`, `addAuditEntry`, `addLoginAttempt`, `relativeTime`, `getLoginLock/setLoginLock` — قفل بعد 5 محاولات 30 دقيقة (مخزن localStorage فقط = يمكن تجاوزه بمسح التخزين).
  - **ADMIN_KEYS**: 20 مفتاح localStorage — خطر تضارب وتجاوز quota (5MB).

- `contexts/LanguageContext.tsx`: يخزن `tharwah_lang` في localStorage، يضبط `document.dir` و `lang` — جيد. لكن لا يزامن مع `Accept-Language` header ولا يخزن في user profile.
- `contexts/SiteSettingsContext.tsx`: فقط `theme` state (light/dark) — يعدل `documentElement.classList`. لا يحفظ في localStorage، لا يقرأ من `prefers-color-scheme`.

### 3.3 مكوّنات `components/ui/`
- `Button.tsx` (33 سطر): variants: primary/secondary/ghost? يدعم isLoading.
- `Card.tsx`: variants: default/interactive/featured. جيد.
- `Badge`, `Avatar`, `Input`, `Select`, `Toggle`, `Progress`, `Skeleton` — مكونات بدائية لكن موحدة. لا يوجد Storybook.
- كلها تستخدم `cn()` من `utils.ts` (clsx + tailwind-merge) — صحيح.

### 3.4 مكونات الموقع العام `site/`
- `SiteHeader.tsx` (346 سطر): sticky + scroll hide/show + progress bar + mega menu خدمات (3 أعمدة) + mobile drawer + theme toggle + language toggle + منطقة عميل (isClientAuthed). تفاعلات كثيرة بدون `useRef` لإغلاق عند الضغط خارج. لا debounce للـ scroll listener.
- `SiteFooter.tsx` (268 سطر): 5 أقسام — announcement bar (sessionStorage), CTA gold gradient, info grid 4 أعمدة, newsletter bar, copyright + privacy modal. Newsletter مجرد timeout 1.5s — لا API حقيقي.
- `LiveTicker.tsx` (54 سطر): تكرار مصفوفة مرتين لـ infinite scroll, animation-play-state عند hover — ذكي لكن بيانات هاردكود.
- `AnnouncementBar`, `BackToTop`, `CookieBanner` (localStorage `cookies-accepted`), `WhatsappButton` — بسيطة وجيدة.

### 3.5 أقسام الصفحة الرئيسية `home/`
- `Hero.tsx` (202): badge, عنوان, CTA, stats, صورة. يستهلك `useCmsHero` — مربوط بالـ CMS.
- `TrustBadges`, `ServicesSection` (99), `StatsSection`, `HowItWorks`, `MarketsPreview`, `WhyChooseUs`, `Testimonials`, `LatestNews`, `CtaSection` — كلها تعرض بيانات من seeds أو CMS localStorage. لا skeleton عند التحميل.

### 3.6 صفحات `routes/` العامة
- `/services.tsx`: 6 خدمات مع features, link إلى `/service/$id`.
- `/service.$id.tsx` (213): صفحة ديناميكية بـ stats + sectors + markets + FAQ accordion محلي. بيانات هاردكود داخل الملف (Record) — كان يجب أن تكون API.
- `/markets.tsx` → `MarketsPage.tsx` (545 سطر): جدول أسواق، فلترة فئة، إضافة تنبيه سعر — كلها state محلي.
- `/news.tsx` → `NewsPage.tsx` (536): قائمة مقالات، فلترة كاتب، تصنيف، بحث — بيانات هاردكود.
- `/about.tsx`, `/contact.tsx` (form success via setTimeout), `/faq.tsx` (search + categories sticky), `/article.$slug.tsx`, `/login.tsx` (client login mock يحفظ أي ايميل باسم أحمد الغامدي).
- `/dashboard.tsx` (280): يجمع 8 tabs + modals transfer + toast + PDF/Excel export — كلها useState محلي، INITIAL_* هاردكود، حساب الرصيد `245000 + reduce`. لا pagination, لا real API.

### 3.7 لوحة العميل `dashboard/`
- `DashboardLayout.tsx` (239): sidebar, header, tabs. يحذف session عبر `clearClientSession` لكن لا يستدعي backend logout.
- `DashboardHome`, `InvestmentsTab`, `PerformanceTab`, `BankingTab`, `TransactionsTab`, `ReportsTab`, `SupportTab`, `AdvisorTab`, `SettingsTab` — كل تبويب ~50-150 سطر، يعتمد props من الأب، لا استدعاءات API، لا loading states حقيقية.

### 3.8 لوحة الأدمن — النواة
- `AdminLayout.tsx` (595): Sidebar 220/64 + Topbar 60, groups (Main, Clients, Platform, Website CMS, System, Admin Tools, Permissions). بادجات live (pendingClients, Txs, Messages, Notifs). حماية sub-admin عبر فحص permissions + auto-logout إذا حُذف. اختصار ⌘K للبحث. إدارة dropdowns. تصميم inline-style ثقيل (صعب الصيانة) لكن دقيق.
- `AdminLogin.tsx` (368): **أخطر ملف** — يحتوي `haidaralkarar20@gmail.com` + `0545` هاردكود، تحقق كلمة المرور بمقارنة مباشرة، قفل localStorage يمكن تجاوزه، لا rate limiting حقيقي، لا captcha.
- `admin/ui.tsx` (415): نظام UI موحد: PageHeader, Panel, PanelHeader, Pill, StatCard, SearchInput, FilterTabs, Field/TextInput/TextArea/SelectBox/Toggle, Modal, ConfirmDialog, PrimaryBtn/GhostBtn/IconBtn, EmptyState, DataTable/Tr/Td, useToast, exportCSV, ClientAvatar — جيد جداً كـ Design System لكنه مكرر مع `components/ui/`.

### 3.9 صفحات الأدمن الفرعية (13+)
- `Overview.tsx` (536): KPI 8 بطاقات + AUM SparklineSVG + DonutChart + Revenue MiniBarChart + Recent Clients + Quick Actions + Transactions + Heatmap + Health Donut + Smart Alerts. بيانات معظمها mock static (AUM_DATA, REVENUE_DATA) + live من store (clients, transactions).
- `Clients.tsx` (246): CRUD محلي + approval/suspend/delete + CSV export + إضافة عميل (EMPTY_FORM). لا validation حقيقي للـ IBAN أو national ID.
- `Portfolios.tsx` (1222 سطر — الأضخم): PageMode list/form, ViewMode cards/table, FlexStore لـ 5 أقسام (personal/financial/banking/kyc/internal) + investments (7 أنواع أصول) + documents (6) + sectionNotes + declineAlert. منطق تحويل HoldingRows إلى Portfolio. ميزات متقدمة: clone as template, compare, PDF export (jsPDF), performance AreaChart (recharts). معقد جداً وكل شيء local.
- `Transactions.tsx` (238): جدول + Approve/Reject + CSV.
- `Messages.tsx` (189): تذاكر + replies + status.
- `Notifications.tsx` (171): list + mark read + إرسال جماعي mock.
- `Reports.tsx` (233): تصدير PDF/Excel للـ KPIs.
- `Team.tsx` (149), `ClientProfile.tsx` (298), `GlobalSearch.tsx` (225), `Calendar.tsx` (337), `Tasks.tsx` (233), `SubAdmins.tsx` (251), `Security.tsx` (184), `Settings.tsx` (147), `ContentHub.tsx` (85), `BasicPages.tsx` (29).
- `cms/*Managers.tsx` (7 ملفات): HeroManager (145), ServicesManager (163), MarketsManager (171), FAQManager (171), TestimonialsManager (196), AboutManager (157), SiteDesign (162), PrivacyPolicyManager (186) — كلها تحرر seeds في localStorage مع toggle active/visible.

### 3.10 `supabase/`
- `schema.sql` (129 سطر): جداول: users, portfolios, transactions, assets, support_tickets, notifications, site_settings, content_sections, sub_admins, meetings, audit_logs — تصميم جيد، أنواع CHECK صحيحة، علاقات FK. لكن **لا RLS policies**, لا indexes صريحة, لا triggers لـ updated_at, لا extension pgcrypto إلا افتراض gen_random_uuid.
- `seed.sql` (53): INSERT users + portfolio + assets + transactions + tickets + site_settings — يستخدم `ON CONFLICT DO NOTHING` لكن portfolios/assets لا تملك unique constraint فيهدد التكرار.

---

## 4) الترابط والتكامل — Data Flow

```
UI Public (Hero, Markets, Services, Testimonials)
   ↕ useCmsHero(), useCmsServices(), useCmsMarkets() ... ← useAdminStore (localStorage)
   ↕ LanguageContext (localStorage tharwah_lang) + SiteSettingsContext (in-memory)

Client Login (/login)
   → saveClientSession({id, name, email}) في localStorage (ثابت!)
   → /dashboard تحمي نفسها بـ isClientAuthed() → navigate /login إذا فشل
   → Dashboard tabs كلها useState محلي — لا يتصل بـ API/Supabase

Admin Login (/Akadmin)
   → يفحص localStorage SUB_ADMINS_SEED أو hardcode super
   → saveAdminSession + localStorage admin_permissions
   → AdminLayout يقرأ useClients()... من localStorage + يفلتر حسب permissions
   → كل صفحة إدارة تكتب بـ setClients / setPortfolios ... → emitAdminDataChange → باقي الصفحات تتحدث

Supabase
   → غير موصول إطلاقاً في الكود (لا createClient)
   → schema.sql جاهز لكن لا يُستخدم
   → api/v1/index.ts لا يوفر endpoints CRUD

api.ts
   → ملف ميت — لا يُستدعى
   → BASE_URL /api/v1 لكن vercel rewrites يعيد توجيهه لـ index.html
```

**نقاط القطع:**
- لا يوجد مصدر حقيقة واحد: localStorage هو DB والمخازن متعددة.
- لا synchronization بين تبويبات المتصفح إلا عبر `storage` event — معرض للعرق.
- العميل والأدمن يشاركان نفس localStorage namespace في نفس المتصفح — عميل يمكنه تعديل admin data لو عرف المفاتيح.
- لا WebSocket / Realtime — كل شيء polling أو interval 500ms (AdminRoot).

---

## 5) تدقيق الأمان — الثغرات

### 🔴 Critical (يجب إصلاح قبل أي نشر)
1. **هاردكود Super Admin:** `AdminLogin.tsx:117` `haidaralkarar20@gmail.com` + `0545`. موجود في Git history. يجب إزالة فوراً واستخدام ENV + bcrypt.
2. **كلمات مرور Plaintext:** SUB_ADMINS_SEED كلها `admin123` مخزنة JSON، إضافة مشرف جديد تخزن `password` كما هي. لا hash.
3. **Auth Client-side فقط:** يمكن فتح Console وكتابة `localStorage.setItem('tharwah_admin_session', JSON.stringify({email:'a@b.com', role:'super'}))` والدخول.
4. **Client Login وهمي:** `/login.tsx` يحفظ جلسة ثابتة `أحمد الغامدي` لأي إدخال — لا تحقق.
5. **لا RLS ولا JWT:** Supabase غير مفعل، حتى لو فُعل، الجداول بدون policies = أي مفتاح anon يستطيع القراءة/الكتابة.
6. **XSS محتمل:** `dangerouslySetInnerHTML` في `Overview.tsx` لرسم DonutChart عبر `<path>` — إذا كان `pct` من مستخدم يمكن حقن SVG.
7. **localStorage Quota & Tampering:** 20 مفتاح `tharwah_admin_*` قابلة للتعديل/المسح/الملء. لا تشفير.

### 🟠 High
- `api.ts` يقرأ `localStorage.getItem('token')` مفتاح غير موجود — تناقض مع `KEYS.CLIENT_SESSION`.
- `vercel.json` rewrites تكسر `/api/*` — سيؤدي لـ 404 غير متوقعة في الإنتاج.
- لا CSP headers, لا `HttpOnly`, لا `Secure` flags.
- لا Rate Limit حقيقي — قفل localStorage يُتجاوز.
- لا تأكيد بريد/هاتف، لا 2FA رغم وجود `twoFactorRequired` في SETTINGS_SEED.
- ملفات `exportCSV`, PDF, Excel تُنشئ محتوى من مدخلات المستخدم بدون تطهير (CSV Injection مثلاً `=CMD|`).
- الصور المولدة PDF / Excel قد تحتوي بيانات حساسة (IBAN) غير مقنعة.

### 🟡 Medium
- `noindex` فقط في AdminLogin مؤقتة — يجب إضافة header على مستوى Vercel.
- `meta viewport width=1280` في AdminLogin يكسر responsiveness.
- لا logging مركزي، `audit_logs` جدول موجود لكن `addAuditEntry` يكتب localStorage فقط.

---

## 6) الثغرات الوظيفية ومنطق العمل

- **Trading/Investment غير موجود:** لا تنفيذ صفقات حقيقي، لا تكامل مع Tadawul API أو Binance أو أي وسيط.
- **BankingTab:** زر "طلب تحديث بيانات بنكية" يضبط `bankRequestSent=true` فقط — لا backend.
- **Notifications:** مجرد قائمة local — لا push، لا email، لا SMS.
- **Meetings/Calendar:** إضافة موعد تخزن في localStorage — لا مزامنة Google Calendar، لا تذكير.
- **Search Global:** يبحث في seeds فقط.
- **ContentHub:** مجرد روابط — لا تحكم صلاحيات دقيق.
- **Markets Ticker:** أسعار ثابتة، لا تحديث لحظي.
- **News:** مقالات هاردكود، لا pagination، لا CMS ربط بـ `content_sections`.
- **Service Details:** sectors/markets هاردكود داخل `service.$id.tsx` — كان يجب أن يأتي من CMS.
- **Reports:** يولد PDF بـ jsPDF لكن النص عربي قد لا يُعرض صحيح (jsPDF لا يدعم العربية بدون خط مخصص).
- **لا إدارة أدوار دقيقة:** SubAdmin permissions 6 قيم فقط (clients, portfolios, transactions, messages, content, reports). لا granular مثل "قراءة فقط".
- **لا سجل تغييرات للمحتوى:** CMS يعدل مباشرة بدون versioning.
- **Portfolios form:** حقول اختيارية "جميع الحقول اختيارية" — يسمح بإنشاء محفظة بدون عميل (لكن الكود يمنع لاحقاً). تناقض.
- **Public + Admin في نفس الدومين:** `/Akadmin` مكشوفة، يمكن اكتشافها.

---

## 7) الأداء والقابلية للتوسع

- **Bundle Size:** استيراد `recharts`, `jspdf`, `xlsx`, `html2canvas`, `dnd-kit` في bundle واحد — لا code splitting. يجب استخدام `React.lazy()` للـ admin.
- **Images:** لا optimized images, لا srcset, favicons فقط.
- **Re-renders:** `useAdminStore` يعيد `setValue(load())` عند كل `CHANGE_EVENT` — حتى لو المفتاح مختلف. كل الصفحات تعيد render.
- **Search & Filter:** فلترة O(n) على المصفوفات في الذاكرة — ستفشل بعد 1000+ عميل.
- **localStorage 5MB حد:** مع 9 عملاء + 5 محافظ + صور base64 مستقبلاً سيتجاوز الحد.
- **No Pagination / Virtualization:** جداول DataTable تعرض كل الصفوف — لا `react-window`.
- **Animations:** ticker `35s linear infinite` + 10 items *2 = 20 DOM nodes متحركة — جيد لكن بدون `will-change`.
- **No Service Worker / PWA:** رغم وجود أيقونات 192/512.

---

## 8) جودة الكود والصيانة

- **TypeScript:** `any` منتشر (59 مرة): `Row as any`, `to as any`, `icon: any`. يضعف الأمان النوعي.
- **No ESLint/Prettier:** لا ملف `.eslintrc`، لا `editorconfig`.
- **No Tests:** `npm test` يطبع Error.
- **Styles:** مزيج Tailwind + inline style (في AdminLayout) — صعب الصيانة، لا يستفيد من purging.
- **Duplicated UI:** `components/ui/` و `components/admin/ui.tsx` مكرران — يجب توحيد.
- **File Naming:** `Akadmin` بحرف كبير — غير متناسق مع باقي المسارات (حساس لنظام Linux).
- **Dead Code:** `App.tsx`, `src/vite-env.d.ts` فارغ؟, `assets/.aistudio/.gitignore`.
- **Comments:** تعليقات عربية مفيدة لكن بعضها يصف ما يفعله الكود بدلاً من لماذا.

---

## 9) تجربة المستخدم و RTL

- **إيجابيات:** RTL متقن، Cairo خط جميل، gold theme فاخر، dark mode موجود، responsive نسبياً، toast و modal animations جيدة.
- **سلبيات:** 
  - `dir` يضبط فقط في LanguageContext — بعض المكونات تستخدم `rtl:` و `ltr:` بشكل غير متناسق.
  - تحويل العملة SAR فقط — لا multi-currency.
  - تاريخ `YYYY-MM-DD` ثابت — لا `date-fns` format حسب اللغة.
  - Accessibility: لا `aria-label` كافي، لا keyboard navigation في المودالات.
  - لا Empty states في بعض الصفحات (Portfolio list عند عدم وجود محافظ يوجد لكن في أماكن أخرى لا).

---

## 10) ما تبقى وما يتطلبه الإنتاج — خارطة طريق

### 10.1 لإكمال MVP وظيفي (أسبوعان)
- [ ] ربط Supabase فعلياً: `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` + service role في API.
- [ ] نقل كل `useAdminStore` إلى `useQuery` + Supabase tables.
- [ ] بناء `api/v1/*` حقيقية: `/clients`, `/portfolios`, `/transactions`, `/auth` مع Zod validation.
- [ ] إصلاح `vercel.json`: استثناء `/api/*` من rewrites.
- [ ] استبدال auth الوهمي بـ Supabase Auth (email/password + RLS).
- [ ] إزالة الهاردكود وتشفير كلمات المرور بـ bcrypt (Supabase يفعل ذلك).
- [ ] إضافة ENV حقيقية: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`, `JWT_SECRET`.

### 10.2 للإنتاج الآمن (شهر)
- **Security:**
  - RLS policies لكل جدول (users فقط يرى بياناته، admin يرى الكل عبر service role).
  - Rate limiting (Upstash Redis) + Captcha في Login.
  - CSP headers, HSTS, X-Frame-Options.
  - إزالة `dangerouslySetInnerHTML` أو تعقيم.
  - تشفير IBAN وحقول حساسة.
  - Audit logs حقيقية في DB + لا localStorage.
- **Backend:**
  - Edge Functions أو Vercel Serverless للـ trading execution (إن وجد).
  - Webhooks للمدفوعات، Tadawul integration.
  - Cron للـ market ticker تحديث (مثلاً كل دقيقة من API خارجي).
  - File storage (Supabase Storage) للمستندات بدلاً من boolean flags.
  - Email service (Resend / SendGrid) للإشعارات.
- **Frontend:**
  - Code splitting: `const Admin = lazy(() => import(...))`.
  - ErrorBoundary + Suspense.
  - Pagination + virtual scrolling.
  - i18n مكتبة (next-intl أو i18next) بدلاً من `t(ar,en)`.
  - PDF عربي: استخدام خط Cairo في jsPDF أو الانتقال لـ `pdf-lib`.
  - تحسين SEO: meta tags, og, sitemap, robots.txt.
- **DevOps:**
  - GitHub Actions: lint, typecheck, build, test.
  - Preview deployments + staging env.
  - Monitoring: Sentry + Vercel Analytics.
  - Backups: Supabase daily backups + PITR.
- **Compliance (Saudi):**
  - PDPL (نظام حماية البيانات الشخصية) — سياسة خصوصية حقيقية، حق الوصول/الحذف.
  - CMA licensing notice.
  - إشعار المخاطر الاستثمارية.
  - KYC/AML حقيقي (Onfido / Jumio أو يدوي).
  - سجلات تدقيق غير قابلة للتعديل.

### 10.3 للنمو (بعد الإطلاق)
- Real-time via Supabase Realtime أو WebSocket للأسعار.
- Mobile App (React Native).
- Advanced Analytics (Mixpanel / PostHog).
- AI insights (Gemini API الموجود في .env.example لكن غير مستخدم).
- Multi-tenancy لو أضيفت فروع.

---

## 11) توصيات فورية (Top 10)

1. **احذف فوراً** `haidaralkarar20@gmail.com` و `0545` من `AdminLogin.tsx` — استخدم `VITE_SUPER_ADMIN_EMAIL` في `.env.local` غير مُتبع.
2. **أوقف تخزين كلمات المرور plaintext** — احذف `password` من `SubAdmin` واستخدم Supabase Auth.
3. **صلّح `vercel.json`:** 
   ```json
   { "rewrites": [{ "source": "/api/(.*)", "destination": "/api/v1/$1" }, { "source": "/(.*)", "destination": "/index.html" }] }
   ```
4. **أنشئ عميل Supabase:** `src/lib/supabase.ts` + اربط `schema.sql` مع RLS.
5. **وحّد نظامي UI** — احذف التكرار بين `ui/` و `admin/ui.tsx`.
6. **أضف `zod` validation** لكل Forms (موجودة `react-hook-form` + `@hookform/resolvers` لكن غير مستخدمة).
7. **أضف `ErrorBoundary`** في `__root.tsx` و `DashboardLayout`.
8. **قلل Bundle:** استورد `recharts` ديناميكياً فقط في صفحات Admin.
9. **أضف `npm run typecheck`:** `tsc --noEmit` في CI.
10. **اكتب README حقيقي** بدلاً من قالب AI Studio + أضف `CONTRIBUTING.md` و `SECURITY.md`.

---

## 12) قائمة فحص الإنتاج (Production Readiness Checklist)

| الفئة | الحالة | ملاحظات |
|---|---|---|
| Auth | 🔴 غير آمن | localStorage فقط |
| DB | 🔴 وهمية | localStorage seeds |
| API | 🔴 وهمي | handler واحد |
| RLS | 🔴 مفقود | schema بدون policies |
| Env | 🟡 ناقص | لا Supabase vars |
| Tests | 🔴 لا يوجد | `npm test` fails |
| Lint | 🔴 لا يوجد | ESLint مفقود |
| CI/CD | 🟡 Vercel فقط | لا GitHub Actions |
| Monitoring | 🔴 لا يوجد | لا Sentry |
| Backups | 🟡 Supabase فقط | لكن غير مستخدم |
| SEO | 🟡 أساسي | لا meta |
| Accessibility | 🟡 متوسط | يحتاج audit |
| Performance | 🟡 65/100 | Bundle كبير |
| Security Headers | 🔴 مفقود | لا CSP |
| PDPL Compliance | 🔴 سياسة وهمية | Modal "قريباً" |

---

## 13) خاتمة الفريق

المشروع يملك **أساس بصري قوي** ونظام تصميم فاخر يستحق الاستثمار. لكنه حالياً **واجهات أمامية بمخزن محلي** — أي مطور يفتح Console يصبح Super Admin. هذا مقبول كـ Prototype أو عرض تجريبي، لكنه **غير قابل للإطلاق** للعملاء الحقيقيين.

الخطوة الصحيحة الآن: تجميد تطوير الميزات الجمالية، والتركيز لمدة 3 أسابيع على **الطبقة الخلفية والأمان** كما هو موضح في خارطة الطريق أعلاه.

> **التقدير التقني:** 
> - لإكمال MVP آمن: 80–120 ساعة عمل (Backend + Supabase + Auth)
> - للإنتاج الكامل مع Compliance: 300–400 ساعة

---

**تم إعداد هذا التقرير تلقائياً عبر تحليل 60+ ملف مصدري في المستودع.**
