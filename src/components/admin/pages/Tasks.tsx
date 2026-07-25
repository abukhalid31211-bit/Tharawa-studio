// ─────────────────────────────────────────────────────────────
// 4.11 — Tasks المهام الإدارية
// تتبع الإجراءات المطلوبة ومواعيدها وحالاتها
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, Circle, Loader, Flag } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { AdminTask, TaskStatus, nextCode, ADMIN_KEYS, TASKS_SEED } from '@/lib/adminData';
import { usePlatformDataState } from '@/lib/platformState';
import {
  PageHeader, Panel, Pill, StatCard, FilterTabs, Modal, ConfirmDialog,
  Field, TextInput, TextArea, SelectBox, PrimaryBtn, GhostBtn, IconBtn,
  EmptyState, useToast,
} from '@/components/admin/ui';

const STATUS_META: Record<TaskStatus, { ar: string; en: string; color: string; icon: any }> = {
  todo: { ar: 'قيد الانتظار', en: 'To Do', color: '#94A3B8', icon: Circle },
  doing: { ar: 'قيد التنفيذ', en: 'In Progress', color: '#0EA5E9', icon: Loader },
  done: { ar: 'منجزة', en: 'Done', color: '#00D97E', icon: CheckCircle2 },
};
const PRIORITY_META: Record<AdminTask['priority'], { ar: string; en: string; color: string }> = {
  high: { ar: 'عالية', en: 'High', color: '#FF4560' },
  medium: { ar: 'متوسطة', en: 'Medium', color: '#F59E0B' },
  low: { ar: 'منخفضة', en: 'Low', color: '#3B82F6' },
};

const EMPTY_FORM = { title: '', desc: '', due: '', priority: 'medium' as AdminTask['priority'], assignee: '', category: 'عملاء' };

export function Tasks() {
  const { t, lang } = useLang();
  const [tasks, setTasks] = usePlatformDataState<AdminTask[]>(ADMIN_KEYS.TASKS, TASKS_SEED);
  const { show, ToastView } = useToast();

  const [filter, setFilter] = useState('all');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTask | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleting, setDeleting] = useState<AdminTask | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter(x => x.status !== 'done' && x.due < todayIso);

  const counts = useMemo(() => ({
    all: tasks.length,
    todo: tasks.filter(x => x.status === 'todo').length,
    doing: tasks.filter(x => x.status === 'doing').length,
    done: tasks.filter(x => x.status === 'done').length,
  }), [tasks]);

  const filtered = useMemo(() => {
    let list = [...tasks].sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      const pr = { high: 0, medium: 1, low: 2 };
      return pr[a.priority] - pr[b.priority] || a.due.localeCompare(b.due);
    });
    if (filter === 'overdue') list = list.filter(x => overdue.includes(x));
    else if (filter !== 'all') list = list.filter(x => x.status === filter);
    return list;
  }, [tasks, filter, overdue]);

  const cycleStatus = (task: AdminTask) => {
    const order: TaskStatus[] = ['todo', 'doing', 'done'];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    setTasks(prev => prev.map(x => x.id === task.id ? { ...x, status: next } : x));
    if (next === 'done') show(t(`أُنجزت: ${task.title}`, `Done: ${task.title}`));
  };

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY_FORM, due: todayIso }); setEditOpen(true); };
  const openEdit = (task: AdminTask) => {
    setEditing(task);
    setForm({ title: task.title, desc: task.desc, due: task.due, priority: task.priority, assignee: task.assignee, category: task.category });
    setEditOpen(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setTasks(prev => prev.map(x => x.id === editing.id ? { ...x, ...form, titleEn: form.title, categoryEn: form.category } : x));
      show(t('تم تحديث المهمة', 'Task updated'));
    } else {
      setTasks(prev => [...prev, {
        id: nextCode(tasks, 'TSK'),
        title: form.title, titleEn: form.title,
        desc: form.desc, due: form.due, priority: form.priority,
        status: 'todo', assignee: form.assignee, category: form.category, categoryEn: form.category,
      }]);
      show(t('تمت إضافة المهمة الإدارية', 'Admin task added'));
    }
    setEditOpen(false);
  };

  const daysLeft = (due: string) => {
    const diff = Math.ceil((new Date(due).getTime() - new Date(todayIso).getTime()) / 86400000);
    if (diff < 0) return { text: t(`متأخرة ${-diff} يوم`, `${-diff}d overdue`), color: '#FF4560' };
    if (diff === 0) return { text: t('اليوم', 'Today'), color: '#F59E0B' };
    if (diff === 1) return { text: t('غداً', 'Tomorrow'), color: '#F59E0B' };
    return { text: t(`بعد ${diff} أيام`, `in ${diff} days`), color: '#64748B' };
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('المهام الإدارية', 'Admin Tasks')}
        subtitle={t('نظام تتبع الإجراءات المطلوبة من المشرفين ومواعيدها وحالاتها', 'Track required admin actions, their due dates and statuses')}
        actions={<PrimaryBtn icon={Plus} onClick={openAdd}>{t('إضافة مهمة', 'Add Task')}</PrimaryBtn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label={t('كل المهام', 'All Tasks')} value={counts.all} icon="📋" color="#3B82F6" />
        <StatCard label={t('قيد الانتظار', 'To Do')} value={counts.todo} icon="⭕" color="#94A3B8" />
        <StatCard label={t('قيد التنفيذ', 'In Progress')} value={counts.doing} icon="🔵" color="#0EA5E9" />
        <StatCard label={t('منجزة', 'Done')} value={counts.done} icon="✅" color="#00D97E" />
        <StatCard label={t('متأخرة', 'Overdue')} value={overdue.length} icon="🚨" color="#FF4560" />
      </div>

      <FilterTabs
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('الكل', 'All'), count: counts.all },
          { value: 'todo', label: t('انتظار', 'To Do'), count: counts.todo },
          { value: 'doing', label: t('تنفيذ', 'Doing'), count: counts.doing },
          { value: 'done', label: t('منجزة', 'Done'), count: counts.done },
          { value: 'overdue', label: t('متأخرة', 'Overdue'), count: overdue.length },
        ]}
      />

      {filtered.length === 0 ? (
        <Panel><EmptyState icon="🎉" text={t('لا توجد مهام هنا', 'No tasks here')} sub={t('كل الإجراءات المطلوبة تحت السيطرة', 'All required actions are under control')} /></Panel>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => {
            const st = STATUS_META[task.status];
            const pr = PRIORITY_META[task.priority];
            const dl = daysLeft(task.due);
            const isOverdue = task.status !== 'done' && task.due < todayIso;
            return (
              <Panel key={task.id} className={`flex items-start gap-4 transition-opacity ${task.status === 'done' ? 'opacity-60' : ''}`} >
                {/* زر الحالة */}
                <button
                  onClick={() => cycleStatus(task)}
                  className="shrink-0 mt-0.5 transition-transform hover:scale-110"
                  title={t('تغيير الحالة', 'Cycle status')}
                  aria-label={lang === 'ar' ? st.ar : st.en}
                >
                  <st.icon className="w-6 h-6" style={{ color: st.color }} />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-sm text-text-primary ${task.status === 'done' ? 'line-through' : ''}`}>{lang === 'ar' ? task.title : task.titleEn}</span>
                    <Pill text={`${t('أولوية', '')} ${lang === 'ar' ? pr.ar : pr.en}`.trim()} color={pr.color} />
                    <Pill text={lang === 'ar' ? task.category : task.categoryEn} color="#8B5CF6" />
                    <Pill text={lang === 'ar' ? st.ar : st.en} color={st.color} dot />
                  </div>
                  {task.desc && <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed">{task.desc}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[10px] flex-wrap">
                    <span className="font-semibold flex items-center gap-1" style={{ color: isOverdue && task.status !== 'done' ? '#FF4560' : dl.color }}>
                      <Flag className="w-3 h-3" /> {t('الاستحقاق:', 'Due:')} <span className="font-mono" dir="ltr">{task.due}</span> — {dl.text}
                    </span>
                    <span className="text-text-muted">👤 {task.assignee}</span>
                    <span className="text-text-muted font-mono">{task.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <IconBtn icon={Pencil} label={t('تعديل', 'Edit')} onClick={() => openEdit(task)} />
                  <IconBtn icon={Trash2} label={t('حذف', 'Delete')} onClick={() => setDeleting(task)} hoverColor="#FF4560" />
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {/* نموذج مهمة */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={editing ? t('تعديل المهمة', 'Edit Task') : t('إضافة مهمة إدارية', 'Add Admin Task')}
        icon={Plus}
        footer={
          <>
            <GhostBtn onClick={() => setEditOpen(false)}>{t('إلغاء', 'Cancel')}</GhostBtn>
            <PrimaryBtn onClick={() => (document.getElementById('task-form') as HTMLFormElement)?.requestSubmit()}>{t('حفظ', 'Save')}</PrimaryBtn>
          </>
        }
      >
        <form id="task-form" onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label={t('عنوان المهمة', 'Task Title')}>
              <TextInput required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label={t('الوصف', 'Description')}>
              <TextArea rows={2} value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder={t('تفاصيل الإجراء المطلوب...', 'Details of the required action...')} />
            </Field>
          </div>
          <Field label={t('تاريخ الاستحقاق', 'Due Date')}>
            <TextInput required type="date" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} dir="ltr" />
          </Field>
          <Field label={t('الأولوية', 'Priority')}>
            <SelectBox value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as AdminTask['priority'] })}
              options={[
                { value: 'high', label: t('🔴 عالية', '🔴 High') },
                { value: 'medium', label: t('🟡 متوسطة', '🟡 Medium') },
                { value: 'low', label: t('🔵 منخفضة', '🔵 Low') },
              ]} />
          </Field>
          <Field label={t('المسؤول', 'Assignee')}>
            <TextInput required value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} />
          </Field>
          <Field label={t('القسم', 'Category')}>
            <SelectBox value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              options={['عملاء', 'مالية', 'تقارير', 'دعم', 'محتوى', 'أمان', 'أخرى'].map(c => ({ value: c, label: c }))} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { setTasks(prev => prev.filter(x => x.id !== deleting!.id)); show(t('تم حذف المهمة', 'Task deleted')); }}
        title={t('حذف المهمة', 'Delete Task')}
        message={t(`حذف مهمة «${deleting?.title}» نهائياً؟`, `Permanently delete "${deleting?.title}"?`)}
        confirmText={t('حذف', 'Delete')}
      />
      {ToastView}
    </div>
  );
}
