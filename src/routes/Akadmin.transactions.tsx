import { createFileRoute } from '@tanstack/react-router';
import { Transactions } from '@/components/admin/pages/BasicPages';
export const Route = createFileRoute('/Akadmin/transactions')({ component: Transactions });
