import { createFileRoute } from '@tanstack/react-router';
import { MarketsManager } from '@/components/admin/pages/BasicPages';
export const Route = createFileRoute('/Akadmin/markets_mgr')({ component: MarketsManager });
