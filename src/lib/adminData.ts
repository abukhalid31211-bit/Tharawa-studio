// ─────────────────────────────────────────────────────────────
// Tharwah Capital — Admin Dashboard Data Layer
// PostgreSQL-backed compatibility layer preserving the existing admin UI contract
// localStorage is used only as a development fallback
// ─────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from 'react';
import { obfuscateData, deobfuscateData, hashPassword } from './crypto';
import { logger } from './logger';
import { api } from './api';
import { useRemoteCollection } from './adminRemote';
import { sanitizeInput, sanitizeEmail, sanitizeCsvValue } from './security';
// Safe: auth.ts does not import adminData.ts, so there is no circular dependency
import { getAdminSession } from './auth';

const CHANGE_EVENT = 'tharwah_admin_data_changed_v2';
const STORE_VERSION = 'v2';

export function emitAdminDataChange(key?: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
}

function load<T>(key: string, seed: T): T {
  if (typeof window === 'undefined') return seed;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return seed;
    try {
      const parsed = JSON.parse(deobfuscateData(raw));
      return parsed && parsed._v === STORE_VERSION ? parsed.data as T : parsed as T;
    } catch {
      return JSON.parse(raw) as T;
    }
  } catch {
    return seed;
  }
}

function persistLocal<T>(key: string, value: T) {
  if (typeof window === 'undefined' || import.meta.env.PROD) return;
  try {
    const serialized = JSON.stringify({ _v: STORE_VERSION, data: value, ts: Date.now() });
    localStorage.setItem(key, obfuscateData(serialized));
  } catch (error) {
    logger.error(`Failed to persist development fallback ${key}`, error);
  }
}

function persist<T>(key: string, value: T) {
  persistLocal(key, value);
  void api.updatePlatformData(key, value)
    .then(() => emitAdminDataChange(key))
    .catch(error => logger.error(`Failed to persist ${key} to PostgreSQL`, error));
}

/**
 * Reactive PostgreSQL-backed collection. The existing tuple contract is kept so
 * every current admin action and every current component remains visually intact.
 */
export function useAdminStore<T>(key: string, seed: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    // Production must never bootstrap administrative state from demo seeds or
    // browser storage. The API/database is the only source of truth.
    if (import.meta.env.PROD) {
      return (Array.isArray(seed) ? [] : {}) as T;
    }
    return load(key, seed);
  });

  const refresh = useCallback(() => {
    void api.getPlatformData(key)
      .then((response: any) => {
        if (response?.data !== null && response?.data !== undefined) setValue(response.data as T);
      })
      .catch(error => {
        if (import.meta.env.PROD) logger.error(`Failed to load ${key} from PostgreSQL`, error);
      });
  }, [key]);

  useEffect(() => {
    refresh();
    const localHandler = (event: Event) => {
      const changedKey = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (!changedKey || changedKey === key) refresh();
    };
    const realtimeHandler = (event: Event) => {
      const changedKey = (event as CustomEvent<any>).detail?.data?.data?.key;
      if (!changedKey || changedKey === key) refresh();
    };
    window.addEventListener(CHANGE_EVENT, localHandler);
    window.addEventListener('tharwah_admin_update', realtimeHandler);
    return () => {
      window.removeEventListener(CHANGE_EVENT, localHandler);
      window.removeEventListener('tharwah_admin_update', realtimeHandler);
    };
  }, [key, refresh]);

  const set = useCallback((nextValue: T | ((prev: T) => T)) => {
    setValue(previous => {
      const next = typeof nextValue === 'function' ? (nextValue as (prev: T) => T)(previous) : nextValue;
      persist(key, next);
      return next;
    });
  }, [key]);

  return [value, set];
}

// ═══════════════════════ Types ═══════════════════════

export type ClientStatus = 'active' | 'pending' | 'suspended';
export type TxType = 'deposit' | 'withdraw' | 'buy' | 'sell' | 'transfer';
export type TxStatus = 'completed' | 'pending' | 'rejected' | 'failed' | 'cancelled';
export type AlertType = 'critical' | 'warning' | 'info' | 'success';

export interface Client {
  id: string;
  name: string;
  nameEn: string;
  email: string;
  phone: string;
  nationalId: string;
  country: string;
  countryEn: string;
  city: string;
  tier: 'Regular' | 'Silver' | 'Gold' | 'Platinum' | 'VIP';
  status: ClientStatus;
  balance: number;
  riskProfile: string;
  riskProfileEn: string;
  advisor: string;
  advisorEn: string;
  joinDate: string;
  lastActivity: string;
  notes?: string;
}

export interface Holding {
  symbol: string;
  name: string;
  nameEn: string;
  weight: number;
  value: number;
  change: number;
}

export interface Portfolio {
  id: string;
  clientId: string;
  name: string;
  nameEn: string;
  strategy: string;
  strategyEn: string;
  risk: string;
  riskEn: string;
  value: number;
  growth: number;
  inception: string;
  holdings: Holding[];
}

export interface AdminTransaction {
  id: string;
  clientId: string;
  type: TxType;
  amount: number;
  currency: string;
  status: TxStatus;
  date: string;
  method: string;
  note: string;
  noteEn: string;
}

export interface MessageReply {
  from: 'client' | 'admin';
  text: string;
  date: string;
}

export interface SupportMessage {
  id: string;
  clientId: string;
  subject: string;
  text: string;
  date: string;
  status: 'pending' | 'answered' | 'closed';
  priority: 'high' | 'medium' | 'low';
  replies: MessageReply[];
  /** ID of the corresponding SupportTicket in the DB (set when message originates from authenticated client) */
  _ticketId?: string;
  /** Origin of the message: 'contact' = public form, 'client' = authenticated client */
  _source?: string;
  _contactName?: string;
  _contactEmail?: string;
  _contactPhone?: string;
}

export interface AdminNotification {
  id: string;
  type: AlertType;
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
  date: string;
  read: boolean;
  page: string;
}

// SECURE SubAdmin - no plaintext password!
export interface SubAdmin {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string; // hashed
  salt: string;
  // Deprecated - migrated
  password?: string; // for migration only, will be removed
  permissions: string[];
  status: 'active' | 'suspended';
  lastActive: string;
  createdAt: string;
}

export type TaskStatus = 'todo' | 'doing' | 'done';
export interface AdminTask {
  id: string;
  title: string;
  titleEn: string;
  desc: string;
  due: string;
  priority: 'high' | 'medium' | 'low';
  status: TaskStatus;
  assignee: string;
  category: string;
  categoryEn: string;
}

export type EventType = 'consultation' | 'meeting' | 'task';
export interface CalendarEvent {
  id: string;
  title: string;
  titleEn: string;
  date: string;
  time: string;
  duration: number;
  type: EventType;
  clientId?: string;
  note: string;
  done: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  experience: string;
  email: string;
  phone: string;
  status: 'active' | 'vacation';
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  actionEn: string;
  date: string;
  ip: string;
  result: 'success' | 'failed';
}

export interface LoginAttempt {
  id: string;
  email: string;
  date: string;
  ip: string;
  result: 'success' | 'failed';
}

export interface PlatformSettings {
  siteName: string;
  siteNameEn: string;
  supportPhone: string;
  supportEmail: string;
  contactAddressAr: string;
  contactAddressEn: string;
  whatsappNumber: string;
  businessHoursAr: string;
  businessHoursEn: string;
  defaultCurrency: string;
  defaultLanguage: 'ar' | 'en';
  maintenanceMode: boolean;
  registrationOpen: boolean;
  twoFactorRequired: boolean;
  sessionTimeout: number;
  weeklyDigest: boolean;
  instantAlerts: boolean;
}

// ═══════════════════════ Seeds with Hashed Passwords ═══════════════════════
// Pre-hashed passwords for demo: all are hashed version of 'admin123' with different salts
// In production these come from the private backend

function createMockHash(password: string, salt: string): string {
  // Simple deterministic mock for seeds - real hashing done async via crypto.ts
  // This is just for initial seeds, will be migrated to real hashes on first use
  let hash = 0;
  const combined = password + salt;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(32, '0') + salt.slice(0, 8);
}

export const CLIENTS_SEED: Client[] = [
  { id: 'C-901', name: 'أحمد الغامدي', nameEn: 'Ahmed Al-Ghamdi', email: 'ahmed.ghamdi@example.com', phone: '+966 55 123 4567', nationalId: '1048752369', country: 'السعودية', countryEn: 'Saudi Arabia', city: 'الرياض', tier: 'Gold', status: 'active', balance: 245000, riskProfile: 'متوازن', riskProfileEn: 'Balanced', advisor: 'خالد بن الوليد', advisorEn: 'Khalid ibn Al-Waleed', joinDate: '2026-07-19', lastActivity: '2026-07-19 14:32', notes: 'يفضل التواصل عبر الجوال بعد السادسة مساءً.' },
  { id: 'C-902', name: 'سارة المنصوري', nameEn: 'Sara Al-Mansouri', email: 'sara.mansouri@example.com', phone: '+966 50 987 1122', nationalId: '1096523841', country: 'السعودية', countryEn: 'Saudi Arabia', city: 'جدة', tier: 'Platinum', status: 'active', balance: 580000, riskProfile: 'نمو جريء', riskProfileEn: 'Aggressive Growth', advisor: 'عبد الرحمن السديس', advisorEn: 'Abdulrahman Al-Sudais', joinDate: '2026-07-18', lastActivity: '2026-07-19 10:15' },
  { id: 'C-903', name: 'خالد العتيبي', nameEn: 'Khaled Al-Otaibi', email: 'khaled.otaibi@example.com', phone: '+966 54 321 7788', nationalId: '1002541976', country: 'السعودية', countryEn: 'Saudi Arabia', city: 'الدمام', tier: 'Silver', status: 'active', balance: 120000, riskProfile: 'محافظ جداً', riskProfileEn: 'Very Conservative', advisor: 'خالد بن الوليد', advisorEn: 'Khalid ibn Al-Waleed', joinDate: '2026-07-16', lastActivity: '2026-07-18 18:04' },
  { id: 'C-904', name: 'فاطمة الزهراني', nameEn: 'Fatima Al-Zahrani', email: 'fatima.zahrani@example.com', phone: '+966 56 444 9021', nationalId: '1077854120', country: 'الإمارات', countryEn: 'UAE', city: 'دبي', tier: 'VIP', status: 'active', balance: 1250000, riskProfile: 'متوازن مائل للنمو', riskProfileEn: 'Balanced Growth', advisor: 'عبد الرحمن السديس', advisorEn: 'Abdulrahman Al-Sudais', joinDate: '2026-07-14', lastActivity: '2026-07-19 09:41' },
  { id: 'C-905', name: 'عبد الله الشمري', nameEn: 'Abdullah Al-Shammari', email: 'abdullah.shammari@example.com', phone: '+966 53 882 3410', nationalId: '1033698452', country: 'السعودية', countryEn: 'Saudi Arabia', city: 'حائل', tier: 'Regular', status: 'pending', balance: 0, riskProfile: 'غير محدد', riskProfileEn: 'Undefined', advisor: '—', advisorEn: '—', joinDate: '2026-07-17', lastActivity: '2026-07-17 12:00' },
  { id: 'C-906', name: 'نورة السبيعي', nameEn: 'Noura Al-Subaie', email: 'noura.subaie@example.com', phone: '+966 59 114 6632', nationalId: '1088904571', country: 'الكويت', countryEn: 'Kuwait', city: 'مدينة الكويت', tier: 'Gold', status: 'active', balance: 340000, riskProfile: 'متوازن', riskProfileEn: 'Balanced', advisor: 'خالد بن الوليد', advisorEn: 'Khalid ibn Al-Waleed', joinDate: '2026-07-14', lastActivity: '2026-07-18 16:22' },
  { id: 'C-907', name: 'فهد القحطاني', nameEn: 'Fahad Al-Qahtani', email: 'fahad.qahtani@example.com', phone: '+966 57 730 2214', nationalId: '1050217993', country: 'السعودية', countryEn: 'Saudi Arabia', city: 'أبها', tier: 'Silver', status: 'pending', balance: 0, riskProfile: 'غير محدد', riskProfileEn: 'Undefined', advisor: '—', advisorEn: '—', joinDate: '2026-07-12', lastActivity: '2026-07-12 11:30' },
  { id: 'C-908', name: 'هند القحطاني', nameEn: 'Hind Al-Qahtani', email: 'hind.qahtani@example.com', phone: '+966 58 223 9014', nationalId: '1022417856', country: 'قطر', countryEn: 'Qatar', city: 'الدوحة', tier: 'Platinum', status: 'active', balance: 760000, riskProfile: 'نمو', riskProfileEn: 'Growth', advisor: 'عبد الرحمن السديس', advisorEn: 'Abdulrahman Al-Sudais', joinDate: '2026-07-08', lastActivity: '2026-07-19 08:12' },
  { id: 'C-909', name: 'مشعل الدوسري', nameEn: 'Mishal Al-Dosari', email: 'mishal.dosari@example.com', phone: '+966 52 690 8123', nationalId: '1099633214', country: 'السعودية', countryEn: 'Saudi Arabia', city: 'الرياض', tier: 'Regular', status: 'suspended', balance: 18500, riskProfile: 'محافظ', riskProfileEn: 'Conservative', advisor: 'خالد بن الوليد', advisorEn: 'Khalid ibn Al-Waleed', joinDate: '2026-06-30', lastActivity: '2026-07-15 13:44' },
];

export const PORTFOLIOS_SEED: Portfolio[] = [
  { id: 'PF-001', clientId: 'C-901', name: 'المحفظة المتوازنة', nameEn: 'Balanced Portfolio', strategy: 'توزيع متوازن بين الأسهم والصكوك', strategyEn: 'Balanced split between equities and sukuk', risk: 'متوازن', riskEn: 'Balanced', value: 245000, growth: 18.5, inception: '2026-01-15',
    holdings: [
      { symbol: '2222.SR', name: 'أرامكو السعودية', nameEn: 'Saudi Aramco', weight: 30, value: 73500, change: 1.2 },
      { symbol: 'SPUS', name: 'صندوق SP الأمريكي المتوافق', nameEn: 'SPUS Sharia ETF', weight: 25, value: 61250, change: 2.1 },
      { symbol: 'SUKUK-KSA', name: 'صكوك حكومية سعودية', nameEn: 'KSA Sovereign Sukuk', weight: 25, value: 61250, change: 0.4 },
      { symbol: 'XAU', name: 'الذهب', nameEn: 'Gold', weight: 20, value: 49000, change: 0.9 },
    ] },
  { id: 'PF-002', clientId: 'C-902', name: 'محفظة النمو الفائق', nameEn: 'Ultra Growth Portfolio', strategy: 'تركيز على أسهم النمو والتقنية العالمية', strategyEn: 'Focus on global growth and tech equities', risk: 'نمو جريء', riskEn: 'Aggressive', value: 580000, growth: 24.1, inception: '2025-11-03',
    holdings: [
      { symbol: 'AAPL', name: 'أبل', nameEn: 'Apple Inc.', weight: 20, value: 116000, change: 0.8 },
      { symbol: 'MSFT', name: 'مايكروسوفت', nameEn: 'Microsoft', weight: 20, value: 116000, change: 1.4 },
      { symbol: 'BTC', name: 'بيتكوين', nameEn: 'Bitcoin', weight: 15, value: 87000, change: 2.4 },
      { symbol: 'TSLA', name: 'تسلا', nameEn: 'Tesla', weight: 15, value: 87000, change: -1.1 },
      { symbol: 'SPUS', name: 'صندوق SP الأمريكي', nameEn: 'SPUS ETF', weight: 30, value: 174000, change: 2.1 },
    ] },
  { id: 'PF-003', clientId: 'C-903', name: 'المحفظة الآمنة للدخل', nameEn: 'Safe Income Portfolio', strategy: 'صكوك وعوائد ثابتة منخفضة المخاطر', strategyEn: 'Sukuk and low-risk fixed income', risk: 'محافظ جداً', riskEn: 'Very Conservative', value: 120000, growth: 9.4, inception: '2026-03-22',
    holdings: [
      { symbol: 'SUKUK-KSA', name: 'صكوك حكومية سعودية', nameEn: 'KSA Sovereign Sukuk', weight: 60, value: 72000, change: 0.4 },
      { symbol: 'REIT-RYAD', name: 'صندوق الرياض للريت', nameEn: 'Riyad REIT', weight: 25, value: 30000, change: 0.7 },
      { symbol: 'CASH', name: 'النقد وما يعادله', nameEn: 'Cash & Equivalents', weight: 15, value: 18000, change: 0.0 },
    ] },
  { id: 'PF-004', clientId: 'C-904', name: 'محفظة كبار المستثمرين', nameEn: 'VIP Wealth Portfolio', strategy: 'تنويع عالمي شامل مع معادن ثمينة', strategyEn: 'Global diversification with precious metals', risk: 'متوازن مائل للنمو', riskEn: 'Balanced Growth', value: 1250000, growth: 21.7, inception: '2025-08-10',
    holdings: [
      { symbol: 'XAU', name: 'الذهب', nameEn: 'Gold', weight: 20, value: 250000, change: 0.9 },
      { symbol: 'SPUS', name: 'صندوق SP الأمريكي', nameEn: 'SPUS ETF', weight: 25, value: 312500, change: 2.1 },
      { symbol: '2222.SR', name: 'أرامكو السعودية', nameEn: 'Saudi Aramco', weight: 15, value: 187500, change: 1.2 },
      { symbol: 'BTC', name: 'بيتكوين', nameEn: 'Bitcoin', weight: 10, value: 125000, change: 2.4 },
      { symbol: 'SUKUK-INTL', name: 'صكوك دولية', nameEn: 'International Sukuk', weight: 30, value: 375000, change: 0.5 },
    ] },
  { id: 'PF-005', clientId: 'C-906', name: 'محفظة النمو المتوازن', nameEn: 'Balanced Growth Portfolio', strategy: 'أسهم خليجية وعالمية بنسب متساوية', strategyEn: 'Equal GCC and global equities', risk: 'متوازن', riskEn: 'Balanced', value: 340000, growth: 14.2, inception: '2026-02-18',
    holdings: [
      { symbol: 'TADAWUL30', name: 'مؤشر تاسي 30', nameEn: 'Tadawul 30 Index', weight: 35, value: 119000, change: 0.6 },
      { symbol: 'SPUS', name: 'صندوق SP الأمريكي', nameEn: 'SPUS ETF', weight: 35, value: 119000, change: 2.1 },
      { symbol: 'XAU', name: 'الذهب', nameEn: 'Gold', weight: 30, value: 102000, change: 0.9 },
    ] },
];

export const TRANSACTIONS_SEED: AdminTransaction[] = [
  { id: 'TX-1101', clientId: 'C-901', type: 'deposit', amount: 42600, currency: 'SAR', status: 'completed', date: '2026-07-19 11:20', method: 'تحويل بنكي', note: 'إيداع شهري مجدول', noteEn: 'Scheduled monthly deposit' },
  { id: 'TX-1098', clientId: 'C-904', type: 'withdraw', amount: 15000, currency: 'SAR', status: 'completed', date: '2026-07-18 16:45', method: 'تحويل بنكي', note: 'سحب جزئي — طلب العميلة', noteEn: 'Partial withdrawal — client request' },
  { id: 'TX-1097', clientId: 'C-905', type: 'buy', amount: 85300, currency: 'SAR', status: 'pending', date: '2026-07-18 13:10', method: 'محفظة داخلية', note: 'شراء وحدات SPUS — بانتظار الموافقة', noteEn: 'Buy SPUS units — awaiting approval' },
  { id: 'TX-1095', clientId: 'C-908', type: 'sell', amount: 22300, currency: 'SAR', status: 'completed', date: '2026-07-17 10:32', method: 'محفظة داخلية', note: 'بيع جزئي أسهم تسلا', noteEn: 'Partial Tesla shares sale' },
  { id: 'TX-1093', clientId: 'C-901', type: 'deposit', amount: 100000, currency: 'SAR', status: 'completed', date: '2026-07-16 09:05', method: 'شيك مصدق', note: 'إيداع رأس مال إضافي', noteEn: 'Additional capital deposit' },
  { id: 'TX-1092', clientId: 'C-906', type: 'transfer', amount: 32000, currency: 'SAR', status: 'pending', date: '2026-07-16 14:55', method: 'تحويل داخلي', note: 'نقل بين محفظتين', noteEn: 'Transfer between portfolios' },
  { id: 'TX-1090', clientId: 'C-909', type: 'withdraw', amount: 5000, currency: 'SAR', status: 'rejected', date: '2026-07-15 15:40', method: 'تحويل بنكي', note: 'مرفوض — حساب البنك غير موثق', noteEn: 'Rejected — unverified bank account' },
  { id: 'TX-1088', clientId: 'C-902', type: 'deposit', amount: 76500, currency: 'SAR', status: 'completed', date: '2026-07-14 12:18', method: 'تحويل بنكي', note: 'إيداع مجدول', noteEn: 'Scheduled deposit' },
  { id: 'TX-1085', clientId: 'C-903', type: 'buy', amount: 12000, currency: 'SAR', status: 'pending', date: '2026-07-13 11:47', method: 'محفظة داخلية', note: 'شراء صكوك حكومية', noteEn: 'Buy sovereign sukuk' },
  { id: 'TX-1082', clientId: 'C-904', type: 'deposit', amount: 250000, currency: 'SAR', status: 'completed', date: '2026-07-10 10:00', method: 'تحويل بنكي', note: 'إيداع ربع سنوي', noteEn: 'Quarterly deposit' },
];

export const MESSAGES_SEED: SupportMessage[] = [
  { id: 'TK-301', clientId: 'C-901', subject: 'طلب تحديث المحفظة الاستثمارية', text: 'أرغب في تغيير وزيادة نسبة العقار بنسبة 5% إضافية وتخفيض الصكوك. هل يمكن تنفيذ ذلك قبل نهاية الشهر؟', date: '2026-07-18 20:14', status: 'pending', priority: 'high', replies: [] },
  { id: 'TK-300', clientId: 'C-902', subject: 'استفسار بخصوص التقرير السنوي', text: 'أريد معرفة موعد تسليم كشف الحساب الضريبي السنوي لعام 2025.', date: '2026-07-10 09:30', status: 'answered', priority: 'medium', replies: [{ from: 'admin', text: 'سيتم إرسال كشف الحساب الضريبي إلى بريدك المسجل خلال الأسبوع الأول من أغسطس.', date: '2026-07-10 14:02' }] },
  { id: 'TK-299', clientId: 'C-904', subject: 'طلب اجتماع مع المستشار', text: 'أرغب بحجز جلسة استشارية لمناقشة إعادة هيكلة المحفظة قبل الربع القادم.', date: '2026-07-09 17:41', status: 'answered', priority: 'high', replies: [{ from: 'admin', text: 'تم حجز موعدك يوم الثلاثاء القادم الساعة 11 صباحاً مع الأستاذ عبد الرحمن.', date: '2026-07-09 19:15' }] },
  { id: 'TK-298', clientId: 'C-908', subject: 'مشكلة في الدخول للتطبيق', text: 'لا أستطيع تسجيل الدخول من تطبيق الجوال منذ التحديث الأخير.', date: '2026-07-08 08:22', status: 'closed', priority: 'medium', replies: [{ from: 'admin', text: 'تم حل المشكلة في الإصدار 2.4.1 — يرجى تحديث التطبيق.', date: '2026-07-08 11:00' }] },
  { id: 'TK-297', clientId: 'C-906', subject: 'سؤال عن رسوم الإدارة', text: 'هل رسوم الإدارة السنوية محسوبة من إجمالي المحفظة أم من الأرباح فقط؟', date: '2026-07-06 13:05', status: 'answered', priority: 'low', replies: [{ from: 'admin', text: 'رسوم الإدارة 1% سنوياً من إجمالي قيمة المحفظة وتُخصم ربعياً.', date: '2026-07-06 15:44' }] },
];

export const NOTIFICATIONS_SEED: AdminNotification[] = [
  { id: 'N-1', type: 'critical', title: 'عميل جديد بانتظار الموافقة', titleEn: 'New Client Awaiting Approval', desc: '3 طلبات تسجيل جديدة تحتاج مراجعة وإقرار', descEn: '3 new registration requests need review and approval', date: '2026-07-19 13:55', read: false, page: '/Akadmin/clients' },
  { id: 'N-2', type: 'warning', title: 'معاملات معلقة تجاوزت 24 ساعة', titleEn: 'Pending Transactions Exceeded 24h', desc: '3 معاملات لم تُعالج منذ أمس — تحتاج مراجعة', descEn: '3 transactions not processed since yesterday — needs review', date: '2026-07-19 13:00', read: false, page: '/Akadmin/transactions' },
  { id: 'N-3', type: 'info', title: 'رسائل جديدة من العملاء', titleEn: 'New Messages from Clients', desc: 'رسالة واحدة في انتظار الرد من فريق الدعم', descEn: '1 message awaiting support team response', date: '2026-07-19 11:20', read: false, page: '/Akadmin/messages' },
  { id: 'N-4', type: 'success', title: 'تم إكمال صفقة ناجحة', titleEn: 'Successful Trade Completed', desc: 'صفقة شراء أرامكو لعميل أحمد الغامدي بقيمة 42,600 ر.س مكتملة', descEn: 'Aramco purchase for client Ahmed Al-Ghamdi worth SAR 42,600 completed', date: '2026-07-18 18:30', read: true, page: '/Akadmin/transactions' },
  { id: 'N-5', type: 'warning', title: 'محفظة تحتاج إعادة توازن', titleEn: 'Portfolio Needs Rebalancing', desc: 'محفظة PF-003 انحرفت عن الاستراتيجية المتفق عليها بنسبة 18%', descEn: 'Portfolio PF-003 deviated 18% from agreed strategy', date: '2026-07-18 14:20', read: true, page: '/Akadmin/portfolios' },
  { id: 'N-6', type: 'info', title: 'نسخة احتياطية مجدولة', titleEn: 'Scheduled Backup', desc: 'اكتملت النسخة الاحتياطية اليومية لقاعدة البيانات بنجاح', descEn: 'Daily database backup completed successfully', date: '2026-07-18 03:00', read: true, page: '/Akadmin/security' },
];

// SECURE SEEDS - hashed passwords
export const SUB_ADMINS_SEED: SubAdmin[] = [
  { 
    id: 'SA-1', 
    name: 'أحمد السديري', 
    email: 'ahmed.sub@tharwah.com', 
    phone: '+966 55 010 2030', 
    passwordHash: createMockHash('admin123', 'salt-ahmed-2026-secure-1'),
    salt: 'salt-ahmed-2026-secure-1',
    permissions: ['clients', 'messages', 'transactions'], 
    status: 'active', 
    lastActive: '2026-07-19 09:12', 
    createdAt: '2026-05-01' 
  },
  { 
    id: 'SA-2', 
    name: 'ريم العنزي', 
    email: 'reem.sub@tharwah.com', 
    phone: '+966 55 040 5060', 
    passwordHash: createMockHash('admin123', 'salt-reem-2026-secure-2'),
    salt: 'salt-reem-2026-secure-2',
    permissions: ['content', 'reports'], 
    status: 'active', 
    lastActive: '2026-07-18 17:38', 
    createdAt: '2026-06-11' 
  },
  { 
    id: 'SA-3', 
    name: 'تركي الحربي', 
    email: 'turki.sub@tharwah.com', 
    phone: '+966 55 070 8090', 
    passwordHash: createMockHash('admin123', 'salt-turki-2026-secure-3'),
    salt: 'salt-turki-2026-secure-3',
    permissions: ['clients'], 
    status: 'suspended', 
    lastActive: '2026-07-02 12:22', 
    createdAt: '2026-06-20' 
  },
];

export const TASKS_SEED: AdminTask[] = [
  { id: 'TSK-1', title: 'مراجعة طلبات التسجيل الجديدة', titleEn: 'Review new registration requests', desc: 'التحقق من مستندات 3 عملاء جدد واعتماد حساباتهم', due: '2026-07-19', priority: 'high', status: 'doing', assignee: 'Super Admin', category: 'عملاء', categoryEn: 'Clients' },
  { id: 'TSK-2', title: 'اعتماد المعاملات المعلقة', titleEn: 'Approve pending transactions', desc: '3 معاملات بانتظار الموافقة تجاوز بعضها 24 ساعة', due: '2026-07-19', priority: 'high', status: 'todo', assignee: 'Super Admin', category: 'مالية', categoryEn: 'Finance' },
  { id: 'TSK-3', title: 'تحديث تقرير الأداء الشهري', titleEn: 'Update monthly performance report', desc: 'تجهيز تقرير يوليو قبل اجتماع مجلس الإدارة', due: '2026-07-22', priority: 'medium', status: 'todo', assignee: 'Super Admin', category: 'تقارير', categoryEn: 'Reports' },
  { id: 'TSK-4', title: 'الرد على استفسارات التذاكر', titleEn: 'Reply to support tickets', desc: 'تذكرة TK-301 المفتوحة من أحمد الغامدي بأولوية عالية', due: '2026-07-20', priority: 'medium', status: 'todo', assignee: 'أحمد السديري', category: 'دعم', categoryEn: 'Support' },
  { id: 'TSK-5', title: 'مراجعة محتوى صفحة من نحن', titleEn: 'Review About page content', desc: 'تحديث سيرة الفريق الجديد ونشر التعديلات', due: '2026-07-25', priority: 'low', status: 'done', assignee: 'ريم العنزي', category: 'محتوى', categoryEn: 'Content' },
  { id: 'TSK-6', title: 'فحص سجلات الأمان الأسبوعي', titleEn: 'Weekly security log review', desc: 'مراجعة محاولات الدخول الفاشلة وتحديث قائمة الحظر', due: '2026-07-21', priority: 'medium', status: 'todo', assignee: 'Super Admin', category: 'أمان', categoryEn: 'Security' },
];

export const EVENTS_SEED: CalendarEvent[] = [
  { id: 'EV-1', title: 'استشارة — أحمد الغامدي', titleEn: 'Consultation — Ahmed Al-Ghamdi', date: '2026-07-19', time: '16:00', duration: 45, type: 'consultation', clientId: 'C-901', note: 'مناقشة طلب زيادة نسبة العقار', done: false },
  { id: 'EV-2', title: 'اجتماع مجلس الإدارة الأسبوعي', titleEn: 'Weekly Board Meeting', date: '2026-07-20', time: '10:00', duration: 90, type: 'meeting', note: 'عرض تقرير الأداء الشهري', done: false },
  { id: 'EV-3', title: 'استشارة — فاطمة الزهراني', titleEn: 'Consultation — Fatima Al-Zahrani', date: '2026-07-21', time: '11:00', duration: 60, type: 'consultation', clientId: 'C-904', note: 'إعادة هيكلة المحفظة', done: false },
  { id: 'EV-4', title: 'مراجعة الحوكمة الربعية', titleEn: 'Quarterly Governance Review', date: '2026-07-23', time: '13:00', duration: 120, type: 'meeting', note: 'مع الفريق القانوني', done: false },
  { id: 'EV-5', title: 'تجهيز تقرير يوليو', titleEn: 'Prepare July report', date: '2026-07-22', time: '09:00', duration: 60, type: 'task', note: 'قبل اجتماع المجلس', done: false },
  { id: 'EV-6', title: 'استشارة — نورة السبيعي', titleEn: 'Consultation — Noura Al-Subaie', date: '2026-07-24', time: '15:30', duration: 30, type: 'consultation', clientId: 'C-906', note: 'تنويع المحفظة', done: false },
];

export const TEAM_SEED: TeamMember[] = [
  { id: 'TM-1', name: 'خالد بن الوليد', nameEn: 'Khalid ibn Al-Waleed', role: 'رئيس قسم استشارات وإدارة الثروات', roleEn: 'Head of Wealth Advisory', experience: '12 عاماً', email: 'khalid@tharwah.com', phone: '+966 55 111 2233', status: 'active' },
  { id: 'TM-2', name: 'عبد الرحمن السديس', nameEn: 'Abdulrahman Al-Sudais', role: 'مستشار مالي معتمد للشريعة', roleEn: 'Certified Sharia Financial Advisor', experience: '15 عاماً', email: 'asudais@tharwah.com', phone: '+966 55 444 5566', status: 'active' },
  { id: 'TM-3', name: 'لمى العتيبي', nameEn: 'Lama Al-Otaibi', role: 'مديرة علاقات كبار العملاء', roleEn: 'VIP Client Relations Manager', experience: '8 أعوام', email: 'lama@tharwah.com', phone: '+966 55 777 8899', status: 'vacation' },
];

export const AUDIT_SEED: AuditLog[] = [
  { id: 'A-1', actor: 'admin@tharwah.com', action: 'تسجيل دخول ناجح (Super Admin)', actionEn: 'Successful sign-in (Super Admin)', date: '2026-07-19 13:40', ip: '—', result: 'success' },
  { id: 'A-2', actor: 'admin@tharwah.com', action: 'اعتماد معاملة TX-1101', actionEn: 'Approved transaction TX-1101', date: '2026-07-19 13:42', ip: '—', result: 'success' },
  { id: 'A-3', actor: 'ahmed.sub@tharwah.com', action: 'تسجيل دخول ناجح (مشرف فرعي)', actionEn: 'Successful sign-in (Sub Admin)', date: '2026-07-19 09:12', ip: '94.77.201.8', result: 'success' },
  { id: 'A-4', actor: 'unknown@test.com', action: 'محاولة دخول فاشلة — بريد غير مسجل', actionEn: 'Failed sign-in — unregistered email', date: '2026-07-19 02:14', ip: '41.222.19.70', result: 'failed' },
  { id: 'A-5', actor: 'admin@tharwah.com', action: 'تعديل محتوى قسم البطل', actionEn: 'Edited Hero section content', date: '2026-07-18 16:05', ip: '—', result: 'success' },
  { id: 'A-6', actor: 'turki.sub@tharwah.com', action: 'محاولة دخول — حساب موقوف', actionEn: 'Sign-in attempt — suspended account', date: '2026-07-18 08:31', ip: '37.104.55.190', result: 'failed' },
];

export const LOGIN_ATTEMPTS_SEED: LoginAttempt[] = [
  { id: 'L-1', email: 'admin@tharwah.com', date: '2026-07-19 13:40', ip: '—', result: 'success' },
  { id: 'L-2', email: 'ahmed.sub@tharwah.com', date: '2026-07-19 09:12', ip: '94.77.201.8', result: 'success' },
  { id: 'L-3', email: 'unknown@test.com', date: '2026-07-19 02:14', ip: '41.222.19.70', result: 'failed' },
  { id: 'L-4', email: 'root@tharwah.com', date: '2026-07-18 23:51', ip: '41.222.19.70', result: 'failed' },
  { id: 'L-5', email: 'admin@tharwah.com', date: '2026-07-18 22:03', ip: '—', result: 'success' },
];

export const SETTINGS_SEED: PlatformSettings = {
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
  twoFactorRequired: true,
  sessionTimeout: 8,
  weeklyDigest: true,
  instantAlerts: true,
};

// ═══════════════════════ CMS seeds ═══════════════════════

export interface HeroContent {
  badge: string; badgeEn: string;
  title: string; titleEn: string;
  subtitle: string; subtitleEn: string;
  ctaPrimary: string; ctaPrimaryEn: string;
  ctaSecondary: string; ctaSecondaryEn: string;
  stats: { value: string; label: string; labelEn: string }[];
}
export const HERO_SEED: HeroContent = {
  badge: 'مرخصة ومنظمة — هيئة السوق المالية',
  badgeEn: 'Licensed & Regulated — CMA',
  title: 'نمِّ ثروتك بأمان وذكاء متوافق مع الشريعة',
  titleEn: 'Grow Your Wealth Securely with Sharia-Compliant Intelligence',
  subtitle: 'منصة استثمارية سعودية متكاملة تجمع بين خبرة المستشارين الماليين وقوة التحليلات الذكية لبناء مستقبلك المالي بثقة.',
  subtitleEn: 'A fully integrated Saudi investment platform combining expert advisors with intelligent analytics to build your financial future with confidence.',
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
};

export interface ServiceItem { id: string; icon: string; title: string; titleEn: string; desc: string; descEn: string; active: boolean }
export const SERVICES_SEED: ServiceItem[] = [
  { id: 'S-1', icon: '📊', title: 'إدارة المحافظ الاستثمارية', titleEn: 'Portfolio Management', desc: 'إدارة احترافية لمحفظتك باستراتيجيات مخصصة تناسب أهدافك ومستوى المخاطر.', descEn: 'Professional management of your portfolio with tailored strategies matching your goals and risk level.', active: true },
  { id: 'S-2', icon: '🕌', title: 'الاستثمار المتوافق مع الشريعة', titleEn: 'Sharia-Compliant Investing', desc: 'منتجات استثمارية مؤكدة التوافق مع أحكام الشريعة عبر هيئة شرعية معتمدة.', descEn: 'Investment products certified Sharia-compliant by an accredited Sharia board.', active: true },
  { id: 'S-3', icon: '🌍', title: 'الوصول للأسواق العالمية', titleEn: 'Global Market Access', desc: 'تداول في أكثر من 40 سوقاً عالمياً من منصة واحدة بعمولات تنافسية.', descEn: 'Trade over 40 global markets from one platform with competitive fees.', active: true },
  { id: 'S-4', icon: '🤖', title: 'التحليلات الذكية', titleEn: 'Smart Analytics', desc: 'تقارير ورؤى مدعومة بالذكاء الاصطناعي لمتابعة أداء استثماراتك لحظة بلحظة.', descEn: 'AI-powered reports and insights to track your investments in real time.', active: true },
  { id: 'S-5', icon: '👨‍💼', title: 'مستشار مالي شخصي', titleEn: 'Personal Financial Advisor', desc: 'مستشار معتمد يرافقك في كل خطوة من رحلتك الاستثمارية.', descEn: 'A certified advisor accompanies you at every step of your investment journey.', active: true },
  { id: 'S-6', icon: '🎓', title: 'التثقيف الاستثماري', titleEn: 'Investment Education', desc: 'دورات وورش عمل لرفع وعيك المالي واتخاذ قرارات استثمارية مدروسة.', descEn: 'Courses and workshops to raise your financial literacy for well-informed decisions.', active: false },
];

export interface MarketItem { id: string; name: string; nameEn: string; symbol: string; price: string; change: number; category: string; categoryEn: string; visible: boolean }
export const MARKETS_SEED: MarketItem[] = [
  { id: 'M-1', name: 'بيتكوين', nameEn: 'Bitcoin', symbol: 'BTC/USD', price: '$67,240', change: 2.4, category: 'عملات رقمية', categoryEn: 'Crypto', visible: true },
  { id: 'M-2', name: 'إيثيريوم', nameEn: 'Ethereum', symbol: 'ETH/USD', price: '$3,180', change: 1.8, category: 'عملات رقمية', categoryEn: 'Crypto', visible: true },
  { id: 'M-3', name: 'أرامكو السعودية', nameEn: 'Saudi Aramco', symbol: '2222.SR', price: '35.20 ر.س', change: -0.3, category: 'أسهم', categoryEn: 'Equities', visible: true },
  { id: 'M-4', name: 'الذهب', nameEn: 'Gold', symbol: 'XAU/USD', price: '$2,340', change: 0.9, category: 'سلع', categoryEn: 'Commodities', visible: true },
  { id: 'M-5', name: 'برنت', nameEn: 'Brent Crude', symbol: 'BZ', price: '$83.10', change: -0.4, category: 'طاقة', categoryEn: 'Energy', visible: true },
  { id: 'M-6', name: 'أبل', nameEn: 'Apple', symbol: 'AAPL', price: '$192.53', change: 0.8, category: 'أسهم', categoryEn: 'Equities', visible: true },
  { id: 'M-7', name: 'مؤشر تاسي', nameEn: 'Tadawul All Share', symbol: 'TASI', price: '12,340', change: 0.6, category: 'مؤشرات', categoryEn: 'Indices', visible: false },
];

export interface FaqItem { id: string; question: string; questionEn: string; answer: string; answerEn: string; category: string; published: boolean; order: number }
export const FAQ_SEED: FaqItem[] = [
  { id: 'F-1', question: 'كيف أبدأ الاستثمار مع ثروة كابيتال؟', questionEn: 'How do I start investing with Tharwah Capital?', answer: 'أنشئ حسابك، أكمل التحقق من الهوية، ثم أودع مبلغ البداية واختر الاستراتيجية المناسبة لك بمساعدة مستشارك.', answerEn: 'Create your account, complete identity verification, deposit your starting amount, and choose a suitable strategy with your advisor.', category: 'البداية', published: true, order: 1 },
  { id: 'F-2', question: 'هل الاستثمارات متوافقة مع الشريعة؟', questionEn: 'Are the investments Sharia-compliant?', answer: 'نعم، جميع منتجاتنا تخضع لمراجعة هيئة شرعية معتمدة وتُستبعد الأسهم غير المتوافقة آلياً.', answerEn: 'Yes, all our products are reviewed by an accredited Sharia board and non-compliant stocks are automatically excluded.', category: 'الشريعة', published: true, order: 2 },
  { id: 'F-3', question: 'ما هي رسوم الإدارة؟', questionEn: 'What are the management fees?', answer: '1% سنوياً من إجمالي قيمة المحفظة، تخصم على أربعة أقساط ربعية دون أي رسوم خفية.', answerEn: '1% annually of total portfolio value, deducted quarterly with no hidden fees.', category: 'الرسوم', published: true, order: 3 },
  { id: 'F-4', question: 'كم تستغرق عملية السحب؟', questionEn: 'How long does withdrawal take?', answer: 'تُعالج طلبات السحب خلال 1-3 أيام عمل بعد اعتمادها من فريق العمليات.', answerEn: 'Withdrawal requests are processed within 1-3 business days after operations team approval.', category: 'العمليات', published: true, order: 4 },
  { id: 'F-5', question: 'هل يوجد حد أدنى للاستثمار؟', questionEn: 'Is there a minimum investment?', answer: 'الحد الأدنى 10,000 ريال للمحفظة المتوازنة و100,000 ريال لمحافظ كبار المستثمرين.', answerEn: 'SAR 10,000 minimum for the balanced portfolio and SAR 100,000 for VIP portfolios.', category: 'البداية', published: false, order: 5 },
];

export interface TestimonialItem { id: string; name: string; nameEn: string; role: string; roleEn: string; text: string; textEn: string; rating: number; status: 'approved' | 'pending' | 'rejected'; date: string }
export const TESTIMONIALS_SEED: TestimonialItem[] = [
  { id: 'T-1', name: 'م. سلطان الحربي', nameEn: 'Eng. Sultan Al-Harbi', role: 'مستثمر منذ 2023', roleEn: 'Investor since 2023', text: 'أفضل قرار اتخذته مالياً. فريق محترف وشفافية كاملة في التقارير، والعوائد فاقت توقعاتي.', textEn: 'The best financial decision I have made. Professional team, full reporting transparency, and returns exceeded my expectations.', rating: 5, status: 'approved', date: '2026-06-20' },
  { id: 'T-2', name: 'أمل الدوسري', nameEn: 'Amal Al-Dosari', role: 'صاحبة أعمال', roleEn: 'Business Owner', text: 'المستشار الشخصي يرد على استفساراتي بسرعة ويشرح كل خطوة. أشعر أن أموالي في أيدٍ أمينة.', textEn: 'My personal advisor answers quickly and explains every step. I feel my money is in safe hands.', rating: 5, status: 'approved', date: '2026-07-02' },
  { id: 'T-3', name: 'يوسف القحطاني', nameEn: 'Yousef Al-Qahtani', role: 'طبيب', roleEn: 'Physician', text: 'المنصة سهلة والتقارير الشهرية واضحة، لكن أتمنى إضافة المزيد من أسواق آسيا.', textEn: 'The platform is easy and monthly reports are clear, but I hope they add more Asian markets.', rating: 4, status: 'pending', date: '2026-07-15' },
  { id: 'T-4', name: 'منيرة السبيعي', nameEn: 'Munira Al-Subaie', role: 'مستثمرة جديدة', roleEn: 'New Investor', text: 'بدأت بمبلغ صغير والتجربة مشجعة جداً حتى الآن. خدمة العملاء ممتازة.', textEn: 'I started small and the experience is very encouraging so far. Customer service is excellent.', rating: 4, status: 'pending', date: '2026-07-17' },
];

export interface AboutContent {
  missionTitle: string; missionTitleEn: string;
  mission: string; missionEn: string;
  visionTitle: string; visionTitleEn: string;
  vision: string; visionEn: string;
  story: string; storyEn: string;
  values: { id: string; icon: string; title: string; titleEn: string; desc: string; descEn: string }[];
  team?: { avatar?: string; nameAr: string; nameEn: string; roleAr: string; roleEn: string; descAr: string; descEn: string }[];
}
export const ABOUT_SEED: AboutContent = {
  missionTitle: 'رسالتنا', missionTitleEn: 'Our Mission',
  mission: 'تمكين كل مستثمر في المنطقة من بناء ثروة مستدامة عبر حلول استثمارية شفافة ومتوافقة مع الشريعة ومدعومة بأحدث التقنيات.',
  missionEn: 'Empowering every investor in the region to build sustainable wealth through transparent, Sharia-compliant, technology-driven investment solutions.',
  visionTitle: 'رؤيتنا', visionTitleEn: 'Our Vision',
  vision: 'أن نكون المنصة الاستثمارية الأولى في الشرق الأوسط بحلول 2030.',
  visionEn: 'To be the leading investment platform in the Middle East by 2030.',
  story: 'تأسست ثروة كابيتال عام 2019 في الرياض على أيدي نخبة من المصرفيين والمستشارين الماليين، ومنذ ذلك الحين نمت أصولنا المدارة لتتجاوز 2.1 مليار ريال نخدم بها أكثر من 5,000 عميل في 6 دول.',
  storyEn: 'Tharwah Capital was founded in Riyadh in 2019 by elite bankers and financial advisors. Since then our AUM has grown beyond SAR 2.1 billion serving 5,000+ clients across 6 countries.',
  values: [
    { id: 'V-1', icon: '🛡️', title: 'الثقة والأمان', titleEn: 'Trust & Security', desc: 'أموال عملائنا محفوظة بحسابات منفصلة وبأعلى معايير الحماية.', descEn: 'Client funds are held in segregated accounts with top-tier protection.' },
    { id: 'V-2', icon: '🔍', title: 'الشفافية', titleEn: 'Transparency', desc: 'تقارير واضحة بلا رسوم خفية ولا مفاجآت.', descEn: 'Clear reporting with no hidden fees or surprises.' },
    { id: 'V-3', icon: '🕌', title: 'الالتزام الشرعي', titleEn: 'Sharia Commitment', desc: 'توافق شرعي موثق لكل منتجاتنا الاستثمارية.', descEn: 'Certified Sharia compliance across all investment products.' },
    { id: 'V-4', icon: '🚀', title: 'الابتكار', titleEn: 'Innovation', desc: 'نوظف الذكاء الاصطناعي لخدمة قراراتك الاستثمارية.', descEn: 'We harness AI to empower your investment decisions.' },
  ],
  team: [
    { avatar: 'خ', nameAr: 'م. خالد الحربي', nameEn: 'Khalid Al-Harbi', roleAr: 'الرئيس التنفيذي', roleEn: 'CEO & Co-Founder', descAr: '25 عاماً من الخبرة في الأسواق المالية الخليجية والعالمية.', descEn: '25 years of experience across Gulf and global financial markets.' },
    { avatar: 'س', nameAr: 'د. سارة المطيري', nameEn: 'Dr. Sara Al-Mutairi', roleAr: 'مديرة الاستثمار والمحافظ', roleEn: 'Director of Investment', descAr: 'متخصصة في الأسواق الناشئة وتحليل المخاطر وبناء المحافظ المؤسسية.', descEn: 'Specialized in emerging markets, risk analysis, and institutional portfolio construction.' },
    { avatar: 'ف', nameAr: 'م. فيصل العمري', nameEn: 'Faisal Al-Omari', roleAr: 'رئيس قسم البحث والتحليل', roleEn: 'Head of Research', descAr: 'يقود التحليل الاستثماري الدوري وتغطية الفرص في الأسواق المحلية والعالمية.', descEn: 'Leads periodic investment research and opportunity coverage across local and global markets.' },
  ],
};

export interface SiteDesignSettings {
  primaryColor: string;
  goldAccent: string;
  darkModeDefault: boolean;
  showAnnouncementBar: boolean;
  showLiveTicker: boolean;
  showWhatsapp: boolean;
  showCookieBanner: boolean;
  logoText: string;
  logoTextEn: string;
  announcement: string;
  announcementEn: string;
}
export const SITE_DESIGN_SEED: SiteDesignSettings = {
  primaryColor: '#0EA5E9',
  goldAccent: '#C9A84C',
  darkModeDefault: false,
  showAnnouncementBar: true,
  showLiveTicker: true,
  showWhatsapp: true,
  showCookieBanner: true,
  logoText: 'ثروة كابيتال',
  logoTextEn: 'Tharwah Capital',
  announcement: '🎉 عرض خاص: بدون رسوم إدارة لأول 3 أشهر للعملاء الجدد',
  announcementEn: '🎉 Special Offer: No management fees for the first 3 months for new clients',
};

export interface PrivacySection { id: string; title: string; titleEn: string; body: string; bodyEn: string; order: number }
export interface PrivacyDoc { lastUpdated: string; intro: string; introEn: string; sections: PrivacySection[] }
export const PRIVACY_SEED: PrivacyDoc = {
  lastUpdated: '2026-06-01',
  intro: 'نلتزم في ثروة كابيتال بحماية خصوصيتك وبياناتك وفق نظام حماية البيانات الشخصية السعودي (PDPL).',
  introEn: 'At Tharwah Capital, we are committed to protecting your privacy and data under the Saudi Personal Data Protection Law (PDPL).',
  sections: [
    { id: 'P-1', title: 'البيانات التي نجمعها', titleEn: 'Data We Collect', body: 'نجمع البيانات الأساسية للهوية (الاسم، رقم الهوية، بيانات التواصل) والبيانات المالية اللازمة لفتح وإدارة حسابك الاستثماري.', bodyEn: 'We collect core identity data (name, ID number, contact details) and the financial data required to open and manage your investment account.', order: 1 },
    { id: 'P-2', title: 'كيفية استخدام البيانات', titleEn: 'How We Use Data', body: 'تُستخدم بياناتك حصرياً لتقديم خدماتنا الاستثمارية والالتزام بالمتطلبات التنظيمية ولا تُباع لأي طرف ثالث.', bodyEn: 'Your data is used exclusively to deliver our investment services and meet regulatory requirements and is never sold to third parties.', order: 2 },
    { id: 'P-3', title: 'مشاركة البيانات', titleEn: 'Data Sharing', body: 'لا نشارك بياناتك إلا مع الجهات التنظيمية عند الطلب القانوني أو مع مزودي خدمات مرتبطين باتفاقيات سرية صارمة.', bodyEn: 'We only share data with regulators upon legal request or with service providers bound by strict confidentiality agreements.', order: 3 },
    { id: 'P-4', title: 'حقوقك', titleEn: 'Your Rights', body: 'يحق لك الوصول لبياناتك وتصحيحها وطلب حذفها في أي وقت عبر التواصل مع مسؤول حماية البيانات.', bodyEn: 'You may access, correct, or request deletion of your data at any time via our Data Protection Officer.', order: 4 },
  ],
};

// ═══════════════════════ Store keys ═══════════════════════
export const ADMIN_KEYS = {
  CLIENTS: 'tharwah_admin_clients_v2',
  PORTFOLIOS: 'tharwah_admin_portfolios_v2',
  TRANSACTIONS: 'tharwah_admin_transactions_v2',
  MESSAGES: 'tharwah_admin_messages_v2',
  NOTIFICATIONS: 'tharwah_admin_notifications_v2',
  SUB_ADMINS: 'tharwah_admin_sub_admins_v2',
  TASKS: 'tharwah_admin_tasks_v2',
  EVENTS: 'tharwah_admin_events_v2',
  TEAM: 'tharwah_admin_team_v2',
  AUDIT: 'tharwah_admin_audit_v2',
  LOGINS: 'tharwah_admin_logins_v2',
  SETTINGS: 'tharwah_admin_settings_v2',
  CMS_HERO: 'tharwah_cms_hero_v2',
  CMS_SERVICES: 'tharwah_cms_services_v2',
  CMS_MARKETS: 'tharwah_cms_markets_v2',
  CMS_FAQ: 'tharwah_cms_faq_v2',
  CMS_TESTIMONIALS: 'tharwah_cms_testimonials_v2',
  CMS_ABOUT: 'tharwah_cms_about_v2',
  CMS_DESIGN: 'tharwah_cms_design_v2',
  CMS_PRIVACY: 'tharwah_cms_privacy_v2',
  SIDEBAR_COLLAPSED: 'tharwah_admin_sidebar_collapsed',
  LOGIN_LOCK: 'tharwah_admin_login_lock_v2',
  REPORTS_HISTORY: 'tharwah_admin_reports_history_v2',
  SECURITY_PREFS: 'tharwah_admin_security_prefs_v2',
  // Legacy for migration
  LEGACY_PREFIX: 'tharwah_admin_',
  LEGACY_CMS_PREFIX: 'tharwah_cms_',
};

// ═══════════════════════ Convenience hooks ═══════════════════════
export const useClients = () => useRemoteCollection<Client>('clients', CLIENTS_SEED);
export const usePortfolios = () => useRemoteCollection<Portfolio>('portfolios', PORTFOLIOS_SEED);
export const useTransactions = () => useRemoteCollection<AdminTransaction>('transactions', TRANSACTIONS_SEED);
export const useMessages = () => useRemoteCollection<SupportMessage>('messages', MESSAGES_SEED);
export const useAdminNotifications = () => useAdminStore<AdminNotification[]>(ADMIN_KEYS.NOTIFICATIONS, NOTIFICATIONS_SEED);
export const useSubAdmins = () => useAdminStore<SubAdmin[]>(ADMIN_KEYS.SUB_ADMINS, SUB_ADMINS_SEED);
export const useTasks = () => useAdminStore<AdminTask[]>(ADMIN_KEYS.TASKS, TASKS_SEED);
export const useCalendarEvents = () => useAdminStore<CalendarEvent[]>(ADMIN_KEYS.EVENTS, EVENTS_SEED);
export const useTeam = () => useAdminStore<TeamMember[]>(ADMIN_KEYS.TEAM, TEAM_SEED);
export const useAuditLog = () => useAdminStore<AuditLog[]>(ADMIN_KEYS.AUDIT, AUDIT_SEED);
export const useLoginAttempts = () => useAdminStore<LoginAttempt[]>(ADMIN_KEYS.LOGINS, LOGIN_ATTEMPTS_SEED);
export const usePlatformSettings = () => useAdminStore<PlatformSettings>(ADMIN_KEYS.SETTINGS, SETTINGS_SEED);

export const useCmsHero = () => useAdminStore<HeroContent>(ADMIN_KEYS.CMS_HERO, HERO_SEED);
export const useCmsServices = () => useAdminStore<ServiceItem[]>(ADMIN_KEYS.CMS_SERVICES, SERVICES_SEED);
export const useCmsMarkets = () => useAdminStore<MarketItem[]>(ADMIN_KEYS.CMS_MARKETS, MARKETS_SEED);
export const useCmsFaq = () => useAdminStore<FaqItem[]>(ADMIN_KEYS.CMS_FAQ, FAQ_SEED);
export const useCmsTestimonials = () => useAdminStore<TestimonialItem[]>(ADMIN_KEYS.CMS_TESTIMONIALS, TESTIMONIALS_SEED);
export const useCmsAbout = () => useAdminStore<AboutContent>(ADMIN_KEYS.CMS_ABOUT, ABOUT_SEED);
export const useCmsDesign = () => useAdminStore<SiteDesignSettings>(ADMIN_KEYS.CMS_DESIGN, SITE_DESIGN_SEED);
export const useCmsPrivacy = () => useAdminStore<PrivacyDoc>(ADMIN_KEYS.CMS_PRIVACY, PRIVACY_SEED);

// ═══════════════════════ Helpers ═══════════════════════

export function nextCode(items: { id: string }[], prefix: string): string {
  const max = items.reduce((m, it) => {
    const n = parseInt(it.id.replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `${prefix}-${max + 1}`;
}

export function unreadMessagesCount(messages: SupportMessage[]) {
  return messages.filter(m => m.status === 'pending').length;
}

export function unreadNotificationsCount(notifications: AdminNotification[]) {
  return notifications.filter(n => !n.read).length;
}

export function addAuditEntry(actor: string, action: string, actionEn: string, result: 'success' | 'failed' = 'success') {
  // Always attribute the entry to the real signed-in admin instead of the
  // hard-coded placeholder that the CMS managers still pass around.
  const sessionEmail = getAdminSession()?.email;
  const realActor = (!actor || actor === 'admin@tharwah.com') ? (sessionEmail || actor) : actor;

  const list = load<AuditLog[]>(ADMIN_KEYS.AUDIT, AUDIT_SEED);
  const entry: AuditLog = {
    id: nextCode(list, 'A'),
    actor: sanitizeEmail(realActor),
    action: sanitizeInput(action),
    actionEn: sanitizeInput(actionEn),
    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
    ip: '—',
    result,
  };
  persist(ADMIN_KEYS.AUDIT, [entry, ...list].slice(0, 100));
  logger.audit(realActor, action, { result });
}

export function addLoginAttempt(email: string, result: 'success' | 'failed') {
  const list = load<LoginAttempt[]>(ADMIN_KEYS.LOGINS, LOGIN_ATTEMPTS_SEED);
  const entry: LoginAttempt = {
    id: nextCode(list, 'L'),
    email: sanitizeEmail(email),
    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
    ip: '—',
    result,
  };
  persist(ADMIN_KEYS.LOGINS, [entry, ...list].slice(0, 100));
}

export function relativeTime(dateStr: string, lang: 'ar' | 'en'): string {
  const then = new Date(dateStr.replace(' ', 'T'));
  const diffMs = Date.now() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return lang === 'ar' ? 'الآن' : 'now';
  if (mins < 60) return lang === 'ar' ? `منذ ${mins} دقيقة` : `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return lang === 'ar' ? 'أمس' : 'yesterday';
  return lang === 'ar' ? `منذ ${days} أيام` : `${days} days ago`;
}

// Login lock helpers (5 failed attempts → 30-minute lock) - now secure
export interface LoginLock { attempts: number; lockedUntil: number | null }
export function getLoginLock(email: string): LoginLock {
  const all = load<Record<string, LoginLock>>(ADMIN_KEYS.LOGIN_LOCK, {});
  return all[sanitizeEmail(email)] || { attempts: 0, lockedUntil: null };
}
export function setLoginLock(email: string, lock: LoginLock) {
  const all = load<Record<string, LoginLock>>(ADMIN_KEYS.LOGIN_LOCK, {});
  all[sanitizeEmail(email)] = lock;
  persist(ADMIN_KEYS.LOGIN_LOCK, all);
}
export function resetLoginLock(email: string) {
  const all = load<Record<string, LoginLock>>(ADMIN_KEYS.LOGIN_LOCK, {});
  delete all[sanitizeEmail(email)];
  persist(ADMIN_KEYS.LOGIN_LOCK, all);
}

// SECURE password verification for SubAdmins
export async function verifySubAdminPassword(inputPassword: string, subAdmin: SubAdmin): Promise<boolean> {
  // If has real hash (from new system), use secure verification
  if (subAdmin.passwordHash && subAdmin.salt) {
    try {
      const result = await hashPassword(inputPassword, subAdmin.salt);
      return result.hash === subAdmin.passwordHash;
    } catch {
      // Fallback to mock hash verification for seeds
      const mockHash = createMockHash(inputPassword, subAdmin.salt);
      return mockHash === subAdmin.passwordHash;
    }
  }
  
  // FIX: Legacy plaintext password comparison removed — no plaintext comparison allowed.
  // Any SubAdmin without a proper hash must reset their password through the admin panel.
  return false;
}

// CSV export with injection prevention
export function exportClientsCsvSafe(clients: Client[], lang: 'ar' | 'en'): string {
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Tier', 'Status', 'Balance'];
  const rows = clients.map(c => [
    sanitizeCsvValue(c.id),
    sanitizeCsvValue(lang === 'ar' ? c.name : c.nameEn),
    sanitizeCsvValue(c.email),
    sanitizeCsvValue(c.phone),
    sanitizeCsvValue(c.tier),
    sanitizeCsvValue(c.status),
    c.balance.toString(),
  ]);
  
  return [headers, ...rows].map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}
