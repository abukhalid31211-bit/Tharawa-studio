import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { getAdminSession, isAdminAuthed } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/Akadmin')({
  component: AdminRoot,
});

function AdminRoot() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const check = () => {
    const ok = isAdminAuthed();
    setAuthed(ok);
    if (ok && (window.location.pathname === '/Akadmin' || window.location.pathname === '/Akadmin/')) {
      navigate({ to: '/Akadmin/overview' });
    }
    if (!ok && window.location.pathname !== '/Akadmin') {
      navigate({ to: '/Akadmin' });
    }
  };

  // Check once on mount.
  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-check only when the tab regains focus, instead of polling every 500ms.
  useEffect(() => {
    const handleFocus = () => check();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authed === null) return <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D0D1A] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0EA5E9]/30 border-t-[#0EA5E9] rounded-full animate-spin" /></div>;

  if (!authed) return <AdminLogin />;

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
