import React, { useState, useEffect, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import {
  LayoutGrid, TrendingUp, TrendingDown, Bitcoin, Gem, Fuel,
  Search, ArrowUpDown, RefreshCw, Bell, Target, Smartphone,
  Check, AlertTriangle, X, ChevronDown, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ─── Types ───────────────────────────────────────────────
type CategoryKey = 'all' | 'stocks' | 'crypto' | 'metals' | 'energy';
type SortKey = 'name' | 'price-asc' | 'price-desc' | 'change-desc' | 'change-asc' | 'mcap';

interface MarketAsset {
  id: string; name: string; nameEn: string; symbol: string; price: number;
  currency: string; change: number; changePercent: number; volume?: string;
  marketCap?: string; category: CategoryKey; market: string; marketEn: string;
  badgeColor: string; trend: 'up' | 'down';
  chart7d: number[];
}

// ─── Mock Data ───────────────────────────────────────────
const ASSETS: MarketAsset[] = [
  // Stocks
  { id: '1', name: 'أرامكو السعودية', nameEn: 'Saudi Aramco', symbol: '2222.SR', price: 35.20, currency: 'ر.س', change: 0.48, changePercent: 1.38, volume: '12.3M', marketCap: '7.5T', category: 'stocks', market: 'تداول السعودية', marketEn: 'Saudi Tadawul', badgeColor: 'gold', trend: 'up', chart7d: [34.1, 34.3, 34.6, 34.8, 35.0, 35.1, 35.2] },
  { id: '2', name: 'بنك الراجحي', nameEn: 'Al Rajhi Bank', symbol: '1120.SR', price: 91.80, currency: 'ر.س', change: -0.74, changePercent: -0.8, volume: '4.1M', marketCap: '345B', category: 'stocks', market: 'تداول السعودية', marketEn: 'Saudi Tadawul', badgeColor: 'gold', trend: 'down', chart7d: [92.5, 92.2, 91.9, 91.6, 91.4, 91.6, 91.8] },
  { id: '3', name: 'سابك', nameEn: 'SABIC', symbol: '2010.SR', price: 83.50, currency: 'ر.س', change: 0.25, changePercent: 0.3, volume: '2.8M', marketCap: '265B', category: 'stocks', market: 'تداول السعودية', marketEn: 'Saudi Tadawul', badgeColor: 'gold', trend: 'up', chart7d: [82.8, 83.0, 83.2, 83.1, 83.3, 83.4, 83.5] },
  { id: '4', name: 'مصرف أبوظبي التجاري', nameEn: 'ADCB Bank', symbol: 'ADCB', price: 9.42, currency: 'د.إ', change: 0.20, changePercent: 2.1, volume: '8.6M', marketCap: '84B', category: 'stocks', market: 'سوق أبوظبي', marketEn: 'Abu Dhabi Market', badgeColor: 'blue', trend: 'up', chart7d: [9.1, 9.2, 9.3, 9.4, 9.4, 9.4, 9.42] },
  { id: '5', name: 'إمارات NBD', nameEn: 'Emirates NBD', symbol: 'ENBD', price: 14.80, currency: 'د.إ', change: -0.07, changePercent: -0.5, volume: '3.2M', marketCap: '88B', category: 'stocks', market: 'سوق دبي', marketEn: 'Dubai Market', badgeColor: 'blue', trend: 'down', chart7d: [14.9, 14.8, 14.7, 14.7, 14.8, 14.8, 14.8] },
  { id: '6', name: 'Apple', nameEn: 'Apple', symbol: 'AAPL', price: 192.53, currency: '$', change: 1.15, changePercent: 0.6, volume: '55.2M', marketCap: '$3.0T', category: 'stocks', market: 'NASDAQ', marketEn: 'NASDAQ', badgeColor: 'gray', trend: 'up', chart7d: [190.2, 191.0, 191.8, 192.0, 192.3, 192.4, 192.53] },
  { id: '7', name: 'Microsoft', nameEn: 'Microsoft', symbol: 'MSFT', price: 418.20, currency: '$', change: -1.26, changePercent: -0.3, volume: '28.1M', marketCap: '$3.1T', category: 'stocks', market: 'NASDAQ', marketEn: 'NASDAQ', badgeColor: 'gray', trend: 'down', chart7d: [419.5, 419.0, 418.5, 418.0, 417.8, 418.0, 418.2] },
  { id: '8', name: 'NVIDIA', nameEn: 'NVIDIA', symbol: 'NVDA', price: 875.40, currency: '$', change: 28.01, changePercent: 3.2, volume: '42.5M', marketCap: '$2.1T', category: 'stocks', market: 'NASDAQ', marketEn: 'NASDAQ', badgeColor: 'gray', trend: 'up', chart7d: [845.0, 852.0, 860.0, 865.0, 870.0, 873.0, 875.4] },
  { id: '9', name: 'بنك القاهرة', nameEn: 'Cairo Bank', symbol: 'CAIR', price: 12.25, currency: 'ج.م', change: 0.22, changePercent: 1.8, volume: '1.5M', marketCap: '22B', category: 'stocks', market: 'البورصة المصرية', marketEn: 'Egyptian Exchange', badgeColor: 'gold', trend: 'up', chart7d: [11.9, 12.0, 12.1, 12.1, 12.2, 12.2, 12.25] },
  // Crypto
  { id: '10', name: 'Bitcoin', nameEn: 'Bitcoin', symbol: 'BTC/USD', price: 67320, currency: '$', change: 1615.68, changePercent: 2.4, volume: '$28.4B', marketCap: '$1.32T', category: 'crypto', market: 'Crypto', marketEn: 'Crypto', badgeColor: 'orange', trend: 'up', chart7d: [65200, 65800, 66300, 66700, 67000, 67200, 67320] },
  { id: '11', name: 'إيثيريوم', nameEn: 'Ethereum', symbol: 'ETH/USD', price: 3512, currency: '$', change: -42.14, changePercent: -1.2, volume: '$12.1B', marketCap: '$422B', category: 'crypto', market: 'Crypto', marketEn: 'Crypto', badgeColor: 'purple', trend: 'down', chart7d: [3550, 3540, 3530, 3520, 3510, 3515, 3512] },
  { id: '12', name: 'بينانس كوين', nameEn: 'BNB', symbol: 'BNB/USD', price: 588, currency: '$', change: 4.70, changePercent: 0.8, volume: '$2.1B', marketCap: '$85B', category: 'crypto', market: 'Crypto', marketEn: 'Crypto', badgeColor: 'orange', trend: 'up', chart7d: [582, 584, 585, 586, 587, 587.5, 588] },
  { id: '13', name: 'ريبل', nameEn: 'Ripple', symbol: 'XRP/USD', price: 0.52, currency: '$', change: -0.002, changePercent: -0.4, volume: '$1.8B', marketCap: '$29B', category: 'crypto', market: 'Crypto', marketEn: 'Crypto', badgeColor: 'purple', trend: 'down', chart7d: [0.53, 0.53, 0.52, 0.52, 0.52, 0.52, 0.52] },
  { id: '14', name: 'سولانا', nameEn: 'Solana', symbol: 'SOL/USD', price: 175, currency: '$', change: 7.18, changePercent: 4.1, volume: '$3.5B', marketCap: '$80B', category: 'crypto', market: 'Crypto', marketEn: 'Crypto', badgeColor: 'purple', trend: 'up', chart7d: [165, 168, 170, 172, 173, 174, 175] },
  { id: '15', name: 'كارديانو', nameEn: 'Cardano', symbol: 'ADA/USD', price: 0.46, currency: '$', change: 0.007, changePercent: 1.5, volume: '$0.9B', marketCap: '$16B', category: 'crypto', market: 'Crypto', marketEn: 'Crypto', badgeColor: 'purple', trend: 'up', chart7d: [0.44, 0.45, 0.45, 0.46, 0.46, 0.46, 0.46] },
  // Metals
  { id: '16', name: 'الذهب', nameEn: 'Gold', symbol: 'XAU/USD', price: 2325.40, currency: '$', change: 11.63, changePercent: 0.5, volume: '-', marketCap: '-', category: 'metals', market: 'Metals', marketEn: 'Metals', badgeColor: 'gold', trend: 'up', chart7d: [2310, 2315, 2320, 2322, 2324, 2325, 2325.4] },
  { id: '17', name: 'الفضة', nameEn: 'Silver', symbol: 'XAG/USD', price: 29.80, currency: '$', change: -0.09, changePercent: -0.3, volume: '-', marketCap: '-', category: 'metals', market: 'Metals', marketEn: 'Metals', badgeColor: 'gray', trend: 'down', chart7d: [30.1, 30.0, 29.9, 29.8, 29.8, 29.8, 29.8] },
  { id: '18', name: 'البلاتين', nameEn: 'Platinum', symbol: 'XPT/USD', price: 993, currency: '$', change: 10.92, changePercent: 1.1, volume: '-', marketCap: '-', category: 'metals', market: 'Metals', marketEn: 'Metals', badgeColor: 'gray', trend: 'up', chart7d: [980, 985, 988, 990, 991, 992, 993] },
  { id: '19', name: 'البلاديوم', nameEn: 'Palladium', symbol: 'XPD/USD', price: 925, currency: '$', change: -16.65, changePercent: -1.8, volume: '-', marketCap: '-', category: 'metals', market: 'Metals', marketEn: 'Metals', badgeColor: 'gray', trend: 'down', chart7d: [940, 938, 935, 932, 930, 928, 925] },
  // Energy
  { id: '20', name: 'النفط الخام WTI', nameEn: 'WTI Crude Oil', symbol: 'CL', price: 79.40, currency: '$', change: 0.95, changePercent: 1.2, volume: '-', marketCap: '-', category: 'energy', market: 'NYMEX', marketEn: 'NYMEX', badgeColor: 'green', trend: 'up', chart7d: [78.2, 78.5, 78.8, 79.0, 79.2, 79.3, 79.4] },
  { id: '21', name: 'برنت الخام', nameEn: 'Brent Crude', symbol: 'BZ', price: 83.10, currency: '$', change: 0.75, changePercent: 0.9, volume: '-', marketCap: '-', category: 'energy', market: 'ICE', marketEn: 'ICE', badgeColor: 'green', trend: 'up', chart7d: [82.0, 82.3, 82.5, 82.8, 83.0, 83.1, 83.1] },
  { id: '22', name: 'الغاز الطبيعي', nameEn: 'Natural Gas', symbol: 'NG', price: 2.18, currency: '$', change: -0.05, changePercent: -2.1, volume: '-', marketCap: '-', category: 'energy', market: 'NYMEX', marketEn: 'NYMEX', badgeColor: 'green', trend: 'down', chart7d: [2.25, 2.23, 2.22, 2.20, 2.19, 2.18, 2.18] },
];

// ─── Helpers ──────────────────────────────────────────────
const badgeColorMap: Record<string, string> = {
  gold: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
  gray: 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400',
  orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400',
  purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400',
  green: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
};

function MiniChart({ data, trend }: { data: number[]; trend: 'up' | 'down' }) {
  const color = trend === 'up' ? '#00B894' : '#E17055';
  const w = 80; const h = 28;
  const min = Math.min(...data); const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.7} />
    </svg>
  );
}

function SparklineArea({ data, color, height = 80 }: { data: number[]; color: string; height?: number }) {
  const w = 280; const h = height;
  const min = Math.min(...data); const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  const base = h;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full">
      <defs>
        <linearGradient id={`area-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${base} ${pts} ${w},${base}`} fill={`url(#area-${color})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}

// ─── Subcomponents ────────────────────────────────────────
function CategoryTab({ id, label, labelEn, icon: Icon, count, active, onClick }: {
  id: string; label: string; labelEn: string; icon: React.ElementType; count: number; active: boolean; onClick: () => void;
}) {
  const { lang } = useLang();
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-5 py-3 rounded-md text-sm font-bold transition-all duration-200 ${
      active
        ? 'gradient-gold text-white shadow-gold-sm'
        : 'bg-transparent border border-border-default text-text-secondary hover:border-gold-primary hover:text-gold-deep'
    }`}>
      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-text-muted'}`} />
      <span>{lang === 'ar' ? label : labelEn}</span>
      <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
        active ? 'bg-white/25 text-white' : 'bg-tertiary text-text-muted'
      }`}>{count}</span>
    </button>
  );
}

function MarketRow({ asset, lang }: { asset: MarketAsset; lang: 'ar' | 'en' }) {
  return (
    <tr className="hover:bg-gold-subtle transition-colors duration-150 even:bg-secondary/40">
      <td className="py-4 px-5">
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 rounded-sm flex items-center justify-center text-[10px] font-black font-mono ${badgeColorMap[asset.badgeColor]}`}>
            {asset.badgeColor === 'gold' ? 'SA' : asset.badgeColor === 'blue' ? 'AE' : asset.badgeColor === 'orange' ? '₿' : asset.badgeColor === 'purple' ? 'Ξ' : asset.badgeColor === 'green' ? '⚡' : asset.symbol.slice(0, 2)}
          </span>
          <div>
            <div className="text-sm font-black text-text-primary">{lang === 'ar' ? asset.name : asset.nameEn}</div>
            <div className="text-[11px] text-text-muted">{lang === 'ar' ? asset.market : asset.marketEn}</div>
          </div>
        </div>
      </td>
      <td className="py-4 px-5 hidden md:table-cell">
        <span className="px-2 py-1 rounded-sm bg-tertiary border border-border-light text-xs font-mono text-text-muted">
          {asset.symbol}
        </span>
      </td>
      <td className={`py-4 px-5 font-mono font-bold text-sm text-text-primary ${asset.trend === 'up' ? 'flash-up' : 'flash-down'}`}>
        {asset.currency === 'ر.س' || asset.currency === 'د.إ' || asset.currency === 'ج.م'
          ? `${asset.price.toFixed(2)} ${asset.currency}`
          : `${asset.currency}${asset.price.toLocaleString(undefined, { minimumFractionDigits: asset.price < 10 ? 2 : 0 })}`}
      </td>
      <td className="py-4 px-5">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-bold font-mono ${
          asset.trend === 'up' ? 'bg-success-light text-success' : 'bg-error-light text-error'
        }`}>
          {asset.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {asset.change > 0 ? '+' : ''}{asset.change.toFixed(2)}
        </span>
      </td>
      <td className="py-4 px-5 hidden lg:table-cell">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-bold font-mono ${
          asset.trend === 'up' ? 'bg-success-light text-success' : 'bg-error-light text-error'
        }`}>
          {asset.changePercent > 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
        </span>
      </td>
      <td className="py-4 px-5 text-sm font-mono text-text-secondary hidden xl:table-cell">{asset.volume || '—'}</td>
      <td className="py-4 px-5 text-sm font-mono text-text-secondary hidden xl:table-cell">{asset.marketCap || '—'}</td>
      <td className="py-4 px-5 hidden lg:table-cell">
        <MiniChart data={asset.chart7d} trend={asset.trend} />
      </td>
    </tr>
  );
}

function AlertCard({ asset, index }: { asset: MarketAsset; index: number }) {
  const { t, lang } = useLang();
  const color = asset.trend === 'up' ? '#00B894' : '#E17055';
  const labelMap: Record<string, string> = {
    crypto: lang === 'ar' ? 'عملات رقمية' : 'Crypto',
    stocks: lang === 'ar' ? 'أسهم' : 'Stocks',
    metals: lang === 'ar' ? 'معادن' : 'Metals',
    energy: lang === 'ar' ? 'طاقة' : 'Energy',
    all: '',
  };
  const emojis: Record<string, string> = {
    crypto: '₿', stocks: '📈', metals: '💎', energy: '⚡', all: '📊',
  };

  return (
    <Card className={`p-5 border-l-4 ${asset.trend === 'up' ? 'border-l-success' : 'border-l-error'} hover:border-gold-primary transition-all duration-200 group`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black bg-secondary text-text-muted">{emojis[asset.category]}</span>
          <span className="text-xs font-bold text-text-muted uppercase">{asset.symbol}</span>
        </div>
        <Badge variant={asset.trend === 'up' ? 'success' : 'error'} size="sm">
          {asset.trend === 'up' ? '+' : ''}{asset.changePercent.toFixed(1)}%
        </Badge>
      </div>
      <div className={`text-2xl font-black font-mono mb-0.5 ${asset.trend === 'up' ? 'text-text-primary' : 'text-text-primary'}`}>
        {asset.currency === 'ر.س' ? `${asset.price.toFixed(2)} ${asset.currency}` : `${asset.currency}${asset.price.toLocaleString()}`}
      </div>
      <div className="text-xs text-text-muted mb-3">{labelMap[asset.category] || ''}</div>
      <SparklineArea data={asset.chart7d} color={color} height={60} />
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border-light">
        <div><div className="text-[10px] text-text-muted">{t('الأعلى اليوم', 'High')}</div><div className="text-xs font-bold font-mono text-text-primary">{Math.max(...asset.chart7d).toFixed(asset.price < 10 ? 2 : 0)}</div></div>
        <div><div className="text-[10px] text-text-muted">{t('الأدنى اليوم', 'Low')}</div><div className="text-xs font-bold font-mono text-text-primary">{Math.min(...asset.chart7d).toFixed(asset.price < 10 ? 2 : 0)}</div></div>
        <div><div className="text-[10px] text-text-muted">{t('الحجم', 'Vol')}</div><div className="text-xs font-bold font-mono text-text-primary">{asset.volume || '—'}</div></div>
      </div>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────
export function MarketsPage() {
  const { t, lang } = useLang();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOpen, setSortOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggedIn] = useState(false);
  const [alertAsset, setAlertAsset] = useState('btc');
  const [alertType, setAlertType] = useState('price');
  const [alertPrice, setAlertPrice] = useState('');

  const filteredAssets = useMemo(() => {
    let list = activeCategory === 'all' ? ASSETS : ASSETS.filter(a => a.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.nameEn.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q));
    }
    const sortFn = (a: MarketAsset, b: MarketAsset) => {
      switch (sortKey) {
        case 'name': return lang === 'ar' ? a.name.localeCompare(b.name) : a.nameEn.localeCompare(b.nameEn);
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'change-desc': return Math.abs(b.changePercent) - Math.abs(a.changePercent);
        case 'change-asc': return Math.abs(a.changePercent) - Math.abs(b.changePercent);
        case 'mcap': return (b.marketCap?.length || 0) - (a.marketCap?.length || 0);
        default: return 0;
      }
    };
    return [...list].sort(sortFn);
  }, [activeCategory, searchQuery, sortKey, lang]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const categoryCounts = useMemo(() => ({
    all: ASSETS.length,
    stocks: ASSETS.filter(a => a.category === 'stocks').length,
    crypto: ASSETS.filter(a => a.category === 'crypto').length,
    metals: ASSETS.filter(a => a.category === 'metals').length,
    energy: ASSETS.filter(a => a.category === 'energy').length,
  }), []);

  const categories: { id: CategoryKey; label: string; labelEn: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'الكل', labelEn: 'All', icon: LayoutGrid },
    { id: 'stocks', label: 'الأسهم', labelEn: 'Stocks', icon: TrendingUp },
    { id: 'crypto', label: 'العملات الرقمية', labelEn: 'Crypto', icon: Bitcoin },
    { id: 'metals', label: 'المعادن', labelEn: 'Metals', icon: Gem },
    { id: 'energy', label: 'الطاقة', labelEn: 'Energy', icon: Fuel },
  ];

  const sortOptions: { key: SortKey; label: string; labelEn: string }[] = [
    { key: 'name', label: 'ترتيب حسب الاسم', labelEn: 'Sort by Name' },
    { key: 'price-asc', label: 'السعر تصاعدياً', labelEn: 'Price Ascending' },
    { key: 'price-desc', label: 'السعر تنازلياً', labelEn: 'Price Descending' },
    { key: 'change-desc', label: 'التغيير — الأعلى أولاً', labelEn: 'Change — Highest First' },
    { key: 'change-asc', label: 'التغيير — الأدنى أولاً', labelEn: 'Change — Lowest First' },
    { key: 'mcap', label: 'القيمة السوقية', labelEn: 'Market Cap' },
  ];

  const topAssets = useMemo(() => {
    return ASSETS.filter(a => ['crypto', 'metals', 'energy', 'stocks'].includes(a.category)).slice(0, 4);
  }, []);

  return (
    <div className="w-full">
      {/* 2.5.1 — Hero */}
      <section className="relative pt-28 pb-16 bg-gradient-to-b from-white via-secondary to-tertiary dark:from-[#0D0D1A] dark:via-[#13132A] dark:to-[#1A1A3A] text-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03 dark:opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, #C9A84C 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <span className="inline-block text-xs font-black uppercase tracking-[0.2em] text-gold-deep mb-4">{t('الأسواق المالية العالمية', 'GLOBAL FINANCIAL MARKETS')}</span>
          <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-4">{t('أسعار حية من أكبر أسواق المال', 'Live Prices from the World\'s Largest Financial Markets')}</h1>
          <p className="text-text-secondary text-base max-w-2xl mx-auto leading-relaxed">{t(
            'تابع أسعار الأسهم الخليجية والعالمية، العملات الرقمية، المعادن النفيسة والطاقة في الوقت الفعلي. بياناتنا محدثة كل 30 ثانية من أكثر من 15 مصدر مالي موثوق',
            'Follow Gulf and global stock prices, cryptocurrencies, precious metals, and energy in real-time. Our data is updated every 30 seconds from more than 15 trusted financial sources'
          )}</p>
        </div>

        {/* Global Indices Strip */}
        <div className="mt-10 max-w-5xl mx-auto px-4">
          <div className="bg-primary dark:bg-elevated border border-border-light rounded-xl shadow-sm p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'S&P 500', value: '5,284.30', change: '+0.85%', trend: 'up' as const },
                { label: 'NASDAQ', value: '18,671.40', change: '+1.24%', trend: 'up' as const },
                { label: lang === 'ar' ? 'تداول السعودية' : 'Saudi Tadawul', value: '12,450.80', change: '-0.32%', trend: 'down' as const },
                { label: 'Gold / XAU', value: '$2,325.40', change: '+0.55%', trend: 'up' as const },
              ].map((idx, i) => (
                <div key={i} className="text-center md:text-right p-4 md:border-l last:border-0 border-border-light">
                  <div className="text-xs font-bold font-mono text-text-muted uppercase mb-1">{idx.label}</div>
                  <div className="text-xl font-black font-mono text-text-primary">{idx.value}</div>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono mt-1 px-2 py-0.5 rounded-full ${
                    idx.trend === 'up' ? 'bg-success-light text-success' : 'bg-error-light text-error'
                  }`}>
                    {idx.trend === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {idx.change}
                  </span>
                </div>
              ))}
            </div>
            {/* Status bar */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span>{t('البيانات حية — آخر تحديث منذ 28 ثانية', 'Data Live — Last updated 28 seconds ago')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" />
                <span>{t('يتحدث تلقائياً كل 30 ثانية', 'Auto-updates every 30 seconds')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5.2 — LiveTicker Strip */}
      <section className="bg-tertiary border-y border-gold-primary/20 h-12 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-tertiary to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-tertiary to-transparent z-10" />
        <div className={`flex items-center h-full gap-8 whitespace-nowrap ${lang === 'ar' ? 'animate-ticker-scroll-ar' : 'animate-ticker-scroll-en'}`} style={{ animationDuration: '30s' }}>
          {[...ASSETS, ...ASSETS].map((a, i) => (
            <a key={i} href={`#asset-${a.id}`} className="flex items-center gap-2 text-sm shrink-0 hover:text-gold-deep transition-colors">
              <span className="font-bold text-text-primary">{lang === 'ar' ? a.name : a.nameEn}</span>
              <span className="font-mono text-text-secondary">{a.currency === 'ر.س' ? a.price.toFixed(2) : `${a.currency}${a.price.toLocaleString()}`}</span>
              <span className={`font-mono text-xs font-bold ${a.trend === 'up' ? 'text-success' : 'text-error'}`}>
                {a.trend === 'up' ? '▲' : '▼'} {Math.abs(a.changePercent).toFixed(1)}%
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* 2.5.3 & 2.5.4 — Tabs + Table */}
      <section className="bg-primary sticky top-0 z-40 py-6 border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <CategoryTab
                  key={cat.id} id={cat.id} label={cat.label} labelEn={cat.labelEn}
                  icon={cat.icon} count={categoryCounts[cat.id]}
                  active={activeCategory === cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                />
              ))}
            </div>

            {/* Tools */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('ابحث عن أصل...', 'Search for an asset...')}
                  className="w-48 bg-secondary border border-border-default rounded-md py-2 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 text-xs font-bold outline-none focus:border-gold-primary transition-colors"
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <button onClick={() => setSortOpen(!sortOpen)} className="flex items-center gap-1.5 bg-secondary border border-border-default rounded-md py-2 px-3 text-xs font-bold text-text-secondary hover:border-gold-primary transition-colors">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('ترتيب حسب', 'Sort by')}</span>
                </button>
                {sortOpen && (
                  <div className="absolute top-full mt-1 rtl:left-0 ltr:right-0 w-52 bg-white dark:bg-[#1C1C34] border border-border-default rounded-xl shadow-lg z-50 py-1 animate-in fade-down">
                    {sortOptions.map(opt => (
                      <button key={opt.key} onClick={() => { setSortKey(opt.key); setSortOpen(false); }} className={`w-full px-5 py-2.5 text-xs font-bold text-right flex items-center justify-between gap-2 transition-colors ${
                        sortKey === opt.key ? 'text-gold-deep bg-gold-subtle' : 'text-text-primary hover:bg-secondary'
                      }`}>
                        <span>{lang === 'ar' ? opt.label : opt.labelEn}</span>
                        {sortKey === opt.key && <Check className="w-3.5 h-3.5 text-gold-deep" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Refresh */}
              <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-1.5 bg-secondary border border-border-default rounded-md py-2 px-3 text-xs font-bold text-text-secondary hover:border-gold-primary transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? t('جارٍ التحديث...', 'Refreshing...') : t('تحديث', 'Refresh')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="bg-primary py-4">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="overflow-hidden p-0">
            {filteredAssets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary dark:bg-tertiary border-b border-border-light">
                      <th className="text-right py-4 px-5 text-[11px] font-black uppercase text-text-muted">{t('الأصل', 'Asset')}</th>
                      <th className="text-right py-4 px-5 text-[11px] font-black uppercase text-text-muted hidden md:table-cell">{t('الرمز', 'Symbol')}</th>
                      <th className="text-left py-4 px-5 text-[11px] font-black uppercase text-text-muted">{t('السعر', 'Price')}</th>
                      <th className="text-left py-4 px-5 text-[11px] font-black uppercase text-text-muted">{t('التغيير', 'Change')}</th>
                      <th className="text-left py-4 px-5 text-[11px] font-black uppercase text-text-muted hidden lg:table-cell">{t('التغيير %', 'Change %')}</th>
                      <th className="text-left py-4 px-5 text-[11px] font-black uppercase text-text-muted hidden xl:table-cell">{t('الحجم', 'Volume')}</th>
                      <th className="text-left py-4 px-5 text-[11px] font-black uppercase text-text-muted hidden xl:table-cell">{t('القيمة السوقية', 'Market Cap')}</th>
                      <th className="text-center py-4 px-5 text-[11px] font-black uppercase text-text-muted hidden lg:table-cell">{t('أداء 7 أيام', '7D Perf.')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light/60">
                    {filteredAssets.map(asset => (
                      <MarketRow key={asset.id} asset={asset} lang={lang} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-lg font-bold text-text-muted mb-2">{t('لا توجد أصول تطابق بحثك', 'No assets match your search')}</h3>
                <Button variant="ghost" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }} className="mt-2">
                  {t('مسح البحث', 'Clear Search')}
                </Button>
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-5 py-4 border-t border-border-light text-xs text-text-muted">
              <span>{t(`يُعرض ${filteredAssets.length} أصل من إجمالي ${ASSETS.length}`, `Showing ${filteredAssets.length} assets out of ${ASSETS.length} total`)}</span>
              <span className="flex items-center gap-1 text-[11px]">
                <AlertTriangle className="w-3 h-3 text-warning" />
                {t('الأسعار للأغراض المعلوماتية فقط وقد تكون متأخرة 15 دقيقة. لا تُعدّ نصيحة استثمارية', 'Prices are for informational purposes only and may be delayed by 15 minutes. Not investment advice')}
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* 2.5.5 — Most Traded Assets */}
      <section className="bg-secondary dark:bg-secondary border-y border-gold-primary/20 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-text-primary">{t('الأصول الأكثر تداولاً اليوم', 'Today\'s Most Traded Assets')}</h2>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span>{t('مُحدَّث الآن', 'Updated Now')}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topAssets.map((asset, i) => (
              <AlertCard key={asset.id} asset={asset} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* 2.5.6 — Price Alerts */}
      <section className="bg-gold-subtle border-y border-gold-primary/20 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Left - Description */}
            <div className="lg:col-span-3 space-y-4">
              <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center shadow-gold-sm">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-black text-text-primary">{t('لا تفوّت فرصة استثمارية أبداً', 'Never Miss an Investment Opportunity Again')}</h2>
              <p className="text-base text-text-secondary leading-relaxed max-w-lg">
                {t(
                  'حدد السعر الذي تريد شراء أو بيع أي أصل عنده، وسنُخطرك فوراً عبر البريد الإلكتروني والرسائل النصية والإشعارات الفورية بمجرد وصول السعر لمستواك المستهدف',
                  'Set the price at which you want to buy or sell any asset, and we will immediately notify you via email, SMS, and push notifications as soon as the price reaches your target level'
                )}
              </p>
              <div className="space-y-3">
                {[
                  { icon: Bell, text: t('تنبيهات فورية عبر البريد والرسائل', 'Instant alerts via email and SMS') },
                  { icon: Target, text: t('حدد مستهدفاً للشراء ومستهدفاً للبيع', 'Set a buy target and a sell target') },
                  { icon: Smartphone, text: t('إشعارات فورية على هاتفك', 'Push notifications on your phone') },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-bold text-text-primary">
                    <div className="w-8 h-8 rounded-full bg-gold-light flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-gold-deep" />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Form */}
            <div className="lg:col-span-2">
              <div className="bg-primary border border-gold-primary rounded-xl p-6 shadow-sm">
                {isLoggedIn ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="w-5 h-5 text-gold-deep" />
                      <h3 className="text-lg font-black">{t('إعداد تنبيه جديد', 'Set Up a New Alert')}</h3>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-secondary">{t('اختر الأصل', 'Select Asset')}</label>
                      <select value={alertAsset} onChange={e => setAlertAsset(e.target.value)} className="w-full bg-secondary border border-border-default rounded-md py-2.5 px-3 text-xs font-bold outline-none focus:border-gold-primary">
                        <option value="btc">Bitcoin (BTC/USD)</option>
                        <option value="eth">Ethereum (ETH/USD)</option>
                        <option value="xau">Gold (XAU/USD)</option>
                        <option value="aapl">Apple (AAPL)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-secondary">{t('نوع التنبيه', 'Alert Type')}</label>
                      <select value={alertType} onChange={e => setAlertType(e.target.value)} className="w-full bg-secondary border border-border-default rounded-md py-2.5 px-3 text-xs font-bold outline-none focus:border-gold-primary">
                        <option value="price">{t('السعر يصل لـ', 'Price reaches')}</option>
                        <option value="rise">{t('السعر يرتفع بنسبة', 'Price rises by %')}</option>
                        <option value="drop">{t('السعر ينخفض بنسبة', 'Price drops by %')}</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-secondary">{t('السعر المستهدف', 'Target Price')}</label>
                      <input type="number" value={alertPrice} onChange={e => setAlertPrice(e.target.value)} className="w-full bg-secondary border border-border-default rounded-md py-2.5 px-3 text-xs font-bold outline-none focus:border-gold-primary" />
                    </div>
                    <Button className="w-full py-3">{t('إضافة التنبيه', 'Add Alert')}</Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="text-4xl">🔔</div>
                    <h3 className="text-lg font-black">{t('سجل دخولك لإعداد التنبيهات', 'Log in to Set Up Alerts')}</h3>
                    <p className="text-sm text-text-secondary">{t('التنبيهات الفورية متاحة لعملاء ثروة كابيتال المسجلين فقط', 'Instant alerts are available to registered Tharwah Capital clients only')}</p>
                    <Button className="w-full py-3">{t('تسجيل الدخول', 'Log In')}</Button>
                    <a href="/register" className="block text-sm font-bold text-gold-deep hover:underline">{t('لست عميلاً بعد؟ سجل الآن', 'Not a client yet? Register now')}</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
