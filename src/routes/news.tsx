import { createFileRoute } from '@tanstack/react-router';
import { NewsPage } from '@/components/news/NewsPage';

export const Route = createFileRoute('/news')({ component: NewsPage });
