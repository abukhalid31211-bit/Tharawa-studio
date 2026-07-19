// ─────────────────────────────────────────────────────────────
// 4.5 — Portfolios إدارة المحافظ الاستثمارية
// Built from: 04-Admin-Dashboard/Main-Pages/Portfolios.md
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  FileDown,
  GitCompare,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { jsPDF } from 'jspdf';
import { useLang } from '@/contexts/LanguageContext';
import { ClientAvatar, DataTable, GhostBtn, IconBtn, PrimaryBtn, Td, Tr } from '@/components/admin/ui';
import { useClients, usePortfolios, Portfolio, Client, nextCode } from '@/lib/adminData';
import { cn } from '@/lib/utils';

type ViewMode = 'cards' | 'table';
type PageMode = 'list' | 'form';
type AssetKey = 'sa' | 'gulf' | 'global' | 'crypto' | 'forex' | 'metals' | 'oil';
type FieldSection = 'personal' | 'financial' | 'banking' | 'kyc' | 'internal';
type CloneMode = 'all' | 'investments' | 'personal';

type Option = { value: string; labelAr: string; labelEn?: string };
type FlexState = { value: string; visible: boolean };
type FlexStore = Record<string, FlexState>;
type InvestmentRow = { id: string; [key: string]: string };

type DocumentKey = 'idCopy' | 'addressProof' | 'bankStatement' | 'taxForm' | 'riskForm' | 'contractSigned';

interface PortfolioData {
  personal: FlexStore;
  financial: FlexStore;
  banking: FlexStore;
  kyc: FlexStore;
  internal: FlexStore;
  investments: Record<AssetKey, InvestmentRow[]>;
  investmentVisibility: Record<AssetKey, boolean>;
  documents: Record<DocumentKey, boolean>;
  sectionNotes: Record<string, string>;
  declineAlert?: { threshold: string; channel: string; active: boolean };
}

type ManagedPortfolio = Portfolio & {
  currency?: string;
  created_at?: string;
  portfolio_data?: PortfolioData;
};

interface FieldConfig {
  key: string;
  labelAr: string;
  labelEn: string;
  type?: 'text' | 'email' | 'date' | 'number' | 'textarea' | 'select';
  options?: Option[];
  placeholder?: string;
  mono?: boolean;
}

interface AssetColumn {
  key: string;
  labelAr: string;
  labelEn: string;
  type?: 'select' | 'text';
  options?: Option[];
}

interface AssetConfig {
  key: AssetKey;
  emoji: string;
  labelAr: string;
  labelEn: string;
  columns: AssetColumn[];
}

const nowDate = () => new Date().toISOString().slice(0, 10);
const newRowId = () => `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const toOptions = (values: string[]): Option[] => values.map(value => ({ value, labelAr: value, labelEn: value }));
const numberFrom = (v: string | number | undefined) => Number(String(v || '').replace(/[^0-9.-]/g, '')) || 0;

const ADVISOR_OPTIONS = toOptions(['خالد بن الوليد', 'عبد الرحمن السديس', 'لمى العتيبي', 'أحمد السديري', 'ريم العنزي']);
const NATIONALITY_OPTIONS = toOptions(['سعودي', 'إماراتي', 'كويتي', 'بحريني', 'قطري', 'عماني', 'مصري', 'أردني', 'لبناني', 'أخرى']);
const ID_TYPE_OPTIONS = toOptions(['هوية وطنية', 'جواز سفر', 'إقامة', 'بطاقة عائلية']);
const CITY_OPTIONS = toOptions(['الرياض', 'جدة', 'مكة', 'المدينة', 'الدمام', 'الخبر', 'تبوك', 'أبها', 'حائل', 'جيزان', 'أخرى']);
const COUNTRY_OPTIONS = toOptions(['السعودية', 'الإمارات', 'الكويت', 'البحرين', 'قطر', 'عُمان', 'الأردن', 'مصر', 'لبنان', 'أخرى']);
const RISK_OPTIONS = toOptions(['منخفض', 'منخفض–متوسط', 'متوسط', 'متوسط–مرتفع', 'مرتفع']);
const GOAL_OPTIONS = toOptions(['نمو رأس المال', 'دخل دوري', 'الحفاظ على الثروة', 'التقاعد', 'تعليم الأبناء', 'أخرى']);
const HORIZON_OPTIONS = toOptions(['أقل من سنة', '1–3 سنوات', '3–5 سنوات', '5–10 سنوات', 'أكثر من 10 سنوات']);
const CURRENCY_OPTIONS = toOptions(['USD', 'SAR', 'AED', 'EUR', 'GBP', 'KWD', 'QAR', 'BHD', 'OMR']);
const TOLERANCE_OPTIONS = toOptions(['منخفض', 'متوسط', 'مرتفع', 'مرتفع جداً']);
const PREVIOUS_EXP_OPTIONS = toOptions(['نعم', 'لا', 'محدودة', 'خبير']);
const TAX_OPTIONS = toOptions(['السعودية', 'الإمارات', 'الكويت', 'البحرين', 'قطر', 'عُمان', 'خارج الخليج']);
const FATCA_OPTIONS = toOptions(['لا', 'نعم', 'غير منطبق']);
const BANK_OPTIONS = toOptions(['بنك الراجحي', 'البنك الأهلي التجاري', 'بنك الرياض', 'بنك سامبا', 'البنك السعودي الفرنسي', 'بنك الجزيرة', 'بنك البلاد', 'إمارات NBD', 'بنك دبي الوطني']);
const TRANSFER_OPTIONS = toOptions(['حوالة بنكية', 'SWIFT', 'عبر التطبيق', 'تحويل فوري', 'أخرى']);
const KYC_OPTIONS = toOptions(['مكتمل', 'جزئي', 'معلق', 'مرفوض', 'قيد المراجعة']);
const PRIORITY_OPTIONS = toOptions(['عادي', 'متوسط', 'عالٍ', 'VIP', 'طارئ']);
const DIRECTION_OPTIONS = toOptions(['شراء', 'بيع']);
const METAL_UNIT_OPTIONS = toOptions(['أوقية', 'جرام', 'كيلو']);
const CHANNEL_OPTIONS = toOptions(['البريد', 'SMS', 'الموقع']);

const STOCKS_SA_OPTIONS: Option[] = [
  { value: '2222', labelAr: '2222 - أرامكو السعودية', labelEn: '2222 - Saudi Aramco' },
  { value: '1120', labelAr: '1120 - بنك الراجحي', labelEn: '1120 - Al Rajhi Bank' },
  { value: '2010', labelAr: '2010 - سابك', labelEn: '2010 - SABIC' },
  { value: '1180', labelAr: '1180 - الأهلي التجاري', labelEn: '1180 - Saudi National Bank' },
  { value: '2350', labelAr: '2350 - زين السعودية', labelEn: '2350 - Zain KSA' },
  { value: '8010', labelAr: '8010 - سبكيم', labelEn: '8010 - Sipchem' },
  { value: '4200', labelAr: '4200 - المملكة القابضة', labelEn: '4200 - Kingdom Holding' },
  { value: '1211', labelAr: '1211 - معادن', labelEn: '1211 - Maaden' },
];

const STOCKS_GLOBAL_OPTIONS: Option[] = [
  { value: 'AAPL', labelAr: 'AAPL - Apple', labelEn: 'AAPL - Apple / NASDAQ' },
  { value: 'MSFT', labelAr: 'MSFT - Microsoft', labelEn: 'MSFT - Microsoft / NASDAQ' },
  { value: 'NVDA', labelAr: 'NVDA - NVIDIA', labelEn: 'NVDA - NVIDIA / NASDAQ' },
  { value: 'GOOGL', labelAr: 'GOOGL - Alphabet', labelEn: 'GOOGL - Alphabet / NASDAQ' },
  { value: 'AMZN', labelAr: 'AMZN - Amazon', labelEn: 'AMZN - Amazon / NASDAQ' },
  { value: 'META', labelAr: 'META - Meta', labelEn: 'META - Meta / NASDAQ' },
  { value: 'TSLA', labelAr: 'TSLA - Tesla', labelEn: 'TSLA - Tesla / NASDAQ' },
  { value: 'BRK.B', labelAr: 'BRK.B - Berkshire Hathaway', labelEn: 'BRK.B - Berkshire Hathaway / NYSE' },
  { value: 'JPM', labelAr: 'JPM - JPMorgan', labelEn: 'JPM - JPMorgan / NYSE' },
  { value: 'V', labelAr: 'V - Visa', labelEn: 'V - Visa / NYSE' },
];

const CRYPTO_OPTIONS = toOptions(['Bitcoin (BTC)', 'Ethereum (ETH)', 'BNB', 'Solana (SOL)', 'Ripple (XRP)', 'Cardano (ADA)', 'Polkadot (DOT)', 'Avalanche (AVAX)', 'Chainlink (LINK)', 'Polygon (MATIC)']);
const FOREX_OPTIONS = toOptions(['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY']);
const METALS_OPTIONS = toOptions(['ذهب (Gold)', 'فضة (Silver)', 'بلاتين (Platinum)', 'بلاديوم (Palladium)']);
const OIL_OPTIONS = toOptions(['WTI Crude Oil', 'Brent Crude', 'Natural Gas', 'Gasoline', 'Heating Oil']);

const PERSONAL_FIELDS: FieldConfig[] = [
  { key: 'clientId', labelAr: 'العميل المرتبط *', labelEn: 'Linked Client *', type: 'select' },
  { key: 'portfolioCode', labelAr: 'كود المحفظة', labelEn: 'Portfolio Code', mono: true },
  { key: 'advisor', labelAr: 'المستشار المسؤول', labelEn: 'Responsible Advisor', type: 'select', options: ADVISOR_OPTIONS },
  { key: 'fullName', labelAr: 'الاسم الكامل', labelEn: 'Full Name' },
  { key: 'nationality', labelAr: 'الجنسية', labelEn: 'Nationality', type: 'select', options: NATIONALITY_OPTIONS },
  { key: 'idType', labelAr: 'نوع الهوية', labelEn: 'ID Type', type: 'select', options: ID_TYPE_OPTIONS },
  { key: 'idNumber', labelAr: 'رقم الهوية', labelEn: 'ID Number', mono: true },
  { key: 'idExpiry', labelAr: 'تاريخ انتهاء الهوية', labelEn: 'ID Expiry Date', type: 'date' },
  { key: 'openDate', labelAr: 'تاريخ فتح المحفظة', labelEn: 'Portfolio Opening Date', type: 'date' },
  { key: 'phone', labelAr: 'الهاتف', labelEn: 'Phone', mono: true },
  { key: 'altPhone', labelAr: 'هاتف بديل', labelEn: 'Alternative Phone', mono: true },
  { key: 'email', labelAr: 'البريد الإلكتروني', labelEn: 'Email', type: 'email' },
  { key: 'address', labelAr: 'العنوان', labelEn: 'Address' },
  { key: 'city', labelAr: 'المدينة', labelEn: 'City', type: 'select', options: CITY_OPTIONS },
  { key: 'country', labelAr: 'الدولة', labelEn: 'Country', type: 'select', options: COUNTRY_OPTIONS },
  { key: 'riskLevel', labelAr: 'مستوى المخاطرة', labelEn: 'Risk Level', type: 'select', options: RISK_OPTIONS },
  { key: 'investmentGoal', labelAr: 'هدف الاستثمار', labelEn: 'Investment Goal', type: 'select', options: GOAL_OPTIONS },
  { key: 'investmentHorizon', labelAr: 'أفق الاستثمار', labelEn: 'Investment Horizon', type: 'select', options: HORIZON_OPTIONS },
  { key: 'currency', labelAr: 'عملة المحفظة', labelEn: 'Portfolio Currency', type: 'select', options: CURRENCY_OPTIONS },
];

const FINANCIAL_FIELDS: FieldConfig[] = [
  { key: 'initialCapital', labelAr: 'رأس المال الابتدائي', labelEn: 'Initial Capital', type: 'number' },
  { key: 'monthlyAddition', labelAr: 'الإضافة الشهرية', labelEn: 'Monthly Addition', type: 'number' },
  { key: 'annualIncome', labelAr: 'الدخل السنوي التقريبي', labelEn: 'Approximate Annual Income', type: 'number' },
  { key: 'netWorth', labelAr: 'صافي الثروة المقدّرة', labelEn: 'Estimated Net Worth', type: 'number' },
  { key: 'otherInvestments', labelAr: 'استثمارات أخرى (قيمة)', labelEn: 'Other Investments (Value)', type: 'number' },
  { key: 'monthlyExpenses', labelAr: 'المصروفات الشهرية', labelEn: 'Monthly Expenses', type: 'number' },
  { key: 'liquidReserve', labelAr: 'الاحتياطي السائل (أشهر)', labelEn: 'Liquid Reserve (Months)', type: 'number' },
  { key: 'maxLoss', labelAr: 'أقصى خسارة مقبولة %', labelEn: 'Maximum Acceptable Loss %', type: 'number' },
  { key: 'riskTolerance', labelAr: 'تحمّل المخاطر', labelEn: 'Risk Tolerance', type: 'select', options: TOLERANCE_OPTIONS },
  { key: 'previousExp', labelAr: 'خبرة استثمارية سابقة', labelEn: 'Previous Investment Experience', type: 'select', options: PREVIOUS_EXP_OPTIONS },
  { key: 'taxResident', labelAr: 'مقيم ضريبي في', labelEn: 'Tax Resident In', type: 'select', options: TAX_OPTIONS },
  { key: 'usCitizen', labelAr: 'مواطن أمريكي / FATCA', labelEn: 'US Citizen / FATCA', type: 'select', options: FATCA_OPTIONS },
];

const BANKING_FIELDS: FieldConfig[] = [
  { key: 'bankName', labelAr: 'اسم البنك', labelEn: 'Bank Name', type: 'select', options: BANK_OPTIONS },
  { key: 'iban', labelAr: 'رقم IBAN', labelEn: 'IBAN Number', mono: true },
  { key: 'accountName', labelAr: 'اسم صاحب الحساب', labelEn: 'Account Holder Name' },
  { key: 'branch', labelAr: 'الفرع', labelEn: 'Branch' },
  { key: 'swiftCode', labelAr: 'رمز SWIFT', labelEn: 'SWIFT Code', mono: true },
  { key: 'transferMethod', labelAr: 'طريقة التحويل المفضلة', labelEn: 'Preferred Transfer Method', type: 'select', options: TRANSFER_OPTIONS },
  { key: 'secondBankName', labelAr: 'اسم البنك الثانوي', labelEn: 'Secondary Bank Name', type: 'select', options: BANK_OPTIONS },
  { key: 'secondIBAN', labelAr: 'IBAN الثانوي', labelEn: 'Secondary IBAN', mono: true },
  { key: 'secondAccountName', labelAr: 'اسم الحساب الثانوي', labelEn: 'Secondary Account Name' },
];

const KYC_FIELDS: FieldConfig[] = [
  { key: 'kycStatus', labelAr: 'حالة KYC', labelEn: 'KYC Status', type: 'select', options: KYC_OPTIONS },
  { key: 'verificationDate', labelAr: 'تاريخ التحقق', labelEn: 'Verification Date', type: 'date' },
  { key: 'verifiedBy', labelAr: 'تم التحقق بواسطة', labelEn: 'Verified By', type: 'select', options: ADVISOR_OPTIONS },
];

const INTERNAL_FIELDS: FieldConfig[] = [
  { key: 'internalNotes', labelAr: 'ملاحظات داخلية', labelEn: 'Internal Notes', type: 'textarea' },
  { key: 'specialTerms', labelAr: 'شروط خاصة', labelEn: 'Special Terms', type: 'textarea' },
  { key: 'feeAdjustment', labelAr: 'تعديل الرسوم', labelEn: 'Fee Adjustment' },
  { key: 'priorityLevel', labelAr: 'مستوى الأولوية', labelEn: 'Priority Level', type: 'select', options: PRIORITY_OPTIONS },
  { key: 'nextFollowUp', labelAr: 'تاريخ المتابعة التالية', labelEn: 'Next Follow-up Date', type: 'date' },
  { key: 'tags', labelAr: 'وسوم / Tags', labelEn: 'Tags' },
];

const DOCUMENTS: { key: DocumentKey; labelAr: string; labelEn: string }[] = [
  { key: 'idCopy', labelAr: 'صورة الهوية / الجواز', labelEn: 'ID / Passport Copy' },
  { key: 'addressProof', labelAr: 'إثبات العنوان', labelEn: 'Address Proof' },
  { key: 'bankStatement', labelAr: 'كشف حساب بنكي (3 أشهر)', labelEn: 'Bank Statement (3 Months)' },
  { key: 'taxForm', labelAr: 'نموذج معلومات ضريبية', labelEn: 'Tax Information Form' },
  { key: 'riskForm', labelAr: 'نموذج المخاطرة الموقّع', labelEn: 'Signed Risk Form' },
  { key: 'contractSigned', labelAr: 'عقد إدارة المحفظة', labelEn: 'Portfolio Management Contract' },
];

const ASSET_CONFIGS: AssetConfig[] = [
  { key: 'sa', emoji: '🇸🇦', labelAr: 'أسهم سعودية', labelEn: 'Saudi Stocks', columns: [
    { key: 'code', labelAr: 'الرمز', labelEn: 'Code', type: 'select', options: STOCKS_SA_OPTIONS },
    { key: 'qty', labelAr: 'الكمية', labelEn: 'Quantity' },
    { key: 'price', labelAr: 'السعر (ر.س)', labelEn: 'Price (SAR)' },
    { key: 'notes', labelAr: 'ملاحظة', labelEn: 'Note' },
  ] },
  { key: 'gulf', emoji: '🌍', labelAr: 'أسهم خليجية', labelEn: 'Gulf Stocks', columns: [
    { key: 'code', labelAr: 'الرمز', labelEn: 'Code' },
    { key: 'name', labelAr: 'اسم الشركة', labelEn: 'Company Name' },
    { key: 'qty', labelAr: 'الكمية', labelEn: 'Quantity' },
    { key: 'price', labelAr: 'السعر', labelEn: 'Price' },
    { key: 'notes', labelAr: 'ملاحظة', labelEn: 'Note' },
  ] },
  { key: 'global', emoji: '🌐', labelAr: 'أسهم عالمية', labelEn: 'Global Stocks', columns: [
    { key: 'code', labelAr: 'الرمز (Symbol)', labelEn: 'Symbol', type: 'select', options: STOCKS_GLOBAL_OPTIONS },
    { key: 'qty', labelAr: 'الأسهم', labelEn: 'Shares' },
    { key: 'price', labelAr: 'السعر ($)', labelEn: 'Price ($)' },
    { key: 'notes', labelAr: 'ملاحظة', labelEn: 'Note' },
  ] },
  { key: 'crypto', emoji: '₿', labelAr: 'رقمية', labelEn: 'Crypto', columns: [
    { key: 'symbol', labelAr: 'العملة', labelEn: 'Currency', type: 'select', options: CRYPTO_OPTIONS },
    { key: 'qty', labelAr: 'الكمية', labelEn: 'Quantity' },
    { key: 'avgPrice', labelAr: 'متوسط السعر ($)', labelEn: 'Average Price ($)' },
  ] },
  { key: 'forex', emoji: '💱', labelAr: 'فوركس', labelEn: 'Forex', columns: [
    { key: 'pair', labelAr: 'الزوج', labelEn: 'Pair', type: 'select', options: FOREX_OPTIONS },
    { key: 'lots', labelAr: 'اللوتات', labelEn: 'Lots' },
    { key: 'direction', labelAr: 'الاتجاه', labelEn: 'Direction', type: 'select', options: DIRECTION_OPTIONS },
    { key: 'avgPrice', labelAr: 'متوسط السعر', labelEn: 'Average Price' },
  ] },
  { key: 'metals', emoji: '💎', labelAr: 'معادن', labelEn: 'Metals', columns: [
    { key: 'metal', labelAr: 'المعدن', labelEn: 'Metal', type: 'select', options: METALS_OPTIONS },
    { key: 'weight', labelAr: 'الوزن/الكمية', labelEn: 'Weight / Qty' },
    { key: 'unit', labelAr: 'الوحدة', labelEn: 'Unit', type: 'select', options: METAL_UNIT_OPTIONS },
    { key: 'avgPrice', labelAr: 'متوسط السعر ($)', labelEn: 'Average Price ($)' },
  ] },
  { key: 'oil', emoji: '⛽', labelAr: 'نفط', labelEn: 'Oil', columns: [
    { key: 'type', labelAr: 'النوع', labelEn: 'Type', type: 'select', options: OIL_OPTIONS },
    { key: 'contracts', labelAr: 'العقود', labelEn: 'Contracts' },
    { key: 'avgPrice', labelAr: 'متوسط السعر ($)', labelEn: 'Average Price ($)' },
  ] },
];

const ALL_FIELD_CONFIGS: Record<FieldSection, FieldConfig[]> = {
  personal: PERSONAL_FIELDS,
  financial: FINANCIAL_FIELDS,
  banking: BANKING_FIELDS,
  kyc: KYC_FIELDS,
  internal: INTERNAL_FIELDS,
};

function makeFlexStore(fields: FieldConfig[]): FlexStore {
  return fields.reduce<FlexStore>((store, field) => {
    store[field.key] = { value: '', visible: true };
    return store;
  }, {});
}

function createEmptyPortfolioData(): PortfolioData {
  return {
    personal: makeFlexStore(PERSONAL_FIELDS),
    financial: makeFlexStore(FINANCIAL_FIELDS),
    banking: makeFlexStore(BANKING_FIELDS),
    kyc: makeFlexStore(KYC_FIELDS),
    internal: makeFlexStore(INTERNAL_FIELDS),
    investments: { sa: [], gulf: [], global: [], crypto: [], forex: [], metals: [], oil: [] },
    investmentVisibility: { sa: true, gulf: true, global: true, crypto: true, forex: true, metals: true, oil: true },
    documents: { idCopy: false, addressProof: false, bankStatement: false, taxForm: false, riskForm: false, contractSigned: false },
    sectionNotes: { personal: '', financial: '', investments: '', banking: '', documents: '', internal: '' },
  };
}

function cloneData(data: PortfolioData): PortfolioData {
  return JSON.parse(JSON.stringify(data)) as PortfolioData;
}

function normalizeData(data?: PortfolioData): PortfolioData {
  const empty = createEmptyPortfolioData();
  if (!data) return empty;
  return {
    ...empty,
    ...data,
    personal: { ...empty.personal, ...(data.personal || {}) },
    financial: { ...empty.financial, ...(data.financial || {}) },
    banking: { ...empty.banking, ...(data.banking || {}) },
    kyc: { ...empty.kyc, ...(data.kyc || {}) },
    internal: { ...empty.internal, ...(data.internal || {}) },
    investments: { ...empty.investments, ...(data.investments || {}) },
    investmentVisibility: { ...empty.investmentVisibility, ...(data.investmentVisibility || {}) },
    documents: { ...empty.documents, ...(data.documents || {}) },
    sectionNotes: { ...empty.sectionNotes, ...(data.sectionNotes || {}) },
  };
}

function fieldValue(data: PortfolioData | undefined, section: FieldSection, key: string): string {
  return data?.[section]?.[key]?.value || '';
}

function clientName(client: Client | undefined, lang: 'ar' | 'en') {
  if (!client) return '—';
  return lang === 'ar' ? client.name : client.nameEn;
}

function portfolioDisplayName(portfolio: ManagedPortfolio, client: Client | undefined, lang: 'ar' | 'en') {
  const formName = fieldValue(portfolio.portfolio_data, 'personal', 'fullName');
  return clientName(client, lang) !== '—' ? clientName(client, lang) : formName || (lang === 'ar' ? portfolio.name : portfolio.nameEn) || portfolio.name || portfolio.id;
}

function portfolioCurrency(portfolio: ManagedPortfolio) {
  return portfolio.currency || fieldValue(portfolio.portfolio_data, 'personal', 'currency') || 'SAR';
}

function portfolioCreatedAt(portfolio: ManagedPortfolio) {
  return portfolio.created_at || portfolio.inception || nowDate();
}

function toHoldingRows(data: PortfolioData): Portfolio['holdings'] {
  const rows = ASSET_CONFIGS.flatMap(asset => data.investments[asset.key].map(row => ({ asset, row })));
  const valued = rows.map(({ asset, row }) => {
    const symbol = row.code || row.symbol || row.pair || row.metal || row.type || row.name || asset.labelEn;
    const qty = numberFrom(row.qty || row.lots || row.weight || row.contracts || '1');
    const price = numberFrom(row.price || row.avgPrice || '0');
    const value = qty && price ? qty * price : 0;
    return {
      symbol,
      name: row.name || symbol,
      nameEn: row.name || symbol,
      value,
      change: Number(((Math.random() * 3) - 1).toFixed(1)),
      weight: 0,
    };
  });
  const total = valued.reduce((sum, row) => sum + row.value, 0) || valued.length;
  return valued.map(row => ({ ...row, value: row.value || Math.round(total / Math.max(valued.length, 1)), weight: Math.max(1, Math.round(((row.value || total / Math.max(valued.length, 1)) / total) * 100)) }));
}

function convertPortfolioToData(portfolio: ManagedPortfolio, clients: Client[]): PortfolioData {
  const existing = normalizeData(portfolio.portfolio_data);
  const client = clients.find(c => c.id === portfolio.clientId);
  existing.personal.clientId.value = existing.personal.clientId.value || portfolio.clientId;
  existing.personal.portfolioCode.value = existing.personal.portfolioCode.value || portfolio.id;
  existing.personal.fullName.value = existing.personal.fullName.value || client?.name || '';
  existing.personal.advisor.value = existing.personal.advisor.value || client?.advisor || '';
  existing.personal.phone.value = existing.personal.phone.value || client?.phone || '';
  existing.personal.email.value = existing.personal.email.value || client?.email || '';
  existing.personal.city.value = existing.personal.city.value || client?.city || '';
  existing.personal.country.value = existing.personal.country.value || client?.country || '';
  existing.personal.riskLevel.value = existing.personal.riskLevel.value || portfolio.risk;
  existing.personal.investmentGoal.value = existing.personal.investmentGoal.value || portfolio.strategy;
  existing.personal.currency.value = existing.personal.currency.value || portfolio.currency || 'SAR';
  existing.personal.openDate.value = existing.personal.openDate.value || portfolio.inception || nowDate();
  existing.financial.initialCapital.value = existing.financial.initialCapital.value || String(portfolio.value || '');

  if (!portfolio.portfolio_data && portfolio.holdings?.length) {
    existing.investments.global = portfolio.holdings.map(h => ({ id: newRowId(), code: h.symbol, qty: String(Math.max(1, Math.round(h.weight))), price: String(Math.round(h.value / Math.max(1, h.weight))), notes: h.name }));
  }
  return existing;
}

function mapToManagedPortfolio(input: { current?: ManagedPortfolio | null; data: PortfolioData; clients: Client[]; fallbackId: string }): ManagedPortfolio {
  const clientId = fieldValue(input.data, 'personal', 'clientId');
  const client = input.clients.find(c => c.id === clientId);
  const code = fieldValue(input.data, 'personal', 'portfolioCode') || input.current?.id || input.fallbackId;
  const goal = fieldValue(input.data, 'personal', 'investmentGoal');
  const risk = fieldValue(input.data, 'personal', 'riskLevel') || input.current?.risk || 'متوسط';
  const capital = numberFrom(fieldValue(input.data, 'financial', 'initialCapital')) || input.current?.value || 0;
  const generatedHoldings = toHoldingRows(input.data);
  const holdings = generatedHoldings.length ? generatedHoldings : (input.current?.holdings || []);
  return {
    ...(input.current || {}),
    id: code,
    clientId,
    name: input.current?.name || (goal ? `محفظة ${goal}` : `محفظة ${client?.name || 'استثمارية'}`),
    nameEn: input.current?.nameEn || (goal ? `${goal} Portfolio` : `${client?.nameEn || 'Investment'} Portfolio`),
    strategy: goal || input.current?.strategy || 'استراتيجية مخصصة',
    strategyEn: goal || input.current?.strategyEn || 'Custom strategy',
    risk,
    riskEn: risk,
    value: capital,
    growth: input.current?.growth ?? 0,
    inception: fieldValue(input.data, 'personal', 'openDate') || input.current?.inception || nowDate(),
    holdings,
    currency: fieldValue(input.data, 'personal', 'currency') || input.current?.currency || 'SAR',
    created_at: input.current?.created_at || new Date().toISOString(),
    portfolio_data: cloneData(input.data),
  };
}

function formatDate(date: string, lang: 'ar' | 'en') {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date || '—';
  return parsed.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US');
}

function truncateName(value: string) {
  return value.length > 10 ? `${value.slice(0, 10)}…` : value;
}

function SectionCard({ emoji, title, open, onToggle, children }: { emoji: string; title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <section className="bg-[#F8FAFC] dark:bg-secondary border border-[#E2E8F0] dark:border-border-default rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full px-[18px] py-3.5 flex items-center justify-between gap-3 select-none cursor-pointer"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-[#1E293B] dark:text-text-primary"><span className="text-[17px]">{emoji}</span>{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
      </button>
      {open && <div className="border-t border-[#E2E8F0] dark:border-border-default px-[18px] pb-[18px] pt-4">{children}</div>}
    </section>
  );
}

function SectionNote({ value, onChange, lang }: { value: string; onChange: (value: string) => void; lang: 'ar' | 'en' }) {
  return (
    <div className="mt-4 pt-3.5 border-t border-dashed border-[#E2E8F0] dark:border-border-default">
      <label className="block text-[11px] font-bold text-[#F59E0B] mb-1.5">{lang === 'ar' ? '📝 ملاحظة القسم (تظهر للعميل)' : '📝 Section Note (shown to client)'}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        placeholder={lang === 'ar' ? 'أضف ملاحظة تظهر أسفل هذا القسم في لوحة العميل...' : 'Add a note displayed below this section in the client dashboard...'}
        className="w-full resize-y bg-[rgba(245,158,11,0.03)] border border-[rgba(245,158,11,0.4)] rounded-lg px-3 py-2.5 outline-none text-xs text-text-primary placeholder:text-text-muted focus:border-[#F59E0B]"
      />
    </div>
  );
}

function VisibilityToggle({ visible, onChange, lang }: { visible: boolean; onChange: (visible: boolean) => void; lang: 'ar' | 'en' }) {
  return (
    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] font-semibold text-[#94A3B8]">{lang === 'ar' ? 'ظهور للعميل:' : 'Client Visibility:'}</span>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn('px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition-colors', visible ? 'bg-emerald-500/12 text-[#059669]' : 'bg-[#F1F5F9] text-[#94A3B8]')}
      >
        <Eye className="w-[11px] h-[11px]" /> {lang === 'ar' ? 'إظهار' : 'Show'}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn('px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition-colors', !visible ? 'bg-[#F1F5F9] text-[#64748B]' : 'bg-[#F1F5F9] text-[#94A3B8]')}
      >
        <EyeOff className="w-[11px] h-[11px]" /> {lang === 'ar' ? 'إخفاء' : 'Hide'}
      </button>
    </div>
  );
}

function HybridSelect({ value, options, onChange, lang, placeholder }: { value: string; options: Option[]; onChange: (value: string) => void; lang: 'ar' | 'en'; placeholder?: string }) {
  const hasValueInOptions = options.some(option => option.value === value);
  const [customMode, setCustomMode] = useState(Boolean(value && !hasValueInOptions));

  useEffect(() => {
    if (value && !options.some(option => option.value === value)) setCustomMode(true);
  }, [options, value]);

  const selectValue = customMode ? '__custom__' : value;
  return (
    <div className="space-y-2">
      <select
        value={selectValue}
        onChange={e => {
          if (e.target.value === '__custom__') {
            setCustomMode(true);
            onChange('');
          } else {
            setCustomMode(false);
            onChange(e.target.value);
          }
        }}
        className="w-full bg-[#F8FAFC] dark:bg-tertiary border border-[#E2E8F0] dark:border-border-default rounded-lg px-3 py-2.5 outline-none text-xs font-medium text-text-primary focus:border-[#0EA5E9] transition-colors"
      >
        <option value="">{placeholder || (lang === 'ar' ? 'اختر...' : 'Select...')}</option>
        {options.map(option => <option key={option.value} value={option.value}>{lang === 'ar' ? option.labelAr : (option.labelEn || option.labelAr)}</option>)}
        <option value="__custom__">{lang === 'ar' ? 'قيمة مخصصة...' : 'Custom value...'}</option>
      </select>
      {customMode && (
        <input
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={lang === 'ar' ? 'اكتب قيمة مخصصة...' : 'Enter custom value...'}
          className="w-full bg-white dark:bg-tertiary border-2 border-[#0EA5E9] rounded-lg px-3 py-2.5 outline-none text-[13px] text-[#0369A1] placeholder:text-[#7DD3FC]"
        />
      )}
    </div>
  );
}

function FlexField({ config, state, onValue, onVisible, lang, optionsOverride }: {
  config: FieldConfig;
  state: FlexState;
  onValue: (value: string) => void;
  onVisible: (visible: boolean) => void;
  lang: 'ar' | 'en';
  optionsOverride?: Option[];
}) {
  const label = lang === 'ar' ? config.labelAr : config.labelEn;
  const commonClass = cn('w-full bg-[#F8FAFC] dark:bg-tertiary border border-[#E2E8F0] dark:border-border-default rounded-lg px-3 py-2.5 outline-none text-xs font-medium text-text-primary placeholder:text-text-muted focus:border-[#0EA5E9] transition-colors', config.mono && 'font-mono');
  return (
    <div>
      <label className="block text-[11px] font-bold text-[#64748B] mb-1.5">{label}</label>
      {config.type === 'textarea' ? (
        <textarea value={state.value} onChange={e => onValue(e.target.value)} rows={3} placeholder={config.placeholder} className={cn(commonClass, 'resize-y')} />
      ) : config.type === 'select' ? (
        <HybridSelect value={state.value} onChange={onValue} options={optionsOverride || config.options || []} lang={lang} />
      ) : (
        <input
          type={config.type || 'text'}
          value={state.value}
          onChange={e => onValue(e.target.value)}
          placeholder={config.placeholder}
          dir={config.mono || config.type === 'email' ? 'ltr' : undefined}
          className={commonClass}
        />
      )}
      <VisibilityToggle visible={state.visible} onChange={onVisible} lang={lang} />
    </div>
  );
}

function MiniButton({ icon: Icon, children, onClick, danger }: { icon: LucideIcon; children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 border transition-colors', danger ? 'text-[#FF4560] border-[#FF4560]/20 bg-[#FF4560]/5 hover:bg-[#FF4560]/10' : 'text-[#0EA5E9] border-[#0EA5E9]/20 bg-[#0EA5E9]/5 hover:bg-[#0EA5E9]/10')}
    >
      <Icon className="w-3 h-3" /> {children}
    </button>
  );
}

export function Portfolios() {
  const { t, lang } = useLang();
  const [rawPortfolios, setPortfolios] = usePortfolios();
  const [clients] = useClients();
  const { show, ToastView } = usePortfolioToast();

  const portfolios = rawPortfolios as ManagedPortfolio[];
  const [pageMode, setPageMode] = useState<PageMode>('list');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [editing, setEditing] = useState<ManagedPortfolio | null>(null);
  const [form, setForm] = useState<PortfolioData>(() => createEmptyPortfolioData());
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ personal: true, financial: true, investments: true, banking: true, documents: true, internal: true });
  const [activeAsset, setActiveAsset] = useState<AssetKey>('sa');
  const [deleting, setDeleting] = useState<ManagedPortfolio | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [performancePortfolio, setPerformancePortfolio] = useState<ManagedPortfolio | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [cloneSource, setCloneSource] = useState<ManagedPortfolio | null>(null);
  const [cloneClientId, setCloneClientId] = useState('');
  const [cloneMode, setCloneMode] = useState<CloneMode>('all');
  const [cloneCode, setCloneCode] = useState('');
  const [alertPortfolio, setAlertPortfolio] = useState<ManagedPortfolio | null>(null);
  const [alertForm, setAlertForm] = useState({ threshold: '15', channel: 'البريد' });

  const clientOptions = useMemo<Option[]>(() => clients.map(client => ({ value: client.id, labelAr: `${client.name} — ${client.id}`, labelEn: `${client.nameEn} — ${client.id}` })), [clients]);
  const getClient = (id: string) => clients.find(client => client.id === id);

  const stats = useMemo(() => {
    const total = portfolios.length;
    const uniqueClients = new Set(portfolios.map(p => p.clientId).filter(Boolean)).size;
    const average = total ? portfolios.reduce((sum, p) => sum + (p.value || 0), 0) / total : 0;
    const newest = [...portfolios].sort((a, b) => new Date(portfolioCreatedAt(b)).getTime() - new Date(portfolioCreatedAt(a)).getTime())[0];
    return { total, uniqueClients, average, newest };
  }, [portfolios]);

  const comparePortfolios = portfolios.filter(portfolio => compareIds.includes(portfolio.id));

  const resetForm = () => {
    setForm(createEmptyPortfolioData());
    setEditing(null);
    setSaved(false);
  };

  const startCreate = () => {
    const empty = createEmptyPortfolioData();
    empty.personal.portfolioCode.value = nextCode(portfolios, 'PF');
    empty.personal.openDate.value = nowDate();
    empty.personal.currency.value = 'SAR';
    setForm(empty);
    setEditing(null);
    setPageMode('form');
  };

  const startEdit = (portfolio: ManagedPortfolio) => {
    setEditing(portfolio);
    setForm(convertPortfolioToData(portfolio, clients));
    setPageMode('form');
    setSaved(false);
  };

  const updateField = (section: FieldSection, key: string, patch: Partial<FlexState>) => {
    setForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: { value: '', visible: true, ...(prev[section][key] || {}), ...patch },
      },
    }));
  };

  const updateNote = (section: string, value: string) => setForm(prev => ({ ...prev, sectionNotes: { ...prev.sectionNotes, [section]: value } }));

  const updateInvestmentRow = (asset: AssetKey, rowId: string, key: string, value: string) => {
    setForm(prev => ({
      ...prev,
      investments: {
        ...prev.investments,
        [asset]: prev.investments[asset].map(row => row.id === rowId ? { ...row, [key]: value } : row),
      },
    }));
  };

  const addInvestmentRow = (asset: AssetKey) => {
    const config = ASSET_CONFIGS.find(item => item.key === asset)!;
    const row = config.columns.reduce<InvestmentRow>((acc, col) => ({ ...acc, [col.key]: '' }), { id: newRowId() });
    setForm(prev => ({ ...prev, investments: { ...prev.investments, [asset]: [...prev.investments[asset], row] } }));
  };

  const removeInvestmentRow = (asset: AssetKey, rowId: string) => {
    setForm(prev => ({ ...prev, investments: { ...prev.investments, [asset]: prev.investments[asset].filter(row => row.id !== rowId) } }));
  };

  const setInvestmentVisibility = (asset: AssetKey, visible: boolean) => {
    setForm(prev => ({ ...prev, investmentVisibility: { ...prev.investmentVisibility, [asset]: visible } }));
  };

  const handleClientChange = (clientId: string) => {
    const client = getClient(clientId);
    updateField('personal', 'clientId', { value: clientId });
    if (client) {
      updateField('personal', 'fullName', { value: client.name });
      updateField('personal', 'phone', { value: client.phone });
      updateField('personal', 'email', { value: client.email });
      updateField('personal', 'city', { value: client.city });
      updateField('personal', 'country', { value: client.country });
      updateField('personal', 'advisor', { value: client.advisor !== '—' ? client.advisor : '' });
      updateField('personal', 'riskLevel', { value: client.riskProfile !== 'غير محدد' ? client.riskProfile : '' });
    }
  };

  const handleSave = () => {
    const linkedClient = fieldValue(form, 'personal', 'clientId');
    if (!linkedClient) {
      show(t('يرجى اختيار العميل المرتبط قبل حفظ المحفظة', 'Please select a linked client before saving'), 'error');
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      const nextPortfolio = mapToManagedPortfolio({ current: editing, data: form, clients, fallbackId: nextCode(portfolios, 'PF') });
      setPortfolios(prev => {
        const current = prev as ManagedPortfolio[];
        const exists = editing ? current.some(portfolio => portfolio.id === editing.id) : current.some(portfolio => portfolio.id === nextPortfolio.id);
        if (exists) return current.map(portfolio => portfolio.id === (editing?.id || nextPortfolio.id) ? nextPortfolio : portfolio) as Portfolio[];
        return [nextPortfolio, ...current] as Portfolio[];
      });
      setSaving(false);
      setSaved(true);
      show(t('✓ تم حفظ المحفظة بنجاح', '✓ Portfolio saved successfully'));
      window.setTimeout(() => setSaved(false), 2000);
    }, 450);
  };

  const handleDelete = () => {
    if (!deleting) return;
    setPortfolios(prev => (prev as ManagedPortfolio[]).filter(portfolio => portfolio.id !== deleting.id) as Portfolio[]);
    show(t('تم حذف المحفظة', 'Portfolio deleted'));
    setDeleting(null);
  };

  const openClone = (portfolio: ManagedPortfolio) => {
    setCloneSource(portfolio);
    setCloneClientId('');
    setCloneMode('all');
    setCloneCode(nextCode(portfolios, 'PF'));
  };

  const createFromTemplate = () => {
    if (!cloneSource || !cloneClientId) {
      show(t('اختر العميل الجديد أولاً', 'Choose the new client first'), 'error');
      return;
    }
    const sourceData = convertPortfolioToData(cloneSource, clients);
    let cloned = createEmptyPortfolioData();
    if (cloneMode === 'all') cloned = cloneData(sourceData);
    if (cloneMode === 'investments') {
      cloned.investments = cloneData(sourceData).investments;
      cloned.investmentVisibility = cloneData(sourceData).investmentVisibility;
    }
    if (cloneMode === 'personal') cloned.personal = cloneData(sourceData).personal;
    const client = getClient(cloneClientId);
    cloned.personal.clientId.value = cloneClientId;
    cloned.personal.portfolioCode.value = cloneCode || nextCode(portfolios, 'PF');
    cloned.personal.fullName.value = client?.name || cloned.personal.fullName.value;
    cloned.personal.openDate.value = nowDate();
    const portfolio = mapToManagedPortfolio({ current: null, data: cloned, clients, fallbackId: cloneCode || nextCode(portfolios, 'PF') });
    portfolio.name = `${t('نسخة من', 'Copy of')} ${cloneSource.name}`;
    portfolio.nameEn = `Copy of ${cloneSource.nameEn}`;
    setPortfolios(prev => [portfolio, ...(prev as ManagedPortfolio[])] as Portfolio[]);
    setCloneSource(null);
    show(t('تم إنشاء محفظة من القالب', 'Portfolio created from template'));
  };

  const exportPdf = (portfolio: ManagedPortfolio) => {
    const client = getClient(portfolio.clientId);
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Tharwah Capital — Portfolio Report', 18, 20);
    doc.setFontSize(11);
    doc.text(`Portfolio: ${portfolio.id}`, 18, 34);
    doc.text(`Client: ${client?.nameEn || client?.name || portfolio.clientId}`, 18, 42);
    doc.text(`Currency: ${portfolioCurrency(portfolio)}`, 18, 50);
    doc.text(`Value: ${portfolio.value.toLocaleString()} ${portfolioCurrency(portfolio)}`, 18, 58);
    doc.text(`Risk: ${portfolio.riskEn || portfolio.risk}`, 18, 66);
    doc.text('Asset Allocation:', 18, 82);
    portfolio.holdings.slice(0, 12).forEach((holding, index) => {
      doc.text(`${index + 1}. ${holding.symbol} — ${holding.weight}% — ${holding.value.toLocaleString()}`, 22, 92 + index * 8);
    });
    const maskedIban = fieldValue(portfolio.portfolio_data, 'banking', 'iban').replace(/.(?=.{4})/g, '•');
    doc.text(`Banking: ${maskedIban || 'Not provided'}`, 18, 198);
    doc.text(`Advisor: ${fieldValue(portfolio.portfolio_data, 'personal', 'advisor') || '—'}`, 18, 208);
    doc.save(`${portfolio.id}-portfolio-report.pdf`);
    show(t('تم إنشاء تقرير PDF', 'PDF report generated'));
  };

  const openAlert = (portfolio: ManagedPortfolio) => {
    const alert = portfolio.portfolio_data?.declineAlert;
    setAlertPortfolio(portfolio);
    setAlertForm({ threshold: alert?.threshold || '15', channel: alert?.channel || 'البريد' });
  };

  const saveAlert = () => {
    if (!alertPortfolio) return;
    setPortfolios(prev => (prev as ManagedPortfolio[]).map(portfolio => {
      if (portfolio.id !== alertPortfolio.id) return portfolio;
      const data = normalizeData(portfolio.portfolio_data);
      data.declineAlert = { threshold: alertForm.threshold, channel: alertForm.channel, active: true };
      return { ...portfolio, portfolio_data: data };
    }) as Portfolio[]);
    setAlertPortfolio(null);
    show(t('تم حفظ إعداد تنبيه الانخفاض', 'Drawdown alert saved'));
  };

  const performanceData = useMemo(() => {
    if (!performancePortfolio) return [];
    const base = Math.max(performancePortfolio.value * 0.82, 1000);
    return ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو'].map((month, index) => ({
      month: lang === 'ar' ? month : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][index],
      value: Math.round(base * (1 + index * 0.035 + Math.sin(index) * 0.015)),
    }));
  }, [lang, performancePortfolio]);

  const renderStats = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
      <StatBox icon="📁" color="#3B82F6" label={t('إجمالي المحافظ', 'Total Portfolios')} value={stats.total} />
      <StatBox icon="👥" color="#0EA5E9" label={t('العملاء', 'Clients')} value={stats.uniqueClients} />
      <StatBox icon="📈" color="#00D97E" label={t('متوسط القيمة', 'Average Value')} value={stats.average ? Math.round(stats.average).toLocaleString() : '—'} />
      <StatBox icon="🏆" color="#F59E0B" label={t('أحدث محفظة', 'Newest Portfolio')} value={stats.newest ? truncateName(stats.newest.id || stats.newest.name) : '—'} />
    </div>
  );

  const renderHeader = () => (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-black text-[#1E293B] dark:text-text-primary">{t('المحافظ الاستثمارية', 'Investment Portfolios')}</h1>
        <p className="text-xs text-[#64748B] mt-1">{t(`${portfolios.length} محفظة مسجلة`, `${portfolios.length} Registered Portfolios`)}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <GhostBtn icon={RefreshCcw} onClick={() => show(t('تم تحديث بيانات المحافظ', 'Portfolios refreshed'))}>{t('تحديث', 'Refresh')}</GhostBtn>
        {pageMode === 'list' && (
          <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg">
            <button onClick={() => setViewMode('cards')} className={cn('px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors', viewMode === 'cards' ? 'bg-white shadow-sm text-[#0EA5E9]' : 'text-[#64748B]')}>{t('بطاقات', 'Cards')}</button>
            <button onClick={() => setViewMode('table')} className={cn('px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors', viewMode === 'table' ? 'bg-white shadow-sm text-[#0EA5E9]' : 'text-[#64748B]')}>{t('جدول', 'Table')}</button>
          </div>
        )}
        {pageMode === 'list' ? (
          <PrimaryBtn icon={Plus} onClick={startCreate}>{t('إنشاء محفظة جديدة', 'Create New Portfolio')}</PrimaryBtn>
        ) : (
          <button onClick={() => { setPageMode('list'); resetForm(); }} className="px-4 py-2 rounded-lg border border-[rgba(14,165,233,0.3)] bg-[rgba(14,165,233,0.1)] text-[#0EA5E9] text-[13px] font-bold">{t('← قائمة المحافظ', '← Portfolio List')}</button>
        )}
      </div>
    </div>
  );

  const renderPortfolioCard = (portfolio: ManagedPortfolio) => {
    const client = getClient(portfolio.clientId);
    const alert = portfolio.portfolio_data?.declineAlert;
    return (
      <div key={portfolio.id} className="bg-[#F8FAFC] dark:bg-secondary border border-[#E2E8F0] dark:border-border-default rounded-xl overflow-hidden transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <div className="px-4 py-3.5 border-b border-[#E2E8F0] dark:border-border-default flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <ClientAvatar name={portfolioDisplayName(portfolio, client, lang)} idSeed={portfolio.id} size={36} />
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-[#1E293B] dark:text-text-primary truncate">{portfolioDisplayName(portfolio, client, lang)}</div>
              <div className="text-[10px] font-mono text-[#94A3B8] truncate">{portfolio.id}</div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <IconBtn icon={Pencil} label={t('تعديل', 'Edit')} onClick={() => startEdit(portfolio)} hoverColor="#0EA5E9" />
            <IconBtn icon={Trash2} label={t('حذف', 'Delete')} onClick={() => setDeleting(portfolio)} hoverColor="#FF4560" />
          </div>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-[#64748B]">{portfolioCurrency(portfolio)}</span>
            <span className="text-[#94A3B8]">{formatDate(portfolioCreatedAt(portfolio), lang)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-white dark:bg-tertiary border border-[#E2E8F0] dark:border-border-default p-2.5">
              <div className="text-[10px] text-[#94A3B8]">{t('القيمة', 'Value')}</div>
              <div className="text-xs font-black font-mono text-[#1E293B] dark:text-text-primary">{portfolio.value.toLocaleString()}</div>
            </div>
            <div className="rounded-lg bg-white dark:bg-tertiary border border-[#E2E8F0] dark:border-border-default p-2.5">
              <div className="text-[10px] text-[#94A3B8]">{t('المخاطر', 'Risk')}</div>
              <div className="text-xs font-bold text-[#0EA5E9] truncate">{lang === 'ar' ? portfolio.risk : portfolio.riskEn}</div>
            </div>
          </div>
          {alert?.active && (
            <div className="rounded-lg bg-[#F59E0B]/8 border border-[#F59E0B]/20 p-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#B45309]"><span>{t(`تنبيه نشط: عند انخفاض ${alert.threshold}% من القمة`, `Active alert: ${alert.threshold}% drawdown from peak`)}</span><span>{alert.channel}</span></div>
              <div className="mt-2 h-1.5 rounded-full bg-[#FDE68A] overflow-hidden"><div className="h-full rounded-full bg-[#F59E0B]" style={{ width: `${Math.max(12, 100 - Number(alert.threshold || 15) * 3)}%` }} /></div>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            <MiniButton icon={BarChart3} onClick={() => setPerformancePortfolio(portfolio)}>{t('عرض الأداء', 'Performance')}</MiniButton>
            <MiniButton icon={Copy} onClick={() => openClone(portfolio)}>{t('نسخ كقالب', 'Copy as Template')}</MiniButton>
            <MiniButton icon={AlertTriangle} onClick={() => openAlert(portfolio)}>{t('تنبيه الانخفاض', 'Drawdown Alert')}</MiniButton>
            <MiniButton icon={FileDown} onClick={() => exportPdf(portfolio)}>{t('تقرير PDF', 'PDF Report')}</MiniButton>
          </div>
        </div>
      </div>
    );
  };

  const renderListMode = () => (
    <>
      <div className="flex justify-end">
        <GhostBtn icon={GitCompare} onClick={() => { setCompareIds(portfolios.slice(0, 2).map(portfolio => portfolio.id)); setCompareOpen(true); }}>{t('مقارنة المحافظ', 'Compare Portfolios')}</GhostBtn>
      </div>
      {portfolios.length === 0 ? (
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-10 text-center">
          <div className="text-[40px] mb-2">📁</div>
          <div className="text-sm text-[#64748B]">{t('لا توجد محافظ بعد', 'No Portfolios Yet')}</div>
          <div className="text-[13px] text-[#94A3B8] mt-1">{t('أنشئ أول محفظة استثمارية للعملاء', 'Create the first investment portfolio for clients')}</div>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3.5">{portfolios.map(renderPortfolioCard)}</div>
      ) : (
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden">
          <DataTable headers={[t('اسم المحفظة', 'Portfolio Name'), t('العميل', 'Client'), t('العملة', 'Currency'), t('تاريخ الإنشاء', 'Creation Date'), t('إجراء', 'Action')]} minWidth={760}>
            {portfolios.map(portfolio => {
              const client = getClient(portfolio.clientId);
              return (
                <Tr key={portfolio.id}>
                  <Td bold>{portfolio.name || portfolio.id}</Td>
                  <Td>{clientName(client, lang)}</Td>
                  <Td>{portfolioCurrency(portfolio)}</Td>
                  <Td>{formatDate(portfolioCreatedAt(portfolio), lang)}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <MiniButton icon={Pencil} onClick={() => startEdit(portfolio)}>{t('تعديل', 'Edit')}</MiniButton>
                      <MiniButton icon={Trash2} danger onClick={() => setDeleting(portfolio)}>{t('حذف', 'Delete')}</MiniButton>
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </DataTable>
        </div>
      )}
    </>
  );

  const renderFieldGrid = (section: FieldSection, fields: FieldConfig[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {fields.map(config => (
        <FlexField
          key={config.key}
          config={config}
          state={form[section][config.key] || { value: '', visible: true }}
          onValue={value => config.key === 'clientId' ? handleClientChange(value) : updateField(section, config.key, { value })}
          onVisible={visible => updateField(section, config.key, { visible })}
          lang={lang}
          optionsOverride={config.key === 'clientId' ? clientOptions : undefined}
        />
      ))}
    </div>
  );

  const activeConfig = ASSET_CONFIGS.find(asset => asset.key === activeAsset)!;

  const renderInvestmentTable = (config: AssetConfig) => (
    <div className="space-y-3">
      <div className="bg-[#F1F5F9] rounded-lg px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="text-xs font-bold text-[#475569]">{lang === 'ar' ? config.labelAr : config.labelEn}</div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setInvestmentVisibility(config.key, true)} className={cn('px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1', form.investmentVisibility[config.key] ? 'bg-emerald-500/12 text-[#059669]' : 'bg-white text-[#94A3B8]')}><Eye className="w-3 h-3" />{t('إظهار القسم', 'Show Section')}</button>
          <button type="button" onClick={() => setInvestmentVisibility(config.key, false)} className={cn('px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1', !form.investmentVisibility[config.key] ? 'bg-white text-[#64748B]' : 'bg-white text-[#94A3B8]')}><EyeOff className="w-3 h-3" />{t('إخفاء', 'Hide')}</button>
        </div>
      </div>
      {form.investments[config.key].length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                {config.columns.map(column => <th key={column.key} className="px-2.5 py-2 text-start text-[11px] font-bold text-[#64748B]">{lang === 'ar' ? column.labelAr : column.labelEn}</th>)}
                <th className="px-2.5 py-2 text-start text-[11px] font-bold text-[#64748B]">{t('حذف', 'Delete')}</th>
              </tr>
            </thead>
            <tbody>
              {form.investments[config.key].map(row => (
                <tr key={row.id} className="border-b border-[rgba(203,213,225,0.5)]">
                  {config.columns.map(column => (
                    <td key={column.key} className="px-2 py-2 align-top">
                      {column.type === 'select' ? (
                        <HybridSelect value={row[column.key] || ''} options={column.options || []} onChange={value => updateInvestmentRow(config.key, row.id, column.key, value)} lang={lang} />
                      ) : (
                        <input value={row[column.key] || ''} onChange={e => updateInvestmentRow(config.key, row.id, column.key, e.target.value)} className="min-w-20 w-full bg-white dark:bg-tertiary border border-[#E2E8F0] dark:border-border-default rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#0EA5E9]" />
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <button type="button" onClick={() => removeInvestmentRow(config.key, row.id)} className="w-7 h-7 rounded-lg bg-[rgba(255,69,96,0.1)] border border-[rgba(255,69,96,0.2)] inline-flex items-center justify-center text-[#FF4560]"><Trash2 className="w-3 h-3" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button type="button" onClick={() => addInvestmentRow(config.key)} className="w-fit bg-[rgba(14,165,233,0.06)] border border-dashed border-[rgba(14,165,233,0.3)] rounded-lg px-3.5 py-2 text-xs text-[#0EA5E9] inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />{t('إضافة سطر', 'Add Row')}</button>
    </div>
  );

  const renderFormMode = () => (
    <form role="form" onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-4">
      <div className="rounded-xl border border-[rgba(245,158,11,0.3)] bg-[linear-gradient(135deg,rgba(255,69,96,0.06),rgba(245,158,11,0.06))] px-[18px] py-3.5 flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div>
          <div className="text-sm font-bold text-[#1E293B] dark:text-text-primary">{t('إشعار — نموذج إنشاء محفظة استثمارية', 'Notice — Investment Portfolio Creation Form')}</div>
          <div className="text-xs text-[#475569] leading-[1.8] mt-0.5">{t('جميع الحقول اختيارية. الحقول التي تختار إظهارها ستظهر لاحقاً في لوحة العميل.', "All fields are optional. Fields you choose to show will appear in the client's dashboard.")}</div>
        </div>
      </div>

      <SectionCard emoji="👤" title={t('البيانات الشخصية والأساسية', 'Personal & Basic Information')} open={openSections.personal} onToggle={() => setOpenSections(prev => ({ ...prev, personal: !prev.personal }))}>
        {renderFieldGrid('personal', PERSONAL_FIELDS)}
        <SectionNote value={form.sectionNotes.personal} onChange={value => updateNote('personal', value)} lang={lang} />
      </SectionCard>

      <SectionCard emoji="💰" title={t('الوضع المالي والاستثماري', 'Financial & Investment Status')} open={openSections.financial} onToggle={() => setOpenSections(prev => ({ ...prev, financial: !prev.financial }))}>
        {renderFieldGrid('financial', FINANCIAL_FIELDS)}
        <SectionNote value={form.sectionNotes.financial} onChange={value => updateNote('financial', value)} lang={lang} />
      </SectionCard>

      <SectionCard emoji="📊" title={t('الاستثمارات والأصول', 'Investments & Assets')} open={openSections.investments} onToggle={() => setOpenSections(prev => ({ ...prev, investments: !prev.investments }))}>
        <div className="flex flex-wrap gap-0.5 bg-[#F1F5F9] rounded-lg p-[3px] mb-4">
          {ASSET_CONFIGS.map(asset => {
            const active = asset.key === activeAsset;
            const count = form.investments[asset.key].length;
            return (
              <button key={asset.key} type="button" onClick={() => setActiveAsset(asset.key)} className={cn('px-3 py-1.5 rounded-md text-[11px] transition-all inline-flex items-center gap-1.5', active ? 'bg-white shadow-sm text-[#0EA5E9] font-bold' : 'text-[#64748B] font-normal')}>
                <span>{asset.emoji}</span>{lang === 'ar' ? asset.labelAr : asset.labelEn}{count > 0 && <span className="rounded-full bg-[rgba(14,165,233,0.2)] text-[#0EA5E9] px-1.5 text-[9px] font-bold">{count}</span>}
              </button>
            );
          })}
        </div>
        {renderInvestmentTable(activeConfig)}
        <SectionNote value={form.sectionNotes.investments} onChange={value => updateNote('investments', value)} lang={lang} />
      </SectionCard>

      <SectionCard emoji="🏦" title={t('البيانات البنكية', 'Banking Information')} open={openSections.banking} onToggle={() => setOpenSections(prev => ({ ...prev, banking: !prev.banking }))}>
        <h4 className="text-[13px] font-bold text-[#1E293B] dark:text-text-primary mb-3">{t('الحساب البنكي الرئيسي', 'Primary Bank Account')}</h4>
        {renderFieldGrid('banking', BANKING_FIELDS.slice(0, 6))}
        <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
          <h4 className="text-[13px] font-bold text-[#1E293B] dark:text-text-primary mb-3">{t('الحساب البنكي الثانوي', 'Secondary Bank Account')}</h4>
          {renderFieldGrid('banking', BANKING_FIELDS.slice(6))}
        </div>
        <SectionNote value={form.sectionNotes.banking} onChange={value => updateNote('banking', value)} lang={lang} />
      </SectionCard>

      <SectionCard emoji="📎" title={t('المستندات والوثائق', 'Documents & Attachments')} open={openSections.documents} onToggle={() => setOpenSections(prev => ({ ...prev, documents: !prev.documents }))}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
          {DOCUMENTS.map(document => {
            const uploaded = form.documents[document.key];
            return (
              <button key={document.key} type="button" onClick={() => setForm(prev => ({ ...prev, documents: { ...prev.documents, [document.key]: !uploaded } }))} className={cn('bg-white dark:bg-tertiary border rounded-xl px-3.5 py-3 flex items-center justify-between gap-3 text-start transition-colors', uploaded ? 'border-[rgba(0,217,126,0.4)]' : 'border-[#E2E8F0] dark:border-border-default')}>
                <span>
                  <span className="block text-xs font-semibold text-[#1E293B] dark:text-text-primary">{lang === 'ar' ? document.labelAr : document.labelEn}</span>
                  <span className="block text-[10px] text-[#64748B] mt-1">{uploaded ? t('✅ تم الرفع', '✅ Uploaded') : t('لم يُرفع بعد', 'Not uploaded yet')}</span>
                </span>
                <span className={cn('w-[30px] h-[30px] rounded-lg border inline-flex items-center justify-center shrink-0', uploaded ? 'bg-[rgba(0,217,126,0.15)] border-[rgba(0,217,126,0.3)] text-[#00D97E]' : 'bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B]')}>
                  {uploaded ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                </span>
              </button>
            );
          })}
        </div>
        {renderFieldGrid('kyc', KYC_FIELDS)}
        <SectionNote value={form.sectionNotes.documents} onChange={value => updateNote('documents', value)} lang={lang} />
      </SectionCard>

      <SectionCard emoji="📝" title={t('ملاحظات المشرف الداخلية', 'Internal Admin Notes')} open={openSections.internal} onToggle={() => setOpenSections(prev => ({ ...prev, internal: !prev.internal }))}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">{renderFieldGrid('internal', INTERNAL_FIELDS.slice(0, 1))}</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{INTERNAL_FIELDS.slice(1, 3).map(config => <FlexField key={config.key} config={config} state={form.internal[config.key]} onValue={value => updateField('internal', config.key, { value })} onVisible={visible => updateField('internal', config.key, { visible })} lang={lang} />)}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{INTERNAL_FIELDS.slice(3).map(config => <FlexField key={config.key} config={config} state={form.internal[config.key]} onValue={value => updateField('internal', config.key, { value })} onVisible={visible => updateField('internal', config.key, { visible })} lang={lang} />)}</div>
        </div>
        <SectionNote value={form.sectionNotes.internal} onChange={value => updateNote('internal', value)} lang={lang} />
      </SectionCard>

      <div className="sticky bottom-0 z-20 bg-[#F8FAFC] dark:bg-secondary border border-[#E2E8F0] dark:border-border-default rounded-xl px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-[0_-8px_24px_rgba(255,255,255,0.85)]">
        <p className="text-xs text-[#64748B]">{t('جميع الحقول اختيارية — فقط الحقول التي اخترت إظهارها ستظهر في لوحة العميل.', 'All fields are optional — only fields marked as visible will appear in the client dashboard.')}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => { setPageMode('list'); resetForm(); }} className="px-5 py-2.5 rounded-lg border border-[#E2E8F0] text-[13px] text-[#64748B]">{t('إلغاء', 'Cancel')}</button>
          <button type="submit" disabled={saving} className={cn('px-6 py-2.5 rounded-lg text-[13px] font-bold text-white inline-flex items-center gap-1.5 disabled:opacity-70', saved ? 'bg-[#00D97E]' : 'bg-[linear-gradient(135deg,#0EA5E9,#38BDF8)]')}>
            {saving ? t('⏳ جارٍ الحفظ...', '⏳ Saving...') : saved ? <><Check className="w-4 h-4" />{t('✓ تم الحفظ!', '✓ Saved!')}</> : <><Save className="w-4 h-4" />{t('💾 حفظ المحفظة', '💾 Save Portfolio')}</>}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div className="space-y-5">
      {renderHeader()}
      {renderStats()}
      {pageMode === 'list' ? renderListMode() : renderFormMode()}

      {deleting && (
        <div className="fixed inset-0 z-[310] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button aria-label="overlay" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleting(null)} />
          <div className="relative w-full max-w-[360px] rounded-2xl bg-white dark:bg-secondary p-7 text-center shadow-[0_25px_50px_rgba(0,0,0,0.2)]">
            <div className="text-[32px] mb-3">🗑️</div>
            <h3 className="text-base font-extrabold text-[#1E293B] dark:text-text-primary">{t('حذف المحفظة', 'Delete Portfolio')}</h3>
            <p className="text-[13px] text-[#64748B] mt-2">{t('هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.', 'Are you sure? This action cannot be undone.')}</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button onClick={() => setDeleting(null)} className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-xs font-bold text-[#64748B]">{t('إلغاء', 'Cancel')}</button>
              <button onClick={handleDelete} className="rounded-lg bg-[linear-gradient(135deg,#EF4444,#DC2626)] px-4 py-2.5 text-xs font-bold text-white">{t('تأكيد الحذف', 'Confirm Delete')}</button>
            </div>
          </div>
        </div>
      )}

      {performancePortfolio && (
        <DialogShell max="max-w-[800px]" onClose={() => setPerformancePortfolio(null)}>
          <div className="p-5">
            <h3 className="text-base font-bold text-[#1E293B] dark:text-text-primary mb-4">{t(`أداء محفظة ${portfolioDisplayName(performancePortfolio, getClient(performancePortfolio.clientId), lang)}`, `Portfolio Performance — ${portfolioDisplayName(performancePortfolio, getClient(performancePortfolio.clientId), lang)}`)}</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs><linearGradient id="portfolioArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.35} /><stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.02} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                  <Area type="monotone" dataKey="value" stroke="#0EA5E9" strokeWidth={2} fill="url(#portfolioArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DialogShell>
      )}

      {compareOpen && (
        <DialogShell max="max-w-[760px]" onClose={() => setCompareOpen(false)}>
          <div className="p-5 space-y-4">
            <h3 className="text-base font-bold text-[#1E293B] dark:text-text-primary">{t('مقارنة المحافظ', 'Compare Portfolios')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-44 overflow-auto rounded-xl border border-[#E2E8F0] p-3">
              {portfolios.map(portfolio => (
                <label key={portfolio.id} className="flex items-center gap-2 text-xs text-text-secondary">
                  <input type="checkbox" checked={compareIds.includes(portfolio.id)} onChange={e => setCompareIds(prev => e.target.checked ? [...prev, portfolio.id] : prev.filter(id => id !== portfolio.id))} />
                  <span className="font-mono">{portfolio.id}</span> — {portfolio.name}
                </label>
              ))}
            </div>
            <DataTable headers={[t('المحفظة', 'Portfolio'), t('القيمة', 'Value'), t('العائد', 'Return'), t('المخاطر', 'Risk'), t('التنويع', 'Diversification')]} minWidth={620}>
              {comparePortfolios.map(portfolio => (
                <Tr key={portfolio.id}>
                  <Td mono bold>{portfolio.id}</Td>
                  <Td mono>{portfolio.value.toLocaleString()} {portfolioCurrency(portfolio)}</Td>
                  <Td mono><span className={portfolio.growth >= 0 ? 'text-[#00D97E] font-bold' : 'text-[#FF4560] font-bold'}>{portfolio.growth >= 0 ? '+' : ''}{portfolio.growth}%</span></Td>
                  <Td>{lang === 'ar' ? portfolio.risk : portfolio.riskEn}</Td>
                  <Td>{t(`${portfolio.holdings.length} فئات`, `${portfolio.holdings.length} classes`)}</Td>
                </Tr>
              ))}
            </DataTable>
          </div>
        </DialogShell>
      )}

      {cloneSource && (
        <DialogShell max="max-w-[520px]" onClose={() => setCloneSource(null)}>
          <div className="p-5 space-y-4">
            <h3 className="text-base font-bold text-[#1E293B] dark:text-text-primary">{t('نسخ محفظة كقالب', 'Copy Portfolio as Template')}</h3>
            <FlexBare label={t('العميل الجديد', 'New Client')}>
              <HybridSelect value={cloneClientId} onChange={setCloneClientId} options={clientOptions} lang={lang} />
            </FlexBare>
            <FlexBare label={t('كود المحفظة', 'Portfolio Code')}>
              <input value={cloneCode} onChange={e => setCloneCode(e.target.value)} className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-xs font-mono outline-none focus:border-[#0EA5E9]" />
            </FlexBare>
            <div className="grid grid-cols-1 gap-2">
              {(['all', 'investments', 'personal'] as CloneMode[]).map(mode => (
                <label key={mode} className="rounded-lg border border-[#E2E8F0] p-3 text-xs font-semibold text-text-secondary flex items-center gap-2">
                  <input type="radio" checked={cloneMode === mode} onChange={() => setCloneMode(mode)} />
                  {mode === 'all' ? t('نسخ كل البيانات', 'Copy all data') : mode === 'investments' ? t('نسخ الاستثمارات فقط', 'Copy investments only') : t('نسخ البيانات الشخصية فقط', 'Copy personal data only')}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <GhostBtn onClick={() => setCloneSource(null)}>{t('إلغاء', 'Cancel')}</GhostBtn>
              <PrimaryBtn icon={Copy} onClick={createFromTemplate}>{t('إنشاء من القالب', 'Create from Template')}</PrimaryBtn>
            </div>
          </div>
        </DialogShell>
      )}

      {alertPortfolio && (
        <DialogShell max="max-w-[460px]" onClose={() => setAlertPortfolio(null)}>
          <div className="p-5 space-y-4">
            <h3 className="text-base font-bold text-[#1E293B] dark:text-text-primary">{t('تنبيه انخفاض المحفظة', 'Portfolio Drawdown Alert')}</h3>
            <FlexBare label={t('نسبة الانخفاض التي تُطلق التنبيه', 'Drawdown percentage that triggers alert')}>
              <input type="number" value={alertForm.threshold} onChange={e => setAlertForm(prev => ({ ...prev, threshold: e.target.value }))} className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-xs outline-none focus:border-[#0EA5E9]" />
            </FlexBare>
            <FlexBare label={t('قناة التنبيه', 'Alert Channel')}>
              <HybridSelect value={alertForm.channel} onChange={value => setAlertForm(prev => ({ ...prev, channel: value }))} options={CHANNEL_OPTIONS} lang={lang} />
            </FlexBare>
            <div className="rounded-lg bg-[#F1F5F9] p-3 text-xs text-[#64748B]">
              {t(`تنبيه نشط: عند انخفاض ${alertForm.threshold || '15'}% من القمة`, `Active alert: drawdown of ${alertForm.threshold || '15'}% from peak`)}
              <div className="mt-2 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden"><div className="h-full bg-[#0EA5E9]" style={{ width: `${Math.max(10, 100 - Number(alertForm.threshold || 15) * 3)}%` }} /></div>
            </div>
            <div className="flex justify-end gap-2"><GhostBtn onClick={() => setAlertPortfolio(null)}>{t('إلغاء', 'Cancel')}</GhostBtn><PrimaryBtn icon={Save} onClick={saveAlert}>{t('حفظ', 'Save')}</PrimaryBtn></div>
          </div>
        </DialogShell>
      )}

      {ToastView}
    </div>
  );
}

function StatBox({ icon, color, label, value }: { icon: string; color: string; label: string; value: React.ReactNode }) {
  return (
    <div className="bg-[#F8FAFC] dark:bg-secondary border border-[#E2E8F0] dark:border-border-default rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${color}15` }}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-[#64748B] truncate">{label}</div>
        <div className="text-[26px] leading-none font-black font-mono truncate" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}

function DialogShell({ children, onClose, max }: { children: React.ReactNode; onClose: () => void; max: string }) {
  return (
    <div className="fixed inset-0 z-[305] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button aria-label="close overlay" onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className={cn('relative w-full max-h-[88vh] overflow-y-auto rounded-2xl bg-white dark:bg-secondary border border-[#E2E8F0] dark:border-border-default shadow-2xl', max)}>
        <button onClick={onClose} className="absolute top-3 end-3 z-10 rounded-lg p-1.5 text-[#64748B] hover:text-[#FF4560] hover:bg-[#FF4560]/5">×</button>
        {children}
      </div>
    </div>
  );
}

function usePortfolioToast() {
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const timer = useRef<number | null>(null);

  const show = (text: string, type: 'success' | 'error' = 'success') => {
    if (timer.current) window.clearTimeout(timer.current);
    setToast({ text, type });
    timer.current = window.setTimeout(() => setToast(null), 3000);
  };

  const ToastView = toast ? (
    <div
      className="fixed bottom-6 end-6 z-[400] rounded-xl px-5 py-3 text-[13px] font-bold text-white shadow-[0_8px_30px_rgba(0,0,0,0.2)] inline-flex items-center gap-2"
      style={{ background: toast.type === 'success' ? '#00D97E' : '#FF4560', animation: 'portfolioToastIn 0.25s ease-out' }}
    >
      {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {toast.text}
      <style>{`@keyframes portfolioToastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  ) : null;

  return { show, ToastView };
}

function FlexBare({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold text-[#64748B] mb-1.5">{label}</span>
      {children}
    </label>
  );
}
