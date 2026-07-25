// ─────────────────────────────────────────────────────────────
// 4.10 — GlobalSearch البحث العالمي في النظام
// بحث موحد في العملاء والمعاملات والأصول والمحتوى من مكان واحد
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, Users, CreditCard, Briefcase, FileText, Star, HelpCircle, TrendingUp, MessageSquare, CornerDownLeft, Loader2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { Panel, EmptyState, Pill } from '@/components/admin/ui';

interface SearchHit {
  group: string;
  groupEn: string;
  icon: any;
  color: string;
  title: string;
  subtitle: string;
  badge?: { text: string; color: string };
  to: string;
}

export function GlobalSearch() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.globalSearch(q);
        setResults(res.data || []);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const groups = useMemo(() => {
    const map = new Map<string, { group: string; groupEn: string; icon: any; color: string; hits: any[] }>();
    const icons: any = { client: Users, portfolio: Briefcase, transaction: CreditCard, message: MessageSquare };
    const colors: any = { client: '#3B82F6', portfolio: '#C9A84C', transaction: '#00D97E', message: '#8B5CF6' };
    const labels: any = { 
      client: { ar: 'العملاء', en: 'Clients' }, 
      portfolio: { ar: 'المحافظ', en: 'Portfolios' }, 
      transaction: { ar: 'المعاملات', en: 'Transactions' }, 
      message: { ar: 'الرسائل', en: 'Messages' } 
    };

    results.forEach(h => {
      const type = h.type;
      if (!map.has(type)) {
        map.set(type, { 
          group: labels[type]?.ar || type, 
          groupEn: labels[type]?.en || type, 
          icon: icons[type] || FileText, 
          color: colors[type] || '#94A3B8', 
          hits: [] 
        });
      }
      map.get(type)!.hits.push(h);
    });
    return Array.from(map.values());
  }, [results]);

  const groups = useMemo(() => {
    const map = new Map<string, { group: string; groupEn: string; icon: any; color: string; hits: SearchHit[] }>();
    results.forEach(h => {
      if (!map.has(h.group)) map.set(h.group, { group: h.group, groupEn: h.groupEn, icon: h.icon, color: h.color, hits: [] });
      map.get(h.group)!.hits.push(h);
    });
    return Array.from(map.values());
  }, [results]);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* حقل البحث الرئيسي */}
      <Panel className="!p-4">
        <div
          className="flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors focus-within:border-[#0EA5E9]"
          style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}
        >
          <Search className="w-5 h-5 shrink-0" style={{ color: query ? '#0EA5E9' : '#94A3B8' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('ابحث في كل المنصة: عملاء، معاملات، أصول، محافظ، رسائل، محتوى...', 'Search the whole platform: clients, transactions, assets, portfolios, messages, content...')}
            className="w-full bg-transparent border-0 outline-none text-sm font-medium text-text-primary placeholder:text-text-muted"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-gold-primary mr-2" />}
          <kbd className="rounded shrink-0" style={{ background: '#E2E8F0', padding: '1px 6px', fontSize: 10, color: '#64748B' }}>⌘K</kbd>
        </div>
      </Panel>

      {/* الحالات */}
      {query.trim().length < 2 ? (
        <div className="space-y-4">
          <Panel>
            <h3 className="text-xs font-bold text-text-muted mb-3">{t('اقتراحات بحث سريعة', 'Quick search suggestions')}</h3>
            <div className="flex flex-wrap gap-2">
              {['أحمد', 'TX-10', 'deposit', t('أرامكو', 'Aramco'), 'C-90', t('شهادة', 'testimonial'), 'SAR'].map(s => (
                <button key={s} onClick={() => setQuery(s)} className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-border-default text-xs font-semibold text-text-muted hover:text-[#0EA5E9] hover:border-[#0EA5E9]/25 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </Panel>
          <Panel className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Users, ar: 'العملاء وملفاتهم', en: 'Clients & profiles', color: '#3B82F6' },
              { icon: CreditCard, ar: 'المعاملات المالية', en: 'Transactions', color: '#00D97E' },
              { icon: Briefcase, ar: 'المحافظ والأصول', en: 'Portfolios & assets', color: '#C9A84C' },
              { icon: FileText, ar: 'محتوى الموقع', en: 'Site content', color: '#0EA5E9' },
            ].map((x, i) => (
              <div key={i} className="text-center py-3">
                <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-2" style={{ background: `${x.color}12` }}>
                  <x.icon className="w-5 h-5" style={{ color: x.color }} />
                </div>
                <p className="text-[11px] font-semibold text-text-muted">{lang === 'ar' ? x.ar : x.en}</p>
              </div>
            ))}
          </Panel>
        </div>
      ) : results.length === 0 ? (
        <Panel><EmptyState icon="🔍" text={t(`لا نتائج عن «${query}»`, `No results for "${query}"`)} sub={t('جرّب كلمات مختلفة أو تحقق من الإملاء', 'Try different keywords or check spelling')} /></Panel>
      ) : (
        <div className="space-y-4">
          <p className="text-[11px] text-text-muted">
            {t(`${results.length} نتيجة في ${groups.length} أقسام خلال أجزاء من الثانية`, `${results.length} results across ${groups.length} sections in a split second`)}
          </p>
          {groups.map(g => (
            <Panel key={g.group} padded={false} className="overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#E2E8F0] dark:border-border-default" style={{ background: `${g.color}08` }}>
                <g.icon className="w-3.5 h-3.5" style={{ color: g.color }} />
                <span className="text-[11px] font-bold" style={{ color: g.color }}>{lang === 'ar' ? g.group : g.groupEn}</span>
                <Pill text={String(g.hits.length)} color={g.color} />
              </div>
              <div className="divide-y divide-[#E2E8F0]/60 dark:divide-border-default/60">
                {g.hits.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => navigate({ to: h.to as any })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-[#0EA5E9]/[0.04] group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary truncate">{h.title}</span>
                        {h.badge && <Pill text={h.badge.text} color={h.badge.color} />}
                      </div>
                      <p className="text-[10px] text-text-muted mt-0.5 truncate">{h.subtitle}</p>
                    </div>
                    <CornerDownLeft className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
