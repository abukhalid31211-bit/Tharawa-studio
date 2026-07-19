import { createFileRoute } from '@tanstack/react-router';
import { PrivacyPolicyManager } from '@/components/admin/pages/BasicPages';
export const Route = createFileRoute('/Akadmin/privacy_policy')({ component: PrivacyPolicyManager });
