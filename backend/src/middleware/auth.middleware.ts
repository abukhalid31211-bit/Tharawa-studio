import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    tier?: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'لا يوجد رمز مصادقة',
      messageEn: 'No authentication token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    req.user = {
      userId: decoded.sub || decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role || 'client',
      tier: decoded.tier,
    };
    next();
  } catch (error: any) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'رمز المصادقة غير صالح أو منتهي الصلاحية',
      messageEn: 'Invalid or expired authentication token',
      code: error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
    });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    authenticateToken(req, res, () => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'ليس لديك صلاحية للوصول إلى هذا المسار',
          messageEn: 'Insufficient permissions',
          requiredRoles: allowedRoles,
          userRole: req.user?.role,
        });
      }
      next();
    });
  };
}
