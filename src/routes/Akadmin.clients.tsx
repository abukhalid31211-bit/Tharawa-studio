import { createFileRoute } from '@tanstack/react-router';
import { Clients } from '@/components/admin/pages/BasicPages';
export const Route = createFileRoute('/Akadmin/clients')({ component: Clients });
