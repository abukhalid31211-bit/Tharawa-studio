import { createFileRoute } from '@tanstack/react-router';
import { NewsManager } from '@/components/admin/pages/cms/NewsManager';
export const Route = createFileRoute('/Akadmin/news_mgr')({ component: NewsManager });
