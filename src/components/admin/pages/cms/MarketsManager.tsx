// ─────────────────────────────────────────────────────────────
// CMS — MarketsManager إدارة شريط الأسواق (Backend-connected)
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCmsMarkets, MarketItem, nextCode, addAuditEntry } from '@/lib/adminData';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import {
  PageHeader, Panel, Pill, StatCard, Modal, ConfirmDialog, Field,
  TextInput, SelectBox, PrimaryBtn, GhostBtn, IconBtn, EmptyState,
  DataTable, Tr, Td, Toggle, useToast, SearchInput,
} from '@/components/admin/ui';

const CATEGORIES = [
  { v: 'أسهم', ar: 'أسهم', en: 'Equities' },
  { v: 'عملات رقمية', ar: 'عملات رقمية', en: 'Crypto' },
  { v: 'سلع', ar: 'سلع', en: 'Commodities' },
  { v: 'طاقة', ar: 'طاقة', en: 'Energy' },
  { v: 'مؤشرات', ar: 'مؤشرات', en: 'Indices' },
];
const CAT_COLOR: Record<string, string> = { 'أسهم': '#3B82F6', 'عملات رقمية': '#F59E0B', 'سلع': '#C9A84C', 'طاقة': '#8B5CF6', 'مؤشرات': '#00D97E' };
const EMPTY = { name: '', nameEn: '', symbol: '', price: '', change: 0, category: 'أسهم', visible: true };

export function MarketsManager() {
  const { t, lang } = useLang();
  const [markets, setMarkets] = useCmsMarkets();
  const { show, ToastView } = useToast();

  const [search, setSearch] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<MarketItem | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState<MarketItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Load remote content
  useEffect(() => {
    api.getContent('markets')
      .then((res: any) => {
        if (res.data?.content_data?.markets) {
          setMarkets(res.data.content_data.markets);
        }
      })
      .catch(err => logger.warn('Failed to load remote markets content', err));
  }, []);

  const syncToBackend = async (updatedMarkets: MarketItem[]) => {
    setSaving(true);
    try {
      await api.updateContent('markets', {
        content_data: { markets: updatedMarkets },
      });
      addAuditEntry('admin@tharwah.com', 'تحديث محتوى الأسواق', 'Updated markets content');
    } catch (err: any) {
      show(err.message || t('فشل الحفظ', 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY); setEditOpen(true); };
  const openEdit = (m: MarketItem) => {
    setEditing(m);
    setForm({ name: m.name, nameEn: m.nameEn, symbol: m.symbol, price: m.price, change: m.change, category: m.category, visible: m.visible });
    setEditOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const catEn = CATEGORIES.find(c => c.v === form.category)?.en || form.category;
    let updated: MarketItem[];
    if (editing) {
      updated = markets.map(m => m.id === editing.id ? { ...m, ...form, categoryEn: catEn } : m);
      show(t('تم تحديث الأصل', 'Asset updated'));
    } else {
      updated = [...markets, { id: nextCode(markets, 'M'), ...form, categoryEn: catEn }];
      show(t('تمت إضافة الأصل لشريط الأسواق', 'Asset added to markets ticker'));
    }
    setMarkets(updated);
    await syncToBackend(updated);
    setEditOpen(false);
  };

  const toggleVisible = async (m: MarketItem) => {
    const updated = markets.map(x => x.id === m.id ? { ...x, visible: !x.visible } : x);
    setMarkets(updated);
    await syncToBackend(updated);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const updated = markets.filter(m => m.id !== deleting.id);
    setMarkets(updated);
    await syncToBackend(updated);
    show(t('تم حذف الأصل', 'Asset deleted'));
    setDeleting(null);
  };

  const filtered = markets.filter(m => !search || m.name.includes(search) || m.nameEn.toLowerCase().includes(search.toLowerCase()) || m.symbol.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إدارة الأسواق والمؤشرات', 'Markets & Indices Manager')}
        subtitle={t('التحكم في أسعار الأصول المعروضة في شريط الأسواق الحي وصفحة الأسواق', 'Control asset prices shown in the live markets ticker and markets page')}
        actions={
          <>
            {saving && <Loader2 className="w-5 h-5 animate-spin text-gold-primary" />}
            <PrimaryBtn icon={Plus} onClick={openAdd}>{t('إضافة أصل', 'Add Asset')}</PrimaryBtn>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('كل الأصول', 'All Assets')} value={markets.length} icon="📊" color="#3B82F6" />
        <StatCard label={t('ظاهرة بالشريط', 'In Ticker')} value={markets.filter(m => m.visible).length} icon="👁️" color="#00D97E" />
        <StatCard label={t('صاعدة اليوم', 'Gainers Today')} value={markets.filter(m => m.change >= 0).length} icon="📈" color="#00D97E" />
        <StatCard label={t('هابطة اليوم', 'Losers Today')} value={markets.filter(m => m.change < 0).length} icon="📉" color="#FF4560" />
      </div>

      <Panel className="!p-3">
        <div className="flex items-center gap-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <span className="text-[11px] text-text-muted shrink-0">{t('معاينة الشريط:', 'Ticker preview:')}</span>
          {markets.filter(m => m.visible).map(m => (
            <span key={m.id} className="flex items-center gap-1.5 shrink-0 text-xs">
              <span className="font-bold text-text-primary">{lang === 'ar' ? m.name : m.nameEn}</span>
              <span className="font-mono">{m.price}</span>
              <span className="font-mono font-bold" style={{ color: m.change >= 0 ? '#00D97E' : '#FF4560' }}>
                {m.change >= 0 ? '▲' : '▼'} {m.change >= 0 ? '+' : ''}{m.change}%
              </span>
            </span>
          ))}
        </div>
      </Panel>

      <SearchInput value={search} onChange={setSearch} placeholder={t('بحث بالاسم أو الرمز...', 'Search by name or symbol...')} className="max-w-sm" />

      <Panel padded={false}>
        {filtered.length === 0 ? (
          <EmptyState icon="📈" text={t('لا توجد أصول مطابقة', 'No assets match')} />
        ) : (
          <DataTable headers={[t('الأصل', 'Asset'), t('الرمز', 'Symbol'), t('الفئة', 'Category'), t('السعر', 'Price'), t('التغير', 'Change'), t('الظهور', 'Visible'), t('العمليات', 'Actions')]}>
            {filtered.map(m => (
              <Tr key={m.id}>
                <Td bold>{lang === 'ar' ? m.name : m.nameEn}</Td>
                <Td mono>{m.symbol}</Td>
                <Td><Pill text={lang === 'ar' ? m.category : m.categoryEn} color={CAT_COLOR[m.category] || '#3B82F6'} /></Td>
                <Td mono bold>{m.price}</Td>
                <Td>
                  <span className="font-mono font-bold flex items-center gap-1" style={{ color: m.change >= 0 ? '#00D97E' : '#FF4560' }}>
                    {m.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {m.change >= 0 ? '+' : ''}{m.change}%
                  </span>
                </Td>
                <Td><Toggle checked={m.visible} onChange={() => toggleVisible(m)} /></Td>
                <Td>
                  <div className="flex items-center gap-0.5">
                    <IconBtn icon={Pencil} label={t('تعديل', 'Edit')} onClick={() => openEdit(m)} />
                    <IconBtn icon={Trash2} label={t('حذف', 'Delete')} onClick={() => setDeleting(m)} hoverColor="#FF4560" />
                  </div>
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={editing ? t('تعديل أصل سوقي', 'Edit Market Asset') : t('إضافة أصل سوقي', 'Add Market Asset')}
        icon={TrendingUp}
        footer={
          <>
            <GhostBtn onClick={() => setEditOpen(false)}>{t('إلغاء', 'Cancel')}</GhostBtn>
            <PrimaryBtn onClick={() => (document.getElementById('mkt-form') as HTMLFormElement)?.requestSubmit()} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('حفظ', 'Save')}
            </PrimaryBtn>
          </>
        }
      >
        <form id="mkt-form" onSubmit={save} className="grid grid-cols-2 gap-4">
          <Field label={t('الاسم (عربي)', 'Name (Arabic)')}>
            <TextInput required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Name (English)">
            <TextInput required value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} dir="ltr" />
          </Field>
          <Field label={t('الرمز', 'Symbol')}>
            <TextInput required value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} dir="ltr" />
          </Field>
          <Field label={t('الفئة', 'Category')}>
            <SelectBox value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              options={CATEGORIES.map(c => ({ value: c.v, label: lang === 'ar' ? c.ar : c.en }))} />
          </Field>
          <Field label={t('السعر الحالي', 'Current Price')} hint={t('أدخل السعر بالصيغة التي تريد عرضها', 'Enter the price in the format you want displayed')}>
            <TextInput required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} dir="ltr" />
          </Field>
          <Field label={t('التغير اليومي %', 'Daily Change %')}>
            <TextInput required type="number" step="0.1" value={form.change} onChange={e => setForm({ ...form, change: Number(e.target.value) })} dir="ltr" />
          </Field>
          <div className="col-span-2">
            <Toggle checked={form.visible} onChange={v => setForm({ ...form, visible: v })} label={t('إظهار في شريط الأسواق', 'Show in markets ticker')} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={t('حذف الأصل', 'Delete Asset')}
        message={t(`سيختفي «${deleting?.name}» من شريط الأسواق في الموقع.`, `"${deleting?.nameEn}" will be removed from the site markets ticker.`)}
        confirmText={t('حذف', 'Delete')}
      />
      {ToastView}
    </div>
  );
}
