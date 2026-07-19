import { createFileRoute } from '@tanstack/react-router';
import { CalendarPage } from '@/components/admin/pages/Calendar';
export const Route = createFileRoute('/Akadmin/calendar')({ component: CalendarPage });
