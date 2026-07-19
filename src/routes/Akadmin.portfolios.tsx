import { createFileRoute } from '@tanstack/react-router';
import { Portfolios } from '@/components/admin/pages/BasicPages';
export const Route = createFileRoute('/Akadmin/portfolios')({ component: Portfolios });
