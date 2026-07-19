import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '@/components/admin/pages/BasicPages';
export const Route = createFileRoute('/Akadmin/settings')({ component: SettingsPage });
