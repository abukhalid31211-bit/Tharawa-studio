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
      content_data: {
        services: [
          { id: 'S-1', icon: '📊', title: 'إدارة المحافظ الاستثمارية', titleEn: 'Portfolio Management', desc: 'إدارة احترافية لمحفظتك باستراتيجيات مخصصة.', descEn: 'Professional management of your portfolio with tailored strategies.', active: true },
          { id: 'S-2', icon: '🕌', title: 'الاستثمار المتوافق مع الشريعة', titleEn: 'Sharia-Compliant Investing', desc: 'منتجات استثمارية مؤكدة التوافق مع أحكام الشريعة.', descEn: 'Investment products certified Sharia-compliant.', active: true },
          { id: 'S-3', icon: '🌍', title: 'الوصول للأسواق العالمية', titleEn: 'Global Market Access', desc: 'تداول في أكثر من 40 سوقاً عالمياً.', descEn: 'Trade over 40 global markets.', active: true },
          { id: 'S-4', icon: '🤖', title: 'التحليلات الذكية', titleEn: 'Smart Analytics', desc: 'تقارير ورؤى مدعومة بالذكاء الاصطناعي.', descEn: 'AI-powered reports and insights.', active: true },
          { id: 'S-5', icon: '👨‍💼', title: 'مستشار مالي شخصي', titleEn: 'Personal Financial Advisor', desc: 'مستشار معتمد يرافقك في كل خطوة.', descEn: 'A certified advisor accompanies you at every step.', active: true },
        ],
      },
    },
    {
      section_key: 'markets',
      content_data: {
        markets: [
          { id: 'M-1', name: 'بيتكوين', nameEn: 'Bitcoin', symbol: 'BTC/USD', price: '$67,240', change: 2.4, category: 'عملات رقمية', categoryEn: 'Crypto', visible: true },
          { id: 'M-2', name: 'إيثيريوم', nameEn: 'Ethereum', symbol: 'ETH/USD', price: '$3,180', change: 1.8, category: 'عملات رقمية', categoryEn: 'Crypto', visible: true },
          { id: 'M-3', name: 'أرامكو السعودية', nameEn: 'Saudi Aramco', symbol: '2222.SR', price: '35.20 ر.س', change: -0.3, category: 'أسهم', categoryEn: 'Equities', visible: true },
          { id: 'M-4', name: 'الذهب', nameEn: 'Gold', symbol: 'XAU/USD', price: '$2,340', change: 0.9, category: 'سلع', categoryEn: 'Commodities', visible: true },
          { id: 'M-5', name: 'برنت', nameEn: 'Brent Crude', symbol: 'BZ', price: '$83.10', change: -0.4, category: 'طاقة', categoryEn: 'Energy', visible: true },
        ],
      },
    },
  ];

  for (const section of contentSections) {
    await prisma.contentSection.upsert({
      where: { section_key: section.section_key },
      update: {},
      create: {
        section_key: section.section_key,
        title_ar: section.title_ar,
        title_en: section.title_en,
        content_data: section.content_data as any,
        is_active: true,
        order_index: 0,
        updated_by: superUser.id,
      },
    });
  }

  // Site settings
  await prisma.siteSetting.upsert({
    where: { key: 'platform' },
    update: {},
    create: {
      key: 'platform',
      value: {
        siteName: 'ثروة كابيتال',
        siteNameEn: 'Tharwah Capital',
        supportPhone: '+966 9200 12345',
        supportEmail: 'support@tharwah.com',
        defaultCurrency: 'SAR',
        defaultLanguage: 'ar',
        maintenanceMode: false,
        registrationOpen: true,
        twoFactorRequired: false,
        sessionTimeout: 8,
        weeklyDigest: false,
        instantAlerts: false,
      },
      description: 'Platform-wide settings',
      updated_by: superUser.id,
    },
  });

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
