import { createFileRoute } from '@tanstack/react-router';
import { ClientProfile } from '@/components/admin/pages/ClientProfile';
export const Route = createFileRoute('/Akadmin/clients/$clientId')({ component: ClientProfile });
