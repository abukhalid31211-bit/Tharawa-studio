import { createFileRoute } from '@tanstack/react-router';
import { HeroManager } from '@/components/admin/pages/BasicPages';
export const Route = createFileRoute('/Akadmin/hero')({ component: HeroManager });
