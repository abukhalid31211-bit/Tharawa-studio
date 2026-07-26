// ─────────────────────────────────────────────────────────────
// NewsManager — إدارة الأخبار والمقالات (CMS Platform Data)
// ─────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Newspaper, Save, X } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { usePlatformDataState } from '@/lib/platformState';
import type { NewsArticle } from '@/lib/publicContent';
import { PageHeader, Panel } from '@/components/admin/ui';

const NEWS_CMS_KEY = 'tharwah_cms_news_v2';

const CATEGORIES = [
  { value: 'analysis', ar: 'تحليل', en: 'Analysis' },
  { value: 'gulf', ar: 'خليجي', en: 'Gulf' },
  { value: 'global', ar: 'عالمي', en: 'Global' },
  { value: 'crypto', ar: 'كريبتو', en: 'Crypto' },
  { value: 'metals', ar: 'معادن', en: 'Metals' },
  { value: 'energy', ar: 'طاقة', en: 'Energy' },
  { value: 'strategy', ar: 'استراتيجية', en: 'Strategy' },
];

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 80);
}

const EMPTY: Omit<NewsArticle, 'id'> = {
  emoji: '📰', category: 'analysis', categoryAr: 'تحليل', categoryEn: 'Analysis',
  title: '', titleEn: '', excerpt: '', excerptEn: '',
  author: '', authorEn: '', role: '', roleEn: '',
  date: new Date().toISOString().slice(0, 10),
  dateEn: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  readTime: '5 دقائق', readTimeEn: '5 min read',
  views: '0', trending: false, featured: false, slug: '',
  bodyAr: [], bodyEn: [],
};

function StatusBadge({ text, color }: { text: string; color: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: color + '22', color }}>
      {text}
    </span>
  );
}

export function NewsManager() {
  const { t, lang } = useLang();
  const [cmsData, setCmsData] = usePlatformDataState<{ articles?: NewsArticle[] }>(
    NEWS_CMS_KEY, { articles: [] }
  );
  const articles = cmsData?.articles ?? [];

  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [form, setForm] = useState<Omit<NewsArticle, 'id'>>(EMPTY);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY, date: new Date().toISOString().slice(0, 10) }); setModal('add'); };
  const openEdit = (a: NewsArticle) => { setEditing(a); const { id: _, ...rest } = a; setForm(rest); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditing(null); };

  const f = (k: keyof typeof form, v: any) => setForm(p => ({ ...p, [k]: v }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const catMeta = CATEGORIES.find(c => c.value === form.category);
    const slug = form.slug || slugify(form.titleEn || form.title);
    const article = { ...form, slug, categoryAr: catMeta?.ar || form.categoryAr, categoryEn: catMeta?.en || form.categoryEn };
    if (editing) {
      setCmsData(p => ({ articles: (p.articles ?? []).map(a => a.id === editing.id ? { ...article, id: editing.id } : a) }));
    } else {
      setCmsData(p => ({ articles: [{ ...article, id: `NEWS-${Date.now()}` }, ...(p.articles ?? [])] }));
    }
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    closeModal();
  };

  const confirmDelete = (id: string) => {
    setCmsData(p => ({ articles: (p.articles ?? []).filter(a => a.id !== id) }));
    setDeletingId(null);
  };

  const catLabel = useMemo(() => Object.fromEntries(CATEGORIES.map(c => [c.value, lang === 'ar' ? c.ar : c.en])), [lang]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('الأخبار والمقالات', 'News & Articles')}
        subtitle={t('أضف وعدّل المقالات التحليلية والأخبار الاستثمارية', 'Add and manage analytical articles')}
        actions={
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-green-500 font-medium">{t('✓ تم الحفظ', '✓ Saved')}</span>}
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-lg text-sm font-semibold hover:bg-gold/90 transition-colors">
              <Plus className="w-4 h-4" /> {t('إضافة مقال', 'Add Article')}
            </button>
          </div>
        }
      />

      <Panel>
        {articles.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t('لا توجد مقالات بعد — أضف أول مقال', 'No articles yet — add your first article')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted text-right">
                  <th className="pb-3 font-medium px-3">{t('العنوان', 'Title')}</th>
                  <th className="pb-3 font-medium px-3">{t('التصنيف', 'Category')}</th>
                  <th className="pb-3 font-medium px-3">{t('الكاتب', 'Author')}</th>
                  <th className="pb-3 font-medium px-3">{t('التاريخ', 'Date')}</th>
                  <th className="pb-3 font-medium px-3">{t('الحالة', 'Status')}</th>
                  <th className="pb-3 px-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {articles.map(a => (
                  <tr key={a.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{a.emoji}</span>
                        <div>
                          <div className="font-medium text-text-primary line-clamp-1">{lang === 'ar' ? a.title : a.titleEn}</div>
                          <div className="text-xs text-text-muted line-clamp-1">{lang === 'ar' ? a.excerpt : a.excerptEn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge text={catLabel[a.category] || a.category} color="#3B82F6" />
                    </td>
                    <td className="py-3 px-3 text-text-secondary">{lang === 'ar' ? a.author : a.authorEn}</td>
                    <td className="py-3 px-3 text-text-muted text-xs">{a.date}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1 flex-wrap">
                        {a.featured && <StatusBadge text={t('مميز', 'Featured')} color="#C9A84C" />}
                        {a.trending && <StatusBadge text={t('رائج', 'Trending')} color="#00D97E" />}
                        {!a.featured && !a.trending && <span className="text-text-muted text-xs">—</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(a)} className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors" title={t('تعديل', 'Edit')}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeletingId(a.id)} className="p-1.5 text-text-muted hover:text-red-400 rounded transition-colors" title={t('حذف', 'Delete')}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ─── Add / Edit Modal ─── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <Newspaper className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-bold text-text-primary">
                  {modal === 'edit' ? t('تعديل مقال', 'Edit Article') : t('إضافة مقال جديد', 'New Article')}
                </h2>
              </div>
              <button onClick={closeModal} className="p-2 text-text-muted hover:text-text-primary rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={save} className="p-6 grid grid-cols-2 gap-4">
              {([
                ['title', t('العنوان (عربي)', 'Title (Arabic)'), true, 'text', 'rtl'],
                ['titleEn', t('العنوان (إنجليزي)', 'Title (English)'), true, 'text', 'ltr'],
                ['author', t('الكاتب (عربي)', 'Author (Arabic)'), true, 'text', 'rtl'],
                ['authorEn', t('الكاتب (إنجليزي)', 'Author (English)'), true, 'text', 'ltr'],
                ['role', t('المسمى (عربي)', 'Role (Arabic)'), false, 'text', 'rtl'],
                ['roleEn', t('المسمى (إنجليزي)', 'Role (English)'), false, 'text', 'ltr'],
                ['emoji', t('الرمز', 'Emoji'), false, 'text', 'ltr'],
                ['date', t('تاريخ النشر', 'Publish Date'), true, 'date', 'ltr'],
                ['readTime', t('وقت القراءة', 'Read Time'), false, 'text', 'rtl'],
                ['readTimeEn', t('Read Time (English)', 'Read Time (English)'), false, 'text', 'ltr'],
              ] as [keyof typeof form, string, boolean, string, string][]).map(([key, label, req, type, dir]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-text-muted mb-1">{label}{req && <span className="text-red-400">*</span>}</label>
                  <input type={type} dir={dir} required={req} value={(form[key] as string) || ''} onChange={e => f(key, e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-gold/50" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">{t('التصنيف', 'Category')}</label>
                <select value={form.category} onChange={e => f('category', e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-gold/50">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{lang === 'ar' ? c.ar : c.en}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
                  <input type="checkbox" checked={form.trending} onChange={e => f('trending', e.target.checked)} className="w-4 h-4 accent-gold" />
                  {t('رائج', 'Trending')}
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
                  <input type="checkbox" checked={form.featured} onChange={e => f('featured', e.target.checked)} className="w-4 h-4 accent-gold" />
                  {t('مميز', 'Featured')}
                </label>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">{t('مقتطف (عربي)', 'Excerpt (Arabic)')}<span className="text-red-400">*</span></label>
                <textarea required rows={2} value={form.excerpt} onChange={e => f('excerpt', e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-gold/50" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">{t('Excerpt (English)', 'Excerpt (English)')}<span className="text-red-400">*</span></label>
                <textarea required dir="ltr" rows={2} value={form.excerptEn} onChange={e => f('excerptEn', e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-gold/50" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">{t('نص المقال (عربي) — فقرة لكل سطر', 'Body (Arabic) — one paragraph per line')}</label>
                <textarea rows={5} value={Array.isArray(form.bodyAr) ? form.bodyAr.join('\n') : ''} onChange={e => f('bodyAr', e.target.value.split('\n'))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-gold/50" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">{t('Article Body (English)', 'Article Body (English)')}</label>
                <textarea dir="ltr" rows={5} value={Array.isArray(form.bodyEn) ? form.bodyEn.join('\n') : ''} onChange={e => f('bodyEn', e.target.value.split('\n'))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-gold/50" />
              </div>
              <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-border">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg transition-colors">
                  {t('إلغاء', 'Cancel')}
                </button>
                <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-gold text-black rounded-lg text-sm font-semibold hover:bg-gold/90 transition-colors">
                  <Save className="w-4 h-4" /> {t('حفظ', 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Confirm Delete ─── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-text-primary">{t('حذف المقال؟', 'Delete Article?')}</h3>
            <p className="text-sm text-text-muted">{t('لا يمكن التراجع عن هذا الإجراء.', 'This action cannot be undone.')}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingId(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                {t('إلغاء', 'Cancel')}
              </button>
              <button onClick={() => confirmDelete(deletingId)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors">
                {t('حذف', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
