-- بيانات أولية لمنصة ثروة كابيتال
-- تاريخ الإنشاء: 2026-07-19

-- مستخدمون تجريبيون
INSERT INTO users (email, name, role, tier, status, portfolio_code) VALUES
('ahmed@example.com', 'أحمد الغامدي', 'client', 'Gold', 'active', 'TH-9842105'),
('sara@example.com', 'سارة المنصوري', 'client', 'Platinum', 'active', 'TH-9842106'),
('khaled@example.com', 'خالد العتيبي', 'client', 'Silver', 'active', 'TH-9842107'),
('fatima@example.com', 'فاطمة الزهراني', 'client', 'VIP', 'active', 'TH-9842108'),
('admin@tharwahcapital.com', 'مشرف النظام', 'super', 'VIP+', 'active', NULL)
ON CONFLICT (email) DO NOTHING;

-- محفظة تجريبية
INSERT INTO portfolios (user_id, name, total_valuation, risk_profile)
SELECT id, 'المحفظة الرئيسية', 245000.00, 'balanced' FROM users WHERE email = 'ahmed@example.com'
ON CONFLICT DO NOTHING;

-- أصول تجريبية
INSERT INTO assets (portfolio_id, name, asset_class, weight_percent, valuation, annual_yield, status)
SELECT (SELECT id FROM portfolios WHERE name = 'المحفظة الرئيسية' LIMIT 1),
  'صندوق الراجحي العقاري الوقفي', 'عقارات', 12.00, 29400.00, 7.20, 'active'
ON CONFLICT DO NOTHING;

INSERT INTO assets (portfolio_id, name, asset_class, weight_percent, valuation, annual_yield, status)
SELECT (SELECT id FROM portfolios WHERE name = 'المحفظة الرئيسية' LIMIT 1),
  'صكوك الحكومة السعودية السيادية', 'صكوك', 20.00, 49000.00, 5.80, 'active'
ON CONFLICT DO NOTHING;

INSERT INTO assets (portfolio_id, name, asset_class, weight_percent, valuation, annual_yield, status)
SELECT (SELECT id FROM portfolios WHERE name = 'المحفظة الرئيسية' LIMIT 1),
  'أسهم مايكروسوفت متوافقة', 'أسهم عالمية', 15.00, 36750.00, 24.10, 'active'
ON CONFLICT DO NOTHING;

-- معاملات تجريبية
INSERT INTO transactions (user_id, type, amount, currency, method, status)
SELECT id, 'deposit', 15000, 'SAR', 'Saudi National Bank (SNB)', 'completed' FROM users WHERE email = 'ahmed@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO transactions (user_id, type, amount, currency, method, status)
SELECT id, 'dividend', 2450, 'SAR', 'Portfolio Reinvestment', 'completed' FROM users WHERE email = 'ahmed@example.com'
ON CONFLICT DO NOTHING;

-- تذاكر دعم تجريبية
INSERT INTO support_tickets (user_id, title, message, status)
SELECT id, 'استفسار بخصوص الأرباح الموزعة', 'تمت إعادة استثمار الأرباح تلقائياً في محفظتك الاستثمارية بناء على تفضيلاتك الحالية.', 'answered'
FROM users WHERE email = 'ahmed@example.com'
ON CONFLICT DO NOTHING;

-- إعدادات الموقع
INSERT INTO site_settings (site_name, theme_mode, language)
VALUES ('ثروة كابيتال', 'light', 'ar')
ON CONFLICT DO NOTHING;
