// ─────────────────────────────────────────────────────────────
// Team — إدارة أعضاء فريق ثروة كابيتال
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { TeamMember, nextCode, ADMIN_KEYS, TEAM_SEED } from '@/lib/adminData';
import { usePlatformDataState } from '@/lib/platformState';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import {
  PageHeader, Panel, Pill, StatCard, Modal, ConfirmDialog, Field,
  TextInput, SelectBox, PrimaryBtn, GhostBtn, IconBtn, EmptyState, useToast, ClientAvatar,
} from '@/components/admin/ui';

const EMPTY = { name: '', nameEn: '', role: '', roleEn: '', experience: '', email: '', phone: '', status: 'active' as TeamMember['status'] };

// The public /about page reads its "team" section from the `about` content
// record (ContentSection('about').content_data.team), not from this page's
// own platform_data store. This roster (managed here) is the intended
// day-to-day source of truth for staff, so every mutation below also mirrors
// the currently "available" members into the about-page content record —
// otherwise changes made on this page would never appear anywhere publicly.
async function syncTeamToAboutPage(nextTeam: TeamMember[]) {
  try {
    const current: any = await api.getContent('about');
    const currentData = current?.data?.content_data && typeof current.data.content_data === 'object'
      ? current.data.content_data
      : {};
    const publicTeam = nextTeam
      .map(member => ({
        avatar: (member.nameEn || member.name || 'T').charAt(0),
        nameAr: member.name,
        nameEn: member.nameEn || member.name,
        roleAr: member.role,
        roleEn: member.roleEn || member.role,
        descAr: member.experience ? `${member.experience} خبرة` : '',
        descEn: member.experience ? `${member.experience} experience` : '',
      }));
    await api.updateContent('about', {
      title_ar: current?.data?.title_ar,
      title_en: current?.data?.title_en,
      content_data: { ...currentData, team: publicTeam },
    });
  } catch (error) {
    logger.error('Failed to sync team roster to the public About page', error);
  }
}

export function Team() {
  const { t, lang } = useLang();
  const [team, setTeam] = usePlatformDataState<TeamMember[]>(ADMIN_KEYS.TEAM, TEAM_SEED);
  const { show, ToastView } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState<TeamMember | null>(null);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setEditOpen(true); };
  const openEdit = (m: TeamMember) => {
    setEditing(m);
    setForm({ name: m.name, nameEn: m.nameEn, role: m.role, roleEn: m.roleEn, experience: m.experience, email: m.email, phone: m.phone, status: m.status });
    setEditOpen(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const next = team.map(m => m.id === editing.id ? { ...m, ...form } : m);
      setTeam(next);
      void syncTeamToAboutPage(next);
      show(t('تم تحديث بيانات العضو', 'Member updated'));
    } else {
      const next = [...team, { id: nextCode(team, 'TM'), ...form }];
      setTeam(next);
      void syncTeamToAboutPage(next);
      show(t('تمت إضافة العضو للفريق', 'Member added to team'));
    }
    setEditOpen(false);
  };

  const active = team.filter(m => m.status === 'active').length;


  return (
    <div className="space-y-5">
      <PageHeader
        title={t('أعضاء فريق ثروة كابيتال', 'Tharwah Capital Team')}
        subtitle={t('إدارة المستشارين الماليين وفريق إدارة الثروات وعلاقات العملاء', 'Manage financial advisors, wealth managers and client relations staff')}
        actions={<PrimaryBtn icon={Plus} onClick={openAdd}>{t('إضافة عضو', 'Add Member')}</PrimaryBtn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label={t('إجمالي الأعضاء', 'Total Members')} value={team.length} icon="👔" color="#3B82F6" />
        <StatCard label={t('متاحون الآن', 'Available Now')} value={active} icon="🟢" color="#00D97E" />
        <StatCard label={t('في إجازة', 'On Vacation')} value={team.length - active} icon="🌴" color="#F59E0B" />
      </div>

      {team.length === 0 ? (
        <Panel><EmptyState icon="👥" text={t('لا يوجد أعضاء في الفريق', 'No team members yet')} /></Panel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {team.map(m => (
            <Panel key={m.id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <ClientAvatar name={lang === 'ar' ? m.name : m.nameEn} idSeed={m.id} size={48} />
                  <div>
                    <h3 className="font-black text-sm text-text-primary">{lang === 'ar' ? m.name : m.nameEn}</h3>
                    <p className="text-[11px] text-text-muted mt-0.5">{lang === 'ar' ? m.role : m.roleEn}</p>
                  </div>
                </div>
                <Pill text={m.status === 'active' ? t('متاح', 'Available') : t('إجازة', 'Vacation')} color={m.status === 'active' ? '#00D97E' : '#F59E0B'} dot />
              </div>

              <div className="space-y-1.5 text-[11px] text-text-muted">
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" /><span className="font-mono">{m.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /><span className="font-mono" dir="ltr">{m.phone}</span></div>
                <div className="flex items-center gap-2">🎖️ <span>{t('الخبرة:', 'Experience:')} {m.experience}</span></div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] dark:border-border-default mt-auto">
                <GhostBtn onClick={() => {
                  const next = team.map(x => x.id === m.id ? { ...x, status: (x.status === 'active' ? 'vacation' : 'active') as TeamMember['status'] } : x);
                  setTeam(next);
                  void syncTeamToAboutPage(next);
                }}>
                  {m.status === 'active' ? t('تحويل لإجازة', 'Set Vacation') : t('إنهاء الإجازة', 'Set Active')}
                </GhostBtn>
                <div className="flex gap-0.5">
                  <IconBtn icon={Pencil} label={t('تعديل', 'Edit')} onClick={() => openEdit(m)} />
                  <IconBtn icon={Trash2} label={t('حذف', 'Delete')} onClick={() => setDeleting(m)} hoverColor="#FF4560" />
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={editing ? t('تعديل بيانات العضو', 'Edit Member') : t('إضافة عضو جديد', 'Add New Member')}
        icon={editing ? Pencil : Plus}
        footer={
          <>
            <GhostBtn onClick={() => setEditOpen(false)}>{t('إلغاء', 'Cancel')}</GhostBtn>
            <PrimaryBtn onClick={() => (document.getElementById('team-form') as HTMLFormElement)?.requestSubmit()}>{t('حفظ', 'Save')}</PrimaryBtn>
          </>
        }
      >
        <form id="team-form" onSubmit={save} className="grid grid-cols-2 gap-4">
          <Field label={t('الاسم (عربي)', 'Name (Arabic)')}>
            <TextInput required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label={t('الاسم (إنجليزي)', 'Name (English)')}>
            <TextInput value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} dir="ltr" />
          </Field>
          <Field label={t('المنصب (عربي)', 'Role (Arabic)')}>
            <TextInput required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
          </Field>
          <Field label={t('المنصب (إنجليزي)', 'Role (English)')}>
            <TextInput value={form.roleEn} onChange={e => setForm({ ...form, roleEn: e.target.value })} dir="ltr" />
          </Field>
          <Field label={t('سنوات الخبرة', 'Experience')}>
            <TextInput required value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
          </Field>
          <Field label={t('الحالة', 'Status')}>
            <SelectBox value={form.status} onChange={e => setForm({ ...form, status: e.target.value as TeamMember['status'] })}
              options={[{ value: 'active', label: t('متاح', 'Available') }, { value: 'vacation', label: t('إجازة', 'Vacation') }]} />
          </Field>
          <Field label={t('البريد الإلكتروني', 'Email')}>
            <TextInput required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} dir="ltr" />
          </Field>
          <Field label={t('الجوال', 'Phone')}>
            <TextInput required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} dir="ltr" />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          const next = team.filter(m => m.id !== deleting!.id);
          setTeam(next);
          void syncTeamToAboutPage(next);
          show(t('تم حذف العضو', 'Member removed'));
        }}
        title={t('حذف عضو الفريق', 'Remove Team Member')}
        message={t(`هل أنت متأكد من حذف ${deleting?.name} من الفريق؟`, `Are you sure you want to remove ${deleting?.nameEn} from the team?`)}
        confirmText={t('حذف', 'Remove')}
      />
      {ToastView}
    </div>
  );
}
