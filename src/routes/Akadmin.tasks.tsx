import { createFileRoute } from '@tanstack/react-router';
import { Tasks } from '@/components/admin/pages/Tasks';
export const Route = createFileRoute('/Akadmin/tasks')({ component: Tasks });
