import { createFileRoute } from '@tanstack/react-router';
import { ServicesManager } from '@/components/admin/pages/BasicPages';
export const Route = createFileRoute('/Akadmin/services_mgr')({ component: ServicesManager });
