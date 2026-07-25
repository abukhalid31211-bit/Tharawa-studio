import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 12;
  const seedDemoData = process.env.SEED_DEMO_DATA === 'true' && process.env.NODE_ENV !== 'production';

  // Super admin user

  const superUser = await prisma.user.upsert({
    where: { email: process.env.SUPER_ADMIN_EMAIL || 'admin@tharwahcapital.com' },
    update: {},
    create: {
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@tharwahcapital.com',
      name: 'مشرف النظام',
      role: 'super',
      tier: 'VIP+',
      status: 'active',
      phone: '+966500000000',
      password_hash: process.env.SUPER_ADMIN_PASSWORD_HASH || null,
    },
  });

  await prisma.subAdmin.upsert({
    where: { user_id: superUser.id },
    update: {},
    create: {
      user_id: superUser.id,
      name: superUser.name,
      email: superUser.email,
      permissions: ['*'],
      status: 'active',
    },
  });

  if (seedDemoData) {
    // Demo client
    const demoPassword = await bcrypt.hash('ClientDemo2026!', saltRounds);
    const demoClient = await prisma.user.upsert({
      where: { email: 'ahmed@example.com' },
      update: {},
      create: {
        email: 'ahmed@example.com',
        name: 'أحمد الغامدي',
        role: 'client',
        tier: 'Gold',
        status: 'active',
        phone: '+966501234567',
        kyc_status: 'verified',
        password_hash: demoPassword,
      },
    });

    // Demo portfolio
    const portfolio = await prisma.portfolio.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        user_id: demoClient.id,
        name: 'المحفظة الرئيسية',
        name_en: 'Main Portfolio',
        total_valuation: 245000,
        risk_profile: 'balanced',
        currency: 'SAR',
        growth_percent: 18.5,
        portfolio_data: {
          strategy: 'توزيع متوازن بين الأسهم والصكوك',
          strategyEn: 'Balanced split between equities and sukuk',
        },
      },
    });

    // Demo assets
    await prisma.asset.upsert({
      where: { id: '00000000-0000-0000-0000-000000000101' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000101',
        portfolio_id: portfolio.id,
        symbol: '2222.SR',
        name: 'أرامكو السعودية',
        name_en: 'Saudi Aramco',
        asset_class: 'equity',
        weight_percent: 30,
        quantity: 2085,
        avg_price: 35.2,
        valuation: 73500,
        annual_yield: 4.2,
        status: 'active',
      },
    });

    await prisma.asset.upsert({
      where: { id: '00000000-0000-0000-0000-000000000102' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000102',
        portfolio_id: portfolio.id,
        symbol: 'SPUS',
        name: 'صندوق SP الأمريكي المتوافق',
        name_en: 'SPUS Sharia ETF',
        asset_class: 'fund',
        weight_percent: 25,
        quantity: 1104,
        avg_price: 55.45,
        valuation: 61250,
        annual_yield: 2.1,
        status: 'active',
      },
    });

    await prisma.asset.upsert({
      where: { id: '00000000-0000-0000-0000-000000000103' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000103',
        portfolio_id: portfolio.id,
        symbol: 'SUKUK-KSA',
        name: 'صكوك حكومية سعودية',
        name_en: 'KSA Sovereign Sukuk',
        asset_class: 'sukuk',
        weight_percent: 25,
        quantity: 612.5,
        avg_price: 100,
        valuation: 61250,
        annual_yield: 5.8,
        status: 'active',
      },
    });

    await prisma.asset.upsert({
      where: { id: '00000000-0000-0000-0000-000000000104' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000104',
        portfolio_id: portfolio.id,
        symbol: 'XAU',
        name: 'الذهب',
        name_en: 'Gold',
        asset_class: 'commodity',
        weight_percent: 20,
        quantity: 25,
        avg_price: 1960,
        valuation: 49000,
        annual_yield: 0.9,
        status: 'active',
      },
    });

    // Demo transactions
    await prisma.transaction.upsert({
      where: { id: '00000000-0000-0000-0000-000000000201' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000201',
        user_id: demoClient.id,
        portfolio_id: portfolio.id,
        type: 'deposit',
        amount: 100000,
        currency: 'SAR',
        method: 'Saudi National Bank (SNB)',
        status: 'completed',
        reference_code: 'DEP-2026-001',
        notes: 'إيداع رأس مال إضافي',
      },
    });

    await prisma.transaction.upsert({
      where: { id: '00000000-0000-0000-0000-000000000202' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000202',
        user_id: demoClient.id,
        portfolio_id: portfolio.id,
        type: 'deposit',
        amount: 15000,
        currency: 'SAR',
        method: 'Saudi National Bank (SNB)',
        status: 'completed',
        reference_code: 'DEP-2026-002',
        notes: 'إيداع شهري مجدول',
      },
    });

    await prisma.transaction.upsert({
      where: { id: '00000000-0000-0000-0000-000000000203' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000203',
        user_id: demoClient.id,
        portfolio_id: portfolio.id,
        type: 'dividend',
        amount: 2450,
        currency: 'SAR',
        method: 'Portfolio Reinvestment',
        status: 'completed',
        reference_code: 'DIV-2026-001',
        notes: 'أرباح موزعة معاد استثمارها',
      },
    });

  }

  // Demo content sections
  const contentSections = [
    {
      section_key: 'hero',
      title_ar: 'نمِّ ثروتك بأمان وذكاء متوافق مع الشريعة',
      title_en: 'Grow Your Wealth Securely with Sharia-Compliant Intelligence',
      content_data: {
        badge: 'مرخصة ومنظمة — هيئة السوق المالية',
        badgeEn: 'Licensed & Regulated — CMA',
        title: 'نمِّ ثروتك بأمان وذكاء متوافق مع الشريعة',
        titleEn: 'Grow Your Wealth Securely with Sharia-Compliant Intelligence',
        subtitle: 'منصة استثمارية سعودية متكاملة تجمع بين خبرة المستشارين الماليين وقوة التحليلات الذكية.',
        subtitleEn: 'A fully integrated Saudi investment platform combining expert advisors with intelligent analytics.',
        ctaPrimary: 'ابدأ الاستثمار الآن',
        ctaPrimaryEn: 'Start Investing Now',
        ctaSecondary: 'تعرف على خدماتنا',
        ctaSecondaryEn: 'Explore Our Services',
        stats: [
          { value: '+2.1B', label: 'ريال أصول مدارة', labelEn: 'SAR Assets Managed' },
          { value: '+5,240', label: 'عميل نشط', labelEn: 'Active Clients' },
          { value: '98%', label: 'رضا العملاء', labelEn: 'Client Satisfaction' },
          { value: '+18%', label: 'متوسط العائد السنوي', labelEn: 'Avg. Annual Return' },
        ],
      },
    },
    {
      section_key: 'services',
      title_ar: 'خدماتنا الاستثمارية',
      title_en: 'Our Investment Services',
      content_data: {
        title: 'خدماتنا الاستثمارية',
        titleEn: 'OUR INVESTMENT SERVICES',
        subtitle: 'نوّع محفظتك وحقق أهدافك المالية',
        subtitleEn: 'Diversify Your Portfolio & Achieve Financial Goals',
        services: [
          { id: 'gulf-stocks', icon: 'TrendingUp', title: 'الأسهم الخليجية والعربية', titleEn: 'Gulf & Arab Equities', desc: 'استثمر في أسواق السعودية والإمارات والكويت. نوفر لك تحليلات دقيقة وأدوات متقدمة.', descEn: 'Invest in Saudi, UAE, and Kuwait markets with accurate analysis and advanced tools.', active: true, featuresAr: ['تحديث لحظي للأسعار', 'تحليلات للسوق المالي', 'تقارير أرباح الشركات'], featuresEn: ['Real-time prices', 'Financial market analysis', 'Company earnings reports'] },
          { id: 'global-stocks', icon: 'Globe', title: 'الأسهم العالمية', titleEn: 'Global Equities', desc: 'وصول مباشر إلى وول ستريت، ناسداك، والأسواق الأوروبية والآسيوية.', descEn: 'Direct access to Wall Street, Nasdaq, European and Asian markets.', active: true, featuresAr: ['أسهم قطاع التكنولوجيا', 'تداول قبل وبعد الإغلاق', 'تغطية عالمية'], featuresEn: ['Tech sector stocks', 'Pre/Post market trading', 'Global coverage'] },
          { id: 'crypto', icon: 'Bitcoin', title: 'العملات الرقمية', titleEn: 'Cryptocurrencies', desc: 'تداول البيتكوين والإيثيريوم والأصول الرقمية بأمان تام.', descEn: 'Trade Bitcoin, Ethereum, and digital assets safely.', active: true, featuresAr: ['محافظ باردة آمنة', 'تداول 24/7', 'رسوم منخفضة'], featuresEn: ['Secure cold wallets', '24/7 Trading', 'Low fees'] },
          { id: 'funds', icon: 'Building2', title: 'صناديق الاستثمار', titleEn: 'Investment Funds', desc: 'اختر من بين باقة متنوعة من صناديق الاستثمار المشتركة و ETFs.', descEn: 'Choose from a variety of mutual funds and ETFs.', active: true, featuresAr: ['صناديق إسلامية', 'عائد توزيعات ثابت', 'إدارة احترافية'], featuresEn: ['Islamic funds', 'Fixed dividend yield', 'Professional management'] },
          { id: 'metals', icon: 'Gem', title: 'المعادن والذهب', titleEn: 'Metals & Gold', desc: 'الملاذ الآمن لأموالك. استثمر في الذهب والفضة والبلاتين.', descEn: 'The safe haven. Invest in Gold, Silver, and Platinum.', active: true, featuresAr: ['حماية من التضخم', 'رافعة مالية مرنة', 'أسعار لحظية'], featuresEn: ['Inflation hedge', 'Flexible leverage', 'Real-time pricing'] },
          { id: 'energy', icon: 'Fuel', title: 'النفط والطاقة', titleEn: 'Oil & Energy', desc: 'شارك في قطاع الطاقة الحيوي عبر النفط الخام والغاز الطبيعي.', descEn: 'Participate in the energy sector via crude oil and natural gas.', active: true, featuresAr: ['عقود آجلة', 'طاقة متجددة', 'تحليلات جيوسياسية'], featuresEn: ['Futures contracts', 'Renewable energy', 'Geopolitical analysis'] },
        ],
      },
    },
    {
      section_key: 'markets',
      title_ar: 'الأسواق',
      title_en: 'Markets',
      content_data: {
        markets: [
          { id: 'M-1', name: 'بيتكوين', nameEn: 'Bitcoin', symbol: 'BTC/USD', price: '$67,240', change: 2.4, category: 'crypto', categoryEn: 'Crypto', market: 'السوق الرقمي', marketEn: 'Digital Market', currency: '$', volume: '24.1B', marketCap: '1.32T', badgeColor: 'orange', chart7d: [64200, 64800, 65120, 66000, 66350, 66950, 67240], visible: true },
          { id: 'M-2', name: 'إيثيريوم', nameEn: 'Ethereum', symbol: 'ETH/USD', price: '$3,180', change: 1.8, category: 'crypto', categoryEn: 'Crypto', market: 'السوق الرقمي', marketEn: 'Digital Market', currency: '$', volume: '12.8B', marketCap: '382B', badgeColor: 'purple', chart7d: [3010, 3055, 3090, 3115, 3140, 3165, 3180], visible: true },
          { id: 'M-3', name: 'أرامكو السعودية', nameEn: 'Saudi Aramco', symbol: '2222.SR', price: '35.20 ر.س', change: -0.3, category: 'stocks', categoryEn: 'Equities', market: 'تداول السعودية', marketEn: 'Saudi Tadawul', currency: 'ر.س', volume: '6.4M', marketCap: '7.2T', badgeColor: 'gold', chart7d: [35.8, 35.6, 35.5, 35.4, 35.3, 35.25, 35.2], visible: true },
          { id: 'M-4', name: 'الذهب', nameEn: 'Gold', symbol: 'XAU/USD', price: '$2,340', change: 0.9, category: 'metals', categoryEn: 'Metals', market: 'المعادن', marketEn: 'Metals', currency: '$', volume: '178K', marketCap: '—', badgeColor: 'green', chart7d: [2290, 2300, 2310, 2325, 2330, 2336, 2340], visible: true },
          { id: 'M-5', name: 'برنت', nameEn: 'Brent Crude', symbol: 'BZ', price: '$83.10', change: -0.4, category: 'energy', categoryEn: 'Energy', market: 'الطاقة', marketEn: 'Energy', currency: '$', volume: '1.9M', marketCap: '—', badgeColor: 'blue', chart7d: [84.5, 84.1, 83.9, 83.6, 83.4, 83.2, 83.1], visible: true },
        ],
      },
    },
    {
      section_key: 'testimonials',
      title_ar: 'آراء العملاء',
      title_en: 'Testimonials',
      content_data: [
        { id: 'T-1', name: 'م. سلطان الحربي', nameEn: 'Eng. Sultan Al-Harbi', role: 'مستثمر منذ 2023', roleEn: 'Investor since 2023', text: 'أفضل قرار اتخذته مالياً. فريق محترف وشفافية كاملة في التقارير، والعوائد فاقت توقعاتي.', textEn: 'The best financial decision I have made. Professional team, full reporting transparency, and returns exceeded my expectations.', rating: 5, status: 'approved', date: '2026-06-20' },
        { id: 'T-2', name: 'أمل الدوسري', nameEn: 'Amal Al-Dosari', role: 'صاحبة أعمال', roleEn: 'Business Owner', text: 'المستشار الشخصي يرد على استفساراتي بسرعة ويشرح كل خطوة. أشعر أن أموالي في أيدٍ أمينة.', textEn: 'My personal advisor answers quickly and explains every step. I feel my money is in safe hands.', rating: 5, status: 'approved', date: '2026-07-02' },
      ],
    },
    {
      section_key: 'about',
      title_ar: 'من نحن',
      title_en: 'About Us',
      content_data: {
        missionTitle: 'رسالتنا', missionTitleEn: 'Our Mission',
        mission: 'تمكين كل مستثمر في المنطقة من بناء ثروة مستدامة عبر حلول استثمارية شفافة ومتوافقة مع الشريعة ومدعومة بأحدث التقنيات.',
        missionEn: 'Empowering every investor in the region to build sustainable wealth through transparent, Sharia-compliant, technology-driven investment solutions.',
        visionTitle: 'رؤيتنا', visionTitleEn: 'Our Vision',
        vision: 'أن نكون المنصة الاستثمارية الأولى في الشرق الأوسط بحلول 2030.',
        visionEn: 'To be the leading investment platform in the Middle East by 2030.',
        story: 'تأسست ثروة كابيتال في الرياض لتقديم تجربة استثمارية عربية مؤسسية تستند إلى الشفافية والامتثال والحوكمة الرشيدة.',
        storyEn: 'Tharwah Capital was established in Riyadh to provide an institutional Arabic investment experience grounded in transparency, compliance, and sound governance.',
        values: [
          { id: 'V-1', icon: '🛡️', title: 'الثقة والأمان', titleEn: 'Trust & Security', desc: 'أموال عملائنا محفوظة بحسابات منفصلة وبأعلى معايير الحماية.', descEn: 'Client funds are held in segregated accounts with top-tier protection.' },
          { id: 'V-2', icon: '🔍', title: 'الشفافية', titleEn: 'Transparency', desc: 'تقارير واضحة بلا رسوم خفية ولا مفاجآت.', descEn: 'Clear reporting with no hidden fees or surprises.' },
          { id: 'V-3', icon: '🕌', title: 'الالتزام الشرعي', titleEn: 'Sharia Commitment', desc: 'توافق شرعي موثق لكل منتجاتنا الاستثمارية.', descEn: 'Certified Sharia compliance across all investment products.' },
          { id: 'V-4', icon: '🚀', title: 'الابتكار', titleEn: 'Innovation', desc: 'نوظف الذكاء الاصطناعي لخدمة قراراتك الاستثمارية.', descEn: 'We harness AI to empower your investment decisions.' },
        ],
        team: [
          { avatar: 'خ', nameAr: 'م. خالد الحربي', nameEn: 'Khalid Al-Harbi', roleAr: 'الرئيس التنفيذي', roleEn: 'CEO & Co-Founder', descAr: '25 عاماً من الخبرة في الأسواق المالية الخليجية والعالمية. حاصل على CFA وماجستير إدارة الأعمال.', descEn: '25 years experience in Gulf and global markets. CFA holder and MBA.' },
          { avatar: 'س', nameAr: 'د. سارة المطيري', nameEn: 'Dr. Sara Al-Mutairi', roleAr: 'مديرة الاستثمار والمحافظ', roleEn: 'Director of Investment', descAr: 'دكتوراه في الاقتصاد المالي، متخصصة في الأسواق الناشئة وتحليل المخاطر.', descEn: 'PhD in Financial Economics specializing in emerging markets and risk analysis.' },
          { avatar: 'ف', nameAr: 'م. فيصل العمري', nameEn: 'Faisal Al-Omari', roleAr: 'رئيس قسم البحث والتحليل', roleEn: 'Head of Research', descAr: 'محلل مالي معتمد بخبرة واسعة في أسواق وول ستريت وبورصات الخليج.', descEn: 'Certified financial analyst with broad experience across Wall Street and Gulf exchanges.' },
        ],
      },
    },
    {
      section_key: 'faq',
      title_ar: 'الأسئلة الشائعة',
      title_en: 'FAQ',
      content_data: [
        { id: 'faq-1', question: 'كيف أبدأ الاستثمار مع ثروة كابيتال؟', questionEn: 'How do I start investing with Tharwah Capital?', answer: 'البداية بسيطة: احجز استشارة مجانية، أكمل التحقق من الهوية، ثم يحدد مستشارك الاستراتيجية المناسبة لك.', answerEn: 'It starts simply: book a free consultation, complete identity verification, then your advisor selects the right strategy for you.', category: 'البداية والتسجيل', published: true, order: 1 },
        { id: 'faq-2', question: 'ما هو الحد الأدنى للاستثمار؟', questionEn: 'What is the minimum investment?', answer: 'يختلف الحد الأدنى حسب نوع المحفظة، ويبدأ من 10,000 ريال للمحافظ الأساسية.', answerEn: 'The minimum varies by portfolio type and starts from SAR 10,000 for core portfolios.', category: 'المحفظة والاستثمار', published: true, order: 2 },
        { id: 'faq-3', question: 'هل الاستثمارات متوافقة مع الشريعة؟', questionEn: 'Are the investments Sharia-compliant?', answer: 'نعم، المنتجات الاستثمارية التي تحمل علامة التوافق الشرعي تخضع لرقابة شرعية معتمدة.', answerEn: 'Yes. Investment products marked as Sharia-compliant are reviewed by an accredited Sharia board.', category: 'المحفظة والاستثمار', published: true, order: 3 },
      ],
    },
    {
      section_key: 'news',
      title_ar: 'الأخبار والتحليلات',
      title_en: 'News & Analysis',
      content_data: {
        articles: [
          {
            id: '1', emoji: '📊', category: 'analysis', categoryAr: 'تحليلات', categoryEn: 'Analysis',
            title: 'بيتكوين يسجل مستويات قياسية جديدة تتجاوز $70,000 — ماذا يعني ذلك للمستثمر العربي؟',
            titleEn: 'Bitcoin Records New Highs Above $70,000 — What Does It Mean for Arab Investors?',
            excerpt: 'بعد ارتفاع قوي خلال الأشهر الماضية، نحلل أسباب الصعود وما إذا كانت فرصة الدخول لا تزال قائمة للمستثمر العربي.',
            excerptEn: 'After a strong multi-month rally, we analyse the drivers of the move and whether an entry opportunity still exists for Arab investors.',
            author: 'م. فيصل العمري', authorEn: 'Faisal Al-Omari', role: 'محلل مالي أول', roleEn: 'Senior Financial Analyst',
            date: '15 يونيو 2026', dateEn: 'June 15, 2026', readTime: '8 دقائق', readTimeEn: '8 min', views: '12,450', trending: true, featured: true, slug: 'bitcoin-all-time-high-2026',
            bodyAr: ['بعد موجة طلب مؤسسي قوية، عاد البيتكوين إلى الواجهة كأحد أكثر الأصول متابعة لدى المستثمرين في المنطقة.', 'الارتفاع الأخير لا يعني بالضرورة أن نقطة الدخول المثالية انتهت، لكنه يفرض إدارة أكثر انضباطاً للمخاطر وتوزيعاً أدق لرأس المال.', 'في ثروة كابيتال ننظر إلى الأصول الرقمية ضمن محفظة منوّعة لا كمكوّن منفرد معزول عن بقية فئات الأصول.'],
            bodyEn: ['After a wave of strong institutional demand, Bitcoin has returned to the spotlight as one of the region’s most closely watched assets.', 'The latest rally does not necessarily mean that the ideal entry point is gone, but it does require stricter risk management and tighter capital allocation.', 'At Tharwah Capital, we treat digital assets as part of a diversified portfolio rather than an isolated standalone allocation.']
          },
          {
            id: '2', emoji: '📈', category: 'gulf', categoryAr: 'الأسهم الخليجية', categoryEn: 'Gulf Stocks',
            title: 'تحليل أداء أسواق الخليج — أين تكمن الفرص الأقوى هذا الربع؟',
            titleEn: 'Gulf Market Performance Analysis — Where Are the Strongest Opportunities This Quarter?',
            excerpt: 'نظرة تحليلية على القطاعات القيادية في الأسواق الخليجية والأوزان التي تستحق المراقبة في المحافظ الإقليمية.',
            excerptEn: 'An analytical look at the leading sectors in Gulf markets and the weights worth monitoring inside regional portfolios.',
            author: 'د. سارة المطيري', authorEn: 'Dr. Sara Al-Mutairi', role: 'محللة أسواق أولى', roleEn: 'Senior Market Analyst',
            date: '10 يونيو 2026', dateEn: 'June 10, 2026', readTime: '12 دقيقة', readTimeEn: '12 min', views: '8,230', trending: false, featured: false, slug: 'gulf-markets-quarterly-analysis-2026',
            bodyAr: ['تظهر الأسواق الخليجية تماسكاً ملحوظاً مدعوماً بأرباح تشغيلية قوية في قطاعات البنوك والطاقة والاتصالات.', 'المستثمر طويل الأجل لا يبحث فقط عن الارتفاع السعري، بل عن جودة الربحية واستدامة التوزيعات النقدية.', 'ولهذا تظل عملية الانتقاء النوعي للأصول أهم من مجرد التعرض العام للمؤشر.'],
            bodyEn: ['Gulf markets continue to show notable resilience, supported by strong operating earnings in banking, energy, and telecom.', 'Long-term investors should not look only at price momentum, but also at earnings quality and dividend sustainability.', 'That is why selective asset picking remains more important than broad index exposure alone.']
          },
          {
            id: '3', emoji: '💎', category: 'metals', categoryAr: 'المعادن', categoryEn: 'Metals',
            title: 'الذهب والتحوّط من التضخم — هل ما زال يحتفظ بدوره الدفاعي؟',
            titleEn: 'Gold and Inflation Hedging — Does It Still Maintain Its Defensive Role?',
            excerpt: 'قراءة في دور الذهب ضمن المحافظ المتوازنة في بيئة أسعار فائدة متحركة وتوقعات تضخم متغيرة.',
            excerptEn: 'A reading of gold’s role inside balanced portfolios in a changing-rate and shifting-inflation environment.',
            author: 'م. خالد الحربي', authorEn: 'Khalid Al-Harbi', role: 'محلل معادن نفيسة', roleEn: 'Precious Metals Analyst',
            date: '5 يونيو 2026', dateEn: 'June 5, 2026', readTime: '6 دقائق', readTimeEn: '6 min', views: '5,670', trending: false, featured: false, slug: 'gold-inflation-hedge-2026',
            bodyAr: ['رغم تغيّر توقعات التضخم، ما زال الذهب يلعب دوراً دفاعياً مهماً عند بناء المحافظ المتوازنة.', 'تكمن القيمة الحقيقية للذهب في قدرته على تخفيف حدة التقلب حين ترتفع المخاطر الجيوسياسية أو تتراجع الثقة في الأصول عالية المخاطرة.'],
            bodyEn: ['Despite changing inflation expectations, gold still plays a meaningful defensive role inside balanced portfolios.', 'Its real value lies in its ability to dampen volatility when geopolitical risks rise or confidence in higher-risk assets declines.']
          }
        ]
      },
    },
    {
      section_key: 'privacy',
      title_ar: 'سياسة الخصوصية',
      title_en: 'Privacy Policy',
      content_data: {
        lastUpdated: '2026-06-01',
        intro: 'نلتزم في ثروة كابيتال بحماية خصوصيتك وبياناتك وفق نظام حماية البيانات الشخصية السعودي (PDPL).',
        introEn: 'At Tharwah Capital, we are committed to protecting your privacy and data under the Saudi Personal Data Protection Law (PDPL).',
        sections: [
          { id: 'P-1', title: 'البيانات التي نجمعها', titleEn: 'Data We Collect', body: 'نجمع البيانات الأساسية للهوية وبيانات التواصل والبيانات المالية اللازمة لفتح وإدارة حسابك الاستثماري.', bodyEn: 'We collect core identity, contact, and financial data required to open and manage your investment account.', order: 1 },
          { id: 'P-2', title: 'كيفية استخدام البيانات', titleEn: 'How We Use Data', body: 'تُستخدم بياناتك حصرياً لتقديم خدماتنا الاستثمارية والالتزام بالمتطلبات التنظيمية.', bodyEn: 'Your data is used exclusively to deliver our investment services and meet regulatory requirements.', order: 2 },
          { id: 'P-3', title: 'حقوقك', titleEn: 'Your Rights', body: 'يحق لك الوصول إلى بياناتك وتصحيحها وطلب حذفها في أي وقت عبر قنوات الدعم الرسمية.', bodyEn: 'You may access, correct, or request deletion of your data at any time via our official support channels.', order: 3 },
        ],
      },
    },
    {
      section_key: 'design',
      title_ar: 'تصميم الموقع',
      title_en: 'Site Design',
      content_data: {
        primaryColor: '#0EA5E9',
        goldAccent: '#C9A84C',
        darkModeDefault: false,
        showAnnouncementBar: true,
        showLiveTicker: true,
        showWhatsapp: true,
        showCookieBanner: true,
        logoText: 'ثروة كابيتال',
        logoTextEn: 'Tharwah Capital',
        announcement: '🎉 استشارة أولى مجانية لزوار المنصة — احجز موعدك الآن',
        announcementEn: '🎉 Free first consultation for platform visitors — book your appointment now',
      },
    },
  ];

  for (const [index, section] of contentSections.entries()) {
    await prisma.contentSection.upsert({
      where: { section_key: section.section_key },
      update: {},
      create: {
        section_key: section.section_key,
        title_ar: section.title_ar,
        title_en: section.title_en,
        content_data: section.content_data as any,
        is_active: true,
        order_index: index,
        updated_by: superUser.id,
      },
    });
  }

  // Site settings
  const platformSettings = {
    siteName: 'ثروة كابيتال',
    siteNameEn: 'Tharwah Capital',
    supportPhone: '+966 9200 12345',
    supportEmail: 'support@tharwah.com',
    contactAddressAr: 'الرياض، حي الملك عبد الله المالي، برج ثروة',
    contactAddressEn: 'Riyadh, King Abdullah Financial District, Tharwah Tower',
    whatsappNumber: '+966920012345',
    businessHoursAr: 'الأحد إلى الخميس — 9:00 ص حتى 5:00 م',
    businessHoursEn: 'Sunday to Thursday — 9:00 AM to 5:00 PM',
    defaultCurrency: 'SAR',
    defaultLanguage: 'ar',
    maintenanceMode: false,
    registrationOpen: true,
    twoFactorRequired: false,
    sessionTimeout: 8,
    weeklyDigest: false,
    instantAlerts: false,
  };

  await prisma.siteSetting.upsert({
    where: { key: 'platform' },
    update: {},
    create: {
      key: 'platform',
      value: platformSettings,
      description: 'Platform-wide settings',
      updated_by: superUser.id,
    },
  });

  const publicSiteSettings = [
    ['platform_name', platformSettings.siteName],
    ['platform_name_en', platformSettings.siteNameEn],
    ['support_phone', platformSettings.supportPhone],
    ['support_email', platformSettings.supportEmail],
    ['maintenance_mode', platformSettings.maintenanceMode],
    ['contact_address_ar', platformSettings.contactAddressAr],
    ['contact_address_en', platformSettings.contactAddressEn],
    ['whatsapp_number', platformSettings.whatsappNumber],
    ['business_hours_ar', platformSettings.businessHoursAr],
    ['business_hours_en', platformSettings.businessHoursEn],
  ] as const;

  for (const [key, value] of publicSiteSettings) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: {},
      create: {
        key,
        value: value as any,
        description: `Public site setting: ${key}`,
        updated_by: superUser.id,
      },
    });
  }

  console.log('✅ Seed completed');
  console.log('Super Admin:', superUser.email);
  console.log('Demo data:', seedDemoData ? 'created' : 'skipped');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
