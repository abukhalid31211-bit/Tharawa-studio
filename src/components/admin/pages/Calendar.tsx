// ─────────────────────────────────────────────────────────────
// 4.9 — Calendar التقويم الإداري
// عرض شهري/أسبوعي/يومي + إضافة مواعيد + تصنيف + إشعارات المواعيد القريبة
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { ChevronRight, ChevronLeft, Plus, CalendarDays, Clock, BellRing, Trash2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCalendarEvents, useClients, CalendarEvent, EventType, nextCode } from '@/lib/adminData';
import {
  PageHeader, Panel, PanelHeader, Pill, Modal, ConfirmDialog, Field,
  TextInput, TextArea, SelectBox, PrimaryBtn, GhostBtn, IconBtn,
  EmptyState, useToast, FilterTabs,
} from '@/components/admin/ui';

const TYPE_META: Record<EventType, { ar: string; en: string; color: string; icon: string }> = {
  consultation: { ar: 'استشارة', en: 'Consultation', color: '#0EA5E9', icon: '🗣️' },
  meeting: { ar: 'اجتماع', en: 'Meeting', color: '#C9A84C', icon: '👥' },
  task: { ar: 'مهمة', en: 'Task', color: '#00D97E', icon: '✅' },
};

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

function toISO(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

export function CalendarPage() {
  const { t, lang } = useLang();
  const [events, setEvents] = useCalendarEvents();
  const [clients] = useClients();
  const { show, ToastView } = useToast();

  const todayIso = toISO(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [cursor, setCursor] = useState(() => new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState({ title: '', date: todayIso, time: '10:00', duration: 60, type: 'consultation' as EventType, clientId: '', note: '' });

  const eventsOfDay = (iso: string) => events.filter(e => e.date === iso).sort((a, b) => a.time.localeCompare(b.time));

  // ── إشعارات المواعيد القريبة (خلال 24 ساعة) ──
  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter(e => {
        const start = new Date(`${e.date}T${e.time}`).getTime();
        return !e.done && start >= now - 3600000 && start <= now + 24 * 3600000;
      })
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [events]);

  // ── شبكة الشهر ──
  const monthGrid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startDay = first.getDay(); // 0=Sunday
    const start = addDays(first, -startDay);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  // ── أيام الأسبوع الحالي ──
  const weekDays = useMemo(() => {
    const start = addDays(cursor, -cursor.getDay());
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const move = (dir: number) => {
    if (view === 'month') {
      const d = new Date(cursor); d.setMonth(d.getMonth() + dir); setCursor(d);
    } else if (view === 'week') {
      setCursor(addDays(cursor, dir * 7));
    } else {
      setCursor(addDays(cursor, dir));
    }
  };

  const monthName = cursor.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });
  const dayName = cursor.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const saveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === form.clientId);
    const title = form.title || (client ? (lang === 'ar' ? `موعد — ${client.name}` : `Appointment — ${client.nameEn}`) : t('موعد جديد', 'New appointment'));
    const ev: CalendarEvent = {
      id: nextCode(events, 'EV'),
      title,
      titleEn: title,
      date: form.date,
      time: form.time,
      duration: form.duration,
      type: form.type,
      clientId: form.clientId || undefined,
      note: form.note,
      done: false,
    };
    setEvents(prev => [...prev, ev]);
    setAddOpen(false);
    setForm({ title: '', date: todayIso, time: '10:00', duration: 60, type: 'consultation', clientId: '', note: '' });
    show(t('تمت إضافة الموعد للتقويم', 'Appointment added to calendar'));
  };

  const toggleDone = (id: string) => setEvents(prev => prev.map(e => e.id === id ? { ...e, done: !e.done } : e));

  const EventChip = ({ ev, compact }: { ev: CalendarEvent; compact?: boolean }) => {
    const meta = TYPE_META[ev.type];
    return (
      <div
        className={`rounded-md px-1.5 py-1 text-start w-full transition-opacity ${ev.done ? 'opacity-40 line-through' : ''}`}
        style={{ background: `${meta.color}12`, borderInlineStart: `2px solid ${meta.color}` }}
        title={`${meta.icon} ${ev.title} — ${ev.time}`}
      >
        {!compact && <div className="text-[9px] font-mono" style={{ color: meta.color }}>{ev.time}</div>}
        <div className="text-[9px] font-semibold text-text-primary truncate">{compact ? `${ev.time} ${ev.title}` : ev.title}</div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('التقويم الإداري', 'Admin Calendar')}
        subtitle={t('مواعيد الاستشارات والاجتماعات والمهام الإدارية بشكل بصري واضح', 'Consultation appointments, meetings and admin tasks in a clear visual layout')}
        actions={<PrimaryBtn icon={Plus} onClick={() => setAddOpen(true)}>{t('إضافة موعد جديد', 'Add Appointment')}</PrimaryBtn>}
      />

      {/* إشعارات المواعيد القريبة */}
      {upcoming.length > 0 && (
        <Panel className="flex items-start gap-3" >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <BellRing className="w-4 h-4" style={{ color: '#F59E0B' }} />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-text-primary mb-2">{t('تذكير: مواعيد خلال 24 ساعة', 'Reminder: appointments within 24 hours')}</h4>
            <div className="flex flex-wrap gap-2">
              {upcoming.map(ev => (
                <Pill key={ev.id} color={TYPE_META[ev.type].color} text={`${TYPE_META[ev.type].icon} ${ev.title} — ${ev.date === todayIso ? t('اليوم', 'Today') : t('غداً', 'Tomorrow')} ${ev.time}`} />
              ))}
            </div>
          </div>
        </Panel>
      )}

      {/* شريط التحكم */}
      <Panel className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <IconBtn icon={lang === 'ar' ? ChevronRight : ChevronLeft} label={t('السابق', 'Previous')} onClick={() => move(-1)} />
          <button onClick={() => setCursor(new Date())} className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-border-default text-[11px] font-bold text-text-muted hover:text-[#0EA5E9] transition-colors">
            {t('اليوم', 'Today')}
          </button>
          <IconBtn icon={lang === 'ar' ? ChevronLeft : ChevronRight} label={t('التالي', 'Next')} onClick={() => move(1)} />
          <h2 className="text-sm font-black text-text-primary ms-2">
            {view === 'month' ? monthName : view === 'week' ? `${weekDays[0].getDate()} – ${weekDays[6].toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long' })}` : dayName}
          </h2>
        </div>
        <FilterTabs
          value={view}
          onChange={v => setView(v as any)}
          options={[
            { value: 'month', label: t('شهري', 'Month') },
            { value: 'week', label: t('أسبوعي', 'Week') },
            { value: 'day', label: t('يومي', 'Day') },
          ]}
        />
      </Panel>

      {/* ── العرض الشهري ── */}
      {view === 'month' && (
        <Panel padded={false} className="overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#E2E8F0] dark:border-border-default">
            {(lang === 'ar' ? ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-text-muted py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthGrid.map((d, i) => {
              const iso = toISO(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = iso === todayIso;
              const dayEvents = eventsOfDay(iso);
              return (
                <div
                  key={i}
                  className="min-h-[92px] p-1.5 border-b border-e border-[#E2E8F0]/60 dark:border-border-default/60 transition-colors hover:bg-[#0EA5E9]/[0.02] cursor-pointer"
                  onClick={() => { setForm(f => ({ ...f, date: iso })); setAddOpen(true); }}
                  style={{ background: isToday ? 'rgba(14,165,233,0.04)' : inMonth ? 'transparent' : 'rgba(148,163,184,0.05)' }}
                >
                  <div
                    className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold mb-1"
                    style={isToday ? { background: '#0EA5E9', color: 'white' } : { color: inMonth ? '#1E293B' : '#94A3B8' }}
                  >
                    {d.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(ev => <EventChip key={ev.id} ev={ev} compact />)}
                    {dayEvents.length > 2 && <div className="text-[9px] text-text-muted font-semibold">+{dayEvents.length - 2} {t('أخرى', 'more')}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* ── العرض الأسبوعي ── */}
      {view === 'week' && (
        <Panel padded={false} className="overflow-x-auto">
          <div className="grid grid-cols-[50px_repeat(7,1fr)] min-w-[900px]">
            <div className="border-b border-e border-[#E2E8F0] dark:border-border-default" />
            {weekDays.map((d, i) => {
              const iso = toISO(d);
              const isToday = iso === todayIso;
              return (
                <div key={i} className="text-center py-2 border-b border-e border-[#E2E8F0] dark:border-border-default" style={{ background: isToday ? 'rgba(14,165,233,0.05)' : 'transparent' }}>
                  <div className="text-[9px] text-text-muted">{d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short' })}</div>
                  <div className="text-xs font-black mx-auto w-6 h-6 flex items-center justify-center rounded-full" style={isToday ? { background: '#0EA5E9', color: 'white' } : { color: '#1E293B' }}>{d.getDate()}</div>
                </div>
              );
            })}
            {HOURS.map(h => (
              <React.Fragment key={h}>
                <div className="text-[9px] font-mono text-text-muted text-center py-3 border-b border-e border-[#E2E8F0]/60 dark:border-border-default/60" dir="ltr">{h}</div>
                {weekDays.map((d, di) => {
                  const evs = eventsOfDay(toISO(d)).filter(e => e.time.slice(0, 2) === h.slice(0, 2));
                  return (
                    <div key={di} className="p-0.5 border-b border-e border-[#E2E8F0]/60 dark:border-border-default/60 min-h-[44px]">
                      {evs.map(ev => <EventChip key={ev.id} ev={ev} />)}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </Panel>
      )}

      {/* ── العرض اليومي ── */}
      {view === 'day' && (
        <div className="space-y-3">
          {eventsOfDay(toISO(cursor)).length === 0 && (
            <Panel><EmptyState icon="📅" text={t('لا توجد مواعيد في هذا اليوم', 'No appointments on this day')} sub={t('اضغط "إضافة موعد جديد" لجدولة أول موعد', 'Click "Add Appointment" to schedule the first one')} /></Panel>
          )}
          {eventsOfDay(toISO(cursor)).map(ev => {
            const meta = TYPE_META[ev.type];
            const client = clients.find(c => c.id === ev.clientId);
            return (
              <Panel key={ev.id} className="flex items-center gap-4" >
                <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ background: `${meta.color}12`, color: meta.color }}>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-sm text-text-primary ${ev.done ? 'line-through opacity-50' : ''}`}>{ev.title}</span>
                    <Pill text={`${meta.icon} ${lang === 'ar' ? meta.ar : meta.en}`} color={meta.color} />
                    {client && <Pill text={lang === 'ar' ? client.name : client.nameEn} color="#3B82F6" />}
                    {ev.done && <Pill text={t('منجز', 'Done')} color="#00D97E" />}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-text-muted">
                    <span className="font-mono" dir="ltr">{ev.time}</span>
                    <span>· {ev.duration} {t('دقيقة', 'min')}</span>
                    {ev.note && <span>· {ev.note}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <GhostBtn onClick={() => toggleDone(ev.id)}>{ev.done ? t('إعادة فتح', 'Reopen') : t('إنجاز', 'Mark Done')}</GhostBtn>
                  <IconBtn icon={Trash2} label={t('حذف', 'Delete')} onClick={() => setDeleting(ev)} hoverColor="#FF4560" />
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {/* مفتاح الألوان */}
      <Panel className="flex items-center gap-4 flex-wrap">
        <span className="text-[11px] font-bold text-text-muted flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {t('تصنيف المواعيد:', 'Event categories:')}</span>
        {Object.values(TYPE_META).map(m => (
          <Pill key={m.en} text={`${m.icon} ${lang === 'ar' ? m.ar : m.en}`} color={m.color} />
        ))}
      </Panel>

      {/* نموذج إضافة موعد */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('إضافة موعد جديد', 'Add New Appointment')}
        icon={Plus}
        footer={
          <>
            <GhostBtn onClick={() => setAddOpen(false)}>{t('إلغاء', 'Cancel')}</GhostBtn>
            <PrimaryBtn onClick={() => (document.getElementById('ev-form') as HTMLFormElement)?.requestSubmit()}>{t('حفظ الموعد', 'Save')}</PrimaryBtn>
          </>
        }
      >
        <form id="ev-form" onSubmit={saveEvent} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label={t('عنوان الموعد', 'Title')}>
              <TextInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </Field>
          </div>
          <Field label={t('نوع الموعد', 'Type')}>
            <SelectBox value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EventType })}
              options={Object.entries(TYPE_META).map(([k, v]) => ({ value: k, label: `${v.icon} ${lang === 'ar' ? v.ar : v.en}` }))} />
          </Field>
          <Field label={t('العميل (اختياري)', 'Client (optional)')}>
            <SelectBox value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}
              options={[{ value: '', label: t('بدون عميل', 'No client') }, ...clients.map(c => ({ value: c.id, label: lang === 'ar' ? c.name : c.nameEn }))]} />
          </Field>
          <Field label={t('التاريخ', 'Date')}>
            <TextInput required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} dir="ltr" />
          </Field>
          <Field label={t('الوقت', 'Time')}>
            <SelectBox value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
              options={HOURS.map(h => ({ value: h, label: h }))} />
          </Field>
          <Field label={t('المدة', 'Duration')}>
            <SelectBox value={String(form.duration)} onChange={e => setForm({ ...form, duration: Number(e.target.value) })}
              options={[{ value: '30', label: t('30 دقيقة', '30 min') }, { value: '45', label: t('45 دقيقة', '45 min') }, { value: '60', label: t('ساعة', '1 hour') }, { value: '90', label: t('ساعة ونصف', '1.5 hours') }, { value: '120', label: t('ساعتان', '2 hours') }]} />
          </Field>
          <div className="col-span-2">
            <Field label={t('ملاحظات', 'Notes')}>
              <TextArea rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder={t('تفاصيل إضافية عن الموعد...', 'Extra details about the appointment...')} />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { setEvents(prev => prev.filter(e => e.id !== deleting!.id)); show(t('تم حذف الموعد', 'Appointment deleted')); }}
        title={t('حذف الموعد', 'Delete Appointment')}
        message={t(`هل تريد حذف «${deleting?.title}» يوم ${deleting?.date} الساعة ${deleting?.time}؟`, `Delete "${deleting?.titleEn}" on ${deleting?.date} at ${deleting?.time}?`)}
        confirmText={t('حذف', 'Delete')}
      />
      {ToastView}
    </div>
  );
}
