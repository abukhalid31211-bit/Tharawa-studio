import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    tier?: string;
  };
}

function deny(res: Response, status: number, error: string, message: string) {
  return res.status(status).json({ error, message });
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user) return next();
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return deny(res, 401, 'Unauthorized', 'لا يوجد رمز مصادقة');

  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
      algorithms: ['HS256'],
    }) as JwtPayload;
    const userId = String(decoded.sub || '');
    const email = typeof decoded.email === 'string' ? decoded.email : '';
    const role = typeof decoded.role === 'string' ? decoded.role : 'client';
    if (!userId || !email) return deny(res, 403, 'Forbidden', 'رمز المصادقة غير صالح');
    req.user = { userId, email, role, tier: typeof decoded.tier === 'string' ? decoded.tier : undefined };
    return next();
  } catch (error) {
    const code = error instanceof jwt.TokenExpiredError ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    return res.status(403).json({
      error: 'Forbidden',
      message: 'رمز المصادقة غير صالح أو منتهي الصلاحية',
      code,
    });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    authenticateToken(req, res, () => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return deny(res, 403, 'Forbidden', 'ليس لديك صلاحية للوصول إلى هذا المسار');
      }
      return next();
    });
  };
}

const sectionPermissionMap: Record<string, string[]> = {
  'clients:read': ['clients'], 'clients:write': ['clients'],
  'portfolios:read': ['portfolios'], 'portfolios:write': ['portfolios'],
  'transactions:read': ['transactions'], 'transactions:write': ['transactions'],
  'messages:read': ['messages'], 'messages:write': ['messages'],
  'content:read': ['content'], 'content:write': ['content'],
  'reports:read': ['reports'],
  'platform:read': ['clients', 'portfolios', 'transactions', 'messages', 'content', 'reports'],
  'platform:write': ['clients', 'portfolios', 'transactions', 'messages', 'content', 'reports'],
};

export function requireClientOrPermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === 'client') return next();
    return requirePermission(permission)(req, res, next);
  };
}

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    authenticateToken(req, res, async () => {
      if (!req.user) return deny(res, 401, 'Unauthorized', 'يلزم تسجيل الدخول');
      if (req.user.role === 'super' || req.user.role === 'admin') return next();
      if (req.user.role !== 'sub') return deny(res, 403, 'Forbidden', 'ليس لديك صلاحية');

      try {
        const subAdmin = await prisma.subAdmin.findUnique({ where: { user_id: req.user.userId } });
        if (!subAdmin || subAdmin.status !== 'active') return deny(res, 403, 'Forbidden', 'الحساب غير نشط');
        const raw = subAdmin.permissions;
        let permissions: string[] = [];
        if (Array.isArray(raw)) permissions = raw.filter((value): value is string => typeof value === 'string');
        else if (typeof raw === 'string') {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) permissions = parsed.filter((value): value is string => typeof value === 'string');
        }
        const accepted = sectionPermissionMap[permission] || [permission];
        if (!permissions.includes('*') && !permissions.includes(permission) && !accepted.some(p => permissions.includes(p))) {
          return deny(res, 403, 'Forbidden', 'الصلاحية المطلوبة غير متاحة');
        }
        return next();
      } catch (error) {
        console.error('[Permission Check]', error);
        return deny(res, 500, 'ServerError', 'تعذر التحقق من الصلاحيات');
      }
    });
  };
}
