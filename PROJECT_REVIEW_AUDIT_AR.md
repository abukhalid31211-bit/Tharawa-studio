# تقرير مراجعة هندسية شاملة لمشروع Tharwah Studio

**تاريخ المراجعة:** 25 يوليو 2026  
**نطاق المراجعة:** الشيفرة المصدرية والتكوينات وقاعدة البيانات والربط بين الواجهات وواجهة API فقط.  
**مستثنى صراحةً:** لم تتم مراجعة ملفات التوثيق الموجودة في الجذر مثل `README.md` وملفات التقارير وملفات الإعداد التشغيلي التوثيقية؛ بناءً على طلب المالك تم التركيز على المشروع التنفيذي الفعلي ملفاً ملفاً.

---

## 1. الخلاصة التنفيذية

المشروع عبارة عن منصة استثمارية عربية/إنجليزية تتكون من:

- موقع عام وتسويقي.
- لوحة عميل للاستثمارات والمعاملات والدعم والمواعيد.
- لوحة إدارة كبيرة متعددة الصفحات وCMS.
- Backend بـ Express/TypeScript/Prisma/PostgreSQL وSocket.IO.
- نموذج بيانات جيد نسبياً يغطي المستخدمين، المحافظ، الأصول، المعاملات، التذاكر، الإشعارات، المواعيد، التدقيق والجلسات.

**الحكم العام: غير جاهز للإطلاق الإنتاجي حالياً.** السبب الحاسم ليس الشكل أو اكتمال الصفحات، بل وجود فجوة بين أجزاء الإدارة القديمة/المحلية وبين الـ Backend الجديد، وأخطاء بناء Backend، ووجود بيانات تجريبية/بدائل مرئية في مسارات مالية، مع عدة نقاط صلاحيات وتحقق يجب إغلاقها قبل التعامل مع بيانات مستثمرين حقيقية.

### درجة تقديرية

| المجال | التقييم |
|---|---:|
| اكتمال الواجهات | 8/10 |
| تصميم الـ Backend والنموذج | 7/10 |
| تكامل الإدارة مع الـ API | 5/10 |
| أمن المصادقة الأساسي | 6/10 |
| صحة البيانات المالية | 4/10 |
| الاختبارات | 2/10 |
| قابلية البناء والتسليم | 4/10 |
| الجاهزية الإنتاجية الكلية | **4.5/10** |

> هذه الدرجة مبنية على قراءة الشيفرة واختبارات البناء الساكنة، وليست شهادة اختراق أو اختبار قبول تشغيلي على قاعدة بيانات حقيقية.

---

## 2. منهجية وحجم المراجعة

تم فحص شجرة `src/` و`backend/`، بما فيها:

- جميع ملفات المسارات، المكونات، contexts، hooks، مكتبات الربط، المصادقة، الأمان، التخزين، والـ CSS التنفيذي.
- جميع مسارات Express وmiddleware وconfig وSocket.IO.
- `schema.prisma` وملف migration وseed التنفيذي.
- `package.json` وTypeScript وVite وESLint وملفات البيئة والتكوين.
- بحث ساكن عن الأسرار، التخزين المحلي، البيانات الوهمية، `fetch`، `dangerouslySetInnerHTML`، TODO/FIXME، ومداخل المصادقة.
- تنفيذ build/test/lint بعد تثبيت الاعتماديات.

**الحجم المرئي في الشيفرة:** نحو 24,049 سطراً في `src` و`backend`، مع عشرات الصفحات والمكونات والمسارات.

### نتائج التحقق الآلي

| الفحص | النتيجة |
|---|---|
| Frontend `npm run build` | **نجح** بعد `npm ci` |
| Frontend `npm test -- --run` | **نجح: 1 ملف، 4 اختبارات** فقط |
| Frontend `npm run lint` | نجح مع **7 تحذيرات React Hooks** |
| Backend `npm run build` | **فشل**: أخطاء TypeScript وعميل Prisma غير مولد |
| Backend `npm run prisma:generate` | تعذر بسبب فشل اتصال تنزيل Prisma engine الشبكي في بيئة المراجعة |
| Backend `npm audit --omit=dev --audit-level=high` | **5 ثغرات عالية** في شجرة الاعتماديات الحالية |

---

## 3. خريطة النظام الحالية

### 3.1 Frontend

- نقطة التشغيل: `src/main.tsx`.
- Routing: TanStack Router مع شجرة مولدة في `src/routeTree.gen.ts`.
- إدارة الحالة الشبكية: TanStack Query في `src/lib/queries.ts`.
- API client: `src/lib/api.ts`.
- جلسات الواجهة: `src/lib/auth.ts` و`src/lib/store.ts`.
- realtime: `src/lib/socket.ts` و`src/contexts/SocketContext.tsx`.
- الموقع العام: `src/routes/index.tsx` ومكونات `src/components/home` و`src/components/site`.
- لوحة العميل: `src/routes/dashboard.tsx` و`src/components/dashboard`.
- لوحة الإدارة: `src/routes/Akadmin.tsx` و`src/components/admin`، مع 20+ مسار إداري.

### 3.2 Backend

- التشغيل والتجميع: `backend/src/server.ts`.
- المصادقة: `backend/src/routes/auth.routes.ts` و`backend/src/middleware/auth.middleware.ts`.
- الموارد: clients, portfolios, transactions, messages, notifications, meetings, sub-admins, settings, audit, content, markets, platform-data, stats, contact.
- ORM: Prisma/PostgreSQL.
- realtime: Socket.IO مع غرف `user:*`, `client:*`, `admin_updates`.
- حماية أولية موجودة: Helmet، CORS، rate limit، JWT issuer/audience/algorithm، bcrypt، Zod في عدد من المسارات، refresh-session hashes، audit logs.

### 3.3 قاعدة البيانات

النموذج يحتوي على 15 كياناً تقريباً، وأبرزها:

`User`, `Portfolio`, `Asset`, `Transaction`, `SupportTicket`, `TicketMessage`, `Notification`, `NotificationReceipt`, `Meeting`, `ContentSection`, `SiteSetting`, `SubAdmin`, `AuditLog`, `LoginAttempt`, `RefreshSession`, `PlatformData`.

التصميم يدعم العلاقات والفهارس وقيوداً مالية أولية مثل `amount > 0` في migration، لكنه لا يفرض معظم حالات الأعمال والقيم المسموحة على مستوى قاعدة البيانات.

---

## 4. النتائج الحرجة والعالية

### C-01 — Backend لا يمر بالبناء
**الخطورة: حرجة | الحالة: مانع إطلاق**

`backend/src/lib/prisma.ts` يفشل في إيجاد `PrismaClient` لأن Prisma Client لم يتم توليده في بيئة البناء. وبعد محاولة التوليد تعذر تنزيل Prisma engine. كما ظهرت أخطاء TypeScript مستقلة:

- `backend/src/routes/portfolios.routes.ts:28`: المتغير `assetSchema` معرّف وغير مستخدم.
- `backend/src/routes/stats.routes.ts:13`: الوسيط `req` معرّف وغير مستخدم مع تفعيل `noUnusedParameters`.

**الأثر:** لا يمكن اعتماد pipeline أو نشر Backend نظيف من checkout جديد، ولا توجد ضمانة أن migrations/client متزامنان.

**الإصلاح:**
1. إضافة خطوة صريحة `prisma generate` إلى pipeline قبل `tsc`.
2. تثبيت/توثيق نسخة Prisma بشكل متطابق بين `package.json` وlockfile.
3. إصلاح الأخطاء غير المستخدمة.
4. استخدام cache/artifact داخلي لـ Prisma engines في CI إذا كان الاتصال الخارجي غير مضمون.
5. جعل build نظيفاً من checkout جديد في بيئة معزولة.

---

### C-02 — لوحة الإدارة تعتمد على طبقة `adminData` محلية/هجينة
**الخطورة: حرجة | الحالة: مانع بيانات إنتاجية**

معظم صفحات الإدارة تستورد hooks من `src/lib/adminData.ts`، بينما الربط الجديد موجود في `src/lib/adminRemote.ts`. الملف المحلي يحتوي seeds وبيانات إدارية تجريبية، ويستخدم `localStorage` كـ development fallback. مثال واضح:

- `src/components/admin/pages/Clients.tsx`
- `src/components/admin/pages/Portfolios.tsx`
- `src/components/admin/pages/Transactions.tsx`
- `src/components/admin/pages/cms/*.tsx`
- `src/components/admin/AdminLayout.tsx`
- `src/lib/adminData.ts:293+`

التنفيذ الهجين قد يبدأ ببيانات seed في التطوير، ثم يحاول المزامنة، لكن ليس كل صفحات الإدارة مرتبطة بعقود API موحدة. في الإنتاج، عند فشل API تتحول بعض الموارد إلى مصفوفات فارغة بدلاً من حالة خطأ واضحة.

**الأثر:** احتمال عرض بيانات غير حقيقية أو فقدان تعديلات واجهة الإدارة، واختلاف سلوك التطوير عن الإنتاج، وصعوبة ضمان أن عمليات CRUD تصل إلى قاعدة البيانات.

**الإصلاح:**
- إزالة seeds من runtime وعدم استخدام `localStorage` للبيانات التشغيلية.
- جعل كل شاشة تستعمل query/mutation موحداً من API.
- تعريف DTOs/types مشتركة بدلاً من `any` والتحويلات المتعددة.
- إظهار error/empty/loading states واضحة، لا fallback مالي صامت.
- إضافة اختبارات contract لكل عملية CRUD.

---

### C-03 — وجود أرقام مالية افتراضية تظهر للمستخدم
**الخطورة: حرجة**

في `src/routes/dashboard.tsx` توجد بدائل مالية مباشرة:

- الرصيد يرجع إلى `245000` إذا لم توجد محفظة.
- النمو يرجع إلى `18.5` إذا لم يوجد `growth_percent`.
- تواريخ افتراضية `2026-07-23`.

كما توجد بيانات عرض indicative في `src/components/dashboard/InvestmentsTab.tsx` و`PerformanceTab.tsx`، وبيانات سوق ثابتة في `src/components/markets/MarketsPage.tsx`.

**الأثر:** قد يرى عميل جديد رصيداً أو عائداً أو أداءً لا يخصه. هذا غير مقبول في منتج مالي حتى لو كان المقصود visual fallback.

**الإصلاح:** عند غياب البيانات اعرض `—`/حالة عدم توفر البيانات، ولا تحسب أو تعرض أي قيمة مالية افتراضية. افصل demo mode عن production ببوابة build صريحة ممنوعة في production.

---

### C-04 — الإعدادات العامة تعرض كل `SiteSetting` بلا allowlist
**الخطورة: عالية**

`backend/src/routes/settings.routes.ts:9-18` و`:21-29` يتيحان `GET /api/settings` و`GET /api/settings/:key` دون مصادقة، ويعيدان قيمة أي مفتاح موجود في جدول الإعدادات.

**الأثر:** إذا أضيف مستقبلاً مفتاح داخلي أو إعداد تشغيلي أو بيانات لا يراد كشفها، يصبح مكشوفاً للعامة. كما أن endpoint القراءة لا يملك تصنيفاً public/private.

**الإصلاح:**
- allowlist صريحة لمفاتيح الموقع العامة.
- فصل `PublicSiteSetting` عن settings الإدارة.
- منع القراءة العامة لأي key غير معروف وإضافة schema لكل قيمة.
- اختبار عدم تسريب إعدادات داخلية.

---

### C-05 — عدة endpoints إدارية تفتقر إلى تحقق ملكية/مدخلات كامل
**الخطورة: عالية**

أمثلة:

- `backend/src/routes/portfolios.routes.ts:172+`: إضافة asset لا تستخدم `assetSchema` المعرّف، وتحوّل القيم بـ `Number()` بلا حدود أو تحقق NaN/قيم سالبة.
- `backend/src/routes/portfolios.routes.ts:95+`: إنشاء portfolio لا يتحقق صراحة من وجود المستخدم أو كونه client قبل الإنشاء.
- `backend/src/routes/meetings.routes.ts:33+`: إنشاء موعد يثق بـ `user_id` للموظف دون تحقق من نوع المستخدم أو صلاحية الوصول، ولا يتحقق من صحة التاريخ/المدة/التعارض الزمني.
- `backend/src/routes/messages.routes.ts:96+`: تحديث التذكرة يقبل `status`, `reply`, `assigned_to` بلا Zod schema، ولا يتحقق من أن `assigned_to` مستخدم صالح.
- `backend/src/routes/notifications.routes.ts:40+`: endpoint إنشاء الإشعار يسمح بـ `action_url` بلا سياسة URL أو منع روابط غير مرغوبة.
- `backend/src/routes/settings.routes.ts:34+`: value وkey بلا schema أو allowlist.

**الأثر:** بيانات غير متسقة، تجاوز حالات الأعمال، أخطاء مالية، وإمكانية تخزين قيم ضارة أو غير صالحة.

**الإصلاح:** schema لكل endpoint، حدود رقمية، enums، تحقق UUID، تحقق ownership/role، معاملات DB atomic عند تعديل المحفظة وأصولها، وقيود DB موازية.

---

### H-01 — قفل تسجيل الدخول غير مرتبط بعنوان IP ولا توجد معالجة تنافسية
**الخطورة: عالية**

`backend/src/routes/auth.routes.ts:65-70` يحسب القفل بعدد كل محاولات البريد خلال المدة. يوجد limiter عام، لكن الحساب على البريد فقط، كما أن العد والفحص ليسا عملية atomic وقد تتسابق الطلبات.

**الإصلاح:** rate limit موزع على `(IP, email)`، تخزين Redis أو جدول مع query/transaction مناسبة، رسائل موحدة لمنع user enumeration، ومراقبة محاولات الهجوم.

---

### H-02 — JWT access token مخزن في localStorage
**الخطورة: عالية**

`src/lib/auth.ts:18-52` يخزن access وrefresh token في `localStorage`. هذا يجعلهما قابلين للسرقة عند أي XSS ناجح. علاوة على ذلك، `VITE_SESSION_SECRET` سر عميل قابل للاستخراج من bundle، لذلك لا يصلح كسِر حقيقي لتوقيع جلسة.

**الإيجابي:** الـ Backend يتحقق من issuer/audience/algorithm، والـ refresh token نفسه مخزن hash في DB ويتم تدويره.

**الإصلاح المفضل:** access token قصير في الذاكرة، refresh token في HttpOnly/Secure/SameSite cookie، CSRF protection للطلبات المعتمدة على cookie، وإزالة أي ثقة في توقيع client-side.

---

### H-03 — عدم اتساق صلاحيات الموظفين
**الخطورة: عالية**

`backend/src/routes/sub-admins.routes.ts:9-10` يفرض `super` أو `admin` للوصول إلى إدارة sub-admins، لكنه يتيح في `:24+` إنشاء sub-admin فقط لـ `super` وهذا جيد. بالمقابل، كثير من عمليات القراءة (`portfolios`, `transactions`, `messages`, `meetings`) لا تستخدم `requirePermission` على GET، بل تكتفي بـ authentication. هذا يعني أن sub-admin قد يقرأ بيانات مورد دون امتلاك صلاحية القراءة الخاصة به.

**الإصلاح:** تطبيق مصفوفة الصلاحيات على كل read/write، وليس على الكتابة فقط، والتأكد من أن `platform:read` ليس بديلاً واسعاً غير مقصود.

---

### H-04 — socket يسمح باتصال unauthenticated ويستخدم غرفاً حسب token فقط لكن lifecycle غير مكتمل
**الخطورة: متوسطة إلى عالية**

`backend/src/server.ts:39-58` يسمح بالاتصال دون token ويضع `authenticated=false`. هذا قد يكون مقصوداً للموقع العام، لكن يجب فصل public events عن socket الخاص بالمستخدمين. كما أن اشتراك العميل يتم عبر `socket.emit('subscribe:client_updates')`، والـ server يستنتج userId من handshake، وهو جيد، بينما دالة `subscribeToClientUpdates(clientId)` تتلقى clientId وتجاهله؛ يجب توحيد العقد.

**الإصلاح:** namespace أو channel عام مستقل، منع أي event داخلي على public socket، اختبار أن مستخدماً لا يستقبل update لمستخدم آخر، وإضافة authorization لكل event مستقبلي.

---

### H-05 — عمليات مالية بلا ledger/accounting invariants
**الخطورة: عالية**

المعاملات تسجل amount/status، لكن تحديث status في `transactions.routes.ts:104+` لا يغيّر رصيد المحفظة، ولا يوجد ledger double-entry أو idempotency key أو منع انتقالات الحالة غير المنطقية. الرصيد المعروض في الواجهة يحسب أحياناً من fallback محلي.

**الإصلاح:** تصميم ledger غير قابل للتعديل، reference/idempotency unique، state machine للمعاملة، transaction DB واحدة عند settlement، سجل تدقيق إلزامي، ومراجعة مالية مستقلة قبل تفعيل deposit/withdrawal الحقيقي.

---

## 5. مراجعة لوحة الإدارة كاملة

### نقاط جيدة

- تقسيم واضح إلى Overview, Clients, Client Profile, Portfolios, Transactions, Messages, Notifications, Calendar, Reports, Security, Settings, Team, Sub-admins, CMS.
- وجود صلاحيات ومفاهيم audit في الواجهة والـ backend.
- وجود صفحات CMS منفصلة للـ Hero/Services/Markets/FAQ/Testimonials/About/Privacy/Design.
- وجود تصميم responsive وRTL/LTR ومكونات UI مشتركة.
- وجود realtime invalidation عبر أحداث socket.

### المشاكل الرئيسية

1. **مصدر البيانات غير موحد:** معظم الصفحات تتعامل مع `adminData`، بينما API الجديد في `adminRemote` ليس المصدر الوحيد.
2. **تغييرات محلية optimistic:** `useRemoteCollection` يغير state محلياً ثم ينفذ sync؛ الفشل قد يترك واجهة مختلفة عن DB حتى تتم refresh، وبعض العمليات قد ترسل دفعات متوازية غير atomic.
3. **المعرفات غير متجانسة:** seed IDs مثل `C-901` و`PF-001`، بينما DB تستخدم UUID. التحويلات غير الموحدة تعرض أخطاء أو روابط غير قابلة للتحميل.
4. **CMS public/private غير واضح:** بعض managers تستخدم `api.getContent` العام، وبعضها platform data المحمي، مع fallback محلي.
5. **Security page:** تغيير كلمة المرور مربوط بالـ API، وهذا جيد، لكن local login-lock/session decorations ليست boundary أمنية.
6. **Global Search:** يجب التأكد أن نتائج البحث تأتي من endpoint مفوض ومحدود، لا من تجميع كامل على العميل.
7. **Reports:** بعض التقارير تعتمد على aggregates تقريبية، وهذا يجب أن يوسم بوضوح على أنه estimate لا تقرير مالي رسمي.
8. **Sub-admins:** يلزم اختبار مصفوفة permissions لكل زر ومسار وليس إخفاء الزر فقط.

### توصية الإدارة
إعادة بناء طبقة الإدارة حول `React Query + API DTOs` فقط، مع إزالة `adminData` من runtime، ثم اختبار كل شاشة بمستخدم super/admin/sub/client.

---

## 6. مراجعة لوحة العميل

### الموجود

- Dashboard shell مستقل عن الموقع العام عبر `src/routes/__root.tsx`.
- Profile، المحافظ، الأصول، الأداء، المعاملات، التقارير، الدعم، المستشار، الإعدادات.
- إنشاء طلبات إيداع/سحب، تذاكر، ومواعيد عبر API.
- refresh token ومحاولة تجديد تلقائية في `src/lib/api.ts`.
- تصدير XLS وPDF من الواجهة.

### الملاحظات

1. `src/routes/dashboard.tsx` يحتوي fallback مالي غير مقبول كما ورد في C-03.
2. وضع تسجيل الدخول برقم الحساب يحوله إلى `${accountNumber}@tharwah.local`، ولا يوجد backend يعالج account number حقيقياً؛ المسار الوظيفي غير مكتمل.
3. صفحة نسيان كلمة المرور (`src/routes/forgot-password.tsx`) ترسل نموذج تواصل فقط؛ لا توجد عملية reset token/email حقيقية.
4. العميل يستطيع إنشاء transaction/ticket/meeting، لكن backend يعتمد في بعض الحالات على body غير مضبوط للموظفين.
5. لا يظهر عقد واضح للتعامل مع timezone للمواعيد؛ `meeting_date` تاريخ فقط و`meeting_time` string.
6. تصدير PDF/XLS في المتصفح جيد كتصدير عرض، لكنه ليس statement رسمي موقعاً أو قابلاً للتدقيق.
7. حماية المسار في `dashboard.tsx` و`Akadmin.tsx` client-side؛ الحماية الحقيقية موجودة في API وهذا صحيح، لكن يجب منع عرض بيانات قديمة قبل اكتمال auth check.
8. عند فشل API قد تبقى query errors غير معروضة للمستخدم بوضوح.

---

## 7. مراجعة الموقع العام

### نقاط جيدة

- تغطية جيدة للصفحات الأساسية: Home, About, Services, Service detail, Markets, News, Article, FAQ, Contact, Login, Forgot Password.
- RTL/LTR، responsive layout، SEO assets أساسية، cookie banner، back-to-top، WhatsApp CTA.
- Error boundary عام.
- لا يظهر استخدام `dangerouslySetInnerHTML` في الفحص الساكن.

### المخاطر

1. بيانات الأسواق في `MarketsPage.tsx` ثابتة؛ يجب عرض timestamp ومصدر data أو وسمها indicative وتأخيرها.
2. Testimonials ومحتوى بعض صفحات الموقع لها fallback محلي؛ يلزم منع عرض محتوى تجريبي في الإنتاج.
3. API client يعرف `getHomeData()` لمسار `/api/home` غير موجود في Backend؛ حالياً قد لا يستخدم، لكنه يدل على contract drift.
4. `src/lib/env.ts` يضع fallback production إلى `api.yourdomain.com` بدلاً من فشل startup/عرض build error؛ هذا قد يبني تطبيقاً يشير إلى نطاق placeholder.
5. CSP يتم حقنه ديناميكياً في `AdminLogin.tsx` باستخدام `unsafe-inline`؛ يجب وضع CSP عبر headers/hosting وتقليل unsafe directives.
6. `SiteSettingsContext` لا يحمل settings من API ولا ي persist theme؛ الوضع الحالي تجميلي وليس CMS-driven بالكامل.
7. المحتوى المالي والتسويقي يحتاج تدقيق قانوني/امتثال مستقل قبل النشر، وهو خارج تدقيق الشيفرة الحالي.

---

## 8. مراجعة Backend/API

### نقاط جيدة

- Helmet، تعطيل `x-powered-by`، CORS، rate limit، JSON size limit.
- JWT مضبوط بـ issuer/audience وHS256 صراحة.
- bcrypt مع cost 12.
- refresh sessions hashed ومُلغاة عند refresh/password change.
- Zod موجود في auth/transactions/platform-data وعدة مسارات.
- audit logs وlogin attempts وgraceful shutdown موجودة.
- filter ownership للعميل في المحافظ/المعاملات/التذاكر/المواعيد موجود في GET وبعض endpoints.

### فجوات

- لا توجد طبقة service/domain تفصل route handlers عن قواعد الأعمال.
- تكرار `try/catch` و`any` كبير، ما يزيد احتمال اختلاف السلوك.
- لا توجد tests للـ API أو authorization matrix أو DB integration.
- لا توجد pagination حقيقية؛ توجد `take: 200/500` فقط، ما لا يصلح للنمو.
- لا توجد correlation/request IDs أو structured logger موحد؛ `morgan` و`console` مختلطان.
- بعض responses تعيد records كاملة أكثر من اللازم، مثل include واسع في transaction detail.
- لا توجد سياسة واضحة للـ retention/cleanup لـ login_attempts وaudit_logs وrefresh_sessions.
- الاعتماد على `req.ip` يحتاج مراجعة `trust proxy` حسب بنية nginx/VPS حتى لا تسجل IP مزوراً.
- لا توجد CSRF strategy واضحة لأن التوكنات في localStorage حالياً؛ إذا تحولت إلى cookies يجب إضافتها.

---

## 9. مراجعة قاعدة البيانات

### نقاط جيدة

- UUIDs، timestamps، علاقات واضحة، `onDelete` مقصود، وفهارس أساسية.
- فصل `NotificationReceipt` عن notification العامة فكرة صحيحة.
- وجود `AuditLog`, `LoginAttempt`, `RefreshSession` مناسب للتدقيق.
- migration تحتوي على `CHECK amount > 0`.

### ما يحتاج تحسيناً

1. معظم الحقول النصية مثل status/type/role/risk_profile ليست enums أو CHECK constraints.
2. لا يوجد unique/idempotency domain key لطلبات الإيداع والسحب غير `reference_code` الاختياري.
3. لا يوجد ledger أو journal entries.
4. `updated_at @updatedAt` في Prisma لا يعني بالضرورة حماية من تحديثات غير صحيحة أو audit كامل.
5. `PlatformData` JSONB يخزن محتوى متنوعاً بلا schema version أو size/shape enforcement.
6. بيانات contact/messages مخزنة داخل JSON array واحدة؛ هذا يسبب race conditions، نمو صف كبير، وصعوبة الفهرسة والتقارير.
7. لا توجد migration evolution واضحة بعد baseline في الشجرة الحالية.
8. لا توجد سياسة backup/restore قابلة للاختبار ضمن الشيفرة التنفيذية المفحوصة.

---

## 10. جودة الشيفرة والاختبارات

### Frontend lint
النتيجة: 7 تحذيرات hooks، أهمها:

- `src/components/admin/AdminLayout.tsx`: dependencies غير مستقرة/ناقصة.
- `src/components/admin/pages/SubAdmins.tsx` وCMS managers: setters ناقصة من dependencies.
- `src/routes/dashboard.tsx`: `t` ناقصة من dependency لـ `useMemo`.

يجب إصلاحها قبل تفعيل lint كـ required check.

### الاختبارات
يوجد ملف اختبار واحد فقط: `src/lib/security.test.ts`، بأربعة اختبارات ناجحة. لا يوجد اختبار فعلي لـ:

- login/refresh/logout.
- صلاحيات super/admin/sub/client.
- ownership بين العملاء.
- CRUD المحافظ/الأصول/المعاملات.
- contact وrate limit.
- Socket room isolation.
- migrations/seed.
- صفحات الإدارة أو لوحة العميل.

**الحد الأدنى قبل الإنتاج:** تغطية unit + API integration + authorization matrix + smoke E2E للرحلات الأساسية.

### الاعتماديات
تم العثور على **5 ثغرات عالية** في audit الاعتماديات الإنتاجية للـ Backend. يجب فحص `npm audit` تفصيلياً وتحديث الحزم/الـ lockfile، مع اختبار regression وعدم استخدام `--force` بلا مراجعة.

---

## 11. مشاكل تشغيل وتسليم

1. `backend/.env` موجود في workspace لكنه ignored؛ يجب التأكد من عدم دخوله artifacts أو logs ومن تدوير أي قيم حقيقية ظهرت فيه.
2. توجد placeholders تشغيلية مثل `yourdomain.com` و`your-domain.com` في defaults وnginx/config. أي production build دون environment سيشير إلى وجهة خاطئة.
3. build backend يعتمد على Prisma generate واتصال تنزيل خارجي؛ CI يحتاج استراتيجية reproducible.
4. لا توجد health/readiness/liveness منفصلة؛ `/health` يفحص DB وهذا جيد للـ readiness لكنه قد لا يناسب liveness.
5. لا يوجد test على nginx/socket proxy أو CORS الفعلي.
6. لا توجد مراقبة أخطاء حقيقية مفعلة؛ `VITE_SENTRY_DSN` اختياري ولا يظهر integration مكتمل.

---

## 12. خطة الإصلاح ذات الأولوية

### P0 — قبل أي نشر

1. إصلاح Backend build وPrisma generation.
2. إزالة كل fallback المالي والأرقام التجريبية من production.
3. توحيد لوحة الإدارة على API حقيقي وإيقاف `adminData` كـ runtime source.
4. تطبيق ownership وpermission على كل read/write endpoint.
5. إضافة schemas كاملة للـ assets/meetings/messages/settings.
6. فصل public settings عن private settings.
7. منع demo seed/password من أي production path.
8. تثبيت الاعتماديات ومعالجة الثغرات الخمس العالية.

### P1 — قبل onboarding مستخدمين حقيقيين

1. نقل refresh إلى HttpOnly cookie أو تقليل أثر localStorage جذرياً.
2. بناء ledger مالي وidempotent transaction state machine.
3. تنفيذ forgot-password حقيقي بمفاتيح أحادية الاستخدام وانتهاء صلاحية.
4. إضافة API integration tests وauthorization tests.
5. إزالة JSON array messages واستبدالها بجدول/كيان تذاكر موحد.
6. pagination/filter/sort server-side.
7. structured logging، request IDs، audit لجميع العمليات المالية والإدارية.

### P2 — تحسين الجودة

1. إصلاح تحذيرات lint والـ `any`.
2. توحيد types/DTOs بين frontend/backend.
3. تحسين error boundaries وempty states.
4. إضافة performance budget وتقسيم bundle؛ bundle الحالي كبير نسبياً، وفيه chunks gzip كبيرة خصوصاً export/charts.
5. اختبار RTL/LTR وresponsive وaccessibility باستخدام Playwright.
6. إضافة contract/versioning للـ PlatformData وCMS.

---

## 13. معايير القبول المقترحة قبل اعتماد الإصدار

لا يعتبر الإصدار جاهزاً إلا بعد تحقق جميع البنود التالية:

- `npm ci && npm run build` ينجح للواجهة والـ Backend من checkout نظيف.
- `prisma generate` و`prisma migrate deploy` يعملان في CI دون تدخل يدوي.
- لا يظهر أي رصيد/نمو/معاملة تجريبية في production.
- كل صفحة إدارة تقرأ وتكتب من API، مع test يثبت ذلك.
- مستخدم client لا يستطيع قراءة/تعديل مورد عميل آخر.
- sub-admin لا يقرأ أو يكتب قسماً بلا permission.
- refresh token rotation وlogout وpassword change مختبرة.
- كل endpoint يقبل schema محدداً ويرفض payloads غير الصالحة.
- `npm audit` لا يحتوي high/critical غير مقبول رسمياً.
- تغطية اختبارات API الأساسية، مع smoke test للموقع واللوحتين.
- فحص production build بحثاً عن placeholders وdemo credentials.
- اختبار backup/restore وقياس latency وrate limiting تحت حمل واقعي.

---

## 14. القرار النهائي لفريق المراجعة

**القرار: يحتاج إعادة ضبط هندسي قبل الإطلاق — ليس رفضاً للتصميم أو الفكرة، بل رفض لحالة التشغيل الحالية كمنصة مالية إنتاجية.**

الواجهة واسعة ومقنعة بصرياً، والنواة الخلفية تحتوي على أساس جيد للمصادقة والنموذج، لكن النظام حالياً يجمع بين prototype/local seeded data وbackend production-oriented. أكبر خطر هو أن يبدو المنتج مكتملاً بينما بعض البيانات والعمليات ليست authoritative أو ليست محمية بنفس مستوى الاتساق.

**ترتيب التنفيذ الموصى به:**

1. اجعل البناء ينجح.
2. اجعل الـ API المصدر الوحيد للبيانات.
3. أزل كل البيانات الافتراضية المالية.
4. أغلق الصلاحيات والتحقق والـ settings exposure.
5. ابنِ ledger واختبارات تكامل.
6. بعد ذلك فقط نفذ hardening والأداء واطلاقاً تدريجياً.
