import { createFileRoute } from '@tanstack/react-router';
import { Messages } from '@/components/admin/pages/BasicPages';
export const Route = createFileRoute('/Akadmin/messages')({ component: Messages });
