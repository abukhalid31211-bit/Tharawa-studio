import { prisma } from './prisma.js';

export async function logAudit(params: {
  actor_email: string;
  action: string;
  action_en?: string;
  user_id?: string;
  resource_type?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  result?: 'success' | 'failed';
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actor_email: params.actor_email,
        action: params.action,
        action_en: params.action_en,
        user_id: params.user_id,
        resource_type: params.resource_type,
        resource_id: params.resource_id,
        details: params.details || {},
        ip_address: params.ip_address,
        user_agent: params.user_agent,
        result: params.result || 'success',
      },
    });
  } catch (err) {
    console.error('[Audit Log Error]', err);
  }
}
