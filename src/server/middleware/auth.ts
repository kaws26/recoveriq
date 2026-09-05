import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { EnterpriseRole } from '../../types';
import { userStore, SanitizedUser } from '../db/users';

const JWT_SECRET = process.env.JWT_SECRET || 'recoveriq_enterprise_secret_key_prod_2026_secure_hmac';

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: EnterpriseRole;
  merchant_id: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: SanitizedUser;
  merchantId?: string;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function signToken(user: SanitizedUser, expiresInHours = 24): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const nowSec = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    merchant_id: user.merchant_id,
    iat: nowSec,
    exp: nowSec + expiresInHours * 3600,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}

export function verifyToken(token: string): JWTPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;

  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sigBuffer = Buffer.from(signature);
  const expectedSigBuffer = Buffer.from(expectedSig);

  if (sigBuffer.length !== expectedSigBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
    return null;
  }

  try {
    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts Bearer token from headers
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const [bearer, token] = authHeader.split(' ');
  if (bearer?.toLowerCase() === 'bearer' && token) {
    return token.trim();
  }
  return null;
}

/**
 * Require valid JWT authentication
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token missing. Please log in with your credentials.',
      },
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired session token. Please log in again.',
      },
    });
  }

  const user = userStore.findById(payload.sub);
  if (!user || user.status !== 'ACTIVE') {
    return res.status(401).json({
      error: {
        code: 'USER_INACTIVE',
        message: 'User account not found or suspended.',
      },
    });
  }

  req.user = userStore.sanitize(user);
  req.merchantId = user.merchant_id;
  next();
}

/**
 * Optional Auth: checks JWT if provided; falls back to default merchant admin context for smooth dev/demo
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const user = userStore.findById(payload.sub);
      if (user && user.status === 'ACTIVE') {
        req.user = userStore.sanitize(user);
        req.merchantId = user.merchant_id;
        return next();
      }
    }
  }

  // Fallback to default demo user context
  const defaultUser = userStore.findByEmail('finance@apexdigital.in');
  if (defaultUser) {
    req.user = userStore.sanitize(defaultUser);
    req.merchantId = defaultUser.merchant_id;
  }
  next();
}

/**
 * Role-Based Access Control (RBAC) Guard
 */
export function requireRole(...allowedRoles: EnterpriseRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role '${req.user.role}' lacks required permissions (${allowedRoles.join(', ')}).`,
        },
      });
    }

    next();
  };
}
