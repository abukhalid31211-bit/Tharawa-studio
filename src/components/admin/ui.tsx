// ─────────────────────────────────────────────────────────────
// Admin UI Kit — shared building blocks for admin pages
// مكوّنات واجهة موحّدة لصفحات لوحة المشرف وفق نظام التصميم
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import { X, Search, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// ─── Page Header ─────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-black text-text-primary">{title}</h1>
        {subtitle && <p className="text-[13px] text-text-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ─── Panel (card container per design system) ────────────────
export function Panel({ children, className, padded = true }: { children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={cn('bg-white dark:bg-secondary border border-[#E2E8F0] dark:border-border-default rounded-xl shadow-sm', padded && 'p-5', className)}>
      {children}
    </div>
  );
}

export function PanelHeader({ icon: Icon, iconColor = '#0EA5E9', title, subtitle, action }: {
  icon?: any; iconColor?: string; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${iconColor}14` }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-text-primary truncate">{title}</h3>
          {subtitle && <p className="text-[11px] text-text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── Pill / Badge ────────────────────────────────────────────
export function Pill({ text, color = '#0EA5E9', bg, className, dot }: { text: string; color?: string; bg?: string; className?: string; dot?: boolean }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap', className)}
      style={{ color, background: bg || `${color}15` }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
      {text}
    </span>
  );
}

// ─── Stat mini card ──────────────────────────────────────────
export function StatCard({ label, value, icon, color = '#0EA5E9', suffix }: { label: string; value: string | number; icon?: string; color?: string; suffix?: string }) {
  return (
    <div className="bg-white dark:bg-secondary border border-[#E2E8F0] dark:border-border-default rounded-xl p-4 flex items-center gap-3">
      {icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: `${color}12` }}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xl font-black font-mono leading-none" style={{ color }}>{value}</div>
        <div className="text-[11px] text-text-muted mt-1 truncate">{label}{suffix ? ` — ${suffix}` : ''}</div>
      </div>
    </div>
  );
}

// ─── Search Input ────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder, className, autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; autoFocus?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 bg-[#F1F5F9] dark:bg-tertiary border border-[#E2E8F0] dark:border-border-default rounded-lg px-3 py-2', className)}>
      <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-transparent border-0 outline-none text-xs font-medium text-text-primary placeholder:text-text-muted"
      />
    </div>
  );
}

// ─── Filter Tabs ─────────────────────────────────────────────
export function FilterTabs({ options, value, onChange }: {
  options: { value: string; label: string; count?: number; color?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150',
              active
                ? 'bg-[#0EA5E9]/10 border-[#0EA5E9]/30 text-[#0EA5E9]'
                : 'bg-transparent border-[#E2E8F0] dark:border-border-default text-text-muted hover:text-[#0EA5E9] hover:border-[#0EA5E9]/20'
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={cn('mr-1 px-1.5 rounded-full text-[9px]', active ? 'bg-[#0EA5E9] text-white' : 'bg-[#E2E8F0] dark:bg-tertiary text-text-muted')}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Form Field wrappers ─────────────────────────────────────
export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-text-muted mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-text-muted mt-1">{hint}</p>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn('w-full bg-[#F8FAFC] dark:bg-tertiary border border-[#E2E8F0] dark:border-border-default rounded-lg px-3 py-2.5 outline-none text-xs font-medium text-text-primary placeholder:text-text-muted focus:border-[#0EA5E9] transition-colors', props.className)}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn('w-full bg-[#F8FAFC] dark:bg-tertiary border border-[#E2E8F0] dark:border-border-default rounded-lg px-3 py-2.5 outline-none text-xs font-medium text-text-primary placeholder:text-text-muted focus:border-[#0EA5E9] transition-colors resize-none', props.className)}
    />
  );
}

export function SelectBox({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return (
    <select
      {...props}
      className={cn('w-full bg-[#F8FAFC] dark:bg-tertiary border border-[#E2E8F0] dark:border-border-default rounded-lg px-3 py-2.5 outline-none text-xs font-medium text-text-primary focus:border-[#0EA5E9] transition-colors', props.className)}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2.5 cursor-pointer group">
      <span className={cn('w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0', checked ? 'bg-[#0EA5E9]' : 'bg-[#CBD5E1] dark:bg-border-default')}>
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
          style={{ insetInlineStart: checked ? 18 : 2 }}
        />
      </span>
      {label && <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors">{label}</span>}
    </button>
  );
}

// ─── Modal ───────────────────────────────────────────────────
export function Modal({ open, onClose, title, icon: Icon, iconColor = '#0EA5E9', children, footer, wide }: {
  open: boolean; onClose: () => void; title: string; icon?: any; iconColor?: string;
  children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn('relative bg-white dark:bg-secondary border border-[#E2E8F0] dark:border-border-default rounded-2xl shadow-2xl w-full max-h-[88vh] flex flex-col overflow-hidden', wide ? 'max-w-3xl' : 'max-w-lg')}
        style={{ animation: 'adminModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] dark:border-border-default shrink-0">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}14` }}>
                <Icon className="w-4 h-4" style={{ color: iconColor }} />
              </div>
            )}
            <h3 className="text-sm font-bold text-text-primary">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-[#FF4560] hover:bg-[#FF4560]/5 transition-colors" aria-label="close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-[#E2E8F0] dark:border-border-default flex items-center justify-end gap-2 shrink-0">{footer}</div>}
        <style>{`@keyframes adminModalIn { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
      </div>
    </div>
  );
}

// ─── Confirm Delete ──────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText, danger = true }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText: string; danger?: boolean;
}) {
  const { t } = useLang();
  return (
    <Modal open={open} onClose={onClose} title={title} icon={AlertTriangle} iconColor="#FF4560"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#E2E8F0] dark:border-border-default text-xs font-bold text-text-muted hover:bg-[#F1F5F9] dark:hover:bg-tertiary transition-colors">
            {t('إلغاء', 'Cancel')}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={cn('px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors', danger ? 'bg-[#FF4560] hover:bg-[#E03A50]' : 'bg-[#0EA5E9] hover:bg-[#0284C7]')}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className="text-xs text-text-secondary leading-relaxed">{message}</p>
    </Modal>
  );
}

// ─── Buttons ─────────────────────────────────────────────────
export function PrimaryBtn({ icon: Icon, children, onClick, type = 'button', disabled, color = '#0EA5E9', colorHover = '#0284C7' }: {
  icon?: any; children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; color?: string; colorHover?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      style={{ background: `linear-gradient(135deg, ${color}, ${colorHover})` }}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

export function GhostBtn({ icon: Icon, children, onClick, danger, disabled }: { icon?: any; children: React.ReactNode; onClick?: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        danger
          ? 'border-[#FF4560]/25 text-[#FF4560] hover:bg-[#FF4560]/5'
          : 'border-[#E2E8F0] dark:border-border-default text-text-muted hover:text-[#0EA5E9] hover:border-[#0EA5E9]/25 hover:bg-[#0EA5E9]/5'
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

// ─── Icon action button (table rows) ─────────────────────────
export function IconBtn({ icon: Icon, label, onClick, color = '#64748B', hoverColor = '#0EA5E9' }: {
  icon: any; label: string; onClick: () => void; color?: string; hoverColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="p-1.5 rounded-lg transition-colors hover:bg-[#0EA5E9]/8"
      style={{ color }}
      onMouseEnter={e => (e.currentTarget.style.color = hoverColor)}
      onMouseLeave={e => (e.currentTarget.style.color = color)}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

// ─── Empty State ─────────────────────────────────────────────
export function EmptyState({ icon = '📭', text, sub }: { icon?: string; text: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-3xl mb-3">{icon}</span>
      <p className="text-[13px] font-semibold text-text-muted">{text}</p>
      {sub && <p className="text-[11px] text-text-muted/70 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Data Table scaffold ─────────────────────────────────────
export function DataTable({ headers, children, minWidth = 640 }: { headers: string[]; children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ minWidth }}>
        <thead>
          <tr className="bg-[#F1F5F9] dark:bg-tertiary border-b border-[#E2E8F0] dark:border-border-default">
            {headers.map((h, i) => (
              <th key={i} className="text-start py-2.5 px-4 text-[11px] font-semibold text-text-muted whitespace-nowrap first:rounded-se-lg last:rounded-ss-lg">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]/60 dark:divide-border-default/60">{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr onClick={onClick} className={cn('hover:bg-[#0EA5E9]/[0.03] transition-colors duration-150', onClick && 'cursor-pointer')}>
      {children}
    </tr>
  );
}

export function Td({ children, className, mono, bold }: { children: React.ReactNode; className?: string; mono?: boolean; bold?: boolean }) {
  return (
    <td className={cn('py-3 px-4 text-xs text-text-secondary', mono && 'font-mono', bold && 'font-bold text-text-primary', className)}>
      {children}
    </td>
  );
}

// ─── Toast ───────────────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (text: string, type: 'success' | 'error' = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ text, type });
    timer.current = setTimeout(() => setToast(null), 2600);
  };

  const ToastView = toast ? (
    <div
      className={cn(
        'fixed bottom-6 inset-x-0 mx-auto w-fit z-[400] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold text-white',
        toast.type === 'success' ? 'bg-[#00B894]' : 'bg-[#FF4560]'
      )}
      style={{ animation: 'adminToastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {toast.text}
      <style>{`@keyframes adminToastIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  ) : null;

  return { show, ToastView };
}

// ─── CSV Export ──────────────────────────────────────────────
export function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <GhostBtn icon={Download} onClick={onClick}>{label}</GhostBtn>
  );
}

// ─── Avatar ──────────────────────────────────────────────────
const AVATAR_COLORS = ['#3B82F6', '#0EA5E9', '#C9A84C', '#8B5CF6', '#EC4899', '#00D97E', '#F59E0B'];
export function ClientAvatar({ name, size = 32, idSeed }: { name: string; size?: number; idSeed?: string }) {
  const seed = (idSeed || name).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const color = AVATAR_COLORS[seed % AVATAR_COLORS.length];
  return (
    <span
      className="rounded-full flex items-center justify-center font-black text-white shrink-0 select-none"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}, ${color}BB)`, fontSize: size * 0.38 }}
    >
      {name.trim().charAt(0) || '؟'}
    </span>
  );
}
